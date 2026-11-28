"""Synchronisation catalogue → contexte LLM."""

from __future__ import annotations

import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.catalog import CatalogSnapshot
from app.schemas.chat import CatalogSyncIn
from app.services.catalog_cache import invalidate, set as cache_set
from app.utils.ids import new_id

router = APIRouter(prefix="/api/catalog", tags=["catalog"])


@router.post("/sync")
def sync_catalog(payload: CatalogSyncIn, db: Session = Depends(get_db)):
    products = [p.model_dump() for p in payload.products]
    scope = payload.scope.strip() or "marketplace"

    existing = db.query(CatalogSnapshot).filter(CatalogSnapshot.scope == scope).first()
    raw = json.dumps(products, ensure_ascii=False)
    if existing:
        existing.products_json = raw
        existing.products_count = len(products)
        snap = existing
    else:
        snap = CatalogSnapshot(
            id=new_id("cat_"),
            scope=scope,
            products_json=raw,
            products_count=len(products),
        )
        db.add(snap)
    db.commit()
    db.refresh(snap)

    # Invalide / rafraîchit le cache mémoire immédiatement
    invalidate(scope)
    cache_set(scope, products)

    return {
        "scope": snap.scope,
        "products_count": snap.products_count,
        "updated_at": snap.updated_at,
    }


@router.get("/{scope:path}")
def get_catalog(scope: str, db: Session = Depends(get_db)):
    snap = db.query(CatalogSnapshot).filter(CatalogSnapshot.scope == scope).first()
    if not snap:
        return {"scope": scope, "products_count": 0, "products": []}
    try:
        products = json.loads(snap.products_json)
    except Exception:
        products = []
    return {
        "scope": snap.scope,
        "products_count": snap.products_count,
        "products": products,
        "updated_at": snap.updated_at,
    }
