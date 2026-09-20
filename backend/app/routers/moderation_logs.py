from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.moderation_log import ModerationLog
from app.routers.auth import get_current_admin
from app.models.user import User
import uuid

router = APIRouter(prefix="/api/moderation-logs", tags=["moderation_logs"])

@router.get("/")
async def get_moderation_logs(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(ModerationLog).order_by(ModerationLog.created_at.desc()).all()

@router.post("/")
async def create_moderation_log(data: dict, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    log_id = f"log_{uuid.uuid4().hex[:8]}"
    mod_log = ModerationLog(
        id=log_id,
        shop_id=data.get("shop_id"),
        shop_name=data.get("shop_name"),
        actor_email=admin.email,
        action=data.get("action"),
        note=data.get("note"),
    )
    db.add(mod_log)
    db.commit()
    db.refresh(mod_log)
    return mod_log