"""
Utility: Logging Configuration
================================
Production-grade structured logging with:
    - Console output (human-readable)
    - JSON log format option (for log aggregators)
    - File rotation (10MB, 5 backups)
    - Configurable log levels
    - Silenced third-party loggers
"""

import logging
import logging.handlers
import sys
import json
from datetime import datetime, timezone
from pathlib import Path
from config import get_settings


class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging in production."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging() -> None:
    """Configure application-wide structured logging."""
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Clear existing handlers to avoid duplicates on reload
    root_logger.handlers.clear()

    # ── Console handler (human-readable) ─────────────────────
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)

    console_fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)-25s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    console_handler.setFormatter(console_fmt)
    root_logger.addHandler(console_handler)

    # ── File handler (rotating, JSON format) ─────────────────
    try:
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)

        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_dir / "app.log",
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding="utf-8",
        )
        file_handler.setLevel(level)
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
    except (PermissionError, OSError):
        logging.getLogger(__name__).warning("Could not create file log handler")

    # ── Silence noisy third-party loggers ────────────────────
    for noisy_logger in [
        "uvicorn.access", "httpcore", "httpx", "openai",
        "urllib3", "asyncio", "PIL",
    ]:
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)

    logging.getLogger(__name__).info(
        f"Logging initialized - level={settings.LOG_LEVEL}, app={settings.APP_NAME}"
    )


def get_logger(name: str) -> logging.Logger:
    """Get a named logger instance."""
    return logging.getLogger(name)
