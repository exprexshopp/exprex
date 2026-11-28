from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    # user | assistant | system
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    # JSON optionnel : product cards, liens, etc.
    rich_json = Column(Text, nullable=True)
    is_error = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
