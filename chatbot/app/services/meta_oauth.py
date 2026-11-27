"""
Meta Embedded Signup — échange de code OAuth + récupération WABA / phone_number_id.
Doc: https://developers.facebook.com/docs/whatsapp/embedded-signup
"""

from __future__ import annotations

from typing import Any, Optional
import httpx
from app.config import settings


class MetaOAuthError(Exception):
    def __init__(self, message: str, detail: Any = None):
        super().__init__(message)
        self.detail = detail


def _graph_base() -> str:
    return f"{settings.META_GRAPH_URL.rstrip('/')}/{settings.META_API_VERSION}"


async def exchange_code_for_token(code: str) -> dict:
    """
    Échange le code renvoyé par Embedded Signup (FB.login response_type=code)
    contre un access token utilisateur / business.
    """
    if not settings.META_APP_ID or not settings.META_APP_SECRET:
        raise MetaOAuthError(
            "META_APP_ID et META_APP_SECRET doivent être configurés côté serveur"
        )
    if not code:
        raise MetaOAuthError("code OAuth manquant")

    url = f"{_graph_base()}/oauth/access_token"
    params = {
        "client_id": settings.META_APP_ID,
        "client_secret": settings.META_APP_SECRET,
        "code": code,
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, params=params)
        data = r.json() if r.content else {}
        if r.status_code >= 400 or "access_token" not in data:
            raise MetaOAuthError("Échec échange code → token", data)
        return data


async def debug_token(input_token: str) -> dict:
    """Inspecte un token (scopes, type, app_id)."""
    app_token = f"{settings.META_APP_ID}|{settings.META_APP_SECRET}"
    url = f"{_graph_base()}/debug_token"
    params = {"input_token": input_token, "access_token": app_token}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, params=params)
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            raise MetaOAuthError("debug_token failed", data)
        return data.get("data") or data


async def get_shared_waba_phone_numbers(
    access_token: str, waba_id: str
) -> list[dict]:
    """Liste les numéros d'un WABA partagé via Embedded Signup."""
    url = f"{_graph_base()}/{waba_id}/phone_numbers"
    params = {"access_token": access_token}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.get(url, params=params)
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            raise MetaOAuthError("Impossible de lister les phone_numbers", data)
        return data.get("data") or []


async def subscribe_app_to_waba(access_token: str, waba_id: str) -> dict:
    """Abonne l'app aux webhooks du WABA (recommandé après signup)."""
    url = f"{_graph_base()}/{waba_id}/subscribed_apps"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, params={"access_token": access_token})
        data = r.json() if r.content else {}
        if r.status_code >= 400:
            # non bloquant : log côté appelant
            return {"ok": False, "error": data}
        return {"ok": True, "data": data}


async def resolve_embedded_signup(
    *,
    code: Optional[str] = None,
    access_token: Optional[str] = None,
    phone_number_id: Optional[str] = None,
    waba_id: Optional[str] = None,
    display_phone: Optional[str] = None,
) -> dict:
    """
    Normalise le résultat Embedded Signup.

    Le frontend envoie typiquement :
    - code (FB.login)  ET/OU  access_token
    - phone_number_id + waba_id (événement message WA_EMBEDDED_SIGNUP)

    Retourne un dict prêt à persister sur ShopBot.
    """
    token = access_token
    token_meta: dict = {}

    if code and not token:
        token_meta = await exchange_code_for_token(code)
        token = token_meta.get("access_token")

    if not token:
        raise MetaOAuthError(
            "Ni code ni access_token fourni après Embedded Signup"
        )

    # Si phone_number_id manquant mais waba_id présent → tenter de le récupérer
    resolved_phone_id = phone_number_id
    resolved_display = display_phone
    resolved_waba = waba_id

    if resolved_waba and not resolved_phone_id:
        numbers = await get_shared_waba_phone_numbers(token, resolved_waba)
        if numbers:
            first = numbers[0]
            resolved_phone_id = str(first.get("id") or "")
            resolved_display = (
                resolved_display
                or first.get("display_phone_number")
                or first.get("verified_name")
            )

    if not resolved_phone_id:
        raise MetaOAuthError(
            "phone_number_id introuvable. "
            "Vérifiez que le flux Embedded Signup a bien renvoyé les données session "
            "(événement WA_EMBEDDED_SIGNUP)."
        )

    # Abonnement webhooks (best effort)
    subscribe_result = None
    if resolved_waba:
        subscribe_result = await subscribe_app_to_waba(token, resolved_waba)

    return {
        "access_token": token,
        "phone_number_id": resolved_phone_id,
        "waba_id": resolved_waba,
        "display_phone": resolved_display,
        "token_meta": token_meta,
        "subscribe": subscribe_result,
    }


def public_sdk_config() -> dict:
    """Config exposée au frontend (pas de secret)."""
    return {
        "app_id": settings.META_APP_ID or None,
        "config_id": settings.META_CONFIG_ID or None,
        "api_version": settings.META_API_VERSION,
        "graph_url": settings.META_GRAPH_URL,
        "embedded_signup_ready": bool(
            settings.META_APP_ID and settings.META_CONFIG_ID
        ),
    }
