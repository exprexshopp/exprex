from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from PIL import Image, ImageOps
import io
import uuid
import base64
from app.config import settings
from app.routers.auth import get_current_user
from app.models.user import User

# ✅ Cloudinary (optionnel)
try:
    import cloudinary
    import cloudinary.uploader
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]


def convert_to_webp(content: bytes, quality: int = 80, max_size: int = 1600) -> bytes:
    """Convertit une image en WebP optimisé (conserve la logique existante)."""
    img = Image.open(io.BytesIO(content))
    try:
        img = ImageOps.exif_transpose(img)
    except Exception:
        pass
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    if max(img.size) > max_size:
        img.thumbnail((max_size, max_size), Image.LANCZOS)
    output = io.BytesIO()
    img.save(output, format='WEBP', quality=quality, optimize=True)
    return output.getvalue()


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Format d'image non supporté")
    
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "Image trop volumineuse (max 5MB)")
    
    # ✅ ÉTAPE 1 : Conversion WebP (toujours)
    try:
        webp_content = convert_to_webp(content, quality=80, max_size=1600)
        print(f"[UPLOAD] WebP: {len(content)} → {len(webp_content)} bytes")
    except Exception as e:
        print(f"[UPLOAD] Erreur WebP: {e}")
        raise HTTPException(500, f"Erreur conversion WebP: {str(e)}")
    
    # ✅ ÉTAPE 2 : Cloudinary en priorité
    if CLOUDINARY_AVAILABLE and settings.CLOUDINARY_URL:
        try:
            result = cloudinary.uploader.upload(
                webp_content,
                folder="exprex",
                public_id=f"img_{uuid.uuid4().hex[:12]}",
                resource_type="image",
                format="webp",
            )
            print(f"[UPLOAD] Cloudinary OK: {result['secure_url']}")
            return {"path": result["secure_url"]}
        except Exception as e:
            print(f"[UPLOAD] Cloudinary échoué: {e}, fallback base64")
    
    # ✅ ÉTAPE 3 : Fallback base64 (fonctionne partout)
    b64 = base64.b64encode(webp_content).decode('utf-8')
    data_url = f"data:image/webp;base64,{b64}"
    print(f"[UPLOAD] Fallback base64 ({len(webp_content)} bytes)")
    return {"path": data_url}