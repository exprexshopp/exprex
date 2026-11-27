"""Construction du system prompt et du contexte boutique pour le LLM."""

from __future__ import annotations

import json
from typing import List, Optional
from app.models.shop_bot import ShopBot
from app.config import settings


def _parse_products(snapshot: Optional[str]) -> List[dict]:
    if not snapshot:
        return []
    try:
        data = json.loads(snapshot)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def build_system_prompt(bot: ShopBot) -> str:
    """
    System prompt dynamique pour Exprex AI Seller.
    Le bot ne connaît QUE les produits de cette boutique.
    """
    products = _parse_products(bot.products_snapshot)
    product_lines = []
    for p in products[:40]:  # limite pour le contexte
        stock = "en stock" if p.get("in_stock", True) else "rupture"
        price = p.get("price", 0)
        slug = p.get("slug") or p.get("id")
        link = f"{settings.EXPREX_FRONTEND_URL}/product/{slug}" if slug else ""
        line = f"- {p.get('name')} | {price} FCFA | {stock}"
        if p.get("description"):
            line += f" | {p['description'][:120]}"
        if link:
            line += f" | lien: {link}"
        product_lines.append(line)

    products_block = (
        "\n".join(product_lines)
        if product_lines
        else "Aucun produit synchronisé pour le moment."
    )

    custom = bot.system_prompt or ""
    tone = bot.tone or "professionnel et amical"
    hours = bot.business_hours or "Non renseignés"
    welcome = bot.welcome_message or ""

    prompt = f"""Tu es l'assistant WhatsApp de la boutique « {bot.shop_name} » sur la plateforme Exprex.

Rôle :
- Répondre aux questions des clients sur les produits de CETTE boutique uniquement.
- Communiquer les prix, disponibilités et caractéristiques.
- Envoyer les liens Exprex des produits quand c'est utile.
- Collecter les demandes de commande ou de réservation (nom, produit, quantité, ville).
- Rester poli, concis et utile (réponses adaptées à WhatsApp : courtes).
- Si tu ne sais pas ou si la demande est complexe (négociation, réclamation, personnalisation poussée), indique clairement qu'un conseiller de la boutique va prendre le relais.

Règles strictes :
- Ne parle JAMAIS des produits d'autres boutiques.
- N'invente pas de prix ni de stock.
- Ne promets pas de livraison ou de délais si ce n'est pas dans les infos fournies.
- Ton de voix : {tone}.

Informations boutique :
- Nom : {bot.shop_name}
- Horaires : {hours}
- Message d'accueil éventuel : {welcome}

Catalogue produits (snapshot) :
{products_block}

Instructions additionnelles du vendeur :
{custom or "Aucune."}

Quand tu proposes un produit, inclus le lien Exprex s'il est disponible.
Si le client demande à parler à un humain, réponds poliment et le système fera le handoff.
"""
    return prompt.strip()


def products_summary_for_mock(bot: ShopBot) -> str:
    products = _parse_products(bot.products_snapshot)
    if not products:
        return "Je n'ai pas encore de catalogue synchronisé. Un conseiller va vous répondre."
    names = [p.get("name", "?") for p in products[:5]]
    return "Voici quelques produits de la boutique : " + ", ".join(names) + "."
