"""API chat web — Exprex AI Shopping (optimisé)."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.session import ChatSession
from app.models.message import ChatMessage
from app.schemas.chat import (
    SessionCreate,
    SessionOut,
    ChatSendIn,
    ChatSendOut,
    MessageOut,
)
from app.services.context import (
    build_system_prompt,
    load_catalog_products,
    filter_products,
)
from app.services.llm import generate_reply
from app.utils.ids import new_id

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _session_out(s: ChatSession) -> SessionOut:
    return SessionOut.model_validate(s)


def _msg_out(m: ChatMessage) -> MessageOut:
    return MessageOut.model_validate(m)


def _find_active_session(
    db: Session, visitor_id: str, session_id: Optional[str]
) -> Optional[ChatSession]:
    if session_id:
        s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if s and s.is_active:
            return s

    # Réutiliser la dernière session active du visiteur (évite de multiplier les sessions)
    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.SESSION_TTL_HOURS)
    q = (
        db.query(ChatSession)
        .filter(
            ChatSession.visitor_id == visitor_id,
            ChatSession.is_active == True,  # noqa: E712
        )
        .order_by(ChatSession.updated_at.desc())
    )
    s = q.first()
    if not s:
        return None
    # TTL soft : si last_message trop vieux, nouvelle session
    ref = s.last_message_at or s.created_at
    if ref and ref.replace(tzinfo=timezone.utc) < cutoff:
        return None
    return s


@router.post("/sessions", response_model=SessionOut)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session = ChatSession(
        id=new_id("sess_"),
        visitor_id=payload.visitor_id,
        user_id=payload.user_id,
        shop_id=payload.shop_id,
        shop_slug=payload.shop_slug,
        product_slug=payload.product_slug,
        locale=payload.locale or "fr",
        is_active=True,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _session_out(session)


@router.get("/sessions/{session_id}", response_model=SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not s:
        raise HTTPException(404, "Session introuvable")
    return _session_out(s)


@router.get("/sessions/{session_id}/messages", response_model=List[MessageOut])
def list_messages(
    session_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    s = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not s:
        raise HTTPException(404, "Session introuvable")
    rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
        .all()
    )
    return [_msg_out(m) for m in rows]


@router.post("/message", response_model=ChatSendOut)
async def send_message(payload: ChatSendIn, db: Session = Depends(get_db)):
    text = (payload.message or "").strip()
    if not text:
        raise HTTPException(400, "Message vide")
    if len(text) > 4000:
        raise HTTPException(400, "Message trop long")

    session = _find_active_session(db, payload.visitor_id, payload.session_id)

    if not session:
        session = ChatSession(
            id=new_id("sess_"),
            visitor_id=payload.visitor_id,
            user_id=payload.user_id,
            shop_id=payload.shop_id,
            shop_slug=payload.shop_slug,
            product_slug=payload.product_slug,
            is_active=True,
        )
        db.add(session)
        db.flush()
    else:
        if payload.shop_id:
            session.shop_id = payload.shop_id
        if payload.shop_slug:
            session.shop_slug = payload.shop_slug
        if payload.product_slug:
            session.product_slug = payload.product_slug
        if payload.user_id:
            session.user_id = payload.user_id

    user_msg = ChatMessage(
        id=new_id("msg_"),
        session_id=session.id,
        role="user",
        content=text,
    )
    db.add(user_msg)
    db.flush()

    # Catalogue + focus produits pertinents pour le prompt
    all_products = load_catalog_products(db, shop_id=session.shop_id)
    focused = filter_products(all_products, text, limit=settings.CATALOG_PROMPT_LIMIT)
    # garder un peu de diversité si filtre trop étroit
    if len(focused) < 5 and all_products:
        seen = {p.get("id") for p in focused}
        for p in all_products:
            if p.get("id") not in seen:
                focused.append(p)
            if len(focused) >= min(15, settings.CATALOG_PROMPT_LIMIT):
                break

    system = build_system_prompt(
        products=focused,
        shop_name=session.shop_slug,
        product_focus=session.product_slug,
    )

    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(settings.MAX_HISTORY_MESSAGES)
        .all()
    )
    history = [
        {
            "role": m.role if m.role in ("user", "assistant") else "user",
            "content": m.content,
        }
        for m in reversed(history_rows)
        if m.id != user_msg.id
    ]

    reply_text = await generate_reply(
        system_prompt=system,
        history=history,
        user_message=text,
        products_for_mock=focused or all_products,
    )

    bot_msg = ChatMessage(
        id=new_id("msg_"),
        session_id=session.id,
        role="assistant",
        content=reply_text,
    )
    db.add(bot_msg)
    session.last_message_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user_msg)
    db.refresh(bot_msg)

    return ChatSendOut(
        session_id=session.id,
        user_message=_msg_out(user_msg),
        assistant_message=_msg_out(bot_msg),
    )
