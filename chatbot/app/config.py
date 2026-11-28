from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Variables d'environnement déjà intégrées — ne pas renommer.
    Toute variable inconnue dans .env est ignorée (extra=ignore).
    """

    APP_NAME: str = "Exprex AI Shopping"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    DATABASE_URL: str = "sqlite:///./chatbot.db"

    # LLM
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o-mini"
    LLM_MOCK: bool = True

    # Exprex
    EXPREX_FRONTEND_URL: str = "https://exprex.vercel.app"
    EXPREX_API_URL: str = ""

    # Sessions / perf
    SESSION_TTL_HOURS: int = 72
    MAX_HISTORY_MESSAGES: int = 20
    # Cache catalogue en mémoire (secondes) — 0 = désactivé
    CATALOG_CACHE_TTL: int = 60
    # Limite produits injectés dans le prompt
    CATALOG_PROMPT_LIMIT: int = 40
    LLM_MAX_TOKENS: int = 500
    LLM_TEMPERATURE: float = 0.4

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
