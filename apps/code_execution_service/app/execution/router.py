# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: October 12-20, 2025
# Scope: Generated FastAPI router for code execution:
#   - POST /execution/execute: Execute code with test cases
#   Integration with Judge0Service for actual execution
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Added request validation
#   - Enhanced error responses

"""
Code execution router
"""
from fastapi import APIRouter, HTTPException

from app.execution.schemas import CodeExecutionRequest, CodeExecutionResponse
from app.execution.service import Judge0Service

router = APIRouter(prefix="/execution", tags=["execution"])
judge0_service = Judge0Service()


@router.post("/execute", response_model=CodeExecutionResponse)
async def execute_code(request: CodeExecutionRequest) -> CodeExecutionResponse:
    """
    Execute code against test cases.
    
    Args:
        request: Code execution request with language, source code, and test cases
        
    Returns:
        Execution results for all test cases
        
    Raises:
        HTTPException: If code execution fails
    """
    try:
        result = await judge0_service.execute_code(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Code execution failed: {str(e)}"
        )
