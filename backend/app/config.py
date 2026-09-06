from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "eXpress Shop API"
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./data/express-shop.db"
    SECRET_KEY: str = "express-shop-dev-secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOAD_DIR: Path = Path("./static/storage")
    
    class Config:
        extra = "ignore"

settings = Settings()