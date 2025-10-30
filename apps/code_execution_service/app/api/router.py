from fastapi import APIRouter

from app.execution.router import router as execution_router

api_router = APIRouter(prefix="/api/v1")

# Include all routers
api_router.include_router(execution_router)
