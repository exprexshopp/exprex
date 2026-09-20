# backend/app/routers/admin.py

from fastapi import APIRouter, Depends
from app.middleware.auth import require_admin
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users")
async def get_all_users(admin: User = Depends(require_admin)):
    """Seul un admin peut voir tous les utilisateurs"""
    # Vérification supplémentaire en base
    if admin.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Accès refusé")
    
    users = db.query(User).all()
    return users

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: User = Depends(require_admin)):
    """Seul un admin peut supprimer un utilisateur"""
    # Impossible de se supprimer soi-même
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Impossible de se supprimer")
    
    # Vérifier que l'utilisateur existe
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Ne pas supprimer un autre admin
    if user.role == "ADMIN":
        raise HTTPException(status_code=403, detail="Impossible de supprimer un admin")
    
    db.delete(user)
    db.commit()
    return {"message": "Utilisateur supprimé"}