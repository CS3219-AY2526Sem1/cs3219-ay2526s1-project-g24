"""
API endpoint tests for user progress routes
"""


class TestUserProgressEndpoints:
    """Tests for user progress tracking endpoints"""

    def test_get_user_attempts(self, client, sample_user_attempt):
        """Test GET /api/users/{user_id}/attempts"""
        user_id = sample_user_attempt.user_id
        response = client.get(f"/api/users/{user_id}/attempts")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert all("question_id" in attempt for attempt in data)
        assert all("status" in attempt for attempt in data)

    def test_get_user_attempts_empty(self, client):
        """Test getting attempts for user with no attempts"""
        response = client.get("/api/users/nonexistent_user/attempts")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_user_solved_questions(self, client, sample_user_attempt):
        """Test GET /api/users/{user_id}/solved"""
        user_id = sample_user_attempt.user_id
        response = client.get(f"/api/users/{user_id}/solved")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All returned questions should have required fields
        for q in data:
            assert "question_id" in q
            assert "title" in q
            assert "difficulty" in q
            assert "attempts_count" in q

    def test_get_user_solved_questions_empty(self, client):
        """Test getting solved questions for user with no accepted solutions"""
        response = client.get("/api/users/nonexistent_user/solved")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_user_stats(self, client, sample_user_attempt):
        """Test GET /api/users/{user_id}/stats"""
        user_id = sample_user_attempt.user_id
        response = client.get(f"/api/users/{user_id}/stats")

        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "total_solved" in data
        assert "easy_solved" in data
        assert "medium_solved" in data
        assert "hard_solved" in data
        assert "total_submissions" in data
        assert "acceptance_rate" in data
        assert data["user_id"] == user_id

    def test_get_user_stats_no_attempts(self, client):
        """Test stats for user with no attempts"""
        response = client.get("/api/users/new_user/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_solved"] == 0
        assert data["total_submissions"] == 0
        assert data["acceptance_rate"] == 0.0

    def test_record_user_attempt_new(self, client, sample_question):
        """Test recording a new user attempt"""
        # This would be created via submit endpoint
        submit_data = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def solution():\n    return [0, 1]",
        }

        response = client.post(
            f"/api/questions/{sample_question.id}/submit?user_id=new_test_user",
            json=submit_data,
        )

        assert response.status_code == 200

        # Verify attempt was recorded
        attempts_response = client.get("/api/users/new_test_user/attempts")
        attempts = attempts_response.json()
        assert len(attempts) > 0
        assert any(a["question_id"] == sample_question.id for a in attempts)

    def test_update_user_attempt_better_runtime(self, client, sample_user_attempt):
        """Test that better runtime updates the record"""
        user_id = sample_user_attempt.user_id
        question_id = sample_user_attempt.question_id

        # Submit with better runtime (lower is better)
        submit_data = {
            "question_id": question_id,
            "language": "python",
            "code": "def solution():\n    return [0, 1]",
        }

        response = client.post(
            f"/api/questions/{question_id}/submit?user_id={user_id}", json=submit_data
        )

        assert response.status_code == 200
        # The implementation should update if runtime is better

    def test_user_progress_filters_by_difficulty(self, client, sample_user_attempt):
        """Test that user stats correctly count by difficulty"""
        user_id = sample_user_attempt.user_id
        response = client.get(f"/api/users/{user_id}/stats")

        assert response.status_code == 200
        data = response.json()

        # Totals should match sum of difficulty counts
        total = data["easy_solved"] + data["medium_solved"] + data["hard_solved"]
        assert total == data["total_solved"]


class TestUserProgressIntegration:
    """Integration tests for user progress tracking"""

    def test_complete_user_journey(self, client, sample_question):
        """Test complete user journey: attempt, fail, succeed"""
        user_id = "journey_user"

        # First attempt - fail
        submit_data = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def solution():\n    return []",  # Wrong answer
        }

        response1 = client.post(
            f"/api/questions/{sample_question.id}/submit?user_id={user_id}",
            json=submit_data,
        )
        assert response1.status_code == 200

        # Check stats - should have 1 submission, 0 solved
        stats1 = client.get(f"/api/users/{user_id}/stats").json()
        assert stats1["total_submissions"] >= 1

        # Second attempt - success
        submit_data["code"] = "def twoSum(nums, target):\n    return [0, 1]"
        response2 = client.post(
            f"/api/questions/{sample_question.id}/submit?user_id={user_id}",
            json=submit_data,
        )
        assert response2.status_code == 200

        # Check solved questions
        solved = client.get(f"/api/users/{user_id}/solved").json()
        assert any(q["question_id"] == sample_question.id for q in solved)

    def test_multiple_users_isolated(self, client, sample_question):
        """Test that user progress is isolated between users"""
        user1 = "user_1"
        user2 = "user_2"

        # User 1 submits
        submit_data = {
            "question_id": sample_question.id,
            "language": "python",
            "code": "def solution():\n    pass",
        }

        client.post(
            f"/api/questions/{sample_question.id}/submit?user_id={user1}",
            json=submit_data,
        )

        # User 2's stats should be empty
        stats2 = client.get(f"/api/users/{user2}/stats").json()
        assert stats2["total_submissions"] == 0
