from sqlalchemy import Column, String, Boolean, ForeignKey
from app.database import Base

class SubCategory(Base):
    __tablename__ = "subcategories"
    id = Column(String, primary_key=True, index=True)
    category_id = Column(String, ForeignKey("categories.id"), nullable=False)
    category_name = Column(String, nullable=False)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
