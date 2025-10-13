"""
Unit tests for CRUD operations
"""

import pytest

from app.questions import crud, schemas
from app.questions.models import DifficultyEnum, TestCaseVisibilityEnum


class TestQuestionCRUD:
    """Tests for question CRUD operations"""

    def test_create_question(self, db, sample_topics, sample_companies):
        """Test creating a question"""
        question_data = schemas.QuestionCreate(
            title="Test Question",
            description="Test description",
            difficulty=schemas.DifficultyEnum.EASY,
            code_templates={"python": "def solution():\n    pass"},
            function_signature={"function_name": "solution"},
            topic_ids=[sample_topics[0].id],
            company_ids=[sample_companies[0].id],
            test_cases=[
                schemas.TestCaseCreate(
                    input_data={"input": [1, 2, 3]},
                    expected_output=[1, 2, 3],
                    visibility=schemas.TestCaseVisibility.SAMPLE,
                    order_index=0,
                )
            ],
        )

        question = crud.create_question(db, question_data)

        assert question.id is not None
        assert question.title == "Test Question"
        assert question.difficulty == DifficultyEnum.EASY
        assert len(question.topics) == 1
        assert len(question.companies) == 1
        assert len(question.test_cases) == 1

    def test_get_question(self, db, sample_question):
        """Test getting a single question"""
        question = crud.get_question(db, sample_question.id)

        assert question is not None
        assert question.id == sample_question.id
        assert question.title == sample_question.title
        assert len(question.test_cases) > 0

    def test_get_question_not_found(self, db):
        """Test getting a non-existent question"""
        question = crud.get_question(db, 9999)
        assert question is None

    def test_get_questions_with_filters(self, db, sample_questions, sample_topics):
        """Test getting questions with various filters"""
        # Filter by difficulty
        filters = schemas.QuestionFilterParams(
            difficulties=[schemas.DifficultyEnum.EASY],
            page=1,
            page_size=10,
        )
        questions, total = crud.get_questions(db, filters)
        assert all(q.difficulty == DifficultyEnum.EASY for q in questions)

        # Filter by topic
        filters = schemas.QuestionFilterParams(
            topic_ids=[sample_topics[0].id], page=1, page_size=10
        )
        questions, total = crud.get_questions(db, filters)
        assert all(sample_topics[0] in q.topics for q in questions)

    def test_get_questions_pagination(self, db, sample_questions):
        """Test pagination"""
        filters = schemas.QuestionFilterParams(page=1, page_size=2)
        questions, total = crud.get_questions(db, filters)

        assert len(questions) <= 2
        assert total >= len(questions)

    def test_get_questions_sorting(self, db, sample_questions):
        """Test sorting questions"""
        # Sort by difficulty ascending
        filters = schemas.QuestionFilterParams(
            page=1, page_size=10, sort_by="difficulty", sort_order="asc"
        )
        questions, _ = crud.get_questions(db, filters)
        # Easy < Medium < Hard
        assert questions[0].difficulty.value <= questions[-1].difficulty.value

    def test_get_questions_search(self, db, sample_questions):
        """Test search functionality"""
        filters = schemas.QuestionFilterParams(
            page=1, page_size=10, search="Reverse"
        )
        questions, total = crud.get_questions(db, filters)

        assert all("Reverse" in q.title for q in questions)

    def test_update_question(self, db, sample_question):
        """Test updating a question"""
        update_data = schemas.QuestionUpdate(
            title="Updated Title",
            difficulty=schemas.DifficultyEnum.MEDIUM,
        )

        updated = crud.update_question(db, sample_question.id, update_data)

        assert updated.title == "Updated Title"
        assert updated.difficulty == DifficultyEnum.MEDIUM

    def test_update_question_topics(self, db, sample_question, sample_topics):
        """Test updating question topics"""
        update_data = schemas.QuestionUpdate(
            topic_ids=[sample_topics[1].id, sample_topics[2].id]
        )

        updated = crud.update_question(db, sample_question.id, update_data)

        assert len(updated.topics) == 2
        assert sample_topics[1] in updated.topics
        assert sample_topics[2] in updated.topics

    def test_delete_question(self, db, sample_question):
        """Test deleting a question"""
        question_id = sample_question.id
        result = crud.delete_question(db, question_id)

        assert result is True
        assert crud.get_question(db, question_id) is None

    def test_delete_question_cascades_test_cases(self, db, sample_question):
        """Test that deleting a question also deletes test cases"""
        question_id = sample_question.id
        test_case_count = len(sample_question.test_cases)

        assert test_case_count > 0

        crud.delete_question(db, question_id)

        # Verify test cases are also deleted
        from app.questions.models import TestCase

        remaining_cases = (
            db.query(TestCase).filter(TestCase.question_id == question_id).count()
        )
        assert remaining_cases == 0

    def test_get_random_question(self, db, sample_questions):
        """Test getting a random question"""
        question = crud.get_random_question(db)

        assert question is not None
        assert question.id in [q.id for q in sample_questions]

    def test_get_random_question_with_filters(self, db, sample_questions):
        """Test getting a random question with filters"""
        filters = schemas.QuestionFilterParams(
            difficulties=[schemas.DifficultyEnum.EASY], page=1, page_size=1
        )
        question = crud.get_random_question(db, filters)

        assert question is not None
        assert question.difficulty == DifficultyEnum.EASY

    def test_get_daily_question(self, db, sample_questions):
        """Test getting the daily question"""
        question = crud.get_daily_question(db)

        assert question is not None
        # Should be deterministic - calling twice should return same question
        question2 = crud.get_daily_question(db)
        assert question.id == question2.id

    def test_get_similar_questions(self, db, sample_question, sample_questions):
        """Test getting similar questions"""
        similar = crud.get_similar_questions(db, sample_question.id, limit=5)

        # Should not include the original question
        assert all(q.id != sample_question.id for q in similar)


class TestTopicCRUD:
    """Tests for topic CRUD operations"""

    def test_get_topics(self, db, sample_topics):
        """Test getting all topics"""
        topics = crud.get_topics(db)
        assert len(topics) >= len(sample_topics)

    def test_get_topic(self, db, sample_topics):
        """Test getting a single topic"""
        topic = crud.get_topic(db, sample_topics[0].id)
        assert topic is not None
        assert topic.name == sample_topics[0].name

    def test_create_topic(self, db):
        """Test creating a topic"""
        topic_data = schemas.TopicCreate(name="New Topic", description="Description")
        topic = crud.create_topic(db, topic_data)

        assert topic.id is not None
        assert topic.name == "New Topic"

    def test_update_topic(self, db, sample_topics):
        """Test updating a topic"""
        topic_data = schemas.TopicCreate(
            name="Updated Topic", description="Updated description"
        )
        updated = crud.update_topic(db, sample_topics[0].id, topic_data)

        assert updated.name == "Updated Topic"
        assert updated.description == "Updated description"

    def test_delete_topic(self, db, sample_topics):
        """Test deleting a topic"""
        topic_id = sample_topics[0].id
        result = crud.delete_topic(db, topic_id)

        assert result is True
        assert crud.get_topic(db, topic_id) is None


class TestCompanyCRUD:
    """Tests for company CRUD operations"""

    def test_get_companies(self, db, sample_companies):
        """Test getting all companies"""
        companies = crud.get_companies(db)
        assert len(companies) >= len(sample_companies)

    def test_get_company(self, db, sample_companies):
        """Test getting a single company"""
        company = crud.get_company(db, sample_companies[0].id)
        assert company is not None
        assert company.name == sample_companies[0].name

    def test_create_company(self, db):
        """Test creating a company"""
        company_data = schemas.CompanyCreate(name="New Company")
        company = crud.create_company(db, company_data)

        assert company.id is not None
        assert company.name == "New Company"

    def test_update_company(self, db, sample_companies):
        """Test updating a company"""
        company_data = schemas.CompanyCreate(name="Updated Company")
        updated = crud.update_company(db, sample_companies[0].id, company_data)

        assert updated.name == "Updated Company"

    def test_delete_company(self, db, sample_companies):
        """Test deleting a company"""
        company_id = sample_companies[0].id
        result = crud.delete_company(db, company_id)

        assert result is True
        assert crud.get_company(db, company_id) is None


class TestTestCaseCRUD:
    """Tests for test case CRUD operations"""

    def test_get_test_cases_public_only(self, db, sample_question):
        """Test getting only public test cases"""
        test_cases = crud.get_test_cases(db, sample_question.id, public_only=True)

        assert all(
            tc.visibility
            in [TestCaseVisibilityEnum.PUBLIC, TestCaseVisibilityEnum.SAMPLE]
            for tc in test_cases
        )

    def test_get_test_cases_all(self, db, sample_question):
        """Test getting all test cases"""
        test_cases = crud.get_test_cases(db, sample_question.id, public_only=False)

        assert len(test_cases) >= 3  # We created 3 test cases

    def test_create_test_case(self, db, sample_question):
        """Test creating a test case"""
        tc_data = schemas.TestCaseCreate(
            input_data={"input": [1, 2]},
            expected_output=[1, 2],
            visibility=schemas.TestCaseVisibility.PRIVATE,
            order_index=10,
        )

        test_case = crud.create_test_case(db, sample_question.id, tc_data)

        assert test_case.id is not None
        assert test_case.question_id == sample_question.id
        assert test_case.visibility == TestCaseVisibilityEnum.PRIVATE

    def test_update_test_case(self, db, sample_question):
        """Test updating a test case"""
        test_cases = crud.get_test_cases(db, sample_question.id, public_only=False)
        tc_id = test_cases[0].id

        tc_data = schemas.TestCaseCreate(
            input_data={"input": [9, 9]},
            expected_output=[9, 9],
            visibility=schemas.TestCaseVisibility.PUBLIC,
            order_index=5,
        )

        updated = crud.update_test_case(db, tc_id, tc_data)

        assert updated.input_data == {"input": [9, 9]}
        assert updated.visibility == TestCaseVisibilityEnum.PUBLIC

    def test_delete_test_case(self, db, sample_question):
        """Test deleting a test case"""
        test_cases = crud.get_test_cases(db, sample_question.id, public_only=False)
        tc_id = test_cases[0].id

        result = crud.delete_test_case(db, tc_id)

        assert result is True
        assert crud.get_test_case(db, tc_id) is None


class TestUserProgressCRUD:
    """Tests for user progress CRUD operations"""

    def test_create_user_attempt(self, db, sample_question):
        """Test creating a user attempt"""
        attempt_data = schemas.UserAttemptCreate(
            question_id=sample_question.id,
            is_solved=True,
            runtime_ms=100,
            memory_mb=10.5,
        )

        attempt = crud.create_user_attempt(db, "user123", attempt_data)

        assert attempt.id is not None
        assert attempt.user_id == "user123"
        assert attempt.question_id == sample_question.id
        assert attempt.is_solved is True
        assert attempt.attempts_count == 1

    def test_update_existing_attempt(self, db, sample_question):
        """Test updating an existing attempt"""
        # Create first attempt
        attempt_data1 = schemas.UserAttemptCreate(
            question_id=sample_question.id,
            is_solved=False,
            runtime_ms=200,
        )
        crud.create_user_attempt(db, "user123", attempt_data1)

        # Create second attempt (should update existing)
        attempt_data2 = schemas.UserAttemptCreate(
            question_id=sample_question.id,
            is_solved=True,
            runtime_ms=100,
        )
        attempt = crud.create_user_attempt(db, "user123", attempt_data2)

        assert attempt.attempts_count == 2
        assert attempt.is_solved is True
        assert attempt.best_runtime_ms == 100  # Should update to better runtime

    def test_get_user_attempts(self, db, sample_question):
        """Test getting user attempts"""
        # Create some attempts
        for i in range(3):
            attempt_data = schemas.UserAttemptCreate(
                question_id=sample_question.id, is_solved=i == 2
            )
            crud.create_user_attempt(db, "user123", attempt_data)

        attempts = crud.get_user_attempts(db, "user123")
        assert len(attempts) >= 1

    def test_get_user_solved_questions(self, db, sample_questions):
        """Test getting user's solved questions"""
        # Solve some questions
        for i, q in enumerate(sample_questions[:2]):
            attempt_data = schemas.UserAttemptCreate(question_id=q.id, is_solved=True)
            crud.create_user_attempt(db, "user123", attempt_data)

        solved = crud.get_user_solved_questions(db, "user123")
        assert len(solved) == 2

    def test_get_user_stats(self, db, sample_questions):
        """Test getting user statistics"""
        # Create attempts for different difficulties
        for q in sample_questions:
            attempt_data = schemas.UserAttemptCreate(
                question_id=q.id, is_solved=q.difficulty == DifficultyEnum.EASY
            )
            crud.create_user_attempt(db, "user123", attempt_data)

        stats = crud.get_user_stats(db, "user123")

        assert stats.user_id == "user123"
        assert stats.total_attempted >= 3
        assert stats.total_solved >= 1
        assert stats.easy_solved >= 1


class TestAnalyticsCRUD:
    """Tests for analytics CRUD operations"""

    def test_get_question_stats(self, db, sample_question, sample_user_attempt):
        """Test getting question statistics"""
        stats = crud.get_question_stats(db, sample_question.id)

        assert stats is not None
        assert stats.question_id == sample_question.id
        assert stats.total_submissions >= 0
        assert stats.acceptance_rate >= 0

    def test_get_question_stats_not_found(self, db):
        """Test getting stats for non-existent question"""
        stats = crud.get_question_stats(db, 9999)
        assert stats is None

    def test_get_question_submissions(self, db, sample_question):
        """Test getting question submissions"""
        submissions = crud.get_question_submissions(db, sample_question.id)
        # Currently returns empty list (placeholder)
        assert isinstance(submissions, list)
