from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, shops, products, categories, cities, upload, subcategories, moderation_logs, analytics, logs, chatbot_bridge

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
    allow_origins=["https://exprex.vercel.app","http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne. Consultez les journaux serveur."},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "https://exprex.vercel.app"),
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
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
app.include_router(logs.router)
app.include_router(chatbot_bridge.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
