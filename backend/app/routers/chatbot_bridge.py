"""
Pont Exprex backend ↔ service chatbot (Exprex AI Seller).

Le chatbot reste un service indépendant (dossier /chatbot).
Ce routeur authentifie le vendeur, lit les données Exprex (shop, products),
et appelle le service chatbot pour connect / sync / conversations.
"""

from __future__ import annotations

import os
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop import Shop
from app.models.product import Product
from app.models.user import User, UserRole
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])

CHATBOT_URL = os.getenv("CHATBOT_URL", "http://127.0.0.1:8001").rstrip("/")
CHATBOT_TIMEOUT = float(os.getenv("CHATBOT_TIMEOUT", "20"))


def _chatbot_headers() -> dict:
    # Réservé si le service chatbot exige un secret interne plus tard
    secret = os.getenv("CHATBOT_INTERNAL_SECRET", "")
    headers = {"Content-Type": "application/json"}
    if secret:
        headers["X-Internal-Secret"] = secret
    return headers


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
            r = await client.request(
                method, url, json=json, params=params, headers=_chatbot_headers()
            )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Service chatbot indisponible ({CHATBOT_URL}): {e}",
        ) from e

    if r.status_code >= 400:
        detail: Any
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    if r.status_code == 204 or not r.content:
        return None
    return r.json()


def _get_owned_shop(shop_id: str, user: User, db: Session) -> Shop:
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(404, "Boutique non trouvée")
    if shop.owner_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(403, "Vous n'êtes pas propriétaire de cette boutique")
    return shop


def _products_payload(db: Session, shop_id: str) -> list[dict]:
    rows = db.query(Product).filter(Product.shop_id == shop_id).all()
    out = []
    for p in rows:
        out.append(
            {
                "id": p.id,
                "name": p.name,
                "description": p.description or "",
                "price": float(p.price or 0),
                "slug": p.slug,
                "in_stock": bool(p.in_stock),
                "image": p.image,
                "category": p.category,
            }
        )
    return out


@router.get("/health")
async def chatbot_health():
    """Ping du service chatbot (admin / diagnostic)."""
    try:
        data = await _chatbot_request("GET", "/api/health")
        return {"bridge": "ok", "chatbot": data}
    except HTTPException as e:
        return {"bridge": "ok", "chatbot": {"status": "down", "detail": e.detail}}


@router.get("/meta/config")
async def meta_sdk_config(current_user: User = Depends(get_current_user)):
    """
    Config publique Embedded Signup (app_id + config_id) pour le frontend.
    Nécessite d'être connecté (vendeur).
    """
    return await _chatbot_request("GET", "/api/oauth/meta/config")


@router.get("/shops/{shop_id}/status")
async def get_bot_status(
    shop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """État du bot pour une boutique (404 chatbot → non configuré)."""
    _get_owned_shop(shop_id, current_user, db)
    try:
        data = await _chatbot_request("GET", f"/api/shops/{shop_id}")
        data["configured"] = True
        return data
    except HTTPException as e:
        if e.status_code == 404:
            return {
                "configured": False,
                "shop_id": shop_id,
                "is_active": False,
                "auto_reply": False,
            }
        raise


@router.post("/shops/{shop_id}/embedded-signup")
async def complete_embedded_signup(
    shop_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Finalise Embedded Signup Meta pour la boutique du vendeur.

    Body (issu du SDK FB + événement WA_EMBEDDED_SIGNUP) :
      code et/ou access_token
      phone_number_id, waba_id, display_phone (recommandés)
      tone, welcome_message (optionnels)
    """
    shop = _get_owned_shop(shop_id, current_user, db)
    payload = {
        "shop_id": shop.id,
        "shop_name": shop.name,
        "shop_slug": shop.slug,
        "code": data.get("code"),
        "access_token": data.get("access_token"),
        "phone_number_id": data.get("phone_number_id"),
        "waba_id": data.get("waba_id"),
        "display_phone": data.get("display_phone") or shop.whatsapp_number,
        "tone": data.get("tone") or "professionnel et amical",
        "system_prompt": data.get("system_prompt"),
        "welcome_message": data.get("welcome_message")
        or f"Bonjour ! Bienvenue chez {shop.name}. Comment puis-je vous aider ?",
        "business_hours": shop.hours,
    }
    result = await _chatbot_request(
        "POST", "/api/oauth/meta/embedded-signup", json=payload
    )

    products = _products_payload(db, shop.id)
    if products:
        await _chatbot_request(
            "POST",
            f"/api/shops/{shop.id}/products-sync",
            json={"products": products},
        )
        result = await _chatbot_request("GET", f"/api/shops/{shop.id}")

    if isinstance(result, dict):
        result["configured"] = True
    return result


@router.post("/shops/{shop_id}/connect")
async def connect_bot(
    shop_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Connexion manuelle (fallback admin / debug).
    Préférer POST .../embedded-signup pour les vendeurs.
    """
    shop = _get_owned_shop(shop_id, current_user, db)
    phone_number_id = (data.get("phone_number_id") or "").strip()
    if not phone_number_id:
        raise HTTPException(400, "phone_number_id est requis")

    payload = {
        "shop_id": shop.id,
        "shop_name": shop.name,
        "shop_slug": shop.slug,
        "phone_number_id": phone_number_id,
        "waba_id": data.get("waba_id"),
        "access_token": data.get("access_token"),
        "display_phone": data.get("display_phone") or shop.whatsapp_number,
        "tone": data.get("tone") or "professionnel et amical",
        "system_prompt": data.get("system_prompt"),
        "welcome_message": data.get("welcome_message")
        or f"Bonjour ! Bienvenue chez {shop.name}. Comment puis-je vous aider ?",
        "business_hours": shop.hours,
    }
    result = await _chatbot_request("POST", "/api/shops/connect", json=payload)

    products = _products_payload(db, shop.id)
    if products:
        await _chatbot_request(
            "POST",
            f"/api/shops/{shop.id}/products-sync",
            json={"products": products},
        )
        result = await _chatbot_request("GET", f"/api/shops/{shop.id}")

    return result


@router.patch("/shops/{shop_id}/settings")
async def update_bot_settings(
    shop_id: str,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Met à jour ton, prompts, auto_reply, is_active, etc."""
    _get_owned_shop(shop_id, current_user, db)
    allowed = {
        "tone",
        "system_prompt",
        "welcome_message",
        "fallback_message",
        "business_hours",
        "is_active",
        "auto_reply",
        "access_token",
        "display_phone",
    }
    payload = {k: v for k, v in data.items() if k in allowed}
    if not payload:
        raise HTTPException(400, "Aucun champ valide à mettre à jour")
    return await _chatbot_request("PATCH", f"/api/shops/{shop_id}", json=payload)


@router.post("/shops/{shop_id}/sync-products")
async def sync_products(
    shop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pousse le catalogue Exprex de la boutique vers le chatbot."""
    _get_owned_shop(shop_id, current_user, db)
    products = _products_payload(db, shop_id)
    return await _chatbot_request(
        "POST",
        f"/api/shops/{shop_id}/products-sync",
        json={"products": products},
    )


@router.get("/shops/{shop_id}/conversations")
async def list_conversations(
    shop_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_shop(shop_id, current_user, db)
    return await _chatbot_request("GET", f"/api/shops/{shop_id}/conversations")


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    # Auth légère : le vendeur doit être connecté ; ownership affiné plus tard via shop_id
    return await _chatbot_request(
        "GET", f"/api/conversations/{conversation_id}/messages"
    )


@router.post("/conversations/{conversation_id}/handoff")
async def handoff(
    conversation_id: str,
    data: dict | None = None,
    current_user: User = Depends(get_current_user),
):
    return await _chatbot_request(
        "POST",
        f"/api/conversations/{conversation_id}/handoff",
        json=data or {},
    )


@router.post("/conversations/{conversation_id}/resume")
async def resume(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
):
    return await _chatbot_request(
        "POST", f"/api/conversations/{conversation_id}/resume", json={}
    )
