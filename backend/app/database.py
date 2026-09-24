from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Détection automatique du type de base
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL (Neon) nécessite SSL
    connect_args = {"sslmode": "require"}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,      # Vérifie la connexion avant usage
    pool_recycle=300,        # Recycle les connexions après 5 min
    pool_size=2,             # Pool réduit pour Vercel Serverless
    max_overflow=0,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
