from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class Message(Base):
    """Message individuel dans une conversation."""

    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)
    conversation_id = Column(
        String, ForeignKey("conversations.id"), nullable=False, index=True
    )

    # in = client → bot | out = bot → client | system
    direction = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String, default="text")  # text | image | interactive | ...

    # Meta message id (pour déduplication / statut)
    wa_message_id = Column(String, nullable=True, index=True)
    status = Column(String, default="sent")  # received | sent | delivered | read | failed

    is_from_bot = Column(Boolean, default=False)
    metadata_json = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
