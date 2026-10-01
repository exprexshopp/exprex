from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from app.database import get_db
from app.models.user import User, UserRole
from app.config import settings
import json
import uuid
import hashlib
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérification simple pour le développement"""
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password: str) -> str:
    """Hash simple avec SHA256 pour le développement"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

# @router.post("/token")
# async def login(
#     form_data: OAuth2PasswordRequestForm = Depends(),
#     db: Session = Depends(get_db)
# ):
#     user = db.query(User).filter(User.email == form_data.username).first()
#     if not user or not verify_password(form_data.password, user.hashed_password):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Email ou mot de passe incorrect",
#         )
#     access_token = create_access_token(data={"sub": str(user.id)})
#     return {"access_token": access_token, "token_type": "bearer"}

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # ✅ Utiliser la vérification directe (pas authenticate_user)
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
        )
    access_token = create_access_token(data={"sub": str(user.id)})
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
        hashed_password=get_password_hash(data.get("password")),
        permissions=permissions
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.id})
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(401, "Token invalide")
    except:
        raise HTTPException(401, "Token invalide")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(401, "Utilisateur non trouvé")
    return user

def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN and not current_user.is_staff:
        raise HTTPException(403, "Accès administrateur requis")
    return current_user
