from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, shops, products, categories, cities, upload, subcategories, moderation_logs, analytics

# Creation des tables
Base.metadata.create_all(bind=engine)

# Creation du dossier d'upload
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/storage", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="storage")

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shops.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(cities.router)
app.include_router(upload.router)
app.include_router(subcategories.router)
app.include_router(moderation_logs.router)
app.include_router(analytics.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}