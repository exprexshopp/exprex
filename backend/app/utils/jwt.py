# backend/app/utils/jwt.py

import jwt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "votre_clé_secrète_très_longue_et_unique"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 heures

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Créer un token JWT avec le rôle intégré"""
    to_encode = data.copy()
    
    # Ajouter le rôle dans le token
    if "role" not in to_encode:
        raise ValueError("Le rôle est requis dans le token")
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str):
    """Décoder et vérifier le token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None


def get_role_from_token(token: str) -> Optional[str]:
    """Extraire le rôle du token"""
    payload = decode_token(token)
    if payload:
        return payload.get("role")
    return None