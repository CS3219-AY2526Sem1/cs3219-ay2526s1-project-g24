from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.questions import crud, schemas

router = APIRouter(prefix="/questions", tags=["Questions"])

@router.post("/", response_model=schemas.Question)
def create_question(question: schemas.QuestionCreate, db: Session = Depends(get_db)):
    return crud.create_question(db=db, question=question)

@router.get("/", response_model=list[schemas.Question])
def read_questions(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_questions(db, skip=skip, limit=limit)

@router.get("/{question_id}", response_model=schemas.Question)
def read_question(question_id: int, db: Session = Depends(get_db)):
    db_question = crud.get_question(db, question_id=question_id)
    if not db_question:
        raise HTTPException(status_code=404, detail="Question not found")
    return db_question
