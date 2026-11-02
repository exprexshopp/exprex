"""Couche de sécurité centrale : mots de passe et JWT.

- Hachage : bcrypt (passlib). Les anciens comptes en SHA-256 (64 caractères
  hexadécimaux, sans sel) restent vérifiables et sont migrés vers bcrypt au
  premier login réussi (voir routers/auth.py).
- JWT : un seul secret (settings.SECRET_KEY), un seul algorithme
  (settings.ALGORITHM), une seule durée (settings.ACCESS_TOKEN_EXPIRE_MINUTES).
"""
import hashlib
import hmac
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")
_SHA256_HEX = re.compile(r"[0-9a-f]{64}")


# ------------------------------------------------------------------
# Mots de passe
# ------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash bcrypt (salé)."""
    return pwd_context.hash(password)


def is_legacy_sha256_hash(password_hash: Optional[str]) -> bool:
    """Ancien format Exprex : SHA-256 hexadécimal (64 caractères), sans sel."""
    return bool(password_hash) and _SHA256_HEX.fullmatch(password_hash) is not None


def verify_password(password: str, password_hash: Optional[str]) -> bool:
    """Vérifie un mot de passe contre un hash bcrypt ou un ancien hash SHA-256.

    Un hash vide, illisible ou de format inconnu renvoie False (jamais d'exception).
    """
    if not password_hash:
        return False
    try:
        if password_hash.startswith(_BCRYPT_PREFIXES):
            return pwd_context.verify(password, password_hash)
        if is_legacy_sha256_hash(password_hash):
            candidate = hashlib.sha256(password.encode("utf-8")).hexdigest()
            return hmac.compare_digest(candidate, password_hash)
    except (ValueError, TypeError):
        return False
    return False


def needs_password_rehash(password_hash: Optional[str]) -> bool:
    """True pour un ancien hash SHA-256 à migrer vers bcrypt."""
    return is_legacy_sha256_hash(password_hash)


# ------------------------------------------------------------------
# JWT
# ------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = data.copy()
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    payload.update({
        "exp": now + expires_delta,
        "iat": now,
        "type": "access",
    })
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Décode et valide un token d'accès. Lève JWTError si invalide ou expiré."""
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("Invalid token type")
    if not payload.get("sub"):
        raise JWTError("Missing subject")
    return payload
