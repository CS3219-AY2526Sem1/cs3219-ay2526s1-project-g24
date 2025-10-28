"""
Integration tests for the Question Service API
Tests error handling, edge cases, and complex workflows
"""

import pytest


class TestErrorHandling:
    """Tests for error handling and validation"""

    def test_create_question_missing_required_fields(self, client):
        """Test creating question with missing fields"""
        invalid_data = {
            "title": "Missing Fields",
            # Missing description, difficulty, etc.
        }

        response = client.post("/api/questions", json=invalid_data)

        assert response.status_code == 422  # Validation error
        assert "detail" in response.json()

    def test_create_question_invalid_difficulty(self, client):
        """Test creating question with invalid difficulty"""
        invalid_data = {
            "title": "Invalid Difficulty",
            "description": "Test",
            "difficulty": "super_hard",  # Invalid value
            "code_templates": {},
            "function_signature": {},
        }

        response = client.post("/api/questions", json=invalid_data)

        assert response.status_code == 422

    def test_create_question_invalid_topic_id(self, client):
        """Test creating question with non-existent topic"""
        invalid_data = {
            "title": "Invalid Topic",
            "description": "Test",
            "difficulty": "easy",
            "code_templates": {"python": "def solution(): pass"},
            "function_signature": {
                "function_name": "solution",
                "arguments": [],
                "return_type": "void"
            },
            "topic_ids": [99999],  # Non-existent topic
            "test_cases": []
        }

        response = client.post("/api/questions", json=invalid_data)

        # Should fail with 400 or 404
        assert response.status_code in [400, 404]

    def test_create_question_invalid_company_id(self, client):
        """Test creating question with non-existent company"""
        invalid_data = {
            "title": "Invalid Company",
            "description": "Test",
            "difficulty": "easy",
            "code_templates": {"python": "def solution(): pass"},
            "function_signature": {
                "function_name": "solution",
                "arguments": [],
                "return_type": "void"
            },
            "company_ids": [99999],  # Non-existent company
            "test_cases": []
        }

        response = client.post("/api/questions", json=invalid_data)

        # Should fail with 400 or 404
        assert response.status_code in [400, 404]

    def test_update_question_invalid_data(self, client, sample_question):
        """Test updating question with invalid data"""
        invalid_data = {
            "difficulty": "invalid_difficulty",
        }

        response = client.put(
            f"/api/questions/{sample_question.id}", json=invalid_data
        )

        assert response.status_code == 422

    def test_pagination_invalid_page(self, client):
        """Test pagination with invalid page number"""
        response = client.get("/api/questions?page=-1")

        # Should either reject or default to page 1
        assert response.status_code in [200, 422]

    def test_pagination_invalid_page_size(self, client):
        """Test pagination with invalid page size"""
        response = client.get("/api/questions?page_size=0")

        # Should either reject or use default
        assert response.status_code in [200, 422]

    def test_sort_by_invalid_field(self, client):
        """Test sorting by invalid field"""
        response = client.get("/api/questions?sort_by=invalid_field")

        # Should either ignore or return error
        assert response.status_code in [200, 400]


class TestEdgeCases:
    """Tests for edge cases and boundary conditions"""

    def test_empty_database_list_questions(self, client, db):
        """Test listing questions when database is empty"""
        # Clear all questions
        from app.questions.models import Question

        db.query(Question).delete()
        db.commit()

        response = client.get("/api/questions")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["questions"]) == 0

    def test_empty_database_random_question(self, client, db):
        """Test getting random question from empty database"""
        from app.questions.models import Question

        db.query(Question).delete()
        db.commit()

        response = client.get("/api/questions/random")

        assert response.status_code == 404

    def test_large_page_number(self, client, sample_questions):
        """Test pagination with page number beyond available data"""
        response = client.get("/api/questions?page=1000&page_size=10")

        assert response.status_code == 200
        data = response.json()
        assert len(data["questions"]) == 0

    def test_search_no_results(self, client):
        """Test search with no matching results"""
        response = client.get("/api/questions?search=NonExistentQuestionXYZ123")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0

    def test_filter_no_results(self, client):
        """Test filter combination that returns no results"""
        response = client.get(
            "/api/questions?difficulties=easy&topic_ids=99999&company_ids=88888"
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0

    def test_similar_questions_no_shared_topics(self, client, db, sample_companies):
        """Test similar questions when question has no topics"""
        from app.questions.models import DifficultyEnum, Question

        # Create question with no topics
        question = Question(
            title="Isolated Question",
            description="No topics",
            difficulty=DifficultyEnum.EASY,
            code_templates={},
            function_signature={},
        )
        db.add(question)
        db.commit()

        response = client.get(f"/api/questions/{question.id}/similar")

        assert response.status_code == 200
        # Should return empty list or questions by difficulty only
        data = response.json()
        assert isinstance(data, list)

    def test_multiple_test_cases_same_order(self, client, sample_question):
        """Test creating test cases with same order_index"""
        tc1 = {
            "input_data": {"test": 1},
            "expected_output": 1,
            "visibility": "public",
            "order_index": 0,
        }
        tc2 = {
            "input_data": {"test": 2},
            "expected_output": 2,
            "visibility": "public",
            "order_index": 0,  # Same order
        }

        response1 = client.post(
            f"/api/questions/{sample_question.id}/test-cases", json=tc1
        )
        response2 = client.post(
            f"/api/questions/{sample_question.id}/test-cases", json=tc2
        )

        # Both should succeed (no unique constraint on order_index)
        assert response1.status_code == 201
        assert response2.status_code == 201


class TestComplexWorkflows:
    """Tests for complex multi-step workflows"""

    def test_complete_question_lifecycle(
        self, client, sample_topics, sample_companies
    ):
        """Test creating, updating, and deleting a question with all relationships"""
        # Create question
        create_data = {
            "title": "Lifecycle Test",
            "description": "Testing full lifecycle",
            "difficulty": "medium",
            "code_templates": {"python": "def solution(): pass"},
            "function_signature": {
                "function_name": "solution",
                "arguments": [],
                "return_type": "void"
            },
            "topic_ids": [sample_topics[0].id],
            "company_ids": [sample_companies[0].id],
            "test_cases": [
                {
                    "input_data": {"test": 1},
                    "expected_output": 1,
                    "visibility": "sample",
                    "order_index": 0,
                }
            ],
        }

        create_response = client.post("/api/questions", json=create_data)
        assert create_response.status_code == 201
        question = create_response.json()
        question_id = question["id"]

        # Update question
        update_data = {
            "title": "Updated Lifecycle Test",
            "difficulty": "hard",
            "topic_ids": [sample_topics[1].id],  # Change topic
        }

        update_response = client.put(f"/api/questions/{question_id}", json=update_data)
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated["title"] == "Updated Lifecycle Test"
        assert updated["difficulty"] == "hard"

        # Add more test cases
        new_tc = {
            "input_data": {"test": 2},
            "expected_output": 2,
            "visibility": "public",
            "order_index": 1,
        }
        tc_response = client.post(
            f"/api/questions/{question_id}/test-cases", json=new_tc
        )
        assert tc_response.status_code == 201

        # Delete question
        delete_response = client.delete(f"/api/questions/{question_id}")
        assert delete_response.status_code == 204

        # Verify deletion
        get_response = client.get(f"/api/questions/{question_id}")
        assert get_response.status_code == 404

    def test_user_solving_multiple_questions(
        self, client, sample_questions, sample_question
    ):
        """Test user solving multiple questions"""
        user_id = "multi_solver"

        # Solve first question
        submit1 = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def solution(): return [0, 1]",
        }

        response1 = client.post(
            f"/api/questions/{sample_question.id}/submit?user_id={user_id}",
            json=submit1,
        )
        assert response1.status_code == 200

        # Solve second question
        if len(sample_questions) > 1:
            question2 = sample_questions[1]
            submit2 = {
                "question_id": question2.id,
                "language": "python",
                "code": "def solution(): pass",
            }

            response2 = client.post(
                f"/api/questions/{question2.id}/submit?user_id={user_id}", json=submit2
            )
            assert response2.status_code == 200

        # Check user stats
        stats = client.get(f"/api/users/{user_id}/stats").json()
        assert stats["total_submissions"] >= 2

    def test_filter_and_pagination_combined(self, client, sample_questions):
        """Test combining filters with pagination"""
        response = client.get(
            "/api/questions?difficulties=easy,medium&page=1&page_size=5&sort_by=title&sort_order=asc"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["questions"]) <= 5
        for q in data["questions"]:
            assert q["difficulty"] in ["easy", "medium"]

    def test_concurrent_user_attempts(self, client, sample_question):
        """Test multiple users attempting same question"""
        users = ["user_a", "user_b", "user_c"]

        for user in users:
            submit_data = {
                "question_id": sample_question.id,
                "language": "python",
                "code": f"# Code by {user}",
            }

            response = client.post(
                f"/api/questions/{sample_question.id}/submit?user_id={user}",
                json=submit_data,
            )
            assert response.status_code == 200

        # Check question stats
        stats = client.get(f"/api/questions/{sample_question.id}/stats").json()
        assert stats["total_submissions"] >= len(users)

        # Each user should have independent attempts
        for user in users:
            user_attempts = client.get(f"/api/users/{user}/attempts").json()
            assert any(a["question_id"] == sample_question.id for a in user_attempts)


class TestDataConsistency:
    """Tests for data consistency and integrity"""

    def test_question_stats_consistency(self, client, sample_question):
        """Test that question stats are consistent with user attempts"""
        user_id = "stats_test_user"

        # Submit multiple times
        for i in range(3):
            submit_data = {
                "question_id": sample_question.id,
                "language": "python",
                "code": f"# Attempt {i}",
            }
            client.post(
                f"/api/questions/{sample_question.id}/submit?user_id={user_id}",
                json=submit_data,
            )

        # Check stats
        stats = client.get(f"/api/questions/{sample_question.id}/stats").json()
        
        # Check that stats exist and have reasonable values from question model
        assert "total_submissions" in stats
        assert "total_accepted" in stats
        assert "acceptance_rate" in stats
        assert stats["question_id"] == sample_question.id

    def test_user_stats_consistency(self, client, sample_question):
        """Test that user stats are consistent with attempts"""
        user_id = "consistency_user"

        # Make attempts
        for i in range(2):
            submit_data = {
                "question_id": sample_question.id,
                "language": "python",
                "code": f"# Attempt {i}",
            }
            client.post(
                f"/api/questions/{sample_question.id}/submit?user_id={user_id}",
                json=submit_data,
            )

        # Get stats and attempts
        stats = client.get(f"/api/users/{user_id}/stats").json()
        attempts = client.get(f"/api/users/{user_id}/attempts").json()

        # Total submissions should be sum of all attempts_count
        expected_submissions = sum(a["attempts_count"] for a in attempts)
        assert stats["total_submissions"] == expected_submissions

    def test_topic_question_count_after_deletion(
        self, client, sample_question, sample_topics
    ):
        """Test that topic question count updates after question deletion"""
        # Add topic to question
        update_data = {"topic_ids": [sample_topics[0].id]}
        client.put(f"/api/questions/{sample_question.id}", json=update_data)

        # Get initial count
        topic_before = client.get(f"/api/topics/{sample_topics[0].id}").json()
        count_before = topic_before["question_count"]

        # Delete question
        client.delete(f"/api/questions/{sample_question.id}")

        # Get updated count
        topic_after = client.get(f"/api/topics/{sample_topics[0].id}").json()
        count_after = topic_after["question_count"]

        # Count should decrease
        assert count_after == count_before - 1
