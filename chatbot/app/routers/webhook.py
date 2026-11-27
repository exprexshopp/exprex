"""Webhook Meta WhatsApp — vérification + réception des messages."""

from __future__ import annotations

from fastapi import APIRouter, Request, Query, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json

from app.config import settings
from app.database import get_db
from app.models.shop_bot import ShopBot
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.whatsapp import WhatsAppClient, extract_inbound_messages
from app.services.llm import generate_reply
from app.utils.ids import new_id

router = APIRouter(tags=["webhook"])


@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Vérification Meta (GET)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.META_VERIFY_TOKEN:
        return PlainTextResponse(content=hub_challenge or "", status_code=200)
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    """Réception des événements WhatsApp (POST)."""
    try:
        payload = await request.json()
    except Exception:
        return {"status": "ignored"}

    messages = extract_inbound_messages(payload)
    if not messages:
        return {"status": "ok", "processed": 0}

    processed = 0
    for inbound in messages:
        try:
            await _handle_inbound(db, inbound)
            processed += 1
        except Exception as e:
            print(f"[webhook] handle error: {e}")
            db.rollback()

    return {"status": "ok", "processed": processed}


async def _handle_inbound(db: Session, inbound: dict):
    phone_number_id = inbound.get("phone_number_id")
    from_wa_id = inbound.get("from_wa_id")
    text = (inbound.get("text") or "").strip()
    wa_message_id = inbound.get("message_id")

    if not phone_number_id or not from_wa_id:
        return

    bot: ShopBot | None = (
        db.query(ShopBot)
        .filter(ShopBot.phone_number_id == phone_number_id, ShopBot.is_active == True)
        .first()
    )
    if not bot:
        print(f"[webhook] no active bot for phone_number_id={phone_number_id}")
        return

    # Déduplication
    if wa_message_id:
        exists = (
            db.query(Message).filter(Message.wa_message_id == wa_message_id).first()
        )
        if exists:
            return

    # Conversation
    conv = (
        db.query(Conversation)
        .filter(
            Conversation.shop_bot_id == bot.id,
            Conversation.customer_wa_id == from_wa_id,
            Conversation.status != "closed",
        )
        .order_by(Conversation.created_at.desc())
        .first()
    )
    if not conv:
        conv = Conversation(
            id=new_id("conv_"),
            shop_bot_id=bot.id,
            shop_id=bot.shop_id,
            customer_wa_id=from_wa_id,
            customer_name=inbound.get("from_name"),
            status="open",
            handed_off=False,
            message_count="0",
        )
        db.add(conv)
        db.flush()

    # Message entrant
    msg_in = Message(
        id=new_id("msg_"),
        conversation_id=conv.id,
        direction="in",
        content=text or f"[{inbound.get('type') or 'media'}]",
        content_type=inbound.get("type") or "text",
        wa_message_id=wa_message_id,
        status="received",
        is_from_bot=False,
    )
    db.add(msg_in)
    conv.last_message_at = datetime.now(timezone.utc)
    try:
        conv.message_count = str(int(conv.message_count or "0") + 1)
    except Exception:
        conv.message_count = "1"
    db.commit()

    # Marquer comme lu (best effort)
    token = bot.access_token or settings.META_ACCESS_TOKEN
    wa = WhatsAppClient(access_token=token, phone_number_id=bot.phone_number_id)
    if wa_message_id:
        await wa.mark_as_read(wa_message_id, phone_number_id=bot.phone_number_id)

    # Handoff actif → pas de réponse bot
    if conv.handed_off or not bot.auto_reply:
        return

    # Demande explicite d'humain
    lower = text.lower()
    if any(
        k in lower
        for k in ("humain", "conseiller", "vendeur", "agent", "parler à quelqu'un")
    ):
        conv.handed_off = True
        conv.status = "handed_off"
        conv.handed_off_at = datetime.now(timezone.utc)
        conv.handoff_reason = "requested_by_customer"
        db.commit()
        reply = (
            bot.fallback_message
            or "Un conseiller de la boutique va vous répondre sous peu."
        )
    else:
        # Historique pour le LLM
        history_rows = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.asc())
            .limit(20)
            .all()
        )
        history = []
        for m in history_rows:
            if m.id == msg_in.id:
                continue
            role = "assistant" if m.is_from_bot else "user"
            history.append({"role": role, "content": m.content})

        reply = await generate_reply(bot, history, text or "")

    # Envoi + stockage
    send_result = await wa.send_text(
        to_wa_id=from_wa_id,
        text=reply,
        phone_number_id=bot.phone_number_id,
    )

    msg_out = Message(
        id=new_id("msg_"),
        conversation_id=conv.id,
        direction="out",
        content=reply,
        content_type="text",
        status="sent" if send_result.get("ok") else "failed",
        is_from_bot=True,
        metadata_json=json.dumps(send_result, default=str)[:2000],
    )
    db.add(msg_out)
    conv.last_message_at = datetime.now(timezone.utc)
    try:
        conv.message_count = str(int(conv.message_count or "0") + 1)
    except Exception:
        pass
    db.commit()
