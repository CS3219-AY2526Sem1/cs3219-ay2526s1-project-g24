import hashlib
import random
from datetime import datetime, timedelta
from typing import List, Optional

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.orm import Session, joinedload

from . import models, schemas

# ============================================================================
# QUESTION CRUD
# ============================================================================

def create_question(db: Session, question: schemas.QuestionCreate):
    """Create a new question with topics, companies, and test cases"""
    # Validate topic_ids exist
    if question.topic_ids:
        topics = db.query(models.Topic).filter(models.Topic.id.in_(question.topic_ids)).all()
        if len(topics) != len(question.topic_ids):
            found_ids = {t.id for t in topics}
            invalid_ids = [tid for tid in question.topic_ids if tid not in found_ids]
            raise ValueError(f"Invalid topic_ids: {invalid_ids}")
    
    # Validate company_ids exist
    if question.company_ids:
        companies = db.query(models.Company).filter(models.Company.id.in_(question.company_ids)).all()
        if len(companies) != len(question.company_ids):
            found_ids = {c.id for c in companies}
            invalid_ids = [cid for cid in question.company_ids if cid not in found_ids]
            raise ValueError(f"Invalid company_ids: {invalid_ids}")
    
    db_question = models.Question(
        title=question.title,
        description=question.description,
        difficulty=models.DifficultyEnum[question.difficulty.value.upper()],
        code_templates=question.code_templates,
        function_signature=question.function_signature,
        constraints=question.constraints,
        hints=question.hints,
    )
    
    # Add topics
    if question.topic_ids:
        db_question.topics = topics
    
    # Add companies
    if question.company_ids:
        db_question.companies = companies
    
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    # Add test cases
    if question.test_cases:
        for tc in question.test_cases:
            test_case = models.TestCase(
                question_id=db_question.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                visibility=models.TestCaseVisibilityEnum[tc.visibility.value.upper()],
                order_index=tc.order_index,
                explanation=tc.explanation,
            )
            db.add(test_case)
        db.commit()
        db.refresh(db_question)
    
    return db_question


def get_questions(
    db: Session, 
    filters: schemas.QuestionFilterParams,
    user_id: Optional[str] = None
):
    """Get questions with filters and pagination"""
    query = db.query(models.Question).options(
        joinedload(models.Question.topics),
        joinedload(models.Question.companies)
    )
    
    # Filter out soft-deleted questions by default (unless include_deleted is True)
    if not filters.include_deleted:
        query = query.filter(models.Question.deleted_at.is_(None))
    
    # Apply difficulty filter
    if filters.difficulties:
        difficulty_enums = [models.DifficultyEnum[d.value.upper()] for d in filters.difficulties]
        query = query.filter(models.Question.difficulty.in_(difficulty_enums))
    
    # Apply topic filter
    if filters.topic_ids:
        query = query.join(models.Question.topics).filter(models.Topic.id.in_(filters.topic_ids))
    
    # Apply company filter
    if filters.company_ids:
        query = query.join(models.Question.companies).filter(models.Company.id.in_(filters.company_ids))
    
    # Apply search filter
    if filters.search:
        query = query.filter(models.Question.title.ilike(f"%{filters.search}%"))
    
    # Apply user-specific filters
    if user_id:
        if filters.attempted_only or filters.solved_only or filters.unsolved_only:
            query = query.outerjoin(
                models.UserQuestionAttempt,
                and_(
                    models.UserQuestionAttempt.question_id == models.Question.id,
                    models.UserQuestionAttempt.user_id == user_id
                )
            )
            
            if filters.solved_only:
                query = query.filter(models.UserQuestionAttempt.is_solved == True)
            elif filters.unsolved_only:
                query = query.filter(
                    or_(
                        models.UserQuestionAttempt.is_solved == False,
                        models.UserQuestionAttempt.id == None
                    )
                )
            elif filters.attempted_only:
                query = query.filter(models.UserQuestionAttempt.id != None)
    
    # Get total count before pagination
    total = query.with_entities(models.Question.id).distinct().count()
    
    # Apply sorting
    if filters.random:
        # Random selection overrides other sorting
        query = query.order_by(func.random())
    else:
        # Regular sorting
        if filters.sort_by == "difficulty":
            order_col = models.Question.difficulty
        elif filters.sort_by == "acceptance_rate":
            order_col = models.Question.acceptance_rate
        elif filters.sort_by == "title":
            order_col = models.Question.title
        else:
            order_col = models.Question.id
        
        if filters.sort_order == "desc":
            query = query.order_by(desc(order_col))
        else:
            query = query.order_by(order_col)
    
    # Apply pagination
    offset = (filters.page - 1) * filters.page_size
    questions = query.offset(offset).limit(filters.page_size).all()
    
    return questions, total


def get_question(db: Session, question_id: int, include_deleted: bool = False):
    """Get a single question by ID with all relationships"""
    query = db.query(models.Question).options(
        joinedload(models.Question.topics),
        joinedload(models.Question.companies),
        joinedload(models.Question.test_cases)
    ).filter(models.Question.id == question_id)
    
    # Filter out soft-deleted unless explicitly requested
    if not include_deleted:
        query = query.filter(models.Question.deleted_at.is_(None))
    
    return query.first()


def update_question(db: Session, question_id: int, question_update: schemas.QuestionUpdate):
    """Update a question"""
    db_question = get_question(db, question_id)
    if not db_question:
        return None
    
    # Update basic fields
    update_data = question_update.dict(exclude_unset=True, exclude={"topic_ids", "company_ids"})
    
    # Convert difficulty enum if present
    if "difficulty" in update_data and update_data["difficulty"]:
        update_data["difficulty"] = models.DifficultyEnum[update_data["difficulty"].value.upper()]
    
    for field, value in update_data.items():
        setattr(db_question, field, value)
    
    # Update topics if provided
    if question_update.topic_ids is not None:
        topics = db.query(models.Topic).filter(models.Topic.id.in_(question_update.topic_ids)).all()
        db_question.topics = topics
    
    # Update companies if provided
    if question_update.company_ids is not None:
        companies = db.query(models.Company).filter(models.Company.id.in_(question_update.company_ids)).all()
        db_question.companies = companies
    
    db_question.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_question)
    return db_question


def delete_question(db: Session, question_id: int, permanent: bool = False):
    """Soft delete a question (or permanent delete if specified)"""
    db_question = get_question(db, question_id, include_deleted=True)
    if not db_question:
        return False
    
    if permanent:
        # Permanent delete - actually remove from database
        db.delete(db_question)
    else:
        # Soft delete - set deleted_at timestamp
        if db_question.deleted_at is not None:
            return False  # Already deleted
        db_question.deleted_at = datetime.utcnow()
    
    db.commit()
    return True


def restore_question(db: Session, question_id: int):
    """Restore a soft-deleted question"""
    db_question = get_question(db, question_id, include_deleted=True)
    if not db_question:
        return None
    
    if db_question.deleted_at is None:
        return db_question  # Already active
    
    db_question.deleted_at = None
    db.commit()
    db.refresh(db_question)
    return db_question


def get_random_question(db: Session, filters: Optional[schemas.QuestionFilterParams] = None):
    """Get a random question with optional filters"""
    if filters is None:
        filters = schemas.QuestionFilterParams(random=True, page=1, page_size=1)
    else:
        filters.random = True
        filters.page_size = 1
    
    questions, _ = get_questions(db, filters)
    return questions[0] if questions else None


def get_daily_question(db: Session):
    """Get the daily challenge question (deterministic based on date)"""
    # Use date as seed for deterministic daily question
    today = datetime.utcnow().date()
    date_string = today.isoformat()
    seed = int(hashlib.md5(date_string.encode()).hexdigest(), 16)
    
    # Get total question count (excluding deleted)
    total_questions = db.query(func.count(models.Question.id)).filter(
        models.Question.deleted_at.is_(None)
    ).scalar()
    if total_questions == 0:
        return None
    
    # Select question based on seed
    question_index = seed % total_questions
    return db.query(models.Question).options(
        joinedload(models.Question.topics),
        joinedload(models.Question.companies)
    ).filter(models.Question.deleted_at.is_(None)).offset(question_index).first()


def get_similar_questions(db: Session, question_id: int, limit: int = 5):
    """Get similar questions based on topics and difficulty"""
    question = get_question(db, question_id, include_deleted=False)
    if not question:
        return []
    
    topic_ids = [t.id for t in question.topics]
    
    query = db.query(models.Question).options(
        joinedload(models.Question.topics),
        joinedload(models.Question.companies)
    ).filter(
        models.Question.id != question_id,
        models.Question.difficulty == question.difficulty,
        models.Question.deleted_at.is_(None)  # Exclude deleted
    )
    
    # Prioritize questions with overlapping topics
    if topic_ids:
        query = query.join(models.Question.topics).filter(
            models.Topic.id.in_(topic_ids)
        )
    
    return query.limit(limit).all()


# ============================================================================
# TEST CASE CRUD
# ============================================================================

def get_test_cases(db: Session, question_id: int, public_only: bool = True):
    """Get test cases for a question"""
    query = db.query(models.TestCase).filter(models.TestCase.question_id == question_id)
    
    if public_only:
        query = query.filter(
            models.TestCase.visibility.in_([
                models.TestCaseVisibilityEnum.PUBLIC,
                models.TestCaseVisibilityEnum.SAMPLE
            ])
        )
    
    return query.order_by(models.TestCase.order_index).all()


def create_test_case(db: Session, question_id: int, test_case: schemas.TestCaseCreate):
    """Create a new test case"""
    db_test_case = models.TestCase(
        question_id=question_id,
        input_data=test_case.input_data,
        expected_output=test_case.expected_output,
        visibility=models.TestCaseVisibilityEnum[test_case.visibility.value.upper()],
        order_index=test_case.order_index,
        explanation=test_case.explanation,
    )
    db.add(db_test_case)
    db.commit()
    db.refresh(db_test_case)
    return db_test_case


def get_test_case(db: Session, test_case_id: int):
    """Get a single test case"""
    return db.query(models.TestCase).filter(models.TestCase.id == test_case_id).first()


def update_test_case(db: Session, test_case_id: int, test_case: schemas.TestCaseCreate):
    """Update a test case"""
    db_test_case = get_test_case(db, test_case_id)
    if not db_test_case:
        return None
    
    db_test_case.input_data = test_case.input_data
    db_test_case.expected_output = test_case.expected_output
    db_test_case.visibility = models.TestCaseVisibilityEnum[test_case.visibility.value.upper()]
    db_test_case.order_index = test_case.order_index
    db_test_case.explanation = test_case.explanation
    
    db.commit()
    db.refresh(db_test_case)
    return db_test_case


def delete_test_case(db: Session, test_case_id: int):
    """Delete a test case"""
    db_test_case = get_test_case(db, test_case_id)
    if db_test_case:
        db.delete(db_test_case)
        db.commit()
        return True
    return False


# ============================================================================
# TOPIC CRUD
# ============================================================================

def get_topics(db: Session, skip: int = 0, limit: int = 100):
    """Get all topics"""
    return db.query(models.Topic).offset(skip).limit(limit).all()


def get_topic(db: Session, topic_id: int):
    """Get a single topic"""
    return db.query(models.Topic).filter(models.Topic.id == topic_id).first()


def create_topic(db: Session, topic: schemas.TopicCreate):
    """Create a new topic"""
    db_topic = models.Topic(name=topic.name, description=topic.description)
    db.add(db_topic)
    db.commit()
    db.refresh(db_topic)
    return db_topic


def update_topic(db: Session, topic_id: int, topic: schemas.TopicCreate):
    """Update a topic"""
    db_topic = get_topic(db, topic_id)
    if not db_topic:
        return None
    
    db_topic.name = topic.name
    db_topic.description = topic.description
    db.commit()
    db.refresh(db_topic)
    return db_topic


def delete_topic(db: Session, topic_id: int):
    """Delete a topic"""
    db_topic = get_topic(db, topic_id)
    if db_topic:
        db.delete(db_topic)
        db.commit()
        return True
    return False


# ============================================================================
# COMPANY CRUD
# ============================================================================

def get_companies(db: Session, skip: int = 0, limit: int = 100):
    """Get all companies"""
    return db.query(models.Company).offset(skip).limit(limit).all()


def get_company(db: Session, company_id: int):
    """Get a single company"""
    return db.query(models.Company).filter(models.Company.id == company_id).first()


def create_company(db: Session, company: schemas.CompanyCreate):
    """Create a new company"""
    db_company = models.Company(
        name=company.name,
        description=company.description
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


def update_company(db: Session, company_id: int, company: schemas.CompanyCreate):
    """Update a company"""
    db_company = get_company(db, company_id)
    if not db_company:
        return None
    
    db_company.name = company.name
    if company.description is not None:
        db_company.description = company.description
    db.commit()
    db.refresh(db_company)
    return db_company


def delete_company(db: Session, company_id: int):
    """Delete a company"""
    db_company = get_company(db, company_id)
    if db_company:
        db.delete(db_company)
        db.commit()
        return True
    return False


# ============================================================================
# USER PROGRESS CRUD
# ============================================================================

def get_user_attempts(db: Session, user_id: str, skip: int = 0, limit: int = 50):
    """Get user's attempt history"""
    return db.query(models.UserQuestionAttempt).filter(
        models.UserQuestionAttempt.user_id == user_id
    ).order_by(desc(models.UserQuestionAttempt.last_attempted_at)).offset(skip).limit(limit).all()


def get_user_solved_questions(db: Session, user_id: str):
    """Get user's solved questions"""
    attempts = db.query(models.UserQuestionAttempt).options(
        joinedload(models.UserQuestionAttempt.question)
    ).filter(
        models.UserQuestionAttempt.user_id == user_id,
        models.UserQuestionAttempt.is_solved == True
    ).all()
    
    # This would need to be transformed to UserSolvedQuestion schema
    return attempts


def get_user_stats(db: Session, user_id: str) -> schemas.UserStats:
    """Get user statistics"""
    attempts = db.query(models.UserQuestionAttempt).options(
        joinedload(models.UserQuestionAttempt.question)
    ).filter(models.UserQuestionAttempt.user_id == user_id).all()
    
    total_attempted = len(attempts)
    total_solved = sum(1 for a in attempts if a.is_solved)
    
    # Count by difficulty
    easy_solved = sum(1 for a in attempts if a.is_solved and a.question.difficulty == models.DifficultyEnum.EASY)
    medium_solved = sum(1 for a in attempts if a.is_solved and a.question.difficulty == models.DifficultyEnum.MEDIUM)
    hard_solved = sum(1 for a in attempts if a.is_solved and a.question.difficulty == models.DifficultyEnum.HARD)
    
    total_submissions = sum(a.attempts_count for a in attempts)
    acceptance_rate = (total_solved / total_submissions * 100) if total_submissions > 0 else 0
    
    return schemas.UserStats(
        user_id=user_id,
        total_solved=total_solved,
        easy_solved=easy_solved,
        medium_solved=medium_solved,
        hard_solved=hard_solved,
        total_attempted=total_attempted,
        acceptance_rate=acceptance_rate,
        total_submissions=total_submissions,
        streak_days=0  # TODO: Calculate streak based on solved dates
    )


def create_user_attempt(db: Session, user_id: str, attempt: schemas.UserAttemptCreate):
    """Record a user attempt"""
    # Check if attempt record exists for this user, question, AND language
    db_attempt = db.query(models.UserQuestionAttempt).filter(
        models.UserQuestionAttempt.user_id == user_id,
        models.UserQuestionAttempt.question_id == attempt.question_id,
        models.UserQuestionAttempt.language == attempt.language
    ).first()
    
    if db_attempt:
        # Update existing attempt
        db_attempt.attempts_count += 1
        db_attempt.last_attempted_at = datetime.utcnow()
        
        # Update status
        if attempt.is_solved:
            db_attempt.status = "solved"
        elif db_attempt.status == "not_attempted":
            db_attempt.status = "attempted"
        
        if attempt.is_solved and not db_attempt.is_solved:
            db_attempt.is_solved = True
            db_attempt.first_solved_at = datetime.utcnow()
        
        # Update best runtime/memory
        if attempt.runtime_ms is not None:
            if db_attempt.best_runtime_ms is None or attempt.runtime_ms < db_attempt.best_runtime_ms:
                db_attempt.best_runtime_ms = attempt.runtime_ms
        
        if attempt.memory_mb is not None:
            if db_attempt.best_memory_mb is None or attempt.memory_mb < db_attempt.best_memory_mb:
                db_attempt.best_memory_mb = attempt.memory_mb
    else:
        # Create new attempt
        status = "solved" if attempt.is_solved else "attempted"
        db_attempt = models.UserQuestionAttempt(
            user_id=user_id,
            question_id=attempt.question_id,
            language=attempt.language,
            is_solved=attempt.is_solved,
            attempts_count=1,
            status=status,
            last_attempted_at=datetime.utcnow(),
            first_solved_at=datetime.utcnow() if attempt.is_solved else None,
            best_runtime_ms=attempt.runtime_ms,
            best_memory_mb=attempt.memory_mb
        )
        db.add(db_attempt)
    
    db.commit()
    db.refresh(db_attempt)
    return db_attempt


def calculate_percentiles(
    db: Session,
    question_id: int,
    language: str,
    runtime_ms: int,
    memory_mb: float
) -> tuple[Optional[float], Optional[float]]:
    """
    Calculate runtime and memory percentiles for a submission.
    Returns (runtime_percentile, memory_percentile) where percentile
    indicates what % of submissions this beats (0-100).
    Only calculates if there are at least 10 successful submissions in the same language.
    """
    # Query all successful attempts for this question in the same language
    successful_attempts = db.query(
        models.UserQuestionAttempt.best_runtime_ms,
        models.UserQuestionAttempt.best_memory_mb
    ).filter(
        models.UserQuestionAttempt.question_id == question_id,
        models.UserQuestionAttempt.language == language,
        models.UserQuestionAttempt.is_solved == True,
        models.UserQuestionAttempt.best_runtime_ms.isnot(None),
        models.UserQuestionAttempt.best_memory_mb.isnot(None)
    ).all()
    
    # Need minimum threshold for meaningful percentiles
    if len(successful_attempts) < 10:
        return None, None
    
    # Extract values
    runtimes = [a.best_runtime_ms for a in successful_attempts]
    memories = [a.best_memory_mb for a in successful_attempts]
    
    # Calculate percentiles (what % of submissions this beats)
    # Lower runtime/memory is better, so we count how many are >= (worse than) current
    runtime_percentile = (sum(1 for r in runtimes if r >= runtime_ms) / len(runtimes)) * 100
    memory_percentile = (sum(1 for m in memories if m >= memory_mb) / len(memories)) * 100
    
    return round(runtime_percentile, 1), round(memory_percentile, 1)


# ============================================================================
# ANALYTICS CRUD
# ============================================================================

def get_question_stats(db: Session, question_id: int) -> Optional[schemas.QuestionStats]:
    """Get question statistics"""
    question = get_question(db, question_id)
    if not question:
        return None
    
    # Get all user attempts for this question
    attempts = db.query(models.UserQuestionAttempt).filter(
        models.UserQuestionAttempt.question_id == question_id
    ).all()
    
    # Calculate averages
    runtimes = [a.best_runtime_ms for a in attempts if a.best_runtime_ms is not None]
    memories = [a.best_memory_mb for a in attempts if a.best_memory_mb is not None]
    
    avg_runtime = sum(runtimes) / len(runtimes) if runtimes else None
    avg_memory = sum(memories) / len(memories) if memories else None
    
    return schemas.QuestionStats(
        question_id=question_id,
        total_submissions=question.total_submissions,
        total_accepted=question.total_accepted,
        acceptance_rate=question.acceptance_rate,
        likes=question.likes,
        dislikes=question.dislikes,
        average_runtime_ms=avg_runtime,
        average_memory_mb=avg_memory,
        difficulty_distribution={}  # TODO: Implement perceived difficulty tracking
    )


def get_question_submissions(db: Session, question_id: int, limit: int = 20):
    """Get recent anonymized submissions for a question"""
    # This would integrate with a submissions table if you track all submissions
    # For now, return empty list as placeholder
    return []
