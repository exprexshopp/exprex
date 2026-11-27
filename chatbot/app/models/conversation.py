from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class Conversation(Base):
    """Fil de discussion entre un client WhatsApp et le bot d'une boutique."""

    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True)
    shop_bot_id = Column(String, ForeignKey("shop_bots.id"), nullable=False, index=True)
    shop_id = Column(String, nullable=False, index=True)

    # Identifiant WhatsApp du client (wa_id)
    customer_wa_id = Column(String, nullable=False, index=True)
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)

    status = Column(String, default="open")  # open | closed | handed_off
    handed_off = Column(Boolean, default=False)
    handed_off_at = Column(DateTime(timezone=True), nullable=True)
    handoff_reason = Column(Text, nullable=True)

    last_message_at = Column(DateTime(timezone=True), nullable=True)
    message_count = Column(String, default="0")  # simple compteur texte pour éviter int issues

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
