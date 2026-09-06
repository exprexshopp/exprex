from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.analytics import Analytics
from app.models.product import Product
from app.routers.auth import get_current_user
from app.models.user import User
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.post("/{product_id}/view")
async def record_view(
    product_id: str,
    db: Session = Depends(get_db)
):
    analytics = db.query(Analytics).filter(Analytics.product_id == product_id).first()
    if analytics:
        analytics.views_count = (analytics.views_count or 0) + 1
        analytics.updated_at = datetime.utcnow()
    else:
        analytics = Analytics(
            id=f"an_{uuid.uuid4().hex[:8]}",
            product_id=product_id,
            views_count=1,
            whatsapp_clicks=0,
            updated_at=datetime.utcnow()
        )
        db.add(analytics)
    db.commit()
    return {"success": True}

@router.post("/{product_id}/whatsapp-click")
async def record_whatsapp_click(
    product_id: str,
    db: Session = Depends(get_db)
):
    analytics = db.query(Analytics).filter(Analytics.product_id == product_id).first()
    if analytics:
        analytics.whatsapp_clicks = (analytics.whatsapp_clicks or 0) + 1
        analytics.updated_at = datetime.utcnow()
    else:
        analytics = Analytics(
            id=f"an_{uuid.uuid4().hex[:8]}",
            product_id=product_id,
            views_count=0,
            whatsapp_clicks=1,
            updated_at=datetime.utcnow()
        )
        db.add(analytics)
    db.commit()
    return {"success": True}