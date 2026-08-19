"""
Core configuration of the application.
Reads environment variables from the .env file using Pydantic BaseSettings.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Quizz App Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-this-in-production-use-a-real-secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # Shorter = more secure
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    FRONTEND_URL: str = "http://localhost:5173"

    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/quizz_db"

    # SMTP Email Configuration
    SMTP_HOST: Optional[str] = "smtp.gmail.com"
    SMTP_PORT: Optional[int] = 587
    SMTP_TLS: bool = True
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = "QuizzApp Support"

    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI Chatbot Configuration
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    ASSISTANT_NAME: str = "Quizzy"

    # Google AI Studio (Gemini API) Configuration
    GEMINI_PRIMARY_MODEL: str = "gemini-flash-latest"

    # OpenRouter AI Configuration (Fallback)
    OPENROUTER_API_KEY: Optional[str] = None
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_PRIMARY_MODEL: str = "inclusionai/ling-3.0-flash:free"
    OPENROUTER_FALLBACK_MODEL: str = "google/gemma-4-26b-a4b-it:free"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()