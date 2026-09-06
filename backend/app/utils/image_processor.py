from PIL import Image
from pathlib import Path
import uuid

def process_uploaded_image(file_path: Path, output_dir: Path) -> str:
    """Convertit une image en WebP et retourne le chemin public"""
    webp_filename = f"{uuid.uuid4()}.webp"
    webp_path = output_dir / webp_filename
    
    img = Image.open(file_path)
    img.save(webp_path, "WEBP", quality=80, optimize=True)
    file_path.unlink()
    
    return f"/storage/{webp_filename}"
