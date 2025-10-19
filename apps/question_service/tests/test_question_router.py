"""
API endpoint tests for question routes
"""

import pytest

from app.questions import schemas


class TestQuestionEndpoints:
    """Tests for question CRUD endpoints"""

    def test_list_questions(self, client, sample_questions):
        """Test GET /api/questions"""
        response = client.get("/api/questions")

        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert "total" in data
        assert "page" in data
        assert len(data["questions"]) > 0

    def test_list_questions_with_difficulty_filter(self, client, sample_questions):
        """Test filtering by difficulty"""
        response = client.get("/api/questions?difficulties=easy")

        assert response.status_code == 200
        data = response.json()
        for q in data["questions"]:
            assert q["difficulty"] == "easy"

    def test_list_questions_with_multiple_difficulties(self, client, sample_questions):
        """Test filtering by multiple difficulties"""
        response = client.get("/api/questions?difficulties=easy,medium")

        assert response.status_code == 200
        data = response.json()
        for q in data["questions"]:
            assert q["difficulty"] in ["easy", "medium"]

    def test_list_questions_with_topic_filter(
        self, client, sample_questions, sample_topics
    ):
        """Test filtering by topic"""
        topic_id = sample_topics[0].id
        response = client.get(f"/api/questions?topic_ids={topic_id}")

        assert response.status_code == 200
        data = response.json()
        for q in data["questions"]:
            topic_ids = [t["id"] for t in q["topics"]]
            assert topic_id in topic_ids

    def test_list_questions_with_company_filter(
        self, client, sample_questions, sample_companies
    ):
        """Test filtering by company"""
        company_id = sample_companies[0].id
        response = client.get(f"/api/questions?company_ids={company_id}")

        assert response.status_code == 200
        data = response.json()
        for q in data["questions"]:
            company_ids = [c["id"] for c in q["companies"]]
            assert company_id in company_ids

    def test_list_questions_with_search(self, client, sample_questions):
        """Test search functionality"""
        response = client.get("/api/questions?search=Reverse")

        assert response.status_code == 200
        data = response.json()
        for q in data["questions"]:
            assert "Reverse" in q["title"]

    def test_list_questions_pagination(self, client, sample_questions):
        """Test pagination"""
        response = client.get("/api/questions?page=1&page_size=2")

        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 2
        assert len(data["questions"]) <= 2

    def test_list_questions_sorting(self, client, sample_questions):
        """Test sorting"""
        response = client.get("/api/questions?sort_by=title&sort_order=asc")

        assert response.status_code == 200
        data = response.json()
        titles = [q["title"] for q in data["questions"]]
        assert titles == sorted(titles)

    def test_get_question_detail(self, client, sample_question):
        """Test GET /api/questions/{id}"""
        response = client.get(f"/api/questions/{sample_question.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_question.id
        assert data["title"] == sample_question.title
        assert "sample_test_cases" in data
        assert "topics" in data
        assert "companies" in data

    def test_get_question_not_found(self, client):
        """Test getting non-existent question"""
        response = client.get("/api/questions/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_create_question(self, client, sample_topics, sample_companies):
        """Test POST /api/questions"""
        question_data = {
            "title": "New Test Question",
            "description": "Test description",
            "difficulty": "easy",
            "code_templates": {"python": "def solution():\n    pass"},
            "function_signature": {
                "function_name": "solution",
                "arguments": [],
                "return_type": "void"
            },
            "topic_ids": [sample_topics[0].id],
            "company_ids": [sample_companies[0].id],
            "test_cases": [
                {
                    "input_data": {"input": [1, 2, 3]},
                    "expected_output": [1, 2, 3],
                    "visibility": "sample",
                    "order_index": 0,
                }
            ],
        }

        response = client.post("/api/questions", json=question_data)

        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Test Question"
        assert len(data["topics"]) == 1

    def test_update_question(self, client, sample_question):
        """Test PUT /api/questions/{id}"""
        update_data = {
            "title": "Updated Title",
            "difficulty": "medium",
        }

        response = client.put(
            f"/api/questions/{sample_question.id}", json=update_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["difficulty"] == "medium"

    def test_update_question_not_found(self, client):
        """Test updating non-existent question"""
        update_data = {"title": "Updated"}
        response = client.put("/api/questions/9999", json=update_data)

        assert response.status_code == 404

    def test_delete_question(self, client, sample_question):
        """Test DELETE /api/questions/{id}"""
        response = client.delete(f"/api/questions/{sample_question.id}")

        assert response.status_code == 204

        # Verify deletion
        get_response = client.get(f"/api/questions/{sample_question.id}")
        assert get_response.status_code == 404

    def test_delete_question_not_found(self, client):
        """Test deleting non-existent question"""
        response = client.delete("/api/questions/9999")

        assert response.status_code == 404


class TestQuestionDiscoveryEndpoints:
    """Tests for question discovery endpoints"""

    def test_get_random_question(self, client, sample_questions):
        """Test GET /api/questions/random"""
        response = client.get("/api/questions/random")

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "title" in data

    def test_get_random_question_with_filters(self, client, sample_questions):
        """Test random question with difficulty filter"""
        response = client.get("/api/questions/random?difficulties=easy")

        assert response.status_code == 200
        data = response.json()
        assert data["difficulty"] == "easy"

    def test_get_daily_question(self, client, sample_questions):
        """Test GET /api/questions/daily"""
        response = client.get("/api/questions/daily")

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "title" in data

        # Should be deterministic
        response2 = client.get("/api/questions/daily")
        data2 = response2.json()
        assert data["id"] == data2["id"]

    def test_get_similar_questions(self, client, sample_question, sample_questions):
        """Test GET /api/questions/{id}/similar"""
        response = client.get(f"/api/questions/{sample_question.id}/similar")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should not include the original question
        assert all(q["id"] != sample_question.id for q in data)

    def test_get_similar_questions_with_limit(self, client, sample_question):
        """Test similar questions with limit parameter"""
        response = client.get(f"/api/questions/{sample_question.id}/similar?limit=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2


class TestTestCaseEndpoints:
    """Tests for test case endpoints"""

    def test_get_test_cases(self, client, sample_question):
        """Test GET /api/questions/{id}/test-cases"""
        response = client.get(f"/api/questions/{sample_question.id}/test-cases")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should only return public/sample cases
        for tc in data:
            assert "input_data" in tc
            assert "expected_output" in tc
            assert "id" not in tc  # Public endpoint shouldn't expose IDs

    def test_create_test_case(self, client, sample_question):
        """Test POST /api/questions/{id}/test-cases"""
        tc_data = {
            "input_data": {"nums": [1, 2, 3], "target": 3},
            "expected_output": [0, 2],
            "visibility": "private",
            "order_index": 10,
        }

        response = client.post(
            f"/api/questions/{sample_question.id}/test-cases", json=tc_data
        )

        assert response.status_code == 201
        data = response.json()
        assert data["question_id"] == sample_question.id
        assert data["visibility"] == "private"

    def test_update_test_case(self, client, sample_question):
        """Test PUT /api/test-cases/{id}"""
        # First get a test case
        test_cases_response = client.get(
            f"/api/questions/{sample_question.id}/test-cases"
        )
        # We need to create one with admin access since public endpoint doesn't return IDs
        tc_create_response = client.post(
            f"/api/questions/{sample_question.id}/test-cases",
            json={
                "input_data": {"test": 1},
                "expected_output": 1,
                "visibility": "public",
                "order_index": 0,
            },
        )
        tc_id = tc_create_response.json()["id"]

        update_data = {
            "input_data": {"updated": 2},
            "expected_output": 2,
            "visibility": "sample",
            "order_index": 5,
        }

        response = client.put(f"/api/test-cases/{tc_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["input_data"] == {"updated": 2}
        assert data["visibility"] == "sample"

    def test_delete_test_case(self, client, sample_question):
        """Test DELETE /api/test-cases/{id}"""
        # Create a test case first
        tc_create_response = client.post(
            f"/api/questions/{sample_question.id}/test-cases",
            json={
                "input_data": {"test": 1},
                "expected_output": 1,
                "visibility": "public",
                "order_index": 0,
            },
        )
        tc_id = tc_create_response.json()["id"]

        response = client.delete(f"/api/test-cases/{tc_id}")

        assert response.status_code == 204


class TestCodeExecutionEndpoints:
    """Tests for code execution endpoints"""

    def test_run_code(self, client, sample_question):
        """Test POST /api/questions/{id}/run"""
        run_data = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def solution():\n    return [0, 1]",
        }

        response = client.post(f"/api/questions/{sample_question.id}/run", json=run_data)

        # If it fails, the error detail will be in the assertion message
        assert response.status_code == 200, f"Error: {response.text}"
        data = response.json()
        assert "results" in data
        assert "total_test_cases" in data
        assert "passed_test_cases" in data
        assert data["question_id"] == sample_question.id

    def test_submit_solution(self, client, sample_question):
        """Test POST /api/questions/{id}/submit"""
        submit_data = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def twoSum(nums, target):\n    return [0, 1]",
        }

        response = client.post(
            f"/api/questions/{sample_question.id}/submit?user_id=test_user",
            json=submit_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert "submission_id" in data
        assert "status" in data
        assert "passed_test_cases" in data
        assert "total_test_cases" in data

    def test_submit_solution_requires_user_id(self, client, sample_question):
        """Test that submit requires user_id parameter"""
        submit_data = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def solution():\n    pass",
        }

        response = client.post(
            f"/api/questions/{sample_question.id}/submit", json=submit_data
        )

        assert response.status_code == 422  # Missing required parameter


class TestAnalyticsEndpoints:
    """Tests for analytics endpoints"""

    def test_get_question_stats(self, client, sample_question):
        """Test GET /api/questions/{id}/stats"""
        response = client.get(f"/api/questions/{sample_question.id}/stats")

        assert response.status_code == 200
        data = response.json()
        assert "question_id" in data
        assert "total_submissions" in data
        assert "acceptance_rate" in data

    def test_get_question_stats_not_found(self, client):
        """Test stats for non-existent question"""
        response = client.get("/api/questions/9999/stats")

        assert response.status_code == 404

    def test_get_question_submissions(self, client, sample_question):
        """Test GET /api/questions/{id}/submissions"""
        response = client.get(f"/api/questions/{sample_question.id}/submissions")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
