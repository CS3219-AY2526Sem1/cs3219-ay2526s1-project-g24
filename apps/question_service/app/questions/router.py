import math
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.code_execution_client import code_execution_client
from app.core.database import get_db
from app.questions import crud, models, schemas
from app.questions.data_structure_utils import prepend_data_structure_comments

router = APIRouter(prefix="/questions", tags=["Questions"])

# ============================================================================
# QUESTION CRUD
# ============================================================================

@router.get("/", response_model=schemas.QuestionListResponse)
def list_questions(
    difficulties: Optional[str] = Query(None, description="Comma-separated difficulties: easy,medium,hard"),
    topic_ids: Optional[str] = Query(None, description="Comma-separated topic IDs"),
    company_ids: Optional[str] = Query(None, description="Comma-separated company IDs"),
    attempted_only: bool = False,
    solved_only: bool = False,
    unsolved_only: bool = False,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: str = "id",
    sort_order: str = "asc",
    user_id: Optional[str] = Query(None, description="User ID for personalized filters"),
    db: Session = Depends(get_db)
):
    """List questions with filters and pagination"""
    
    # Parse comma-separated values
    difficulty_list = None
    if difficulties:
        difficulty_list = [schemas.DifficultyEnum(d.strip()) for d in difficulties.split(",")]
    
    topic_id_list = None
    if topic_ids:
        topic_id_list = [int(tid.strip()) for tid in topic_ids.split(",")]
    
    company_id_list = None
    if company_ids:
        company_id_list = [int(cid.strip()) for cid in company_ids.split(",")]
    
    # Create filter params
    filters = schemas.QuestionFilterParams(
        difficulties=difficulty_list,
        topic_ids=topic_id_list,
        company_ids=company_id_list,
        attempted_only=attempted_only,
        solved_only=solved_only,
        unsolved_only=unsolved_only,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    questions, total = crud.get_questions(db, filters, user_id)
    
    # Convert to list items
    question_items = []
    for q in questions:
        # Get user attempt info if user_id provided
        is_attempted = False
        is_solved = False
        if user_id:
            attempt = db.query(models.UserQuestionAttempt).filter(
                models.UserQuestionAttempt.user_id == user_id,
                models.UserQuestionAttempt.question_id == q.id
            ).first()
            if attempt:
                is_attempted = True
                is_solved = attempt.is_solved
        
        question_items.append(schemas.QuestionListItem(
            id=q.id,
            title=q.title,
            difficulty=schemas.DifficultyEnum(q.difficulty.value),
            acceptance_rate=q.acceptance_rate,
            topics=[schemas.TopicResponse(id=t.id, name=t.name, description=t.description) for t in q.topics],
            companies=[schemas.CompanyResponse(id=c.id, name=c.name) for c in q.companies],
            is_attempted=is_attempted,
            is_solved=is_solved
        ))
    
    total_pages = math.ceil(total / page_size)
    
    return schemas.QuestionListResponse(
        questions=question_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/random", response_model=schemas.QuestionDetail)
def get_random_question(
    difficulties: Optional[str] = Query(None),
    topic_ids: Optional[str] = Query(None),
    company_ids: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get a random question with optional filters"""
    
    # Parse filters similar to list_questions
    difficulty_list = None
    if difficulties:
        difficulty_list = [schemas.DifficultyEnum(d.strip()) for d in difficulties.split(",")]
    
    topic_id_list = None
    if topic_ids:
        topic_id_list = [int(tid.strip()) for tid in topic_ids.split(",")]
    
    company_id_list = None
    if company_ids:
        company_id_list = [int(cid.strip()) for cid in company_ids.split(",")]
    
    filters = schemas.QuestionFilterParams(
        difficulties=difficulty_list,
        topic_ids=topic_id_list,
        company_ids=company_id_list,
        random=True,
        page=1,
        page_size=1
    )
    
    question = crud.get_random_question(db, filters)
    if not question:
        raise HTTPException(status_code=404, detail="No questions found matching criteria")
    
    return _build_question_detail(db, question, user_id)


@router.get("/daily", response_model=schemas.QuestionDetail)
def get_daily_question(
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get the daily challenge question"""
    question = crud.get_daily_question(db)
    if not question:
        raise HTTPException(status_code=404, detail="No daily question available")
    
    return _build_question_detail(db, question, user_id)


@router.get("/{question_id}", response_model=schemas.QuestionDetail)
def get_question(
    question_id: int,
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get question details"""
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return _build_question_detail(db, question, user_id)


@router.post("/", response_model=schemas.QuestionDetail, status_code=201)
def create_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(get_db)
):
    """Create a new question (admin only)"""
    try:
        db_question = crud.create_question(db, question)
        return _build_question_detail(db, db_question, None)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{question_id}", response_model=schemas.QuestionDetail)
def update_question(
    question_id: int,
    question: schemas.QuestionUpdate,
    db: Session = Depends(get_db)
):
    """Update a question (admin only)"""
    db_question = crud.update_question(db, question_id, question)
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return _build_question_detail(db, db_question, None)


@router.delete("/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    """Delete a question (admin only)"""
    success = crud.delete_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")


@router.get("/{question_id}/similar", response_model=list[schemas.QuestionListItem])
def get_similar_questions(
    question_id: int,
    limit: int = Query(5, ge=1, le=20),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get similar questions based on topics and difficulty"""
    similar = crud.get_similar_questions(db, question_id, limit)
    
    result = []
    for q in similar:
        is_attempted = False
        is_solved = False
        if user_id:
            attempt = db.query(models.UserQuestionAttempt).filter(
                models.UserQuestionAttempt.user_id == user_id,
                models.UserQuestionAttempt.question_id == q.id
            ).first()
            if attempt:
                is_attempted = True
                is_solved = attempt.is_solved
        
        result.append(schemas.QuestionListItem(
            id=q.id,
            title=q.title,
            difficulty=schemas.DifficultyEnum(q.difficulty.value),
            acceptance_rate=q.acceptance_rate,
            topics=[schemas.TopicResponse(id=t.id, name=t.name, description=t.description) for t in q.topics],
            companies=[schemas.CompanyResponse(id=c.id, name=c.name) for c in q.companies],
            is_attempted=is_attempted,
            is_solved=is_solved
        ))
    
    return result


# ============================================================================
# TEST CASES
# ============================================================================

@router.get("/{question_id}/test-cases", response_model=list[schemas.TestCasePublic])
def get_test_cases(
    question_id: int,
    db: Session = Depends(get_db)
):
    """Get sample/public test cases for a question"""
    # Verify question exists
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    test_cases = crud.get_test_cases(db, question_id, public_only=True)
    
    return [
        schemas.TestCasePublic(
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            explanation=tc.explanation,
            order_index=tc.order_index
        )
        for tc in test_cases
    ]


@router.post("/{question_id}/test-cases", response_model=schemas.TestCaseResponse, status_code=201)
def create_test_case(
    question_id: int,
    test_case: schemas.TestCaseCreate,
    db: Session = Depends(get_db)
):
    """Add a test case to a question (admin only)"""
    # Verify question exists
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db_test_case = crud.create_test_case(db, question_id, test_case)
    return schemas.TestCaseResponse(
        id=db_test_case.id,
        question_id=db_test_case.question_id,
        input_data=db_test_case.input_data,
        expected_output=db_test_case.expected_output,
        visibility=schemas.TestCaseVisibility(db_test_case.visibility.value),
        order_index=db_test_case.order_index,
        explanation=db_test_case.explanation
    )


# ============================================================================
# CODE EXECUTION (STUBS)
# ============================================================================

@router.post("/{question_id}/run", response_model=schemas.CodeExecutionResponse)
async def run_code(
    question_id: int,
    request: schemas.CodeExecutionRequest,
    db: Session = Depends(get_db)
):
    """Run code against sample/selected test cases"""
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Validate language
    if request.language not in question.code_templates:
        raise HTTPException(
            status_code=400,
            detail=f"Language {request.language} not supported for this question"
        )
    
    # Get test cases
    if request.test_case_ids:
        test_cases = [crud.get_test_case(db, tc_id) for tc_id in request.test_case_ids]
        test_cases = [tc for tc in test_cases if tc is not None]
    else:
        test_cases = crud.get_test_cases(db, question_id, public_only=True)
    
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases found")
    
    # Prepare test cases for execution service
    execution_test_cases = []
    for tc in test_cases:
        execution_test_cases.append({
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "order_index": tc.order_index,
        })
    
    # Call code execution service with question-specific limits
    try:
        # Convert function_signature to dict for API call
        function_signature_dict = {
            "function_name": question.function_signature["function_name"],
            "arguments": question.function_signature["arguments"],
            "return_type": question.function_signature["return_type"]
        }
        
        # Extract language-specific limits
        time_limit = question.time_limit.get(request.language, 5)  # default 5 seconds
        memory_limit = question.memory_limit.get(request.language, 64000)  # default 64MB
        
        execution_result = await code_execution_client.execute_code(
            language=request.language,
            source_code=request.code,
            test_cases=execution_test_cases,
            time_limit=float(time_limit),
            memory_limit=memory_limit,
            function_signature=function_signature_dict,
        )
        
        # Map results back to our schema
        results = []
        for result in execution_result["results"]:
            # Find the original test case ID
            tc = test_cases[result["order_index"]]
            results.append(schemas.TestCaseResult(
                test_case_id=tc.id,
                input_data=result["input_data"],
                expected_output=result["expected_output"],
                actual_output=result.get("actual_output"),
                passed=result["passed"],
                runtime_ms=result.get("runtime_ms"),
                memory_mb=result.get("memory_kb", 0) / 1024 if result.get("memory_kb") else None,
                error=result.get("error_message"),
            ))
        
        return schemas.CodeExecutionResponse(
            question_id=question_id,
            language=request.language,
            total_test_cases=execution_result["total_test_cases"],
            passed_test_cases=execution_result["passed_test_cases"],
            results=results,
            overall_passed=execution_result["overall_passed"],
            avg_runtime_ms=execution_result.get("avg_runtime_ms"),
            avg_memory_mb=(
                execution_result.get("avg_memory_kb") / 1024
                if execution_result.get("avg_memory_kb")
                else None
            ),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Code execution failed: {str(e)}"
        )


@router.post("/{question_id}/submit", response_model=schemas.SubmissionResponse)
async def submit_solution(
    question_id: int,
    request: schemas.SubmissionRequest,
    user_id: str = Query(..., description="User ID submitting the solution"),
    db: Session = Depends(get_db)
):
    """Submit solution (runs all test cases including private)"""
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Validate language
    if request.language not in question.code_templates:
        raise HTTPException(
            status_code=400,
            detail=f"Language {request.language} not supported for this question"
        )
    
    # Get all test cases (including private)
    test_cases = crud.get_test_cases(db, question_id, public_only=False)
    
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases found")
    
    # Prepare test cases for execution service
    execution_test_cases = []
    for tc in test_cases:
        execution_test_cases.append({
            "input_data": tc.input_data,
            "expected_output": tc.expected_output,
            "order_index": tc.order_index,
        })
    
    # Call code execution service with question-specific limits
    try:
        # Convert function_signature to dict for API call
        function_signature_dict = {
            "function_name": question.function_signature["function_name"],
            "arguments": question.function_signature["arguments"],
            "return_type": question.function_signature["return_type"]
        }
        
        # Extract language-specific limits
        time_limit = question.time_limit.get(request.language, 5)  # default 5 seconds
        memory_limit = question.memory_limit.get(request.language, 64000)  # default 64MB
        
        execution_result = await code_execution_client.execute_code(
            language=request.language,
            source_code=request.code,
            test_cases=execution_test_cases,
            time_limit=float(time_limit),
            memory_limit=memory_limit,
            function_signature=function_signature_dict,
        )
        
        passed = execution_result["passed_test_cases"]
        total = execution_result["total_test_cases"]
        is_solved = execution_result["overall_passed"]
        
        # Determine status
        if is_solved:
            status = "accepted"
        elif execution_result.get("compilation_error"):
            status = "compilation_error"
        else:
            # Check if any test had specific errors
            has_tle = any(
                r.get("status") == "time_limit_exceeded"
                for r in execution_result["results"]
            )
            has_runtime_error = any(
                r.get("status") == "runtime_error"
                for r in execution_result["results"]
            )
            
            if has_tle:
                status = "time_limit_exceeded"
            elif has_runtime_error:
                status = "runtime_error"
            else:
                status = "wrong_answer"
        
        # Update question stats
        question.total_submissions += 1
        if is_solved:
            question.total_accepted += 1
        question.acceptance_rate = int((question.total_accepted / question.total_submissions) * 100)
        db.commit()
        
        # Get runtime and memory stats
        avg_runtime = execution_result.get("avg_runtime_ms")
        avg_memory = execution_result.get("avg_memory_kb")
        avg_memory_mb = avg_memory / 1024 if avg_memory else None
        
        # Record user attempt
        attempt = schemas.UserAttemptCreate(
            question_id=question_id,
            is_solved=is_solved,
            runtime_ms=int(avg_runtime) if avg_runtime else None,
            memory_mb=avg_memory_mb,
        )
        crud.create_user_attempt(db, user_id, attempt)
        
        # Calculate percentiles (simplified - in production, would query historical data)
        runtime_percentile = 75.5 if is_solved else None
        memory_percentile = 80.2 if is_solved else None
        
        submission_id = str(uuid.uuid4())
        
        return schemas.SubmissionResponse(
            submission_id=submission_id,
            question_id=question_id,
            status=status,
            passed_test_cases=passed,
            total_test_cases=total,
            runtime_ms=int(avg_runtime) if avg_runtime else None,
            memory_mb=avg_memory_mb,
            runtime_percentile=runtime_percentile,
            memory_percentile=memory_percentile,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Code execution failed: {str(e)}"
        )


# ============================================================================
# ANALYTICS
# ============================================================================

@router.get("/{question_id}/stats", response_model=schemas.QuestionStats)
def get_question_stats(
    question_id: int,
    db: Session = Depends(get_db)
):
    """Get question statistics"""
    stats = crud.get_question_stats(db, question_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return stats


@router.get("/{question_id}/submissions", response_model=list[schemas.SubmissionSummary])
def get_question_submissions(
    question_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get recent anonymized submissions for a question"""
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    submissions = crud.get_question_submissions(db, question_id, limit)
    return submissions


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _build_question_detail(db: Session, question: models.Question, user_id: Optional[str]) -> schemas.QuestionDetail:
    """Build QuestionDetail response from Question model"""
    from datetime import datetime
    
    # Get sample test cases
    sample_cases = [
        schemas.TestCasePublic(
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            explanation=tc.explanation,
            order_index=tc.order_index
        )
        for tc in question.test_cases
        if tc.visibility in [models.TestCaseVisibilityEnum.PUBLIC, models.TestCaseVisibilityEnum.SAMPLE]
    ]
    
    # Get user attempt info
    is_attempted = False
    is_solved = False
    user_attempts_count = 0
    
    if user_id:
        attempt = db.query(models.UserQuestionAttempt).filter(
            models.UserQuestionAttempt.user_id == user_id,
            models.UserQuestionAttempt.question_id == question.id
        ).first()
        if attempt:
            is_attempted = True
            is_solved = attempt.is_solved
            user_attempts_count = attempt.attempts_count
    
    # Prepend data structure definitions to code templates
    code_templates_with_comments = prepend_data_structure_comments(
        question.code_templates,
        question.function_signature
    )
    
    return schemas.QuestionDetail(
        id=question.id,
        title=question.title,
        description=question.description,
        difficulty=schemas.DifficultyEnum(question.difficulty.value),
        code_templates=code_templates_with_comments,
        function_signature=question.function_signature,
        constraints=question.constraints,
        hints=question.hints,
        time_limit=question.time_limit,
        memory_limit=question.memory_limit,
        acceptance_rate=question.acceptance_rate,
        total_submissions=question.total_submissions,
        total_accepted=question.total_accepted,
        likes=question.likes,
        dislikes=question.dislikes,
        topics=[schemas.TopicResponse(id=t.id, name=t.name, description=t.description) for t in question.topics],
        companies=[schemas.CompanyResponse(id=c.id, name=c.name) for c in question.companies],
        sample_test_cases=sample_cases,
        created_at=question.created_at,
        updated_at=question.updated_at,
        is_attempted=is_attempted,
        is_solved=is_solved,
        user_attempts_count=user_attempts_count
    )
