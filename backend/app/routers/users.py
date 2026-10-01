from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.models.product import Product
from app.routers.auth import get_current_user, get_current_admin, get_password_hash
from app.schemas.user import UserResponse, UserListResponse
import uuid
import json
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["users"])


# ============================================================
# USER MANAGEMENT
# ============================================================

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserListResponse])
async def get_users_no_slash(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/", response_model=list[UserListResponse])
async def get_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("", response_model=UserResponse)
async def create_user_no_slash(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return await _create_user(data, db)


@router.post("/", response_model=UserResponse)
async def create_user(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return await _create_user(data, db)


async def _create_user(data: dict, db: Session):
    existing = db.query(User).filter(
        (User.email == data.get("email")) | (User.username == data.get("username"))
    ).first()
    if existing:
        raise HTTPException(400, "Email ou nom d'utilisateur deja utilise")
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    role = data.get("role", "CUSTOMER")
    permissions = json.dumps(
        ["manage_own_shop", "manage_own_products"] if role == "SELLER"
        else ["view_catalog", "create_reviews", "add_favorites"] if role == "CUSTOMER"
        else ["manage_all"] if role == "ADMIN"
        else ["view_catalog", "create_reviews", "add_favorites"]
    )
    new_user = User(
        id=user_id,
        email=data.get("email"),
        username=data.get("username"),
        first_name=data.get("first_name", ""),
        last_name=data.get("last_name", ""),
        role=role,
        gender=data.get("gender"),
        is_staff=data.get("is_staff", False),
        hashed_password=get_password_hash(data.get("password", "password123")),
        permissions=permissions
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouve")
    
    # ✅ Sécurité : ne jamais écraser hashed_password via PUT générique
    protected_fields = {"hashed_password", "id"}
    for key, value in data.items():
        if key in protected_fields:
            continue
        if key == "password":
            user.hashed_password = get_password_hash(value)
        elif hasattr(user, key):
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouve")
    if user.id == admin.id:
        raise HTTPException(400, "Impossible de se supprimer soi-même")
    db.delete(user)
    db.commit()
    return {"success": True}


# ============================================================
# FAVORITES — VERSION OPTIMISÉE (1 seul appel)
# ============================================================

@router.get("/{user_id}/favorites")
async def get_user_favorites(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    ✅ Retourne la liste des IDs de produits favoris en 1 seul appel.
    Remplace les N appels à /favorites/{product_id}/status.
    """
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(403, "Accès non autorisé")
    
    # ✅ Ne sélectionner QUE product_id (optimisation)
    favorites = db.query(Favorite.product_id).filter(Favorite.user_id == user_id).all()
    return {"product_ids": [f[0] for f in favorites]}


@router.get("/{user_id}/favorites/{product_id}/status")
async def get_favorite_status(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Conservé pour compatibilité — mais à supprimer côté frontend"""
    if current_user.id != user_id:
        raise HTTPException(403, "Accès non autorisé")
    
    favorite = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first()
    
    return {"isFavorite": favorite is not None}


@router.post("/{user_id}/favorites/{product_id}")
async def toggle_favorite(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.id != user_id:
        raise HTTPException(403, "Accès non autorisé")
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.product_id == product_id
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"isFavorite": False}
    else:
        fav_id = f"fav_{uuid.uuid4().hex[:8]}"
        new_fav = Favorite(
            id=fav_id,
            user_id=user_id,
            product_id=product_id,
            created_at=datetime.utcnow()
        )
        db.add(new_fav)
        db.commit()
        db.refresh(new_fav)
        return {"isFavorite": True}