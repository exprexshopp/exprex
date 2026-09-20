from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category
from app.routers.auth import get_current_admin
from app.models.user import User
import uuid

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get("/")
async def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).all()

@router.get("")
async def get_categories_no_slash(db: Session = Depends(get_db)):
    return db.query(Category).filter(Category.is_active == True).all()

@router.post("/")
async def create_category(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not data.get("name") or not data.get("slug"):
        raise HTTPException(400, "Le nom et le slug sont requis")
    
    cat_id = f"cat_{uuid.uuid4().hex[:8]}"
    new_cat = Category(
        id=cat_id,
        name=data.get("name"),
        slug=data.get("slug"),
        is_active=data.get("is_active", True)
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.post("")
async def create_category_no_slash(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not data.get("name") or not data.get("slug"):
        raise HTTPException(400, "Le nom et le slug sont requis")
    
    cat_id = f"cat_{uuid.uuid4().hex[:8]}"
    new_cat = Category(
        id=cat_id,
        name=data.get("name"),
        slug=data.get("slug"),
        is_active=data.get("is_active", True)
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return new_cat

@router.put("/{cat_id}")
async def update_category(cat_id: str, data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Catégorie non trouvée")
    for key, value in data.items():
        if hasattr(cat, key):
            setattr(cat, key, value)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{cat_id}")
async def delete_category(cat_id: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Catégorie non trouvée")
    db.delete(cat)
    db.commit()
    return {"success": True}