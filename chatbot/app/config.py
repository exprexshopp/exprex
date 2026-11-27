from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    APP_NAME: str = "Exprex AI Seller"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    DATABASE_URL: str = "sqlite:///./chatbot.db"

    # Meta WhatsApp Cloud API
    META_VERIFY_TOKEN: str = "exprex_verify_token_change_me"
    META_APP_SECRET: str = ""
    META_ACCESS_TOKEN: str = ""
    META_API_VERSION: str = "v21.0"

    # LLM
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    LLM_MOCK: bool = True

    # Exprex
    EXPREX_FRONTEND_URL: str = "https://exprex.vercel.app"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
