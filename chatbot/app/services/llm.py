from __future__ import annotations

from typing import List, Dict, Optional

from app.config import settings
from app.services.context import mock_reply

_client = None


def _get_client():
    """Client OpenAI réutilisé (évite de recréer la connexion à chaque message)."""
    global _client
    if _client is None:
        from openai import AsyncOpenAI

        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL or None,
        )
    return _client


async def generate_reply(
    *,
    system_prompt: str,
    history: List[Dict[str, str]],
    user_message: str,
    products_for_mock: Optional[list] = None,
) -> str:
    if settings.LLM_MOCK or not settings.OPENAI_API_KEY:
        return mock_reply(user_message, products_for_mock or [])

    messages = [{"role": "system", "content": system_prompt}]
    for m in history[-settings.MAX_HISTORY_MESSAGES :]:
        role = m.get("role") if m.get("role") in ("user", "assistant") else "user"
        content = (m.get("content") or "").strip()
        if content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": user_message})

    try:
        client = _get_client()
        resp = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
        )
        text = (resp.choices[0].message.content or "").strip()
        return text or "Je n'ai pas pu formuler de réponse. Reformulez votre question."
    except Exception as e:
        print(f"[llm] error: {e}")
        # Fallback mock pour ne pas bloquer l'UI
        return mock_reply(user_message, products_for_mock or [])
