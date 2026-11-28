"""Contexte LLM + recherche catalogue légère."""

from __future__ import annotations

import json
import re
from typing import List, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.catalog import CatalogSnapshot
from app.services import catalog_cache


def _parse_products(raw: Optional[str]) -> List[dict]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def load_catalog_products(
    db: Session,
    *,
    shop_id: Optional[str] = None,
    limit: Optional[int] = None,
) -> List[dict]:
    limit = limit or settings.CATALOG_PROMPT_LIMIT
    scopes: List[str] = []
    if shop_id:
        scopes.append(f"shop:{shop_id}")
    scopes.append("marketplace")

    for scope in scopes:
        cached = catalog_cache.get(scope)
        if cached is not None:
            return cached[:limit]

        snap = (
            db.query(CatalogSnapshot)
            .filter(CatalogSnapshot.scope == scope)
            .first()
        )
        if snap:
            products = _parse_products(snap.products_json)
            if products:
                catalog_cache.set(scope, products)
                return products[:limit]
    return []


def filter_products(products: List[dict], query: str, limit: int = 8) -> List[dict]:
    """Filtre simple par mots-clés (nom, description, catégorie, boutique)."""
    q = (query or "").lower().strip()
    if not q or not products:
        return products[:limit]

    tokens = [t for t in re.split(r"\W+", q) if len(t) > 2]
    # enlever mots vides FR
    stop = {
        "les", "des", "une", "pour", "avec", "dans", "sur", "cherche", "cherchee",
        "montre", "montrer", "veux", "voudrais", "quel", "quelle", "prix", "produit",
        "produits", "bonjour", "salut", "hello", "besoin",
    }
    tokens = [t for t in tokens if t not in stop]
    if not tokens:
        return products[:limit]

    scored: List[tuple] = []
    for p in products:
        blob = " ".join(
            str(p.get(k) or "")
            for k in ("name", "description", "category", "shop_name", "slug")
        ).lower()
        score = sum(1 for t in tokens if t in blob)
        # budget approximatif : "moins de 10000" etc. ignoré ici (LLM gère)
        if score:
            scored.append((score, p))
    scored.sort(key=lambda x: -x[0])
    if scored:
        return [p for _, p in scored[:limit]]
    return products[:limit]


def build_system_prompt(
    *,
    products: List[dict],
    shop_name: Optional[str] = None,
    product_focus: Optional[str] = None,
) -> str:
    lines = []
    for p in products[: settings.CATALOG_PROMPT_LIMIT]:
        stock = "en stock" if p.get("in_stock", True) else "rupture"
        price = p.get("price", 0)
        slug = p.get("slug") or p.get("id")
        link = f"{settings.EXPREX_FRONTEND_URL}/product/{slug}" if slug else ""
        shop = p.get("shop_name") or ""
        line = f"- {p.get('name')} | {price} FCFA | {stock}"
        if shop:
            line += f" | boutique: {shop}"
        if p.get("category"):
            line += f" | cat: {p['category']}"
        if p.get("description"):
            line += f" | {str(p['description'])[:100]}"
        if link:
            line += f" | lien: {link}"
        lines.append(line)

    catalog = "\n".join(lines) if lines else "Catalogue en cours de synchronisation."

    focus = ""
    if shop_name:
        focus += f"\nContexte page : boutique « {shop_name} »."
    if product_focus:
        focus += f"\nProduit consulté : {product_focus}."

    return f"""Tu es **Exprex AI Shopping**, l'assistant d'achat intégré à la plateforme Exprex ({settings.EXPREX_FRONTEND_URL}).

Rôle :
- Aider les visiteurs à découvrir, comparer et choisir des produits du marketplace.
- Répondre en français, court et clair (2–5 phrases max sauf liste produits).
- Inclure le lien fiche produit quand tu recommandes un article.
- Ne jamais inventer prix, stock ou boutique hors catalogue fourni.
- Si le catalogue est vide, le dire et inviter à parcourir le site.

Règles :
- Canal unique : chat web Exprex (pas WhatsApp).
- Pas de promesse de livraison / paiement hors infos fournies.
- Ton amical, utile, concis.
{focus}

Catalogue (snapshot) :
{catalog}
"""


def mock_reply(user_message: str, products: List[dict]) -> str:
    msg = (user_message or "").lower().strip()
    matched = filter_products(products, user_message, limit=4)

    if any(w in msg for w in ("bonjour", "salut", "hello", "bonsoir", "hey")):
        hint = ""
        if products:
            hint = f" Exemples : {', '.join(p.get('name', '?') for p in products[:3])}."
        return (
            "Bonjour ! Je suis l'assistant Exprex. "
            "Indiquez une catégorie, un budget ou un nom de produit."
            + hint
        )

    if matched and any(
        w in msg
        for w in (
            "prix",
            "produit",
            "cherche",
            "montre",
            "dispo",
            "disponible",
            "combien",
            "recommande",
            "veux",
            "besoin",
        )
    ):
        parts = []
        for p in matched:
            slug = p.get("slug") or p.get("id")
            link = f"{settings.EXPREX_FRONTEND_URL}/product/{slug}" if slug else ""
            price = p.get("price", 0)
            stock = "en stock" if p.get("in_stock", True) else "rupture"
            line = f"• {p.get('name')} — {price} FCFA ({stock})"
            if link:
                line += f" → {link}"
            parts.append(line)
        return "Voici ce que je trouve :\n" + "\n".join(parts)

    if matched:
        names = ", ".join(p.get("name", "?") for p in matched[:3])
        return (
            f"D'après le catalogue : {names}. "
            "Demandez le prix, la dispo ou un lien vers la fiche."
        )

    if products:
        return (
            "Je n'ai pas trouvé d'article exact. "
            f"Suggestions : {', '.join(p.get('name', '?') for p in products[:3])}. "
            "Reformulez avec un mot-clé (ex. chaussures, téléphone…)."
        )

    return (
        "Catalogue pas encore synchronisé. "
        "Parcourez les catégories sur Exprex ou réessayez dans un instant."
    )
