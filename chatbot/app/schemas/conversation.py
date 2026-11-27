from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    direction: str
    content: str
    content_type: str
    is_from_bot: bool
    status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: str
    shop_id: str
    customer_wa_id: str
    customer_name: Optional[str] = None
    status: str
    handed_off: bool
    last_message_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class HandoffIn(BaseModel):
    reason: Optional[str] = None
