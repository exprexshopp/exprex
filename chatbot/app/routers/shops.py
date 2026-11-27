"""API de configuration des bots par boutique."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json

from app.database import get_db
from app.models.shop_bot import ShopBot
from app.schemas.shop_bot import (
    ShopBotConnect,
    ShopBotUpdate,
    ShopBotOut,
    ProductsSyncIn,
)
from app.utils.ids import new_id

router = APIRouter(prefix="/api/shops", tags=["shops"])


def _to_out(bot: ShopBot) -> ShopBotOut:
    count = 0
    if bot.products_snapshot:
        try:
            count = len(json.loads(bot.products_snapshot))
        except Exception:
            count = 0
    return ShopBotOut(
        id=bot.id,
        shop_id=bot.shop_id,
        shop_name=bot.shop_name,
        shop_slug=bot.shop_slug,
        phone_number_id=bot.phone_number_id,
        display_phone=bot.display_phone,
        tone=bot.tone,
        system_prompt=bot.system_prompt,
        welcome_message=bot.welcome_message,
        fallback_message=bot.fallback_message,
        business_hours=bot.business_hours,
        is_active=bot.is_active,
        auto_reply=bot.auto_reply,
        products_count=count,
        products_updated_at=bot.products_updated_at,
        created_at=bot.created_at,
        updated_at=bot.updated_at,
    )


@router.post("/connect", response_model=ShopBotOut)
def connect_shop(payload: ShopBotConnect, db: Session = Depends(get_db)):
    """
    Enregistre / met à jour la connexion WhatsApp d'une boutique.
    shop_id = id de la boutique dans Exprex.
    """
    existing = db.query(ShopBot).filter(ShopBot.shop_id == payload.shop_id).first()

    # phone_number_id unique
    if payload.phone_number_id:
        conflict = (
            db.query(ShopBot)
            .filter(
                ShopBot.phone_number_id == payload.phone_number_id,
                ShopBot.shop_id != payload.shop_id,
            )
            .first()
        )
        if conflict:
            raise HTTPException(
                status_code=409,
                detail="Ce phone_number_id est déjà lié à une autre boutique",
            )

    if existing:
        existing.shop_name = payload.shop_name
        existing.shop_slug = payload.shop_slug
        existing.phone_number_id = payload.phone_number_id
        existing.waba_id = payload.waba_id
        if payload.access_token:
            existing.access_token = payload.access_token
        existing.display_phone = payload.display_phone
        if payload.tone:
            existing.tone = payload.tone
        if payload.system_prompt is not None:
            existing.system_prompt = payload.system_prompt
        if payload.welcome_message is not None:
            existing.welcome_message = payload.welcome_message
        if payload.business_hours is not None:
            existing.business_hours = payload.business_hours
        existing.is_active = True
        bot = existing
    else:
        bot = ShopBot(
            id=new_id("bot_"),
            shop_id=payload.shop_id,
            shop_name=payload.shop_name,
            shop_slug=payload.shop_slug,
            phone_number_id=payload.phone_number_id,
            waba_id=payload.waba_id,
            access_token=payload.access_token,
            display_phone=payload.display_phone,
            tone=payload.tone or "professionnel et amical",
            system_prompt=payload.system_prompt,
            welcome_message=payload.welcome_message,
            business_hours=payload.business_hours,
            is_active=True,
            auto_reply=True,
        )
        db.add(bot)

    db.commit()
    db.refresh(bot)
    return _to_out(bot)


@router.get("/{shop_id}", response_model=ShopBotOut)
def get_shop_bot(shop_id: str, db: Session = Depends(get_db)):
    bot = db.query(ShopBot).filter(ShopBot.shop_id == shop_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot non configuré pour cette boutique")
    return _to_out(bot)


@router.patch("/{shop_id}", response_model=ShopBotOut)
def update_shop_bot(
    shop_id: str, payload: ShopBotUpdate, db: Session = Depends(get_db)
):
    bot = db.query(ShopBot).filter(ShopBot.shop_id == shop_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot non configuré pour cette boutique")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(bot, k, v)
    db.commit()
    db.refresh(bot)
    return _to_out(bot)


@router.post("/{shop_id}/products-sync", response_model=ShopBotOut)
def sync_products(
    shop_id: str, payload: ProductsSyncIn, db: Session = Depends(get_db)
):
    """
    Injecte un snapshot des produits de la boutique (phase 1).
    Plus tard : lecture directe depuis le backend / DB Exprex.
    """
    bot = db.query(ShopBot).filter(ShopBot.shop_id == shop_id).first()
    if not bot:
        raise HTTPException(status_code=404, detail="Bot non configuré pour cette boutique")

    products = [p.model_dump() for p in payload.products]
    bot.products_snapshot = json.dumps(products, ensure_ascii=False)
    bot.products_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(bot)
    return _to_out(bot)


@router.get("", response_model=list[ShopBotOut])
def list_shop_bots(db: Session = Depends(get_db)):
    bots = db.query(ShopBot).order_by(ShopBot.created_at.desc()).all()
    return [_to_out(b) for b in bots]
