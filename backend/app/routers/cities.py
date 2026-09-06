from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.city import City
from app.routers.auth import get_current_admin
from app.models.user import User
import uuid

router = APIRouter(prefix="/api/cities", tags=["cities"])

# ✅ Route GET avec slash
@router.get("/")
async def get_cities(db: Session = Depends(get_db)):
    return db.query(City).filter(City.is_active == True).all()

# ✅ Route GET sans slash (compatibilité)
@router.get("")
async def get_cities_no_slash(db: Session = Depends(get_db)):
    return db.query(City).filter(City.is_active == True).all()

# ✅ Route POST avec slash
@router.post("/")
async def create_city(
    data: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if not data.get("name"):
        raise HTTPException(400, "Le nom de la ville est requis")
    
    city_id = f"city_{uuid.uuid4().hex[:8]}"
    new_city = City(
        id=city_id,
        name=data.get("name"),
        is_active=data.get("is_active", True)
    )
    db.add(new_city)
    db.commit()
    db.refresh(new_city)
    return new_city

# ✅ Route POST sans slash (compatibilité)
@router.post("")
async def create_city_no_slash(
    data: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if not data.get("name"):
        raise HTTPException(400, "Le nom de la ville est requis")
    
    city_id = f"city_{uuid.uuid4().hex[:8]}"
    new_city = City(
        id=city_id,
        name=data.get("name"),
        is_active=data.get("is_active", True)
    )
    db.add(new_city)
    db.commit()
    db.refresh(new_city)
    return new_city

# ✅ Route PUT
@router.put("/{city_id}")
async def update_city(
    city_id: str,
    data: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(404, "Ville non trouvée")
    
    if "name" in data:
        city.name = data["name"]
    if "is_active" in data:
        city.is_active = data["is_active"]
    
    db.commit()
    db.refresh(city)
    return city

# ✅ Route DELETE
@router.delete("/{city_id}")
async def delete_city(
    city_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    city = db.query(City).filter(City.id == city_id).first()
    if not city:
        raise HTTPException(404, "Ville non trouvée")
    
    db.delete(city)
    db.commit()
    return {"success": True}