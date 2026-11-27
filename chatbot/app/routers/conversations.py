"""API conversations & handoff."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.shop_bot import ShopBot
from app.schemas.conversation import ConversationOut, MessageOut, HandoffIn

router = APIRouter(prefix="/api", tags=["conversations"])


@router.get("/shops/{shop_id}/conversations", response_model=list[ConversationOut])
def list_conversations(shop_id: str, db: Session = Depends(get_db)):
    rows = (
        db.query(Conversation)
        .filter(Conversation.shop_id == shop_id)
        .order_by(Conversation.last_message_at.desc().nullslast())
        .limit(100)
        .all()
    )
    return rows


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def list_messages(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages


@router.post("/conversations/{conversation_id}/handoff", response_model=ConversationOut)
def handoff_conversation(
    conversation_id: str,
    payload: HandoffIn,
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    conv.handed_off = True
    conv.status = "handed_off"
    conv.handed_off_at = datetime.now(timezone.utc)
    conv.handoff_reason = payload.reason or "manual"
    db.commit()
    db.refresh(conv)
    return conv


@router.post("/conversations/{conversation_id}/resume", response_model=ConversationOut)
def resume_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")
    conv.handed_off = False
    conv.status = "open"
    conv.handoff_reason = None
    db.commit()
    db.refresh(conv)
    return conv
