from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.questions import crud, schemas

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.get("/", response_model=list[schemas.TopicResponse])
def list_topics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all topics"""
    topics = crud.get_topics(db, skip=skip, limit=limit)
    return [
        schemas.TopicResponse(
            id=t.id,
            name=t.name,
            description=t.description,
            question_count=len(t.questions)
        )
        for t in topics
    ]


@router.get("/{topic_id}", response_model=schemas.TopicResponse)
def get_topic(
    topic_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific topic by ID"""
    topic = crud.get_topic(db, topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    return schemas.TopicResponse(
        id=topic.id,
        name=topic.name,
        description=topic.description,
        question_count=len(topic.questions)
    )


@router.post("/", response_model=schemas.TopicResponse, status_code=201)
def create_topic(
    topic: schemas.TopicCreate,
    db: Session = Depends(get_db)
):
    """Create a new topic (admin only)"""
    try:
        db_topic = crud.create_topic(db, topic)
        return schemas.TopicResponse(
            id=db_topic.id,
            name=db_topic.name,
            description=db_topic.description,
            question_count=len(db_topic.questions)
        )
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail=f"Topic with name '{topic.name}' already exists"
        )


@router.put("/{topic_id}", response_model=schemas.TopicResponse)
def update_topic(
    topic_id: int,
    topic: schemas.TopicCreate,
    db: Session = Depends(get_db)
):
    """Update a topic (admin only)"""
    db_topic = crud.update_topic(db, topic_id, topic)
    if not db_topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    return schemas.TopicResponse(
        id=db_topic.id,
        name=db_topic.name,
        description=db_topic.description,
        question_count=len(db_topic.questions)
    )


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db)
):
    """Delete a topic (admin only)"""
    success = crud.delete_topic(db, topic_id)
    if not success:
        raise HTTPException(status_code=404, detail="Topic not found")
