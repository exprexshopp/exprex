from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class ModerationLog(Base):
    __tablename__ = "moderation_logs"
    id = Column(String, primary_key=True, index=True)
    shop_id = Column(String, nullable=False)
    shop_name = Column(String, nullable=False)
    actor_email = Column(String, nullable=False)
    action = Column(String, nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
