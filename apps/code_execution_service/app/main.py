from fastapi import FastAPI

from app.api.router import api_router

app = FastAPI(
    title="Code Execution Service",
    description="Service for executing code submissions using Judge0",
    version="0.1.0"
)

app.include_router(api_router)


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "code-execution-service"}
