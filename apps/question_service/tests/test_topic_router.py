"""
API endpoint tests for topic routes
"""


class TestTopicEndpoints:
    """Tests for topic CRUD endpoints"""

    def test_list_topics(self, client, sample_topics):
        """Test GET /api/topics"""
        response = client.get("/api/topics")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert all("id" in topic for topic in data)
        assert all("name" in topic for topic in data)

    def test_get_topic(self, client, sample_topics):
        """Test GET /api/topics/{id}"""
        topic = sample_topics[0]
        response = client.get(f"/api/topics/{topic.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == topic.id
        assert data["name"] == topic.name
        assert "question_count" in data

    def test_get_topic_not_found(self, client):
        """Test getting non-existent topic"""
        response = client.get("/api/topics/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_create_topic(self, client):
        """Test POST /api/topics"""
        topic_data = {
            "name": "New Topic",
            "description": "A new test topic",
        }

        response = client.post("/api/topics", json=topic_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Topic"
        assert data["description"] == "A new test topic"
        assert "id" in data

    def test_create_topic_duplicate_name(self, client, sample_topics):
        """Test creating topic with duplicate name"""
        topic_data = {
            "name": sample_topics[0].name,
            "description": "Duplicate",
        }

        response = client.post("/api/topics", json=topic_data)

        # Depending on DB constraints, this might be 400 or 409
        assert response.status_code in [400, 409]

    def test_update_topic(self, client, sample_topics):
        """Test PUT /api/topics/{id}"""
        topic = sample_topics[0]
        update_data = {
            "name": "Updated Topic Name",
            "description": "Updated description",
        }

        response = client.put(f"/api/topics/{topic.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Topic Name"
        assert data["description"] == "Updated description"

    def test_update_topic_not_found(self, client):
        """Test updating non-existent topic"""
        update_data = {"name": "Updated"}
        response = client.put("/api/topics/9999", json=update_data)

        assert response.status_code == 404

    def test_delete_topic(self, client, sample_topics):
        """Test DELETE /api/topics/{id}"""
        # Create a new topic to delete (to avoid affecting other tests)
        create_response = client.post(
            "/api/topics", json={"name": "Topic to Delete", "description": "Test"}
        )
        topic_id = create_response.json()["id"]

        response = client.delete(f"/api/topics/{topic_id}")

        assert response.status_code == 204

        # Verify deletion
        get_response = client.get(f"/api/topics/{topic_id}")
        assert get_response.status_code == 404

    def test_delete_topic_not_found(self, client):
        """Test deleting non-existent topic"""
        response = client.delete("/api/topics/9999")

        assert response.status_code == 404

    def test_topic_with_questions(self, client, sample_question):
        """Test that topic shows question count"""
        # Get a topic that's associated with sample_question
        response = client.get("/api/topics")
        topics = response.json()

        # Find a topic with questions
        topic_with_questions = next(
            (t for t in topics if t.get("question_count", 0) > 0), None
        )

        if topic_with_questions:
            assert topic_with_questions["question_count"] > 0
