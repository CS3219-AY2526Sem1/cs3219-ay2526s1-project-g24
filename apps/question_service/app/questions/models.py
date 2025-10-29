import enum
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import relationship

from app.core.database import Base

# Association tables for many-to-many relationships
question_topics = Table('question_topics', Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id')),
    Column('topic_id', Integer, ForeignKey('topics.id'))
)

question_companies = Table('question_companies', Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id')),
    Column('company_id', Integer, ForeignKey('companies.id'))
)

class DifficultyEnum(enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class TestCaseVisibilityEnum(enum.Enum):
    PUBLIC = "public"      # Shown to users before submission
    PRIVATE = "private"    # Hidden, used for validation
    SAMPLE = "sample"      # Example test cases in description

class Question(Base):
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    difficulty = Column(Enum(DifficultyEnum), nullable=False, index=True)
    
    # Code template for different languages
    # Structure: {"python": "def solution():\n    pass", "javascript": "function solution() {}"}
    code_templates = Column(JSON, nullable=False)
    
    # Function signature info for validation
    # Structure: {"function_name": "twoSum", "params": [...], "return_type": "..."}
    function_signature = Column(JSON, nullable=False)
    
    # Constraints, hints, follow-up questions
    constraints = Column(Text)
    hints = Column(JSON)  # Array of hint strings
    
    # Execution limits - per language
    # Structure: {"python": 5, "javascript": 5, "java": 10, "cpp": 3}
    time_limit = Column(JSON, nullable=False, default={"python": 5, "javascript": 5, "java": 10, "cpp": 3})
    # Structure: {"python": 64000, "javascript": 64000, "java": 128000, "cpp": 32000} (in KB)
    memory_limit = Column(JSON, nullable=False, default={"python": 64000, "javascript": 64000, "java": 128000, "cpp": 32000})
    
    # Metadata
    acceptance_rate = Column(Integer, default=0)
    total_submissions = Column(Integer, default=0)
    total_accepted = Column(Integer, default=0)
    likes = Column(Integer, default=0)
    dislikes = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    topics = relationship("Topic", secondary=question_topics, back_populates="questions")
    companies = relationship("Company", secondary=question_companies, back_populates="questions")
    test_cases = relationship("TestCase", back_populates="question", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = 'topics'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    
    questions = relationship("Question", secondary=question_topics, back_populates="topics")

class Company(Base):
    __tablename__ = 'companies'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    
    questions = relationship("Question", secondary=question_companies, back_populates="companies")

class TestCase(Base):
    __tablename__ = 'test_cases'
    
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    
    # Input can be JSON for multiple parameters
    # Example: {"nums": [2,7,11,15], "target": 9}
    input_data = Column(JSON, nullable=False)
    
    # Expected output
    expected_output = Column(JSON, nullable=False)
    
    # Visibility level
    visibility = Column(Enum(TestCaseVisibilityEnum), nullable=False, default=TestCaseVisibilityEnum.PRIVATE)
    
    # Order for display
    order_index = Column(Integer, default=0)
    
    # Optional: explanation for sample cases
    explanation = Column(Text)
    
    question = relationship("Question", back_populates="test_cases")

# User-specific tracking (interfaces with User Service)
class UserQuestionAttempt(Base):
    __tablename__ = 'user_question_attempts'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(String(255), nullable=False, index=True)  # From User Service
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False, index=True)
    language = Column(String(50), nullable=False)  # Programming language used
    
    # Attempt details
    is_solved = Column(Boolean, default=False)
    attempts_count = Column(Integer, default=0)
    status = Column(String(50), default="not_attempted")  # not_attempted, attempted, solved
    last_attempted_at = Column(DateTime, default=datetime.utcnow)
    first_solved_at = Column(DateTime, nullable=True)
    
    # Best submission for this user
    best_runtime_ms = Column(Integer, nullable=True)
    best_memory_mb = Column(Integer, nullable=True)
    
    # Relationship
    question = relationship("Question")