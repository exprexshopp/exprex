"""
Pont Exprex backend ↔ service chatbot web (Exprex AI Shopping).
Endpoints dédiés sous /api/chatbot/* uniquement.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

CHATBOT_URL = os.getenv("CHATBOT_URL", "http://127.0.0.1:8001").rstrip("/")
CHATBOT_TIMEOUT = float(os.getenv("CHATBOT_TIMEOUT", "30"))


async def _chatbot_request(
    method: str,
    path: str,
    *,
    json: Optional[dict] = None,
    params: Optional[dict] = None,
) -> Any:
    url = f"{CHATBOT_URL}{path}"
    try:
        async with httpx.AsyncClient(timeout=CHATBOT_TIMEOUT) as client:
            r = await client.request(method, url, json=json, params=params)
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service chatbot indisponible ({CHATBOT_URL}): {e}",
        ) from e
    if r.status_code >= 400:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    if r.status_code == 204 or not r.content:
        return None
    return r.json()


def _products_payload(db: Session, shop_id: Optional[str] = None) -> list[dict]:
    q = db.query(Product)
    if shop_id:
        q = q.filter(Product.shop_id == shop_id)
    rows = q.limit(200).all()
    out = []
    for p in rows:
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "description": getattr(p, "description", None) or "",
                "price": float(p.price or 0),
                "slug": p.slug,
                "in_stock": bool(p.in_stock),
                "image": p.image,
                "category": p.category,
                "shop_id": p.shop_id,
                "shop_name": getattr(p, "shop_name", None),
                "shop_slug": getattr(p, "shop_slug", None),
            }
        )
    return out


@router.get("/health")
async def chatbot_health():
    try:
        data = await _chatbot_request("GET", "/api/health")
        return {"bridge": "ok", "chatbot": data}
    except HTTPException as e:
        return {"bridge": "ok", "chatbot": {"status": "down", "detail": e.detail}}


@router.post("/message")
async def proxy_message(data: dict):
    return await _chatbot_request("POST", "/api/chat/message", json=data)


@router.get("/sessions/{session_id}/messages")
async def proxy_messages(session_id: str):
    return await _chatbot_request("GET", f"/api/chat/sessions/{session_id}/messages")


@router.post("/catalog/sync-marketplace")
async def sync_marketplace(db: Session = Depends(get_db)):
    products = _products_payload(db)
    return await _chatbot_request(
        "POST",
        "/api/catalog/sync",
        json={"scope": "marketplace", "products": products},
    )


@router.post("/catalog/sync-shop/{shop_id}")
async def sync_shop(shop_id: str, db: Session = Depends(get_db)):
    products = _products_payload(db, shop_id=shop_id)
    return await _chatbot_request(
        "POST",
        "/api/catalog/sync",
        json={"scope": f"shop:{shop_id}", "products": products},
    )
