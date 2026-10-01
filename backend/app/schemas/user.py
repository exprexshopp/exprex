from pydantic import BaseModel
from typing import Optional
from app.models.user import UserRole


class UserResponse(BaseModel):
    """Réponse publique — NE CONTIENT PAS hashed_password"""
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    role: UserRole
    is_staff: bool = False
    gender: Optional[str] = None
    permissions: str = "[]"

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Version allégée pour les listes"""
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    role: UserRole
    is_staff: bool = False

    class Config:
        from_attributes = True