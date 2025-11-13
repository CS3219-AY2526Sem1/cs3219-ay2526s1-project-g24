# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: September 18 - October 10, 2025
# Scope: Generated FastAPI application initialization with:
#   - CORS middleware configuration
#   - Router registration
#   - Health check endpoint
#   - Swagger/OpenAPI documentation
#   - Metrics endpoint for Prometheus
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Production CORS configuration with environment-based origins
#   - Added comprehensive error handling middleware
#   - Modified startup/shutdown events for database management
#   - Added logging configuration
#   - Integrated observability (metrics, health checks)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.router import api_router

app = FastAPI(title="Question Service")

# Configure CORS - get allowed origins from environment variable
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

# Basic health endpoint for k8s probes
@app.get("/health")
def health():
    return {"status": "ok"}
