from pydantic import BaseModel
from typing import Optional, List, Any, Dict


class WebhookPayload(BaseModel):
    """Payload brut Meta — on parse manuellement pour rester flexible."""

    object: Optional[str] = None
    entry: Optional[List[Dict[str, Any]]] = None
