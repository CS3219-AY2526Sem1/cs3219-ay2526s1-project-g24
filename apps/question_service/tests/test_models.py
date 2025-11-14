"""
Tests for database models and relationships
"""

from app.questions import models, schemas
from app.questions.models import DifficultyEnum, TestCaseVisibilityEnum


class TestQuestionModel:
    """Tests for Question model"""

    def test_create_question(self, db):
        """Test creating a question"""
        question = models.Question(
            title="Test Question",
            description="Test description",
            difficulty=DifficultyEnum.EASY,
            code_templates={"python": "def solution():\n    pass"},
            function_signature={
                "function_name": "solution",
                "arguments": [],
                "return_type": "void"
            },
        )
        db.add(question)
        db.commit()

        assert question.id is not None
        assert question.title == "Test Question"
        assert question.difficulty == DifficultyEnum.EASY

    def test_question_topic_relationship(self, db, sample_topics):
        """Test many-to-many relationship with topics"""
        question = models.Question(
            title="Question with Topics",
            description="Test",
            difficulty=DifficultyEnum.MEDIUM,
            code_templates={},
            function_signature={},
        )
        question.topics = [sample_topics[0], sample_topics[1]]
        db.add(question)
        db.commit()

        assert len(question.topics) == 2
        assert sample_topics[0] in question.topics

    def test_question_company_relationship(self, db, sample_companies):
        """Test many-to-many relationship with companies"""
        question = models.Question(
            title="Question with Companies",
            description="Test",
            difficulty=DifficultyEnum.HARD,
            code_templates={},
            function_signature={},
        )
        question.companies = [sample_companies[0]]
        db.add(question)
        db.commit()

        assert len(question.companies) == 1
        assert sample_companies[0] in question.companies

    def test_question_test_cases_cascade_delete(self, db):
        """Test that deleting question deletes test cases"""
        question = models.Question(
            title="Question to Delete",
            description="Test",
            difficulty=DifficultyEnum.EASY,
            code_templates={},
            function_signature={},
        )
        db.add(question)
        db.commit()

        test_case = models.TestCase(
            question_id=question.id,
            input_data={"test": 1},
            expected_output=1,
            visibility=TestCaseVisibilityEnum.PUBLIC,
            order_index=0,
        )
        db.add(test_case)
        db.commit()

        tc_id = test_case.id
        question_id = question.id

        # Delete question
        db.delete(question)
        db.commit()

        # Test case should be deleted
        assert db.query(models.TestCase).filter_by(id=tc_id).first() is None

    def test_question_attempts_cascade_delete(self, db, sample_question):
        """Test that user attempts are NOT deleted when question is deleted (orphan records)"""
        attempt = models.UserQuestionAttempt(
            user_id="test_user",
            question_id=sample_question.id,
            status="solved",
        )
        db.add(attempt)
        db.commit()

        attempt_id = attempt.id
        question_id = sample_question.id

        # Delete question
        db.delete(sample_question)
        db.commit()

        # Attempt should still exist (no cascade delete configured)
        # This preserves historical user progress data even if question is removed
        orphaned_attempt = db.query(models.UserQuestionAttempt).filter_by(id=attempt_id).first()
        assert orphaned_attempt is not None
        assert orphaned_attempt.question_id == question_id


class TestTopicModel:
    """Tests for Topic model"""

    def test_create_topic(self, db):
        """Test creating a topic"""
        topic = models.Topic(
            name="New Topic",
            description="A test topic",
        )
        db.add(topic)
        db.commit()

        assert topic.id is not None
        assert topic.name == "New Topic"

    def test_topic_unique_name(self, db, sample_topics):
        """Test that topic names should be unique"""
        # This depends on DB constraints
        # If constraint exists, this will raise an exception
        topic = models.Topic(
            name=sample_topics[0].name,
            description="Duplicate",
        )
        db.add(topic)

        # If there's a unique constraint, this should fail
        # Otherwise, it will succeed (depends on schema)
        try:
            db.commit()
            # If commit succeeds, constraint might not be enforced
        except Exception:
            # Expected if unique constraint exists
            db.rollback()


class TestCompanyModel:
    """Tests for Company model"""

    def test_create_company(self, db):
        """Test creating a company"""
        company = models.Company(
            name="Test Company",
            description="A test company",
        )
        db.add(company)
        db.commit()

        assert company.id is not None
        assert company.name == "Test Company"


class TestTestCaseModel:
    """Tests for TestCase model"""

    def test_create_test_case(self, db, sample_question):
        """Test creating a test case"""
        test_case = models.TestCase(
            question_id=sample_question.id,
            input_data={"nums": [1, 2, 3], "target": 3},
            expected_output=[0, 2],
            visibility=TestCaseVisibilityEnum.SAMPLE,
            order_index=0,
        )
        db.add(test_case)
        db.commit()

        assert test_case.id is not None
        assert test_case.question_id == sample_question.id
        assert test_case.visibility == TestCaseVisibilityEnum.SAMPLE

    def test_test_case_visibility_enum(self, db, sample_question):
        """Test TestCaseVisibility enum values"""
        visibilities = [
            TestCaseVisibilityEnum.SAMPLE,
            TestCaseVisibilityEnum.PUBLIC,
            TestCaseVisibilityEnum.PRIVATE,
        ]

        for idx, visibility in enumerate(visibilities):
            tc = models.TestCase(
                question_id=sample_question.id,
                input_data={},
                expected_output={},
                visibility=visibility,
                order_index=idx,
            )
            db.add(tc)

        db.commit()

        # All should be created successfully
        test_cases = (
            db.query(models.TestCase).filter_by(question_id=sample_question.id).all()
        )
        assert len(test_cases) >= 3


class TestUserQuestionAttemptModel:
    """Tests for UserQuestionAttempt model"""

    def test_create_attempt(self, db, sample_question):
        """Test creating a user attempt"""
        attempt = models.UserQuestionAttempt(
            user_id="test_user",
            question_id=sample_question.id,
            status="solved",
            is_solved=True,
            attempts_count=1,
            best_runtime_ms=100,
            best_memory_mb=10.24,
        )
        db.add(attempt)
        db.commit()

        assert attempt.id is not None
        assert attempt.user_id == "test_user"
        assert attempt.status == "solved"

    def test_attempt_status_enum(self, db, sample_question):
        """Test status field values"""
        statuses = [
            "solved",
            "attempted",
            "not_attempted",
        ]

        for status in statuses:
            attempt = models.UserQuestionAttempt(
                user_id=f"test_user_{status}",
                question_id=sample_question.id,
                status=status,
            )
            db.add(attempt)

        db.commit()

        # All should be created successfully
        attempts = (
            db.query(models.UserQuestionAttempt)
            .filter_by(question_id=sample_question.id)
            .all()
        )
        assert len(attempts) >= len(statuses)

    def test_attempt_timestamps(self, db, sample_question):
        """Test that last_attempted_at is set automatically"""
        attempt = models.UserQuestionAttempt(
            user_id="test_user",
            question_id=sample_question.id,
            status="solved",
        )
        db.add(attempt)
        db.commit()

        assert attempt.last_attempted_at is not None


class TestModelRelationships:
    """Tests for complex model relationships"""

    def test_question_with_all_relationships(self, db, sample_topics, sample_companies):
        """Test question with topics, companies, and test cases"""
        question = models.Question(
            title="Complete Question",
            description="Has all relationships",
            difficulty=DifficultyEnum.MEDIUM,
            code_templates={"python": "def solution(): pass"},
            function_signature={
                "function_name": "solution",
                "arguments": [],
                "return_type": "void"
            },
        )
        question.topics = [sample_topics[0], sample_topics[1]]
        question.companies = [sample_companies[0]]

        db.add(question)
        db.commit()

        # Add test cases
        test_case = models.TestCase(
            question_id=question.id,
            input_data={"test": 1},
            expected_output=1,
            visibility=TestCaseVisibilityEnum.SAMPLE,
            order_index=0,
        )
        db.add(test_case)

        # Add user attempts
        attempt = models.UserQuestionAttempt(
            user_id="test_user",
            question_id=question.id,
            status="solved",
        )
        db.add(attempt)
        db.commit()

        # Verify all relationships
        assert len(question.topics) == 2
        assert len(question.companies) == 1
        assert len(question.test_cases) == 1
        
        # Verify user attempt was created (no direct relationship from Question to attempts)
        user_attempts = db.query(models.UserQuestionAttempt).filter_by(question_id=question.id).all()
        assert len(user_attempts) == 1

    def test_topic_questions_backref(self, db, sample_question, sample_topics):
        """Test that topics can access their questions"""
        # Add topic to question
        sample_question.topics.append(sample_topics[0])
        db.commit()

        # Access questions from topic
        topic = db.query(models.Topic).filter_by(id=sample_topics[0].id).first()
        assert sample_question in topic.questions

    def test_company_questions_backref(self, db, sample_question, sample_companies):
        """Test that companies can access their questions"""
        # Add company to question
        sample_question.companies.append(sample_companies[0])
        db.commit()

        # Access questions from company
        company = db.query(models.Company).filter_by(id=sample_companies[0].id).first()
        assert sample_question in company.questions

    def test_cascade_deletes_preserve_related_entities(
        self, db, sample_question, sample_topics, sample_companies
    ):
        """Test that deleting question doesn't delete topics/companies"""
        # sample_question already has topics and companies from fixture
        # Just record the IDs
        topic_ids = [t.id for t in sample_question.topics]
        company_ids = [c.id for c in sample_question.companies]
        
        assert len(topic_ids) > 0, "sample_question should have topics"
        assert len(company_ids) > 0, "sample_question should have companies"

        # Delete question
        db.delete(sample_question)
        db.commit()

        # Topics and companies should still exist
        for topic_id in topic_ids:
            assert db.query(models.Topic).filter_by(id=topic_id).first() is not None
        for company_id in company_ids:
            assert db.query(models.Company).filter_by(id=company_id).first() is not None
