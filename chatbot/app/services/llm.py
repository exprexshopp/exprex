"""Génération de réponses — LLM OpenAI-compatible ou mock."""

from __future__ import annotations

from typing import List, Dict, Optional
from app.config import settings
from app.models.shop_bot import ShopBot
from app.services.context import build_system_prompt, products_summary_for_mock


async def generate_reply(
    bot: ShopBot,
    history: List[Dict[str, str]],
    user_message: str,
) -> str:
    """
    history: liste de {"role": "user"|"assistant", "content": "..."}
    """
    if settings.LLM_MOCK or not settings.OPENAI_API_KEY:
        return _mock_reply(bot, user_message)

    system = build_system_prompt(bot)
    messages = [{"role": "system", "content": system}]
    # garder les derniers tours pour rester dans la fenêtre de contexte
    for m in history[-12:]:
        messages.append({"role": m["role"], "content": m["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL or None,
        )
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=500,
        )
        text = resp.choices[0].message.content or ""
        return text.strip() or bot.fallback_message or "Je vous réponds dès que possible."
    except Exception as e:
        print(f"[llm] error: {e}")
        return bot.fallback_message or "Un conseiller de la boutique va vous répondre sous peu."


def _mock_reply(bot: ShopBot, user_message: str) -> str:
    """Réponses déterministes pour dev / démo sans clé LLM."""
    msg = (user_message or "").lower().strip()

    if any(w in msg for w in ("bonjour", "bonsoir", "salut", "hello", "hi")):
        if bot.welcome_message:
            return bot.welcome_message
        return (
            f"Bonjour ! Bienvenue chez {bot.shop_name}. "
            "Comment puis-je vous aider aujourd'hui ?"
        )

    if any(w in msg for w in ("humain", "conseiller", "vendeur", "agent", "parler à")):
        return (
            "Bien sûr, je transfère votre demande à un conseiller de la boutique. "
            "Il vous répondra dès que possible."
        )

    if any(w in msg for w in ("prix", "coût", "combien", "tarif")):
        return (
            products_summary_for_mock(bot)
            + " Indiquez le nom du produit pour le prix exact."
        )

    if any(w in msg for w in ("dispo", "disponible", "stock", "rupture")):
        return (
            "Je peux vérifier la disponibilité. "
            "Précisez le produit qui vous intéresse."
        )

    if any(w in msg for w in ("livraison", "livrer", "douala", "yaoundé", "yaounde")):
        return (
            "Pour la livraison, un conseiller confirmera les modalités et délais "
            "selon votre ville. Souhaitez-vous passer commande ?"
        )

    if any(w in msg for w in ("commande", "commander", "acheter", "réserver")):
        return (
            "Parfait. Indiquez le produit, la quantité et votre ville. "
            "Un conseiller validera ensuite la commande avec vous."
        )

    # défaut
    summary = products_summary_for_mock(bot)
    return (
        f"Merci pour votre message. {summary} "
        "Posez-moi une question sur un produit, un prix ou la disponibilité, "
        "ou demandez à parler à un conseiller."
    )
