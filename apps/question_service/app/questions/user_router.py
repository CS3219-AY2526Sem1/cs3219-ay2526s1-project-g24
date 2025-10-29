from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.questions import crud, models, schemas

router = APIRouter(prefix="/users", tags=["User Progress"])


@router.get("/me/attempts", response_model=list[schemas.UserAttemptResponse])
def get_my_attempts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authenticated user's attempt history"""
    user_id = user["user_id"]
    attempts = crud.get_user_attempts(db, user_id, skip=skip, limit=limit)
    return [
        schemas.UserAttemptResponse(
            id=a.id,
            user_id=a.user_id,
            question_id=a.question_id,
            is_solved=a.is_solved,
            attempts_count=a.attempts_count,
            last_attempted_at=a.last_attempted_at,
            first_solved_at=a.first_solved_at,
            best_runtime_ms=a.best_runtime_ms,
            best_memory_mb=a.best_memory_mb
        )
        for a in attempts
    ]


@router.get("/me/solved", response_model=list[schemas.UserSolvedQuestion])
def get_my_solved_questions(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authenticated user's solved questions"""
    user_id = user["user_id"]
    attempts = crud.get_user_solved_questions(db, user_id)
    
    result = []
    for a in attempts:
        result.append(schemas.UserSolvedQuestion(
            question_id=a.question_id,
            title=a.question.title,
            difficulty=schemas.DifficultyEnum(a.question.difficulty.value),
            first_solved_at=a.first_solved_at,
            attempts_count=a.attempts_count,
            best_runtime_ms=a.best_runtime_ms
        ))
    
    return result


@router.get("/me/stats", response_model=schemas.UserStats)
def get_my_stats(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get authenticated user's statistics"""
    user_id = user["user_id"]
    return crud.get_user_stats(db, user_id)


@router.post("/me/attempts", response_model=schemas.UserAttemptResponse, status_code=201)
def record_my_attempt(
    attempt: schemas.UserAttemptCreate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record an attempt for the authenticated user"""
    user_id = user["user_id"]
    
    # Verify question exists
    question = crud.get_question(db, attempt.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db_attempt = crud.create_user_attempt(db, user_id, attempt)
    return schemas.UserAttemptResponse(
        id=db_attempt.id,
        user_id=db_attempt.user_id,
        question_id=db_attempt.question_id,
        is_solved=db_attempt.is_solved,
        attempts_count=db_attempt.attempts_count,
        last_attempted_at=db_attempt.last_attempted_at,
        first_solved_at=db_attempt.first_solved_at,
        best_runtime_ms=db_attempt.best_runtime_ms,
        best_memory_mb=db_attempt.best_memory_mb
    )

