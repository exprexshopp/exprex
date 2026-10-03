from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product
from app.models.shop import Shop
from app.models.analytics import Analytics
from app.models.review import Review
from app.models.favorite import Favorite
from app.routers.auth import get_current_user
from app.models.user import User
import uuid

from datetime import datetime 

from sqlalchemy.orm import relationship

router = APIRouter(prefix="/api/products", tags=["products"])

# class Product(Base):
#     __tablename__ = "products"
#     # ... colonnes existantes ...
    
analytics = relationship("Analytics", back_populates="product", uselist=False)

@property
def views_count(self):
    return self.analytics.views_count if self.analytics else 0

@property
def whatsapp_clicks(self):
    return self.analytics.whatsapp_clicks if self.analytics else 0
        
# ============================================================
# GET
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
# ... (tes imports existants)

@router.get("/")
async def get_products(
    search: str | None = Query(None),
    category: str | None = Query(None),
    subcategory: str | None = Query(None),
    city: str | None = Query(None),
    price_min: float | None = Query(None, ge=0),
    price_max: float | None = Query(None, ge=0),
    sort_by: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """Récupère les produits avec filtres réels."""
    query = db.query(Product).join(Shop, Product.shop_id == Shop.id)

    # 🔎 Recherche texte (nom produit, description, nom boutique)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Product.name.ilike(like),
                Product.description.ilike(like),
                Shop.name.ilike(like),
            )
        )

    # 📂 Catégorie (slug ou nom)
    if category:
        query = query.filter(
            or_(Product.category == category,
                Product.category.ilike(f"%{category}%"))
        )

    # 📁 Sous-catégorie (slug ou nom)
    if subcategory:
        query = query.filter(
            or_(Product.subcategory_name == subcategory,
                Product.subcategory_name.ilike(f"%{subcategory}%"))
        )

    # 🏙️ Ville (via la boutique)
    if city:
        query = query.filter(Shop.city == city)

    # 💰 Prix
    if price_min is not None:
        query = query.filter(Product.price >= price_min)
    if price_max is not None:
        query = query.filter(Product.price <= price_max)

    # ↕️ Tri
    if sort_by == "price_asc":
        query = query.order_by(asc(Product.price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.price))
    elif sort_by == "newest":
        query = query.order_by(desc(Product.created_at))
    else:
        query = query.order_by(desc(Product.created_at))

    products = query.all()

    result = []
    for product in products:
        analytics = db.query(Analytics).filter(
            Analytics.product_id == product.id
        ).first()

        # ✅ shop_name TOUJOURS depuis Shop.name
        shop = db.query(Shop).filter(Shop.id == product.shop_id).first()

        result.append({
            "id": product.id,
            "shop_id": product.shop_id,
            "shop_name": shop.name if shop else product.shop_name,
            "shop_slug": shop.slug if shop else product.shop_slug,
            "shop_whatsapp": shop.whatsapp_number if shop else product.shop_whatsapp,
            "shop_city": shop.city if shop else None,   # ← utile pour CatalogFeed
            "name": product.name,
            "description": product.description,
            "slug": product.slug,
            "price": product.price,
            "image": product.image,
            "category": product.category,
            "subcategory_id": product.subcategory_id,
            "subcategory_name": product.subcategory_name,
            "in_stock": product.in_stock,
            "created_at": product.created_at,
            "views_count": analytics.views_count if analytics else 0,
            "whatsapp_clicks": analytics.whatsapp_clicks if analytics else 0,
            "reviews_count": 0,
            "favorites_count": 0,
        })

    return result

@router.get("")
async def get_products_no_slash(
    search: str | None = Query(None),
    category: str | None = Query(None),
    subcategory: str | None = Query(None),
    city: str | None = Query(None),
    price_min: float | None = Query(None, ge=0),
    price_max: float | None = Query(None, ge=0),
    sort_by: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return await get_products(
        search, category, subcategory, city,
        price_min, price_max, sort_by, db
    )

@router.get("/{slug}")
# async def get_product(slug: str, db: Session = Depends(get_db)):
#     """Récupère un produit par son slug (avec slash)"""
#     product = db.query(Product).filter(Product.slug == slug).first()
#     if not product:
#         raise HTTPException(404, "Produit non trouvé")
#     return product
async def get_product(slug: str, db: Session = Depends(get_db)):
    """Récupère un produit par son slug avec ses vues"""
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    # Récupérer les analytics
    analytics = db.query(Analytics).filter(Analytics.product_id == product.id).first()
    
    # Récupérer les reviews
    reviews = db.query(Review).filter(Review.product_id == product.id).all()
    
    # Récupérer les favoris
    favorites = db.query(Favorite).filter(Favorite.product_id == product.id).all()
    
    return {
        "id": product.id,
        "shop_id": product.shop_id,
        "shop_name": product.shop_name,
        "shop_slug": product.shop_slug,
        "shop_whatsapp": product.shop_whatsapp,
        "name": product.name,
        "description": product.description,
        "slug": product.slug,
        "price": product.price,
        "image": product.image,
        "category": product.category,
        "subcategory_id": product.subcategory_id,
        "subcategory_name": product.subcategory_name,
        "in_stock": product.in_stock,
        "created_at": product.created_at,
        "views_count": analytics.views_count if analytics else 0,
        "whatsapp_clicks": analytics.whatsapp_clicks if analytics else 0,
        "reviews_count": len(reviews),
        "favorites_count": len(favorites),
    }

@router.get("{slug}")
async def get_product_no_slash(slug: str, db: Session = Depends(get_db)):
    """Récupère un produit par son slug (sans slash)"""
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    return product



# ============================================================
# REVIEWS
# ============================================================

@router.get("/{product_id}/reviews")
async def get_product_reviews(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Récupère tous les avis d'un produit"""
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    return reviews

@router.post("/{product_id}/reviews")
async def create_review(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un avis pour un produit"""
    # Vérifier que le produit existe
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    # Créer l'avis
    review_id = f"rev_{uuid.uuid4().hex[:8]}"
    new_review = Review(
        id=review_id,
        user_id=current_user.id,
        user_name=data.get("user_name", f"{current_user.first_name} {current_user.last_name}"),
        product_id=product_id,
        rating=data.get("rating", 5),
        comment=data.get("comment", ""),
        created_at=datetime.utcnow()
    )
    
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review

# ============================================================
# POST - UNE SEULE ROUTE SANS SLASH
# ============================================================

@router.post("")
async def create_product(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau produit"""
    shop = db.query(Shop).filter(Shop.id == data.get("shop_id")).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    
    product_id = f"prod_{uuid.uuid4().hex[:8]}"
    slug = f"{data.get('name', 'product').lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"
    
    new_product = Product(
        id=product_id,
        shop_id=shop.id,
        shop_name=shop.name,
        shop_slug=shop.slug,
        shop_whatsapp=shop.whatsapp_number,
        name=data.get("name"),
        description=data.get("description", ""),
        slug=slug,
        price=float(data.get("price", 0)),
        image=data.get("image"),
        category=data.get("category"),
        subcategory_id=data.get("subcategory_id"),
        subcategory_name=data.get("subcategory_name"),
        in_stock=data.get("in_stock", True)
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return {"id": product_id, "slug": slug}

# ✅ POST avec slash (redirige vers la même fonction)
@router.post("/")
async def create_product_with_slash(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crée un nouveau produit (avec slash) - redirige vers la route principale"""
    return await create_product(data, current_user, db)


# ============================================================
# PUT
# ============================================================

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour un produit (avec slash)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    for key, value in data.items():
        if hasattr(product, key):
            setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.put("{product_id}")
async def update_product_no_slash(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Met à jour un produit (sans slash)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    for key, value in data.items():
        if hasattr(product, key):
            setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product


# ============================================================
# DELETE
# ============================================================

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un produit (avec slash)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    db.query(Analytics).filter(Analytics.product_id == product_id).delete()
    db.query(Review).filter(Review.product_id == product_id).delete()
    db.query(Favorite).filter(Favorite.product_id == product_id).delete()
    
    db.delete(product)
    db.commit()
    return {"success": True}

@router.delete("{product_id}")
async def delete_product_no_slash(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Supprime un produit (sans slash)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")
    
    db.query(Analytics).filter(Analytics.product_id == product_id).delete()
    db.query(Review).filter(Review.product_id == product_id).delete()
    db.query(Favorite).filter(Favorite.product_id == product_id).delete()
    
    db.delete(product)
    db.commit()
    return {"success": True}


    # ============================================================
# ANALYTICS
# ============================================================

@router.post("/{product_id}/view")
async def record_view(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Enregistre une vue sur un produit"""
    analytics = db.query(Analytics).filter(Analytics.product_id == product_id).first()
    if analytics:
        analytics.views_count = (analytics.views_count or 0) + 1
        analytics.updated_at = datetime.utcnow()
    else:
        analytics = Analytics(
            id=f"an_{uuid.uuid4().hex[:8]}",
            product_id=product_id,
            views_count=1,
            whatsapp_clicks=0,
            updated_at=datetime.utcnow()
        )
        db.add(analytics)
    db.commit()
    return {"success": True}

@router.post("/{product_id}/whatsapp-click")
async def record_whatsapp_click(
    product_id: str,
    db: Session = Depends(get_db)
):
    """Enregistre un clic WhatsApp sur un produit"""
    analytics = db.query(Analytics).filter(Analytics.product_id == product_id).first()
    if analytics:
        analytics.whatsapp_clicks = (analytics.whatsapp_clicks or 0) + 1
        analytics.updated_at = datetime.utcnow()
    else:
        analytics = Analytics(
            id=f"an_{uuid.uuid4().hex[:8]}",
            product_id=product_id,
            views_count=0,
            whatsapp_clicks=1,
            updated_at=datetime.utcnow()
        )
        db.add(analytics)
    db.commit()
    return {"success": True}