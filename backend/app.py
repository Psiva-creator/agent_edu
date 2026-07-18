"""
Career Guide AI — Application Entry Point
==========================================
FastAPI application with:
    - API versioning (/api/v1)
    - CORS middleware
    - Request logging middleware
    - Global exception handling
    - Structured logging
    - Lifespan events (startup validation)
    - Monitoring hooks (/health, /metrics)
    - Auto-generated Swagger docs at /docs
"""

import time
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from utils.logging import setup_logging
from utils.exceptions import AppException

# ─── Request Metrics (in-memory) ─────────────────────────────

_metrics = {
    "total_requests": 0,
    "total_errors": 0,
    "total_latency_ms": 0.0,
    "endpoints_hit": {},
    "status_codes": {},
}


# ─── Lifespan: startup / shutdown ─────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — runs on startup and shutdown."""
    # ── Startup ──────────────────────────────────────────────
    setup_logging()
    
    # Initialize SQLite database
    from services.db_service import init_db
    init_db()
    
    settings = get_settings()
    logger = logging.getLogger("app")
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"LLM available: {settings.is_llm_available}")

    # ── Validate environment ─────────────────────────────────
    _validate_environment(settings, logger)

    yield  # App runs here

    # ── Shutdown ─────────────────────────────────────────────
    logger.info("Shutting down gracefully.")
    logger.info(f"Total requests served: {_metrics['total_requests']}")


def _validate_environment(settings, logger):
    """Validate critical configuration at startup."""
    warnings = []

    if not settings.is_llm_available:
        warnings.append("OPENAI_API_KEY not set — LLM features will use fallback mode")

    if settings.DEBUG:
        warnings.append("DEBUG mode is ON — disable in production")

    if "*" in settings.ALLOWED_ORIGINS:
        warnings.append("CORS allows all origins (*) — restrict in production")

    for w in warnings:
        logger.warning(f"[CONFIG] {w}")

    if not warnings:
        logger.info("[CONFIG] All environment validations passed")


# ─── App Factory ──────────────────────────────────────────────

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "Multi-agent Career Intelligence API. Analyze resumes, generate "
        "career roadmaps, browse learning resources, and create one-page "
        "Career Intelligence Reports — all powered by AI with intelligent fallbacks."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEBUG else "/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "System", "description": "Health check, metrics, and API info"},
        {"name": "Resume", "description": "Resume analysis and export (Markdown / HTML / PDF)"},
        {"name": "Roadmap", "description": "Personalized career roadmap generation"},
        {"name": "Resources", "description": "Curated learning resource library (18 skills)"},
        {"name": "Report", "description": "Career Intelligence Report (JSON / HTML / PDF)"},
        {"name": "Career", "description": "Career analysis and job search"},
        {"name": "Interview", "description": "AI Interview Simulator — generate questions, evaluate answers, final scoring"},
        {"name": "Skills", "description": "Skill Intelligence Dashboard - market demand, salary impact, deep analytics"},
    ],
)

# ─── Middleware ───────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log every request with timing, collect metrics."""
    start = time.perf_counter()
    logger = logging.getLogger("access")

    response = await call_next(request)

    elapsed_ms = (time.perf_counter() - start) * 1000

    # Update metrics
    _metrics["total_requests"] += 1
    _metrics["total_latency_ms"] += elapsed_ms
    path = request.url.path
    _metrics["endpoints_hit"][path] = _metrics["endpoints_hit"].get(path, 0) + 1
    code = str(response.status_code)
    _metrics["status_codes"][code] = _metrics["status_codes"].get(code, 0) + 1
    if response.status_code >= 400:
        _metrics["total_errors"] += 1

    # Log request
    logger.info(
        f"{request.method} {path} -> {response.status_code} ({elapsed_ms:.0f}ms)"
    )

    # Add timing header
    response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"

    return response


# ─── Global Exception Handlers ───────────────────────────────


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """Handle custom application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions."""
    logging.getLogger("app").error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500},
    )


# ─── Register Routers (API v1) ───────────────────────────────

from routers import career, jobs, roadmap, resume, report, resources, interview, skills, compare, cover_letter, profile

API_PREFIX = settings.API_V1_PREFIX  # /api/v1

app.include_router(resume.router,    prefix=API_PREFIX)
app.include_router(roadmap.router,   prefix=API_PREFIX)
app.include_router(resources.router, prefix=API_PREFIX)
app.include_router(report.router,    prefix=API_PREFIX)
app.include_router(career.router,    prefix=API_PREFIX)
app.include_router(jobs.router,      prefix=API_PREFIX)
app.include_router(interview.router, prefix=API_PREFIX)
app.include_router(skills.router,    prefix=API_PREFIX)
app.include_router(compare.router,   prefix=API_PREFIX)
app.include_router(cover_letter.router, prefix=API_PREFIX)
app.include_router(profile.router,   prefix=API_PREFIX)

# ─── Root Endpoints ──────────────────────────────────────────


# Get path to frontend/dist relative to app.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

@app.get("/", tags=["System"], include_in_schema=False)
async def root():
    """Serve SPA index.html or API overview if frontend/dist doesn't exist."""
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "api_prefix": API_PREFIX,
        "endpoints": {
            "resume_analyze":       f"{API_PREFIX}/resume/analyze",
            "resume_export_md":     f"{API_PREFIX}/resume/export/markdown",
            "resume_export_html":   f"{API_PREFIX}/resume/export/html",
            "resume_export_pdf":    f"{API_PREFIX}/resume/export/pdf",
            "roadmap":              f"{API_PREFIX}/roadmap",
            "resources":            f"{API_PREFIX}/resources",
            "resources_by_skill":   f"{API_PREFIX}/resources/{{skill}}",
            "report":               f"{API_PREFIX}/report",
            "report_html":          f"{API_PREFIX}/report/html",
            "report_pdf":           f"{API_PREFIX}/report/pdf",
            "health":               "/health",
            "metrics":              "/metrics",
            "debug_llm":            f"{API_PREFIX}/debug/llm-status",
        },
    }

from utils.dependencies import get_llm

@app.get(f"{API_PREFIX}/debug/llm-status", tags=["System"])
async def llm_status():
    """Monitoring LLMService state."""
    llm = get_llm()
    return llm.get_stats()


@app.get("/health", tags=["System"])
async def health_check():
    """Health check with LLM and system status."""
    import sys
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "python": sys.version.split()[0],
        "llm_available": settings.is_llm_available,
        "debug": settings.DEBUG,
        "total_requests_served": _metrics["total_requests"],
    }


@app.get("/metrics", tags=["System"])
async def metrics():
    """Application metrics for monitoring."""
    total = _metrics["total_requests"]
    return {
        "total_requests": total,
        "total_errors": _metrics["total_errors"],
        "error_rate": round(_metrics["total_errors"] / max(total, 1) * 100, 2),
        "avg_latency_ms": round(_metrics["total_latency_ms"] / max(total, 1), 1),
        "status_codes": _metrics["status_codes"],
        "top_endpoints": dict(
            sorted(_metrics["endpoints_hit"].items(), key=lambda x: x[1], reverse=True)[:10]
        ),
    }

# ─── Serve Frontend SPA ───────────────────────────────────────

if os.path.exists(FRONTEND_DIST_DIR):
    # Mount assets folder
    assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
    # Expose root-level files directly
    @app.get("/favicon.svg", include_in_schema=False)
    async def favicon():
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "favicon.svg"))
        
    @app.get("/icons.svg", include_in_schema=False)
    async def icons():
        return FileResponse(os.path.join(FRONTEND_DIST_DIR, "icons.svg"))

    # Catch-all route to serve index.html for React Router SPA routes
    @app.get("/{catchall:path}", include_in_schema=False)
    async def serve_spa(request: Request, catchall: str):
        if (
            catchall.startswith("api/") or 
            catchall.startswith("docs") or 
            catchall.startswith("redoc") or 
            catchall == "health" or 
            catchall == "metrics" or
            catchall.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="Not found")
            
        index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="SPA index file not found")
