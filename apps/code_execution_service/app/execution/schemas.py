# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: October 12-20, 2025
# Scope: Generated Pydantic schemas for code execution:
#   - CodeExecutionRequest: Request schema with code, language, test cases
#   - CodeExecutionResponse: Response with results, metrics, status
#   - Judge0Result: Individual test case result
#   - LanguageEnum, ExecutionStatus: Enums for type safety
#   - TestCase: Input/output schema
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Added validation for supported languages
#   - Enhanced type safety with enums

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class LanguageEnum(str, Enum):
    """Supported programming languages"""
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"


class ExecutionStatus(str, Enum):
    """Execution status codes"""
    ACCEPTED = "accepted"
    WRONG_ANSWER = "wrong_answer"
    TIME_LIMIT_EXCEEDED = "time_limit_exceeded"
    MEMORY_LIMIT_EXCEEDED = "memory_limit_exceeded"
    RUNTIME_ERROR = "runtime_error"
    COMPILATION_ERROR = "compilation_error"
    INTERNAL_ERROR = "internal_error"


# Request Schemas
class TestCaseInput(BaseModel):
    """Single test case input"""
    input_data: Dict[str, Any]
    expected_output: Any
    order_index: int = 0


class CodeExecutionRequest(BaseModel):
    """Request to execute code"""
    language: LanguageEnum
    source_code: str
    test_cases: List[TestCaseInput]
    time_limit: Optional[float] = Field(None, description="Time limit in seconds")
    memory_limit: Optional[int] = Field(None, description="Memory limit in KB")
    function_signature: Optional[Dict[str, Any]]= Field(None, description="Function" \
    "signature for validation")


# Response Schemas
class TestCaseResult(BaseModel):
    """Result of a single test case execution"""
    order_index: int
    input_data: Dict[str, Any]
    expected_output: Any
    actual_output: Optional[Any] = None
    passed: bool
    runtime_ms: Optional[int] = None
    memory_kb: Optional[int] = None
    status: ExecutionStatus
    error_message: Optional[str] = None
    stdout: Optional[str] = None
    stderr: Optional[str] = None


class CodeExecutionResponse(BaseModel):
    """Response from code execution"""
    language: str
    total_test_cases: int
    passed_test_cases: int
    results: List[TestCaseResult]
    overall_passed: bool
    avg_runtime_ms: Optional[int] = None
    avg_memory_kb: Optional[int] = None
    compilation_error: Optional[str] = None


# Judge0 Internal Schemas
class Judge0SubmissionRequest(BaseModel):
    """Judge0 submission request"""
    source_code: str
    language_id: int
    stdin: Optional[str] = None
    expected_output: Optional[str] = None
    cpu_time_limit: Optional[float] = None
    memory_limit: Optional[int] = None
    wall_time_limit: Optional[float] = None
    additional_files: Optional[str] = Field(
        None, 
        description="Base64 encoded zip file with additional files (for language_id 89)"
    )


class Judge0SubmissionResponse(BaseModel):
    """Judge0 submission response"""
    token: str


class Judge0Status(BaseModel):
    """Judge0 execution status"""
    id: int
    description: str


class Judge0Result(BaseModel):
    """Judge0 execution result"""
    stdout: Optional[str] = None
    stderr: Optional[str] = None
    compile_output: Optional[str] = None
    message: Optional[str] = None
    status: Judge0Status
    time: Optional[str] = None  # Execution time in seconds
    memory: Optional[int] = None  # Memory in KB
    token: str
