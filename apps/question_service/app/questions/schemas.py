from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class DifficultyEnum(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class TestCaseVisibility(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    SAMPLE = "sample"

# Function Signature Schemas (for structured code generation)
class FunctionArgument(BaseModel):
    """Represents a function argument with name and type"""
    name: str
    type: str  # Generic type like "int", "int[]", "string", "ListNode", etc.
    
    class Config:
        from_attributes = True

class FunctionSignature(BaseModel):
    """Structured function metadata for code generation"""
    function_name: str
    arguments: List[FunctionArgument]
    return_type: str
    
    class Config:
        from_attributes = True

# Topic Schemas
class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None

class TopicCreate(TopicBase):
    pass

class TopicResponse(TopicBase):
    id: int
    question_count: int = 0
    
    class Config:
        from_attributes = True

# Company Schemas
class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    question_count: int = 0
    
    class Config:
        from_attributes = True

# Test Case Schemas
class TestCaseBase(BaseModel):
    input_data: Dict[str, Any]
    expected_output: Any
    visibility: TestCaseVisibility = TestCaseVisibility.PRIVATE
    order_index: int = 0
    explanation: Optional[str] = None

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: int
    question_id: int
    
    class Config:
        from_attributes = True

class TestCasePublic(BaseModel):
    """Only public/sample test cases shown to users"""
    input_data: Dict[str, Any]
    expected_output: Any
    explanation: Optional[str] = None
    order_index: int

# Question Schemas
class QuestionBase(BaseModel):
    title: str
    description: str
    difficulty: DifficultyEnum
    code_templates: Dict[str, str]  # {"python": "...", "javascript": "..."}
    function_signature: Dict[str, Any]  # Stored as JSON, validated as FunctionSignature structure
    constraints: Optional[str] = None
    hints: Optional[List[str]] = None
    time_limit: Dict[str, int] = Field(
        default={"python": 5, "javascript": 5, "java": 10, "cpp": 3},
        description="Time limit in seconds per language"
    )
    memory_limit: Dict[str, int] = Field(
        default={"python": 64000, "javascript": 64000, "java": 128000, "cpp": 32000},
        description="Memory limit in KB per language"
    )
    
    @validator('function_signature')
    def validate_function_signature(cls, v):
        """Validate function_signature has correct structure"""
        if not isinstance(v, dict):
            raise ValueError("function_signature must be a dictionary")
        
        required_keys = {'function_name', 'arguments', 'return_type'}
        if not all(key in v for key in required_keys):
            raise ValueError(f"function_signature must contain keys: {required_keys}")
        
        if not isinstance(v['arguments'], list):
            raise ValueError("arguments must be a list")
        
        for arg in v['arguments']:
            if not isinstance(arg, dict) or 'name' not in arg or 'type' not in arg:
                raise ValueError("Each argument must have 'name' and 'type' keys")
        
        return v

class QuestionCreate(QuestionBase):
    topic_ids: List[int] = []
    company_ids: List[int] = []
    test_cases: List[TestCaseCreate] = []

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[DifficultyEnum] = None
    code_templates: Optional[Dict[str, str]] = None
    constraints: Optional[str] = None
    hints: Optional[List[str]] = None
    time_limit: Optional[Dict[str, int]] = Field(None, description="Time limit in seconds per language")
    memory_limit: Optional[Dict[str, int]] = Field(None, description="Memory limit in KB per language")
    topic_ids: Optional[List[int]] = None
    company_ids: Optional[List[int]] = None

class QuestionListItem(BaseModel):
    """Lightweight question info for list view"""
    id: int
    title: str
    difficulty: DifficultyEnum
    acceptance_rate: int
    topics: List[TopicResponse]
    companies: List[CompanyResponse]
    is_attempted: bool = False
    is_solved: bool = False
    
    class Config:
        from_attributes = True

class QuestionDetail(QuestionBase):
    """Full question details"""
    id: int
    acceptance_rate: int
    total_submissions: int
    total_accepted: int
    likes: int
    dislikes: int
    topics: List[TopicResponse]
    companies: List[CompanyResponse]
    sample_test_cases: List[TestCasePublic]  # Only sample cases
    created_at: datetime
    updated_at: datetime
    
    # User-specific data (populated from service layer)
    is_attempted: bool = False
    is_solved: bool = False
    user_attempts_count: int = 0
    
    class Config:
        from_attributes = True

# Filter Schemas
class QuestionFilterParams(BaseModel):
    difficulties: Optional[List[DifficultyEnum]] = None
    topic_ids: Optional[List[int]] = None
    company_ids: Optional[List[int]] = None
    attempted_only: bool = False
    solved_only: bool = False
    unsolved_only: bool = False
    random: bool = False
    search: Optional[str] = None  # Search in title
    
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    
    sort_by: Optional[str] = "id"  # id, difficulty, acceptance_rate, title
    sort_order: Optional[str] = "asc"  # asc, desc

class QuestionListResponse(BaseModel):
    questions: List[QuestionListItem]
    total: int
    page: int
    page_size: int
    total_pages: int

# Code Execution Schemas
class CodeExecutionRequest(BaseModel):
    language: str
    code: str
    test_case_ids: Optional[List[int]] = None  # If None, run against sample cases
    
    @validator('language')
    def validate_language(cls, v):
        allowed = ['python', 'javascript', 'java', 'cpp']
        if v not in allowed:
            raise ValueError(f'Language must be one of {allowed}')
        return v

class TestCaseResult(BaseModel):
    test_case_id: int
    input_data: Dict[str, Any]
    expected_output: Any
    actual_output: Any
    passed: bool
    runtime_ms: Optional[int] = None
    memory_mb: Optional[float] = None
    error: Optional[str] = None

class CodeExecutionResponse(BaseModel):
    question_id: int
    language: str
    total_test_cases: int
    passed_test_cases: int
    results: List[TestCaseResult]
    overall_passed: bool
    avg_runtime_ms: Optional[int] = None
    avg_memory_mb: Optional[float] = None

# Submission Schemas
class SubmissionRequest(BaseModel):
    language: str
    code: str

class SubmissionResponse(BaseModel):
    submission_id: str
    question_id: int
    status: str  # "accepted", "wrong_answer", "time_limit_exceeded", "runtime_error"
    passed_test_cases: int
    total_test_cases: int
    runtime_ms: Optional[int] = None
    memory_mb: Optional[float] = None
    runtime_percentile: Optional[float] = None
    memory_percentile: Optional[float] = None
    timestamp: datetime

# User Progress Schemas
class UserAttemptBase(BaseModel):
    user_id: str
    question_id: int
    is_solved: bool = False
    attempts_count: int = 0
    status: str = "not_attempted"

class UserAttemptCreate(BaseModel):
    question_id: int
    is_solved: bool
    runtime_ms: Optional[int] = None
    memory_mb: Optional[float] = None

class UserAttemptResponse(UserAttemptBase):
    id: int
    last_attempted_at: datetime
    first_solved_at: Optional[datetime] = None
    best_runtime_ms: Optional[int] = None
    best_memory_mb: Optional[float] = None
    
    class Config:
        from_attributes = True

class UserSolvedQuestion(BaseModel):
    question_id: int
    title: str
    difficulty: DifficultyEnum
    first_solved_at: Optional[datetime] = None
    attempts_count: int
    best_runtime_ms: Optional[int] = None
    
    class Config:
        from_attributes = True

class UserStats(BaseModel):
    user_id: str
    total_solved: int
    easy_solved: int
    medium_solved: int
    hard_solved: int
    total_attempted: int
    acceptance_rate: float
    total_submissions: int
    streak_days: int = 0

# Analytics Schemas
class QuestionStats(BaseModel):
    question_id: int
    total_submissions: int
    total_accepted: int
    acceptance_rate: int
    likes: int
    dislikes: int
    average_runtime_ms: Optional[float] = None
    average_memory_mb: Optional[float] = None
    difficulty_distribution: Dict[str, int] = {}  # User-perceived difficulty

class SubmissionSummary(BaseModel):
    """Anonymized submission for analytics"""
    timestamp: datetime
    language: str
    status: str
    runtime_ms: Optional[int] = None
    memory_mb: Optional[float] = None