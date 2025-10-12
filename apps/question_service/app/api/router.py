from fastapi import APIRouter
from app.questions import router as question_routes

api_router = APIRouter()
api_router.include_router(question_routes.router)
