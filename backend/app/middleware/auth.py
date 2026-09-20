# backend/app/middleware/auth.py

from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from typing import Optional
from app.models.user import User
from app.database import get_db
from sqlalchemy.orm import Session

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Récupérer l'utilisateur courant depuis le token JWT"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


async def require_admin(user: User = Depends(get_current_user)):
    """Vérifier que l'utilisateur est ADMIN"""
    if user.role != "ADMIN" and not user.is_staff:
        raise HTTPException(status_code=403, detail="Accès admin requis")
    return user


async def require_seller(user: User = Depends(get_current_user)):
    """Vérifier que l'utilisateur est SELLER ou ADMIN"""
    if user.role not in ["SELLER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Accès vendeur requis")
    return user