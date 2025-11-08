from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.api.router import api_router

app = FastAPI(
    title="Code Execution Service",
    description="Service for executing code submissions using Judge0",
    version="0.1.0"
)

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


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "code-execution-service"}
