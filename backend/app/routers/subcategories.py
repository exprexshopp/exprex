from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.subcategory import SubCategory
from app.routers.auth import get_current_admin
from app.models.user import User
import uuid

router = APIRouter(prefix="/api/subcategories", tags=["subcategories"])

@router.get("/")
async def get_subcategories(category_id: str = None, db: Session = Depends(get_db)):
    query = db.query(SubCategory)
    if category_id:
        query = query.filter(SubCategory.category_id == category_id)
    return query.all()

@router.post("/")
async def create_subcategory(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    sub_id = f"sub_{uuid.uuid4().hex[:8]}"
    new_sub = SubCategory(
        id=sub_id,
        category_id=data.get("category_id"),
        category_name=data.get("category_name"),
        name=data.get("name"),
        slug=data.get("slug"),
        is_active=data.get("is_active", True)
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

@router.put("/{sub_id}")
async def update_subcategory(sub_id: str, data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    sub = db.query(SubCategory).filter(SubCategory.id == sub_id).first()
    if not sub:
        raise HTTPException(404, "Sous-categorie non trouvee")
    for key, value in data.items():
        if hasattr(sub, key):
            setattr(sub, key, value)
    db.commit()
    db.refresh(sub)
    return sub

@router.delete("/{sub_id}")
async def delete_subcategory(sub_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    sub = db.query(SubCategory).filter(SubCategory.id == sub_id).first()
    if not sub:
        raise HTTPException(404, "Sous-categorie non trouvee")
    db.delete(sub)
    db.commit()
    return {"success": True}