import math
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.questions import crud, models, schemas

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
def run_code(
    question_id: int,
    request: schemas.CodeExecutionRequest,
    db: Session = Depends(get_db)
):
    """Run code against sample/selected test cases"""
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Get test cases
    if request.test_case_ids:
        test_cases = [crud.get_test_case(db, tc_id) for tc_id in request.test_case_ids]
        test_cases = [tc for tc in test_cases if tc is not None]
    else:
        test_cases = crud.get_test_cases(db, question_id, public_only=True)
    
    # TODO: Implement actual code execution
    # This is a stub implementation
    results = []
    for tc in test_cases:
        results.append(schemas.TestCaseResult(
            test_case_id=tc.id,
            input_data=tc.input_data,
            expected_output=tc.expected_output,
            actual_output=tc.expected_output,  # Stub: assume correct
            passed=True,
            runtime_ms=100,
            memory_mb=10.5,
            error=None
        ))
    
    return schemas.CodeExecutionResponse(
        question_id=question_id,
        language=request.language,
        total_test_cases=len(results),
        passed_test_cases=len(results),
        results=results,
        overall_passed=True,
        avg_runtime_ms=100,
        avg_memory_mb=10.5
    )


@router.post("/{question_id}/submit", response_model=schemas.SubmissionResponse)
def submit_solution(
    question_id: int,
    request: schemas.SubmissionRequest,
    user_id: str = Query(..., description="User ID submitting the solution"),
    db: Session = Depends(get_db)
):
    """Submit solution (runs all test cases including private)"""
    question = crud.get_question(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Get all test cases (including private)
    test_cases = crud.get_test_cases(db, question_id, public_only=False)
    
    # TODO: Implement actual code execution
    # This is a stub implementation
    passed = len(test_cases)
    total = len(test_cases)
    is_solved = passed == total
    
    # Update question stats
    question.total_submissions += 1
    if is_solved:
        question.total_accepted += 1
    question.acceptance_rate = int((question.total_accepted / question.total_submissions) * 100)
    db.commit()
    
    # Record user attempt
    attempt = schemas.UserAttemptCreate(
        question_id=question_id,
        is_solved=is_solved,
        runtime_ms=150,
        memory_mb=12.3
    )
    crud.create_user_attempt(db, user_id, attempt)
    
    submission_id = str(uuid.uuid4())
    
    return schemas.SubmissionResponse(
        submission_id=submission_id,
        question_id=question_id,
        status="accepted" if is_solved else "wrong_answer",
        passed_test_cases=passed,
        total_test_cases=total,
        runtime_ms=150,
        memory_mb=12.3,
        runtime_percentile=75.5,
        memory_percentile=80.2,
        timestamp=datetime.utcnow()
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
    
    return schemas.QuestionDetail(
        id=question.id,
        title=question.title,
        description=question.description,
        difficulty=schemas.DifficultyEnum(question.difficulty.value),
        code_templates=question.code_templates,
        function_signature=question.function_signature,
        constraints=question.constraints,
        hints=question.hints,
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
