from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import webhook, shops, conversations, oauth

# Création des tables au démarrage (dev / standalone)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="0.2.0",
    description="Exprex AI Seller — assistant WhatsApp multi-boutiques (Embedded Signup Meta)",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://exprex.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://localhost:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook.router)
app.include_router(shops.router)
app.include_router(conversations.router)
app.include_router(oauth.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "module": "chatbot",
        "version": "0.2.0",
        "llm_mock": settings.LLM_MOCK,
        "embedded_signup_ready": bool(
            settings.META_APP_ID and settings.META_CONFIG_ID
        ),
    }


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "health": "/api/health",
        "webhook": "/webhook",
        "oauth_config": "/api/oauth/meta/config",
        "embedded_signup": "/api/oauth/meta/embedded-signup",
    }
