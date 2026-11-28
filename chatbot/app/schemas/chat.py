from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class SessionCreate(BaseModel):
    visitor_id: str = Field(..., min_length=3, max_length=128)
    user_id: Optional[str] = None
    shop_id: Optional[str] = None
    shop_slug: Optional[str] = None
    product_slug: Optional[str] = None
    locale: str = "fr"


class SessionOut(BaseModel):
    id: str
    visitor_id: str
    user_id: Optional[str] = None
    shop_id: Optional[str] = None
    shop_slug: Optional[str] = None
    product_slug: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatSendIn(BaseModel):
    session_id: Optional[str] = None
    visitor_id: str
    user_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=4000)
    shop_id: Optional[str] = None
    shop_slug: Optional[str] = None
    product_slug: Optional[str] = None


class MessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    rich_json: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatSendOut(BaseModel):
    session_id: str
    user_message: MessageOut
    assistant_message: MessageOut


class CatalogProductIn(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float = 0
    slug: Optional[str] = None
    in_stock: bool = True
    image: Optional[str] = None
    category: Optional[str] = None
    shop_id: Optional[str] = None
    shop_name: Optional[str] = None
    shop_slug: Optional[str] = None


class CatalogSyncIn(BaseModel):
    scope: str = Field(
        ...,
        description="marketplace ou shop:{shop_id}",
        examples=["marketplace", "shop:shop_abc"],
    )
    products: List[CatalogProductIn]
