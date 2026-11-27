from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class ShopBotConnect(BaseModel):
    shop_id: str
    shop_name: str
    shop_slug: Optional[str] = None
    phone_number_id: str
    waba_id: Optional[str] = None
    access_token: Optional[str] = None
    display_phone: Optional[str] = None
    tone: Optional[str] = "professionnel et amical"
    system_prompt: Optional[str] = None
    welcome_message: Optional[str] = None
    business_hours: Optional[str] = None


class ShopBotUpdate(BaseModel):
    tone: Optional[str] = None
    system_prompt: Optional[str] = None
    welcome_message: Optional[str] = None
    fallback_message: Optional[str] = None
    business_hours: Optional[str] = None
    is_active: Optional[bool] = None
    auto_reply: Optional[bool] = None
    access_token: Optional[str] = None
    display_phone: Optional[str] = None


class ProductItem(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    slug: Optional[str] = None
    in_stock: bool = True
    image: Optional[str] = None
    category: Optional[str] = None


class ProductsSyncIn(BaseModel):
    products: List[ProductItem]


class ShopBotOut(BaseModel):
    id: str
    shop_id: str
    shop_name: str
    shop_slug: Optional[str] = None
    phone_number_id: Optional[str] = None
    display_phone: Optional[str] = None
    tone: Optional[str] = None
    system_prompt: Optional[str] = None
    welcome_message: Optional[str] = None
    fallback_message: Optional[str] = None
    business_hours: Optional[str] = None
    is_active: bool
    auto_reply: bool
    products_count: int = 0
    products_updated_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
