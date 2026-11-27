"""Client Meta WhatsApp Cloud API."""

from __future__ import annotations

from typing import Optional, Dict, Any
import httpx
from app.config import settings


class WhatsAppClient:
    def __init__(
        self,
        access_token: Optional[str] = None,
        phone_number_id: Optional[str] = None,
    ):
        self.access_token = access_token or settings.META_ACCESS_TOKEN
        self.phone_number_id = phone_number_id
        self.api_version = settings.META_API_VERSION
        self.base = f"https://graph.facebook.com/{self.api_version}"

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def send_text(
        self,
        to_wa_id: str,
        text: str,
        phone_number_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Envoie un message texte simple."""
        pn_id = phone_number_id or self.phone_number_id
        if not pn_id or not self.access_token:
            return {"ok": False, "error": "missing_phone_number_id_or_token"}

        url = f"{self.base}/{pn_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to_wa_id,
            "type": "text",
            "text": {"preview_url": True, "body": text[:4096]},
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, headers=self._headers(), json=payload)
            data = r.json() if r.content else {}
            if r.status_code >= 400:
                return {"ok": False, "status": r.status_code, "error": data}
            return {"ok": True, "data": data}

    async def mark_as_read(self, message_id: str, phone_number_id: Optional[str] = None):
        pn_id = phone_number_id or self.phone_number_id
        if not pn_id or not self.access_token or not message_id:
            return
        url = f"{self.base}/{pn_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
        }
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await client.post(url, headers=self._headers(), json=payload)
        except Exception as e:
            print(f"[whatsapp] mark_as_read error: {e}")


def extract_inbound_messages(payload: dict) -> list[dict]:
    """
    Parse le webhook Meta et retourne une liste normalisée :
    {
      phone_number_id, from_wa_id, from_name, message_id, text, timestamp
    }
    """
    results = []
    if not payload or payload.get("object") != "whatsapp_business_account":
        return results

    for entry in payload.get("entry") or []:
        for change in entry.get("changes") or []:
            value = change.get("value") or {}
            meta = value.get("metadata") or {}
            phone_number_id = meta.get("phone_number_id")
            contacts = {c.get("wa_id"): c for c in (value.get("contacts") or [])}

            for msg in value.get("messages") or []:
                wa_id = msg.get("from")
                contact = contacts.get(wa_id) or {}
                profile = contact.get("profile") or {}
                text = ""
                if msg.get("type") == "text":
                    text = (msg.get("text") or {}).get("body") or ""
                elif msg.get("type") == "button":
                    text = (msg.get("button") or {}).get("text") or ""
                elif msg.get("type") == "interactive":
                    interactive = msg.get("interactive") or {}
                    if "button_reply" in interactive:
                        text = interactive["button_reply"].get("title") or ""
                    elif "list_reply" in interactive:
                        text = interactive["list_reply"].get("title") or ""

                results.append(
                    {
                        "phone_number_id": phone_number_id,
                        "from_wa_id": wa_id,
                        "from_name": profile.get("name"),
                        "message_id": msg.get("id"),
                        "text": text,
                        "type": msg.get("type"),
                        "timestamp": msg.get("timestamp"),
                        "raw": msg,
                    }
                )
    return results
