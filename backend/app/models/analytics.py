from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class Analytics(Base):
    __tablename__ = "analytics"
    id = Column(String, primary_key=True, index=True)
    product_id = Column(String, ForeignKey("products.id"), unique=True, nullable=False)
    views_count = Column(Integer, default=0)
    whatsapp_clicks = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
