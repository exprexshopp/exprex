import asyncio
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.product import Product
from app.models.shop import Shop
from app.routers.products import get_products


def make_session(count=30):
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    session.add(Shop(
        id="shop-1", owner_id="owner-1", name="Shop", slug="shop",
        description="", city="Dakar", location="", theme="default",
        custom_theme_color="", hours="{}", status="ACTIVE"
    ))
    session.add_all([
        Product(
            id=f"product-{i:02}", shop_id="shop-1", shop_name="Shop",
            shop_slug="shop", name=f"Product {i}", description="",
            slug=f"product-{i}", price=i, category="test",
            created_at=datetime(2026, 1, 1)
        )
        for i in range(count)
    ])
    session.commit()
    return session, engine


def kwargs(session):
    return dict(
        search=None, category=None, subcategory=None, city=None,
        price_min=None, price_max=None, sort_by=None, db=session
    )


def test_page_30():
    session, engine = make_session(30)
    p1 = asyncio.run(get_products(**kwargs(session), page=1, page_size=24))
    p2 = asyncio.run(get_products(**kwargs(session), page=2, page_size=24))
    assert len(p1["products"]) == 24 and p1["has_more"] is True
    assert len(p2["products"]) == 6 and p2["has_more"] is False
    session.close(); engine.dispose()


def test_page_48_second_page():
    session, engine = make_session(48)
    p2 = asyncio.run(get_products(**kwargs(session), page=2, page_size=24))
    assert len(p2["products"]) == 24 and p2["has_more"] is False
    session.close(); engine.dispose()


def test_empty():
    session, engine = make_session(0)
    p1 = asyncio.run(get_products(**kwargs(session), page=1, page_size=24))
    assert p1["total"] == 0 and p1["products"] == [] and p1["has_more"] is False
    session.close(); engine.dispose()


def test_page_size_and_page_clamps():
    session, engine = make_session(120)
    capped = asyncio.run(get_products(**kwargs(session), page=1, page_size=500))
    clamped = asyncio.run(get_products(**kwargs(session), page=0, page_size=24))
    assert capped["page_size"] == 100 and len(capped["products"]) == 100
    assert clamped["page"] == 1
    session.close(); engine.dispose()


def test_cursor_pagination():
    session, engine = make_session(30)
    first = asyncio.run(get_products(**kwargs(session), cursor=None, limit=24))
    assert first["has_more"] is True
    session.close(); engine.dispose()


def test_legacy_call_without_pagination_is_array():
    session, engine = make_session(3)
    products = asyncio.run(get_products(**kwargs(session), page=None, page_size=None))
    assert isinstance(products, list) and len(products) == 3
    session.close(); engine.dispose()
