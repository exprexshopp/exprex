from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
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

router = APIRouter(prefix="/api/products", tags=["products"])


# ============================================================
# HELPERS
# ============================================================

def _serialize_product(product: Product, analytics=None, reviews_count=0, favorites_count=0) -> dict:
    """Sérialise un produit en dict avec les champs attendus par le frontend."""
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
        "reviews_count": reviews_count,
        "favorites_count": favorites_count,
    }


# ============================================================
# GET /api/products  —  liste avec filtres
# ============================================================

@router.get("/")
async def get_products(
    city: str | None = Query(None, description="Filtrer par ville de la boutique"),
    search: str | None = Query(None, description="Recherche sur nom, description, nom boutique"),
    category: str | None = Query(None, description="Filtrer par catégorie"),
    subcategory: str | None = Query(None, description="Filtrer par sous-catégorie (id)"),
    price_min: float | None = Query(None, description="Prix minimum"),
    price_max: float | None = Query(None, description="Prix maximum"),
    sort_by: str | None = Query(None, description="Tri: price_asc, price_desc, newest"),
    db: Session = Depends(get_db),
):
    """
    Récupère tous les produits avec filtres optionnels.
    
    Filtres supportés :
    - city : ville de la boutique
    - search : nom produit, description, nom boutique
    - category : catégorie du produit
    - subcategory : id de sous-catégorie
    - price_min / price_max : fourchette de prix
    - sort_by : price_asc | price_desc | newest
    """
    # Base query : jointure Product <-> Shop
    query = db.query(Product).join(Shop, Product.shop_id == Shop.id)

    # Filtre par ville
    if city:
        query = query.filter(Shop.city == city)

    # Filtre par recherche (nom produit, description, nom boutique)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(pattern),
                Product.description.ilike(pattern),
                Shop.name.ilike(pattern),
            )
        )

    # Filtre par catégorie
    if category:
        query = query.filter(Product.category == category)

    # Filtre par sous-catégorie
    if subcategory:
        query = query.filter(Product.subcategory_id == subcategory)

    # Filtre par prix
    if price_min is not None:
        query = query.filter(Product.price >= price_min)
    if price_max is not None:
        query = query.filter(Product.price <= price_max)

    # Tri
    if sort_by == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.created_at.desc())
    else:
        # Défaut : plus récents en premier
        query = query.order_by(Product.created_at.desc())

    products = query.all()

    # Récupérer les analytics en une seule requête (évite N+1)
    product_ids = [p.id for p in products]
    analytics_map: dict[str, Analytics] = {}
    if product_ids:
        analytics_list = (
            db.query(Analytics)
            .filter(Analytics.product_id.in_(product_ids))
            .all()
        )
        analytics_map = {a.product_id: a for a in analytics_list}

    # Construire la réponse
    result = []
    for product in products:
        analytics = analytics_map.get(product.id)
        result.append(_serialize_product(product, analytics))

    return result


# ============================================================
# GET /api/products/{slug}  —  détail
# ============================================================

@router.get("/{slug}")
async def get_product(slug: str, db: Session = Depends(get_db)):
    """Récupère un produit par son slug avec ses vues, avis et favoris."""
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")

    analytics = db.query(Analytics).filter(Analytics.product_id == product.id).first()
    reviews_count = db.query(Review).filter(Review.product_id == product.id).count()
    favorites_count = db.query(Favorite).filter(Favorite.product_id == product.id).count()

    return _serialize_product(
        product,
        analytics=analytics,
        reviews_count=reviews_count,
        favorites_count=favorites_count,
    )


# ============================================================
# REVIEWS
# ============================================================

@router.get("/{product_id}/reviews")
async def get_product_reviews(product_id: str, db: Session = Depends(get_db)):
    """Récupère tous les avis d'un produit."""
    reviews = db.query(Review).filter(Review.product_id == product_id).all()
    return reviews


@router.post("/{product_id}/reviews")
async def create_review(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crée un avis pour un produit."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")

    review_id = f"rev_{uuid.uuid4().hex[:8]}"
    new_review = Review(
        id=review_id,
        user_id=current_user.id,
        user_name=data.get("user_name", f"{current_user.first_name} {current_user.last_name}"),
        product_id=product_id,
        rating=data.get("rating", 5),
        comment=data.get("comment", ""),
        created_at=datetime.utcnow(),
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return new_review


# ============================================================
# POST /api/products  —  création
# ============================================================

@router.post("/")
async def create_product(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Crée un nouveau produit."""
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
        in_stock=data.get("in_stock", True),
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {"id": product_id, "slug": slug}


# ============================================================
# PUT /api/products/{product_id}  —  mise à jour
# ============================================================

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Met à jour un produit."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")

    # Champs en lecture seule / à ne pas écraser directement
    protected = {"id", "created_at"}

    for key, value in data.items():
        if key in protected:
            continue
        if hasattr(product, key):
            setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return _serialize_product(product)


# ============================================================
# DELETE /api/products/{product_id}
# ============================================================

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Supprime un produit et ses données liées."""
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
async def record_view(product_id: str, db: Session = Depends(get_db)):
    """Enregistre une vue sur un produit."""
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
            updated_at=datetime.utcnow(),
        )
        db.add(analytics)
    db.commit()
    return {"success": True}


@router.post("/{product_id}/whatsapp-click")
async def record_whatsapp_click(product_id: str, db: Session = Depends(get_db)):
    """Enregistre un clic WhatsApp sur un produit."""
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
            updated_at=datetime.utcnow(),
        )
        db.add(analytics)
    db.commit()
    return {"success": True}