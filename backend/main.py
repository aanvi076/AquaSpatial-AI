"""
Main FastAPI Application Entrypoint
KOHLER AI Bathroom Designer & Planner
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.api.routes import router as api_router

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("kohler_ai_designer")

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Multimodal, constraint-aware AI bathroom design assistant grounded in authentic KOHLER catalog products.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "title": settings.app_name,
        "version": settings.version,
        "status": "online",
        "docs": "/docs",
        "api_health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting {settings.app_name} on {settings.api_host}:{settings.api_port}...")
    uvicorn.run("backend.main:app", host=settings.api_host, port=settings.api_port, reload=True)
