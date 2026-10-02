from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.shop import Shop
from app.models.moderation_log import ModerationLog
from app.routers.auth import get_current_user, get_current_admin
from app.models.user import User, UserRole  # ✅ Import UserRole ajouté
import uuid
import json

router = APIRouter(prefix="/api/shops", tags=["shops"])

# ✅ GET toutes les boutiques
@router.get("/")
async def get_shops(city: str = None, db: Session = Depends(get_db)):
    query = db.query(Shop)
    if city:
        query = query.filter(Shop.city == city)
    return query.all()

# ✅ GET sans slash (compatibilité)
@router.get("")
async def get_shops_no_slash(city: str = None, db: Session = Depends(get_db)):
    query = db.query(Shop)
    if city:
        query = query.filter(Shop.city == city)
    return query.all()

# ✅ POST - Créer une boutique
@router.post("/")
async def create_shop(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validation des champs requis
    if not data.get("name"):
        raise HTTPException(400, "Le nom de la boutique est requis")
    if not data.get("whatsapp_number"):
        raise HTTPException(400, "Le numéro WhatsApp est requis")
    
    shop_id = f"shop_{uuid.uuid4().hex[:8]}"
    slug = f"{data.get('name', 'shop').lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"

    hours = data.get("hours", {
        "monday": {"opening_time": "08:00", "closing_time": "18:00", "is_closed": False},
        "tuesday": {"opening_time": "08:00", "closing_time": "18:00", "is_closed": False},
        "wednesday": {"opening_time": "08:00", "closing_time": "18:00", "is_closed": False},
        "thursday": {"opening_time": "08:00", "closing_time": "18:00", "is_closed": False},
        "friday": {"opening_time": "08:00", "closing_time": "18:00", "is_closed": False},
        "saturday": {"opening_time": "08:00", "closing_time": "17:00", "is_closed": False},
        "sunday": {"opening_time": None, "closing_time": None, "is_closed": True}
    })

    new_shop = Shop(
        id=shop_id,
        owner_id=current_user.id,
        owner_email=current_user.email,
        name=data.get("name"),
        slug=slug,
        description=data.get("description", ""),
        city=data.get("city", ""),
        location=data.get("location", ""),
        phone=data.get("phone", ""),
        whatsapp_number=data.get("whatsapp_number", ""),
        logo=data.get("logo"),
        theme=data.get("theme", "modern"),
        custom_theme_color=data.get("custom_theme_color", "#4f46e5"),
        facebook=data.get("facebook"),
        instagram=data.get("instagram"),
        hours=json.dumps(hours),
        status="PENDING",
        is_active=False
    )
    
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    
    return {"id": shop_id, "slug": slug}

# ✅ POST sans slash (compatibilité)
@router.post("")
async def create_shop_no_slash(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not data.get("name"):
        raise HTTPException(400, "Le nom de la boutique est requis")
    if not data.get("whatsapp_number"):
        raise HTTPException(400, "Le numéro WhatsApp est requis")
    
    shop_id = f"shop_{uuid.uuid4().hex[:8]}"
    slug = f"{data.get('name', 'shop').lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"

    hours = data.get("hours", {})
    
    new_shop = Shop(
        id=shop_id,
        owner_id=current_user.id,
        owner_email=current_user.email,
        name=data.get("name"),
        slug=slug,
        description=data.get("description", ""),
        city=data.get("city", ""),
        location=data.get("location", ""),
        phone=data.get("phone", ""),
        whatsapp_number=data.get("whatsapp_number", ""),
        logo=data.get("logo"),
        theme=data.get("theme", "modern"),
        custom_theme_color=data.get("custom_theme_color", "#4f46e5"),
        facebook=data.get("facebook"),
        instagram=data.get("instagram"),
        hours=json.dumps(hours),
        status="PENDING",
        is_active=False
    )
    
    db.add(new_shop)
    db.commit()
    db.refresh(new_shop)
    
    return {"id": shop_id, "slug": slug}

# ✅ PUT - Mettre à jour une boutique
@router.put("/{shop_id}")
async def update_shop(
    shop_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    # Vérifier que l'utilisateur est le propriétaire ou un admin
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Vous n'êtes pas autorisé à modifier cette boutique")
    
    # Mettre à jour les champs
    updatable_fields = [
        "name", "description", "city", "location", "phone", 
        "whatsapp_number", "logo", "theme", "custom_theme_color", 
        "facebook", "instagram", "hours"
    ]
    
    for field in updatable_fields:
        if field in data:
            if field == "hours" and isinstance(data[field], dict):
                setattr(shop, field, json.dumps(data[field]))
            else:
                setattr(shop, field, data[field])
    
    db.commit()
    db.refresh(shop)
    return shop

# ✅ PATCH - Mettre à jour les horaires
@router.patch("/{shop_id}/hours")
async def update_shop_hours(
    shop_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    if shop.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(403, "Vous n'êtes pas autorisé à modifier cette boutique")
    
    hours_data = data.get("hours")
    if not hours_data or not isinstance(hours_data, dict):
        raise HTTPException(400, "Données d'horaires invalides")
    
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for day in days:
        if day not in hours_data:
            continue
        day_hours = hours_data[day]
        if not isinstance(day_hours, dict):
            raise HTTPException(400, f"Format invalide pour le jour {day}")
        
        if "is_closed" not in day_hours:
            day_hours["is_closed"] = False
        
        if not day_hours.get("is_closed", False):
            if not day_hours.get("opening_time") or not day_hours.get("closing_time"):
                raise HTTPException(400, f"Horaires manquants pour le jour {day}")
    
    shop.hours = json.dumps(hours_data)
    db.commit()
    db.refresh(shop)
    
    return {
        "success": True,
        "message": "Horaires mis à jour avec succès",
        "hours": hours_data
    }

# ✅ GET - Analytics
@router.get("/{shop_id}/analytics")
async def get_shop_analytics(
    shop_id: str,
    db: Session = Depends(get_db)
):
    from app.models.product import Product
    from app.models.analytics import Analytics
    
    products = db.query(Product).filter(Product.shop_id == shop_id).all()
    
    total_views = 0
    total_whatsapp = 0
    products_with_analytics = []
    
    for product in products:
        analytics = db.query(Analytics).filter(
            Analytics.product_id == product.id
        ).first()
        
        views = analytics.views_count if analytics else 0
        whatsapp = analytics.whatsapp_clicks if analytics else 0
        
        total_views += views or 0
        total_whatsapp += whatsapp or 0
        
        # ✅ Construire un dictionnaire avec les compteurs inclus
        products_with_analytics.append({
            "id": product.id,
            "shop_id": product.shop_id,
            "name": product.name,
            "slug": product.slug,
            "image": product.image,
            "price": product.price,
            "category": product.category,
            "subcategory_name": product.subcategory_name,
            "in_stock": product.in_stock,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            # ✅ Compteurs analytics (ce qui manquait)
            "views_count": views or 0,
            "whatsapp_clicks": whatsapp or 0,
        })
    
    return {
        "totalViews": total_views,
        "totalWhatsApp": total_whatsapp,
        "totalRevenue": 0,
        "products": products_with_analytics,
    }

# ✅ PATCH - Approuver une boutique
@router.patch("/{shop_id}/approve")
async def approve_shop(
    shop_id: str,
    data: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    shop.status = data.get("status", "ACTIVE")
    shop.is_active = True
    db.commit()
    db.refresh(shop)
    
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    mod_log = ModerationLog(
        id=log_id,
        shop_id=shop_id,
        shop_name=shop.name,
        actor_email=admin.email,
        action="approve",
        note=data.get("note", "Boutique validée par admin.")
    )
    db.add(mod_log)
    db.commit()
    
    return {"success": True}

# ✅ PATCH - Rejeter une boutique
@router.patch("/{shop_id}/reject")
async def reject_shop(
    shop_id: str,
    data: dict,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    shop.status = data.get("status", "REJECTED")
    shop.is_active = False
    shop.rejection_reason = data.get("rejection_reason")
    db.commit()
    db.refresh(shop)
    
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    mod_log = ModerationLog(
        id=log_id,
        shop_id=shop_id,
        shop_name=shop.name,
        actor_email=admin.email,
        action="reject",
        note=data.get("rejection_reason", "")
    )
    db.add(mod_log)
    db.commit()
    
    return {"success": True}