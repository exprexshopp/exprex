from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import chat, catalog

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.1.0",
    description="Exprex AI Shopping — assistant d'achat intégré à la plateforme (chat web)",
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

app.include_router(chat.router)
app.include_router(catalog.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "module": "chatbot",
        "channel": "web",
        "version": "1.1.0",
        "llm_mock": settings.LLM_MOCK,
        "catalog_cache_ttl": settings.CATALOG_CACHE_TTL,
    }


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "docs": "/docs",
        "health": "/api/health",
        "chat": "/api/chat/message",
        "catalog_sync": "/api/catalog/sync",
    }
