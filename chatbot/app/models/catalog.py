from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.sql import func
from app.database import Base


class CatalogSnapshot(Base):
    """
    Snapshot catalogue pour le contexte LLM.
    - scope=marketplace : vue globale (top produits)
    - scope=shop:{shop_id} : produits d'une boutique
    """

    __tablename__ = "catalog_snapshots"

    id = Column(String, primary_key=True, index=True)
    scope = Column(String, unique=True, nullable=False, index=True)
    products_json = Column(Text, nullable=False)  # JSON array
    products_count = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
