"""
Application Configuration
Centralized settings management using pydantic-settings.
All configuration is loaded from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ─── Application ──────────────────────────────────────
    APP_NAME: str = "Career Guide AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-powered career guidance API with multi-agent architecture"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # ─── Server ───────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # ─── API ──────────────────────────────────────────────
    API_V1_PREFIX: str = "/api/v1"

    # ─── OpenAI / LLM ────────────────────────────────────
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_TEMPERATURE: float = 0.7
    OPENAI_MAX_TOKENS: int = 4096

    # ─── Export ───────────────────────────────────────────
    EXPORT_DIR: str = "exports"
    MAX_UPLOAD_SIZE_MB: int = 10

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }

    @property
    def is_llm_available(self) -> bool:
        """Check if a valid LLM API key is configured."""
        return bool(self.OPENAI_API_KEY and self.OPENAI_API_KEY != "your_api_key_here")


@lru_cache()
def get_settings() -> Settings:
    """Get cached application settings (singleton)."""
    return Settings()
