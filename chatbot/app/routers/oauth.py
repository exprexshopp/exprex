"""
Endpoints Embedded Signup Meta pour Exprex AI Seller.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.shop_bot import ShopBot
from app.schemas.oauth import EmbeddedSignupComplete, EmbeddedSignupPublicConfig
from app.schemas.shop_bot import ShopBotOut
from app.routers.shops import _to_out
from app.services.meta_oauth import (
    MetaOAuthError,
    public_sdk_config,
    resolve_embedded_signup,
)
from app.utils.ids import new_id

router = APIRouter(prefix="/api/oauth", tags=["oauth"])


@router.get("/meta/config", response_model=EmbeddedSignupPublicConfig)
def meta_public_config():
    """
    Config publique pour initialiser le SDK Facebook / Embedded Signup
    côté frontend (app_id + config_id, jamais le secret).
    """
    return EmbeddedSignupPublicConfig(**public_sdk_config())


@router.post("/meta/embedded-signup", response_model=ShopBotOut)
async def complete_embedded_signup(
    payload: EmbeddedSignupComplete,
    db: Session = Depends(get_db),
):
    """
    Finalise le flux Embedded Signup :
    1. Échange code → access_token (si besoin)
    2. Résout phone_number_id / waba_id
    3. Crée ou met à jour le ShopBot
    """
    if not payload.shop_id or not payload.shop_name:
        raise HTTPException(400, "shop_id et shop_name sont requis")

    try:
        resolved = await resolve_embedded_signup(
            code=payload.code,
            access_token=payload.access_token,
            phone_number_id=payload.phone_number_id,
            waba_id=payload.waba_id,
            display_phone=payload.display_phone,
        )
    except MetaOAuthError as e:
        raise HTTPException(
            status_code=400,
            detail={"message": str(e), "meta": e.detail},
        ) from e

    phone_number_id = resolved["phone_number_id"]
    access_token = resolved["access_token"]
    waba_id = resolved.get("waba_id")
    display_phone = resolved.get("display_phone") or payload.display_phone

    # Unicité phone_number_id
    conflict = (
        db.query(ShopBot)
        .filter(
            ShopBot.phone_number_id == phone_number_id,
            ShopBot.shop_id != payload.shop_id,
        )
        .first()
    )
    if conflict:
        raise HTTPException(
            409,
            "Ce numéro WhatsApp est déjà lié à une autre boutique Exprex",
        )

    existing = db.query(ShopBot).filter(ShopBot.shop_id == payload.shop_id).first()
    if existing:
        existing.shop_name = payload.shop_name
        existing.shop_slug = payload.shop_slug
        existing.phone_number_id = phone_number_id
        existing.waba_id = waba_id
        existing.access_token = access_token
        existing.display_phone = display_phone
        if payload.tone:
            existing.tone = payload.tone
        if payload.system_prompt is not None:
            existing.system_prompt = payload.system_prompt
        if payload.welcome_message is not None:
            existing.welcome_message = payload.welcome_message
        if payload.business_hours is not None:
            existing.business_hours = payload.business_hours
        existing.is_active = True
        existing.auto_reply = True
        bot = existing
    else:
        bot = ShopBot(
            id=new_id("bot_"),
            shop_id=payload.shop_id,
            shop_name=payload.shop_name,
            shop_slug=payload.shop_slug,
            phone_number_id=phone_number_id,
            waba_id=waba_id,
            access_token=access_token,
            display_phone=display_phone,
            tone=payload.tone or "professionnel et amical",
            system_prompt=payload.system_prompt,
            welcome_message=payload.welcome_message
            or f"Bonjour ! Bienvenue chez {payload.shop_name}. Comment puis-je vous aider ?",
            business_hours=payload.business_hours,
            is_active=True,
            auto_reply=True,
        )
        db.add(bot)

    db.commit()
    db.refresh(bot)
    return _to_out(bot)
