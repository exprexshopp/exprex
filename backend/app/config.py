from pydantic import field_validator
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "eXpress Shop API"
    # Desactive par defaut : a activer explicitement via la variable d'environnement DEBUG=true
    DEBUG: bool = False
    DATABASE_URL: str
    # Obligatoire, sans valeur par défaut : si SECRET_KEY est absente de
    # l'environnement, le démarrage échoue (pydantic ValidationError, qui
    # hérite de ValueError). C'est l'unique secret JWT de l'application.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOAD_DIR: Path = Path("./static/storage")
    CLOUDINARY_URL: str = ""

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("SECRET_KEY ne doit pas être vide")
        return v

    class Config:
        extra = "ignore"

settings = Settings()
