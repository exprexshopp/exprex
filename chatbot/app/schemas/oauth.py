from pydantic import BaseModel, Field
from typing import Optional


class EmbeddedSignupComplete(BaseModel):
    """
    Payload envoyé par le frontend après le flux Embedded Signup Meta.

    - code : code OAuth (FB.login response_type=code)
    - access_token : parfois renvoyé directement selon la config
    - phone_number_id / waba_id : issus de l'événement postMessage WA_EMBEDDED_SIGNUP
    """

    shop_id: str
    shop_name: str
    shop_slug: Optional[str] = None

    code: Optional[str] = None
    access_token: Optional[str] = None
    phone_number_id: Optional[str] = None
    waba_id: Optional[str] = None
    display_phone: Optional[str] = None

    tone: Optional[str] = "professionnel et amical"
    system_prompt: Optional[str] = None
    welcome_message: Optional[str] = None
    business_hours: Optional[str] = None


class EmbeddedSignupPublicConfig(BaseModel):
    app_id: Optional[str] = None
    config_id: Optional[str] = None
    api_version: str = "v21.0"
    graph_url: str = "https://graph.facebook.com"
    embedded_signup_ready: bool = False
