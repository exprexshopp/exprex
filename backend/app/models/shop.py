from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base

class Shop(Base):
    __tablename__ = "shops"
    id = Column(String, primary_key=True, index=True)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    owner_email = Column(String, nullable=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    location = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True)
    logo = Column(String, nullable=True)
    theme = Column(String, nullable=False)
    custom_theme_color = Column(String, nullable=False)
    facebook = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    hours = Column(Text, nullable=False)  # JSON string
    status = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
