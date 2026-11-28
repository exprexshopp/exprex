from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class ChatSession(Base):
    """
    Session de discussion sur la plateforme Exprex (visiteur ou utilisateur connecté).
    Canal unique : web (exprex.vercel.app).
    """

    __tablename__ = "chat_sessions"

    id = Column(String, primary_key=True, index=True)
    # Anonyme (localStorage) ou user_id Exprex si connecté
    visitor_id = Column(String, nullable=False, index=True)
    user_id = Column(String, nullable=True, index=True)
    # Contexte optionnel : page boutique / produit
    shop_id = Column(String, nullable=True, index=True)
    shop_slug = Column(String, nullable=True)
    product_slug = Column(String, nullable=True)
    locale = Column(String, default="fr")
    is_active = Column(Boolean, default=True)
    meta_json = Column(Text, nullable=True)  # JSON libre (ville, filtres…)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    last_message_at = Column(DateTime(timezone=True), nullable=True)
