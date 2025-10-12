from fastapi import FastAPI
from app.core.database import Base, engine
from app.api.router import api_router

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Question Service")
app.include_router(api_router)
