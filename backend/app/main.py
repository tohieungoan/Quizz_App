"""
Main FastAPI Application Entry Point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base
import app.models  # Import all models for SQLAlchemy table detection

# Automatically create tables in PostgreSQL if they do not exist
Base.metadata.create_all(bind=engine)

# Automatically synchronize PostgreSQL / SQLite database columns
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS device_name, DROP COLUMN IF EXISTS ip_address;"))
        conn.execute(text("ALTER TABLE questions DROP COLUMN IF EXISTS media_type, ADD COLUMN IF NOT EXISTS audio_url VARCHAR;"))
        conn.execute(text("ALTER TABLE question_options DROP COLUMN IF EXISTS media_type, ADD COLUMN IF NOT EXISTS audio_url VARCHAR;"))
        conn.execute(text("ALTER TABLE groups ADD COLUMN IF NOT EXISTS icon VARCHAR DEFAULT 'GraduationCap';"))
        conn.execute(text("ALTER TABLE exams ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS progression_mode VARCHAR DEFAULT 'manual';"))
        conn.execute(text("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;"))
        conn.execute(text("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS current_question_started_at TIMESTAMP;"))
        conn.execute(text("ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS lifecycle_user_imported_inapp BOOLEAN DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS lifecycle_user_imported_email BOOLEAN DEFAULT TRUE;"))
        try:
            if settings.DATABASE_URL.startswith("sqlite"):
                conn.execute(text("ALTER TABLE participants ADD COLUMN streak INTEGER DEFAULT 0;"))
            else:
                conn.execute(text("ALTER TABLE participants ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;"))
        except Exception:
            pass
        conn.commit()
except Exception:
    pass



from contextlib import asynccontextmanager
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.api.v1.websockets.room_manager import room_websocket_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    room_websocket_manager.start_listener_task()
    yield
    # Shutdown
    room_websocket_manager.stop_listener_task()
    shutdown_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,  # Allow only configured origins from .env
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


