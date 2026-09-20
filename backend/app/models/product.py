from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, index=True)
    shop_id = Column(String, ForeignKey("shops.id"), nullable=False)
    shop_name = Column(String, nullable=False)
    shop_slug = Column(String, nullable=False)
    shop_whatsapp = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    price = Column(Float, nullable=False)
    image = Column(String, nullable=True)
    category = Column(String, nullable=False)
    subcategory_id = Column(String, nullable=True)
    subcategory_name = Column(String, nullable=True)
    in_stock = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
