from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError
from app.database import get_db
from app.models.user import User, UserRole
import json
import logging
import uuid
from app.utils.security import (
    verify_password,
    hash_password,
    needs_password_rehash,
    create_access_token,
    decode_access_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

# Alias de compatibilité : routers/users.py importe get_password_hash depuis ce module.
get_password_hash = hash_password


@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )

    user_id = user.id

    # Migration transparente SHA-256 -> bcrypt : uniquement après un login réussi.
    # Une erreur ici ne doit jamais empêcher la connexion.
    if needs_password_rehash(user.hashed_password):
        try:
            user.hashed_password = hash_password(form_data.password)
            db.commit()
        except Exception:
            db.rollback()
            logger.exception("Migration du hash vers bcrypt impossible pour l'utilisateur %s", user_id)

    access_token = create_access_token({"sub": str(user_id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
async def register(data: dict, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.email == data.get("email")) | (User.username == data.get("username"))
    ).first()
    if existing:
        raise HTTPException(400, "Email ou nom d'utilisateur déjà utilisé")
    
    user_id = f"usr_{uuid.uuid4().hex[:8]}"
    role = UserRole.SELLER if data.get("role") == "SELLER" else UserRole.CUSTOMER
    permissions = json.dumps(
        ["manage_own_shop", "manage_own_products"] if role == UserRole.SELLER 
        else ["view_catalog", "create_reviews", "add_favorites"]
    )
    
    new_user = User(
        id=user_id,
        email=data.get("email"),
        username=data.get("username"),
        first_name=data.get("first_name"),
        last_name=data.get("last_name"),
        role=role,
        gender=data.get("gender"),
        is_staff=False,
        hashed_password=hash_password(data.get("password")),
        permissions=permissions
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token({"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise HTTPException(401, "Token invalide")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise HTTPException(401, "Utilisateur non trouvé")
    return user

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN and not current_user.is_staff:
        raise HTTPException(403, "Accès administrateur requis")
    return current_user
