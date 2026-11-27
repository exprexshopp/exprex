from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer
from sqlalchemy.sql import func
from app.database import Base


class ShopBot(Base):
    """
    Configuration du bot WhatsApp pour une boutique Exprex.
    shop_id correspond à shops.id du backend Exprex (pas de FK cross-service).
    """

    __tablename__ = "shop_bots"

    id = Column(String, primary_key=True, index=True)
    shop_id = Column(String, unique=True, nullable=False, index=True)
    shop_name = Column(String, nullable=False)
    shop_slug = Column(String, nullable=True)

    # WhatsApp Business
    phone_number_id = Column(String, unique=True, nullable=True, index=True)
    waba_id = Column(String, nullable=True)
    access_token = Column(Text, nullable=True)  # chiffrer en prod
    display_phone = Column(String, nullable=True)

    # Personnalisation
    system_prompt = Column(Text, nullable=True)
    tone = Column(String, default="professionnel et amical")  # ton de voix
    business_hours = Column(Text, nullable=True)  # JSON string
    welcome_message = Column(Text, nullable=True)
    fallback_message = Column(
        Text,
        default="Un conseiller de la boutique va vous répondre sous peu.",
    )

    # Snapshot produits (phase 1 — plus tard sync live Exprex)
    products_snapshot = Column(Text, nullable=True)  # JSON array
    products_updated_at = Column(DateTime(timezone=True), nullable=True)

    is_active = Column(Boolean, default=False)
    auto_reply = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
