from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.favorite import Favorite
from app.models.product import Product
from app.routers.auth import get_current_user, get_current_admin
from app.routers.auth import get_password_hash
import uuid
import json

from app.models.favorite import Favorite
from app.models.product import Product
from datetime import datetime

router = APIRouter(prefix="/api/users", tags=["users"])

# ============================================================
# USER MANAGEMENT
# ============================================================

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/")
async def get_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).all()

@router.post("/")
async def create_user(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
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

@router.put("/{user_id}")
async def update_user(user_id: str, data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouve")
    for key, value in data.items():
        if hasattr(user, key):
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouve")
    db.delete(user)
    db.commit()
    return {"success": True}


# ============================================================
# FAVORITES
# ============================================================

@router.get("/{user_id}/favorites")
async def get_user_favorites(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Récupère tous les favoris d'un utilisateur"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Utilisateur non trouvé")
    
    if current_user.id != user_id and current_user.role != "ADMIN":
        raise HTTPException(403, "Accès non autorisé")
    
    favorites = db.query(Favorite).filter(Favorite.user_id == user_id).all()
    return favorites

@router.get("/{user_id}/favorites/{product_id}/status")
async def get_favorite_status(
    user_id: str,
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vérifie si un produit est dans les favoris"""
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
    """Ajoute ou retire un produit des favoris"""
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