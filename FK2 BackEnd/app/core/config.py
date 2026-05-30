"""
Core settings loaded from .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── Database ────────────────────────────────────────────────────────────
    DATABASE_URL:       str = "postgresql+asyncpg://postgres:password@localhost:5432/paskal_analytics"

    # ── Academic Defaults ────────────────────────────────────────────────────
    DEFAULT_FACULTY_NAME:  str = "Fakultas Kedokteran MedTrack University"


    # ── CORS ─────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS:    str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://paskal-dasboard.vercel.app,https://paskal-dasboard-danielrscareer-8448s-projects.vercel.app,https://23-paskal-saas.vercel.app,https://23-paskal-front-end.vercel.app"

    # ── AI Provider Config ───────────────────────────────────────────────────
    # Set AI_PROVIDER to "openai", "anthropic", or "gemini"
    AI_PROVIDER:        str = "openai"
    OPENAI_API_KEY:     str = ""
    ANTHROPIC_API_KEY:  str = ""
    GEMINI_API_KEY:     str = ""

    # ── Cache ─────────────────────────────────────────────────────────────────
    # Optional: set REDIS_URL to use Redis (e.g. "redis://localhost:6379/0")
    # Leave empty to use in-memory cache (suitable for single-instance deployments)
    REDIS_URL:                    str = ""
    INSIGHT_CACHE_TTL_SECONDS:    int = 3600   # 1 hour

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
