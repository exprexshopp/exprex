"""
Seed d'une boutique démo + produits pour tester le module sans Meta.
Usage:
  cd chatbot && python -m scripts.seed_demo
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# permet d'importer app depuis la racine chatbot/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import SessionLocal, engine, Base
from app.models.shop_bot import ShopBot
from app.utils.ids import new_id
from datetime import datetime, timezone

Base.metadata.create_all(bind=engine)


def main():
    db = SessionLocal()
    shop_id = "demo-shop-001"

    bot = db.query(ShopBot).filter(ShopBot.shop_id == shop_id).first()
    products = [
        {
            "id": "p1",
            "name": "Ordinateur portable 15 pouces",
            "description": "Idéal programmation, 16 Go RAM, SSD 512 Go",
            "price": 185000,
            "slug": "laptop-15-prog",
            "in_stock": True,
            "category": "Informatique",
        },
        {
            "id": "p2",
            "name": "Souris sans fil",
            "description": "Ergonomique, autonomie 12 mois",
            "price": 8500,
            "slug": "souris-sans-fil",
            "in_stock": True,
            "category": "Accessoires",
        },
        {
            "id": "p3",
            "name": "Clavier mécanique RGB",
            "description": "Switches blue, layout AZERTY",
            "price": 32000,
            "slug": "clavier-meca-rgb",
            "in_stock": False,
            "category": "Accessoires",
        },
    ]

    if bot:
        bot.products_snapshot = json.dumps(products, ensure_ascii=False)
        bot.products_updated_at = datetime.now(timezone.utc)
        bot.is_active = True
        bot.phone_number_id = bot.phone_number_id or "demo_phone_number_id"
        print(f"Updated existing bot: {bot.id}")
    else:
        bot = ShopBot(
            id=new_id("bot_"),
            shop_id=shop_id,
            shop_name="Tech Douala Demo",
            shop_slug="tech-douala-demo",
            phone_number_id="demo_phone_number_id",
            display_phone="+237600000000",
            tone="professionnel et chaleureux",
            welcome_message="Bonjour ! Bienvenue chez Tech Douala. Que recherchez-vous ?",
            system_prompt="Tu peux proposer la livraison à Douala sous 48h si le produit est en stock.",
            business_hours='{"lun-ven": "9h-18h", "sam": "9h-13h"}',
            products_snapshot=json.dumps(products, ensure_ascii=False),
            products_updated_at=datetime.now(timezone.utc),
            is_active=True,
            auto_reply=True,
        )
        db.add(bot)
        print(f"Created bot: {bot.id}")

    db.commit()
    print("Shop ID:", shop_id)
    print("Phone number ID (demo):", bot.phone_number_id)
    print("Products:", len(products))
    db.close()


if __name__ == "__main__":
    main()
