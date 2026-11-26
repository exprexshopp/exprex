from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, asc, desc
from app.database import get_db
from app.models.product import Product
from app.models.shop import Shop
from app.models.analytics import Analytics
from app.models.review import Review
from app.models.favorite import Favorite
from app.routers.auth import get_current_user
from app.models.user import User
from app.models.category import Category
from app.models.subcategory import SubCategory
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/products", tags=["products"])

# ============================================================
# HELPERS
# ============================================================

def _serialize_product(product: Product, analytics=None, reviews_count=0, favorites_count=0) -> dict:
    """Sérialise uniquement les champs nécessaires à une carte catalogue."""
    return {
        "id": product.id,
        "shop_id": product.shop_id,
        "shop_name": product.shop_name,
        "shop_slug": product.shop_slug,
        "shop_whatsapp": product.shop_whatsapp,
        "name": product.name,
        "slug": product.slug,
        "price": product.price,
        "image": product.image,
        "category": product.category,
        "subcategory_name": product.subcategory_name,
        "in_stock": product.in_stock,
        "created_at": product.created_at,
        "views_count": analytics.views_count if analytics else 0,
        "whatsapp_clicks": analytics.whatsapp_clicks if analytics else 0,
        "reviews_count": reviews_count,
        "favorites_count": favorites_count,
    }


def _serialize_catalog_product(product: Product, analytics=None) -> dict:
    """Champs légers utilisés uniquement par la grille paginée."""
    return {
        "id": product.id,
        "shop_id": product.shop_id,
        "shop_name": product.shop_name,
        "shop_slug": product.shop_slug,
        "name": product.name,
        "slug": product.slug,
        "price": product.price,
        "image": product.image,
        "category": product.category,
        "subcategory_name": product.subcategory_name,
        "in_stock": product.in_stock,
        "created_at": product.created_at,
        "views_count": analytics.views_count if analytics else 0,
        "whatsapp_clicks": analytics.whatsapp_clicks if analytics else 0,
    }


# ============================================================
# GET
# ============================================================

@router.get("")
async def get_products(
    search: str | None = Query(None),
    category: str | None = Query(None),
    subcategory: str | None = Query(None),
    city: str | None = Query(None),
    price_min: float | None = Query(None, ge=0),
    price_max: float | None = Query(None, ge=0),
    sort_by: str | None = Query(None),
    page: int | None = Query(None),
    page_size: int | None = Query(None),
    cursor: str | None = Query(None),
    limit: int | None = Query(None),
    db: Session = Depends(get_db),
):
    raw_cursor = cursor
    raw_limit = limit
    raw_page = page
    raw_page_size = page_size

    def plain_value(value):
        if hasattr(value, "default"):
            value = value.default
        return value

    cursor = plain_value(cursor)
    limit = plain_value(limit)
    page = plain_value(page)
    page_size = plain_value(page_size)

    try:
        page = max(1, int(page or 1))
    except (TypeError, ValueError):
        page = 1

    try:
        requested_size = limit or page_size or 24
        page_size = max(1, min(int(requested_size), 100))
    except (TypeError, ValueError):
        page_size = 24

    cursor_mode = isinstance(cursor, str) and bool(cursor)
    paginated = (
        not hasattr(raw_page, "default") and raw_page is not None
    ) or (
        not hasattr(raw_page_size, "default") and raw_page_size is not None
    ) or cursor_mode or (
        not hasattr(raw_limit, "default") and raw_limit is not None
    )

    query = db.query(Product).join(Shop, Product.shop_id == Shop.id)

    if category:
        cat_obj = db.query(Category).filter(
            or_(Category.slug == category, Category.name == category)
        ).first()
        if cat_obj:
            sub_ids = [
                s.id for s in db.query(SubCategory)
                .filter(SubCategory.category_id == cat_obj.id).all()
            ]
            conditions = [
                Product.category == cat_obj.slug,
                Product.category == cat_obj.name,
            ]
            if sub_ids:
                conditions.append(Product.subcategory_id.in_(sub_ids))
            query = query.filter(or_(*conditions))
        else:
            query = query.filter(or_(
                Product.category == category,
                Product.category.ilike(f"%{category}%"),
            ))

    if subcategory:
        sub_obj = db.query(SubCategory).filter(
            or_(SubCategory.slug == subcategory, SubCategory.name == subcategory)
        ).first()
        if sub_obj:
            query = query.filter(Product.subcategory_id == sub_obj.id)
        else:
            query = query.filter(or_(
                Product.subcategory_name == subcategory,
                Product.subcategory_name.ilike(f"%{subcategory}%"),
            ))

    if search:
        query = query.filter(or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
        ))

    if city:
        query = query.filter(Shop.city == city)

    if price_min is not None:
        query = query.filter(Product.price >= price_min)
    if price_max is not None:
        query = query.filter(Product.price <= price_max)

    cursor_product = None
    if cursor:
        cursor_product = db.query(Product).filter(Product.id == cursor).first()

    total = query.count()

    if sort_by == "price_asc":
        query = query.order_by(asc(Product.price), desc(Product.id))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Product.price), desc(Product.id))
    else:
        query = query.order_by(desc(Product.created_at), desc(Product.id))

    if cursor_product:
        if sort_by == "price_asc":
            query = query.filter(or_(
                Product.price > cursor_product.price,
                and_(Product.price == cursor_product.price, Product.id < cursor_product.id),
            ))
        elif sort_by == "price_desc":
            query = query.filter(or_(
                Product.price < cursor_product.price,
                and_(Product.price == cursor_product.price, Product.id < cursor_product.id),
            ))
        else:
            query = query.filter(or_(
                Product.created_at < cursor_product.created_at,
                and_(Product.created_at == cursor_product.created_at, Product.id < cursor_product.id),
            ))

    if paginated:
        if cursor_mode:
            query = query.limit(page_size + 1)
        else:
            query = query.offset((page - 1) * page_size).limit(page_size)

    products = query.all()
    result = []
    for product in products:
        analytics = db.query(Analytics).filter(
            Analytics.product_id == product.id
        ).first()
        result.append(
            _serialize_catalog_product(product, analytics=analytics)
            if paginated
            else _serialize_product(product, analytics=analytics)
        )

    if paginated:
        if cursor_mode:
            has_more = len(result) > page_size
            result = result[:page_size]
        else:
            offset = (page - 1) * page_size
            has_more = (offset + len(result)) < total

        response = {
            "products": result,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": has_more,
        }
        if cursor_mode:
            response["next_cursor"] = result[-1]["id"] if response["has_more"] and result else None
        return response

    return result


@router.get("/{slug}")
async def get_product(slug: str, db: Session = Depends(get_db)):
    """Récupère un produit par son slug avec ses vues."""
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
    return db.query(Review).filter(Review.product_id == product_id).all()


@router.post("/{product_id}/reviews")
async def create_review(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Produit non trouvé")

    new_review = Review(
        id=f"rev_{uuid.uuid4().hex[:8]}",
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
# POST
# ============================================================

@router.post("")
async def create_product(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
# PUT
# ============================================================

@router.put("/{product_id}")
async def update_product(
    product_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
    db: Session = Depends(get_db),
):
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
    analytics = db.query(Analytics).filter(Analytics.product_id == product_id).first()
    if analytics:
        analytics.views_count = (analytics.views_count or 0) + 1
        analytics.updated_at = datetime.utcnow()
    else:
        db.add(Analytics(
            id=f"an_{uuid.uuid4().hex[:8]}",
            product_id=product_id,
            views_count=1,
            whatsapp_clicks=0,
            updated_at=datetime.utcnow(),
        ))
    db.commit()
    return {"success": True}


@router.post("/{product_id}/whatsapp-click")
async def record_whatsapp_click(product_id: str, db: Session = Depends(get_db)):
    analytics = db.query(Analytics).filter(Analytics.product_id == product_id).first()
    if analytics:
        analytics.whatsapp_clicks = (analytics.whatsapp_clicks or 0) + 1
        analytics.updated_at = datetime.utcnow()
    else:
        db.add(Analytics(
            id=f"an_{uuid.uuid4().hex[:8]}",
            product_id=product_id,
            views_count=0,
            whatsapp_clicks=1,
            updated_at=datetime.utcnow(),
        ))
    db.commit()
    return {"success": True}