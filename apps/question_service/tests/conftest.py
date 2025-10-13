"""
Test configuration and fixtures
"""

import sys
from pathlib import Path

# Add the parent directory to Python path so 'app' can be imported
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.questions.models import (
    Company,
    DifficultyEnum,
    Question,
    TestCase,
    TestCaseVisibilityEnum,
    Topic,
    UserQuestionAttempt,
)

# Use in-memory SQLite for tests
# Use file::memory:?cache=shared to share the in-memory database across connections
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,  # Use StaticPool to share the connection
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables once at module level
Base.metadata.create_all(bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create a fresh database session for each test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def client(db):
    """Create a test client with overridden database"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# Sample data fixtures
@pytest.fixture
def sample_topics(db):
    """Create sample topics"""
    topics = [
        Topic(name="Array", description="Array problems"),
        Topic(name="String", description="String manipulation"),
        Topic(name="Hash Table", description="Hash table problems"),
        Topic(name="Dynamic Programming", description="DP problems"),
    ]
    for topic in topics:
        db.add(topic)
    db.commit()
    for topic in topics:
        db.refresh(topic)
    return topics


@pytest.fixture
def sample_companies(db):
    """Create sample companies"""
    companies = [
        Company(name="Google"),
        Company(name="Amazon"),
        Company(name="Microsoft"),
        Company(name="Meta"),
    ]
    for company in companies:
        db.add(company)
    db.commit()
    for company in companies:
        db.refresh(company)
    return companies


@pytest.fixture
def sample_question(db, sample_topics, sample_companies):
    """Create a sample question with test cases"""
    question = Question(
        title="Two Sum",
        description="Given an array of integers nums and an integer target...",
        difficulty=DifficultyEnum.EASY,
        code_templates={
            "python": "def twoSum(nums, target):\n    pass",
            "javascript": "function twoSum(nums, target) { }",
        },
        function_signature={
            "function_name": "twoSum",
            "params": [{"name": "nums", "type": "int[]"}, {"name": "target", "type": "int"}],
            "return_type": "int[]",
        },
        constraints="2 <= nums.length <= 10^4",
        hints=["Use a hash map", "Think O(n) complexity"],
        acceptance_rate=50,
        total_submissions=1000,
        total_accepted=500,
        likes=100,
        dislikes=5,
    )
    question.topics = [sample_topics[0], sample_topics[2]]  # Array, Hash Table
    question.companies = [sample_companies[0], sample_companies[1]]  # Google, Amazon

    db.add(question)
    db.commit()
    db.refresh(question)

    # Add test cases
    test_cases = [
        TestCase(
            question_id=question.id,
            input_data={"nums": [2, 7, 11, 15], "target": 9},
            expected_output=[0, 1],
            visibility=TestCaseVisibilityEnum.SAMPLE,
            order_index=0,
            explanation="nums[0] + nums[1] = 9",
        ),
        TestCase(
            question_id=question.id,
            input_data={"nums": [3, 2, 4], "target": 6},
            expected_output=[1, 2],
            visibility=TestCaseVisibilityEnum.PUBLIC,
            order_index=1,
        ),
        TestCase(
            question_id=question.id,
            input_data={"nums": [3, 3], "target": 6},
            expected_output=[0, 1],
            visibility=TestCaseVisibilityEnum.PRIVATE,
            order_index=2,
        ),
    ]
    for tc in test_cases:
        db.add(tc)
    db.commit()

    db.refresh(question)
    return question


@pytest.fixture
def sample_questions(db, sample_topics, sample_companies):
    """Create multiple sample questions"""
    questions = [
        Question(
            title="Reverse Linked List",
            description="Reverse a singly linked list",
            difficulty=DifficultyEnum.EASY,
            code_templates={"python": "def reverseList(head):\n    pass"},
            function_signature={"function_name": "reverseList"},
            acceptance_rate=70,
            total_submissions=500,
            total_accepted=350,
        ),
        Question(
            title="Longest Substring Without Repeating Characters",
            description="Find the longest substring without repeating characters",
            difficulty=DifficultyEnum.MEDIUM,
            code_templates={"python": "def lengthOfLongestSubstring(s):\n    pass"},
            function_signature={"function_name": "lengthOfLongestSubstring"},
            acceptance_rate=35,
            total_submissions=2000,
            total_accepted=700,
        ),
        Question(
            title="Median of Two Sorted Arrays",
            description="Find the median of two sorted arrays",
            difficulty=DifficultyEnum.HARD,
            code_templates={"python": "def findMedianSortedArrays(nums1, nums2):\n    pass"},
            function_signature={"function_name": "findMedianSortedArrays"},
            acceptance_rate=30,
            total_submissions=1000,
            total_accepted=300,
        ),
    ]

    for i, q in enumerate(questions):
        q.topics = [sample_topics[i % len(sample_topics)]]
        q.companies = [sample_companies[i % len(sample_companies)]]
        db.add(q)

    db.commit()
    for q in questions:
        db.refresh(q)

    return questions


@pytest.fixture
def sample_user_attempt(db, sample_question):
    """Create a sample user attempt"""
    attempt = UserQuestionAttempt(
        user_id="user123",
        question_id=sample_question.id,
        is_solved=True,
        attempts_count=3,
        best_runtime_ms=100,
        best_memory_mb=10.5,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt
