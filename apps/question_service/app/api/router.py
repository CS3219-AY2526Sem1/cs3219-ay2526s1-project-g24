from fastapi import APIRouter

from app.questions import (
    company_router,
    router,
    test_case_router,
    topic_router,
    user_router,
)

api_router = APIRouter(prefix="/api/v1")

# Include all routers
api_router.include_router(router.router)
api_router.include_router(test_case_router.router)
api_router.include_router(topic_router.router)
api_router.include_router(company_router.router)
api_router.include_router(user_router.router)
