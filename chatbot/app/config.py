from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Exprex AI Seller"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8001

    DATABASE_URL: str = "sqlite:///./chatbot.db"

    # Meta WhatsApp Cloud API + Embedded Signup
    META_VERIFY_TOKEN: str = "exprex_verify_token_change_me"
    META_APP_ID: str = ""
    META_APP_SECRET: str = ""
    META_CONFIG_ID: str = ""  # Embedded Signup configuration ID
    META_ACCESS_TOKEN: str = ""  # fallback / app-level token
    META_API_VERSION: str = "v21.0"
    META_GRAPH_URL: str = "https://graph.facebook.com"

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
