from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from PIL import Image
import uuid
from app.config import settings
from app.routers.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Format d'image non supporté")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image trop volumineuse (max 5MB)")
    
    ext = Path(file.filename).suffix
    filename = f"{uuid.uuid4()}{ext}"
    filepath = settings.UPLOAD_DIR / filename
    webp_path = settings.UPLOAD_DIR / f"{filename.rsplit('.', 1)[0]}.webp"
    
    with open(filepath, "wb") as f:
        f.write(content)
    
    try:
        img = Image.open(filepath)
        img.save(webp_path, "WEBP", quality=80, optimize=True)
        filepath.unlink()
    except Exception as e:
        raise HTTPException(500, f"Erreur conversion: {str(e)}")
    
    return {"path": f"/storage/{webp_path.name}"}
