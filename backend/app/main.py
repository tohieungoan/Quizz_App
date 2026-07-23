"""
Main FastAPI Application Entry Point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base
import app.models  # Import toàn bộ models để SQLAlchemy nhận diện các bảng

# Khởi tạo tự động các bảng trong Database PostgreSQL nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

# Tự động đồng bộ các cột CSDL PostgreSQL
try:
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS device_name, DROP COLUMN IF EXISTS ip_address;"))
        conn.execute(text("ALTER TABLE questions DROP COLUMN IF EXISTS media_type, ADD COLUMN IF NOT EXISTS audio_url VARCHAR;"))
        conn.execute(text("ALTER TABLE question_options DROP COLUMN IF EXISTS media_type, ADD COLUMN IF NOT EXISTS audio_url VARCHAR;"))
        conn.execute(text("ALTER TABLE groups ADD COLUMN IF NOT EXISTS icon VARCHAR DEFAULT 'GraduationCap';"))
        conn.commit()
except Exception:
    pass



app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health Check"])
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}


