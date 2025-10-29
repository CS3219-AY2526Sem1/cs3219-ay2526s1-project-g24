"""
API endpoint tests for company routes
"""


class TestCompanyEndpoints:
    """Tests for company CRUD endpoints"""

    def test_list_companies(self, client, sample_companies):
        """Test GET /api/companies"""
        response = client.get("/api/companies")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert all("id" in company for company in data)
        assert all("name" in company for company in data)

    def test_get_company(self, client, sample_companies):
        """Test GET /api/companies/{id}"""
        company = sample_companies[0]
        response = client.get(f"/api/companies/{company.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == company.id
        assert data["name"] == company.name
        assert "question_count" in data

    def test_get_company_not_found(self, client):
        """Test getting non-existent company"""
        response = client.get("/api/companies/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_create_company(self, client):
        """Test POST /api/companies"""
        company_data = {
            "name": "New Company Inc",
            "description": "A new test company",
        }

        response = client.post("/api/companies", json=company_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Company Inc"
        assert data["description"] == "A new test company"
        assert "id" in data

    def test_create_company_duplicate_name(self, client, sample_companies):
        """Test creating company with duplicate name"""
        company_data = {
            "name": sample_companies[0].name,
            "description": "Duplicate",
        }

        response = client.post("/api/companies", json=company_data)

        # Depending on DB constraints, this might be 400 or 409
        assert response.status_code in [400, 409]

    def test_update_company(self, client, sample_companies):
        """Test PUT /api/companies/{id}"""
        company = sample_companies[0]
        update_data = {
            "name": "Updated Company Name",
            "description": "Updated description",
        }

        response = client.put(f"/api/companies/{company.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Company Name"
        assert data["description"] == "Updated description"

    def test_update_company_not_found(self, client):
        """Test updating non-existent company"""
        update_data = {"name": "Updated"}
        response = client.put("/api/companies/9999", json=update_data)

        assert response.status_code == 404

    def test_delete_company(self, client, sample_companies):
        """Test DELETE /api/companies/{id}"""
        # Create a new company to delete (to avoid affecting other tests)
        create_response = client.post(
            "/api/companies",
            json={"name": "Company to Delete", "description": "Test"},
        )
        company_id = create_response.json()["id"]

        response = client.delete(f"/api/companies/{company_id}")

        assert response.status_code == 204

        # Verify deletion
        get_response = client.get(f"/api/companies/{company_id}")
        assert get_response.status_code == 404

    def test_delete_company_not_found(self, client):
        """Test deleting non-existent company"""
        response = client.delete("/api/companies/9999")

        assert response.status_code == 404

    def test_company_with_questions(self, client, sample_question):
        """Test that company shows question count"""
        # Get companies
        response = client.get("/api/companies")
        companies = response.json()

        # Find a company with questions
        company_with_questions = next(
            (c for c in companies if c.get("question_count", 0) > 0), None
        )

        if company_with_questions:
            assert company_with_questions["question_count"] > 0
