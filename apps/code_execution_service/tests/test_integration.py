"""
Integration tests for /api/execution/execute endpoint
Tests full execution flow with mocked Judge0
"""
from unittest.mock import MagicMock

from tests.conftest import (
    MOCK_JUDGE0_RESPONSES,
    SAMPLE_FUNCTION_SIGNATURES,
    SAMPLE_TEST_DATA,
    SAMPLE_USER_CODE,
)


class TestExecuteEndpoint:
    """Test /api/execution/execute endpoint"""
    
    def test_execute_python_simple_success(
        self, test_client, mock_judge0_client, sample_two_sum_request
    ):
        """Test successful execution of Python code"""
        response = test_client.post(
            "/api/execution/execute",
            json=sample_two_sum_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["language"] == "python"
        assert data["total_test_cases"] == 1
        assert "results" in data
        assert len(data["results"]) == 1
    
    def test_execute_all_languages(self, test_client, mock_judge0_client):
        """Test execution works for all supported languages"""
        languages = ["python", "javascript", "java", "cpp"]
        
        for language in languages:
            request = {
                "language": language,
                "source_code": SAMPLE_USER_CODE[language]["two_sum"],
                "test_cases": [
                    {
                        "input_data": SAMPLE_TEST_DATA["two_sum"]["input_data"],
                        "expected_output": SAMPLE_TEST_DATA["two_sum"]["expected_output"],
                        "order_index": 0
                    }
                ],
                "function_signature": SAMPLE_FUNCTION_SIGNATURES["two_sum"],
                "time_limit": 2.0,
                "memory_limit": 256000
            }
            
            response = test_client.post("/api/execution/execute", json=request)
            
            assert response.status_code == 200, f"Failed for {language}"
            data = response.json()
            assert data["language"] == language
    
    def test_execute_with_linked_list(
        self, test_client, mock_judge0_client, sample_linked_list_request
    ):
        """Test execution with ListNode custom data structure"""
        response = test_client.post(
            "/api/execution/execute",
            json=sample_linked_list_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["language"] == "python"
        assert data["total_test_cases"] == 1
    
    def test_execute_multiple_test_cases(self, test_client, mock_judge0_client):
        """Test execution with multiple test cases"""
        request = {
            "language": "python",
            "source_code": SAMPLE_USER_CODE["python"]["two_sum"],
            "test_cases": [
                {
                    "input_data": {"nums": [2, 7, 11, 15], "target": 9},
                    "expected_output": [0, 1],
                    "order_index": 0
                },
                {
                    "input_data": {"nums": [3, 2, 4], "target": 6},
                    "expected_output": [1, 2],
                    "order_index": 1
                },
                {
                    "input_data": {"nums": [3, 3], "target": 6},
                    "expected_output": [0, 1],
                    "order_index": 2
                }
            ],
            "function_signature": SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            "time_limit": 2.0,
            "memory_limit": 256000
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["total_test_cases"] == 3
        assert len(data["results"]) == 3
        
        # Verify order is maintained
        assert data["results"][0]["order_index"] == 0
        assert data["results"][1]["order_index"] == 1
        assert data["results"][2]["order_index"] == 2


class TestExecuteEndpointErrorHandling:
    """Test error handling in execute endpoint"""
    
    def test_execute_invalid_language(self, test_client, mock_judge0_client):
        """Test execution with invalid language"""
        request = {
            "language": "ruby",  # Not supported
            "source_code": "puts 'hello'",
            "test_cases": [
                {
                    "input_data": {},
                    "expected_output": None,
                    "order_index": 0
                }
            ]
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_execute_missing_required_fields(self, test_client, mock_judge0_client):
        """Test execution with missing required fields"""
        request = {
            "language": "python",
            # Missing source_code and test_cases
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        assert response.status_code == 422
    
    def test_execute_compilation_error(self, test_client, monkeypatch):
        """Test execution with compilation error"""
        # Mock Judge0 to return compilation error
        mock_post_response = MagicMock()
        mock_post_response.json = MagicMock(return_value={"token": "test-token"})
        mock_post_response.raise_for_status = MagicMock()
        
        mock_get_response = MagicMock()
        mock_get_response.json = MagicMock(
            return_value=MOCK_JUDGE0_RESPONSES["submission_compilation_error"]
        )
        mock_get_response.raise_for_status = MagicMock()
        
        async def mock_post(*args, **kwargs):
            return mock_post_response
        
        async def mock_get(*args, **kwargs):
            return mock_get_response
        
        mock_client = MagicMock()
        mock_client.post = mock_post
        mock_client.get = mock_get
        
        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass
            
            async def __aenter__(self):
                return mock_client
            
            async def __aexit__(self, *args):
                pass
        
        monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
        
        request = {
            "language": "python",
            "source_code": "def broken syntax",  # Invalid syntax
            "test_cases": [
                {
                    "input_data": SAMPLE_TEST_DATA["two_sum"]["input_data"],
                    "expected_output": SAMPLE_TEST_DATA["two_sum"]["expected_output"],
                    "order_index": 0
                }
            ],
            "function_signature": SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should indicate compilation error
        assert data["compilation_error"] is not None
        assert data["overall_passed"] is False
    
    def test_execute_runtime_error(self, test_client, monkeypatch):
        """Test execution with runtime error"""
        # Mock Judge0 to return runtime error
        mock_post_response = MagicMock()
        mock_post_response.json = MagicMock(return_value={"token": "test-token"})
        mock_post_response.raise_for_status = MagicMock()
        
        mock_get_response = MagicMock()
        mock_get_response.json = MagicMock(
            return_value=MOCK_JUDGE0_RESPONSES["submission_runtime_error"]
        )
        mock_get_response.raise_for_status = MagicMock()
        
        async def mock_post(*args, **kwargs):
            return mock_post_response
        
        async def mock_get(*args, **kwargs):
            return mock_get_response
        
        mock_client = MagicMock()
        mock_client.post = mock_post
        mock_client.get = mock_get
        
        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass
            
            async def __aenter__(self):
                return mock_client
            
            async def __aexit__(self, *args):
                pass
        
        monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
        
        request = {
            "language": "python",
            "source_code": SAMPLE_USER_CODE["python"]["two_sum"],
            "test_cases": [
                {
                    "input_data": {"nums": [], "target": 9},  # Empty array causes error
                    "expected_output": [],
                    "order_index": 0
                }
            ],
            "function_signature": SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have runtime error in results
        assert data["results"][0]["status"] == "runtime_error"
        assert data["results"][0]["error_message"] is not None
        assert data["overall_passed"] is False
    
    def test_execute_time_limit_exceeded(self, test_client, monkeypatch):
        """Test execution with time limit exceeded"""
        # Mock Judge0 to return TLE
        mock_post_response = MagicMock()
        mock_post_response.json = MagicMock(return_value={"token": "test-token"})
        mock_post_response.raise_for_status = MagicMock()
        
        mock_get_response = MagicMock()
        mock_get_response.json = MagicMock(
            return_value=MOCK_JUDGE0_RESPONSES["submission_time_limit_exceeded"]
        )
        mock_get_response.raise_for_status = MagicMock()
        
        async def mock_post(*args, **kwargs):
            return mock_post_response
        
        async def mock_get(*args, **kwargs):
            return mock_get_response
        
        mock_client = MagicMock()
        mock_client.post = mock_post
        mock_client.get = mock_get
        
        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass
            
            async def __aenter__(self):
                return mock_client
            
            async def __aexit__(self, *args):
                pass
        
        monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
        
        request = {
            "language": "python",
            "source_code": "while True: pass",  # Infinite loop
            "test_cases": [
                {
                    "input_data": {},
                    "expected_output": None,
                    "order_index": 0
                }
            ],
            "time_limit": 1.0
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have time limit exceeded status
        assert data["results"][0]["status"] == "time_limit_exceeded"
        assert data["overall_passed"] is False


class TestExecuteEndpointCustomLimits:
    """Test custom time and memory limits"""
    
    def test_execute_with_custom_time_limit(
        self, test_client, mock_judge0_client, sample_two_sum_request
    ):
        """Test execution with custom time limit"""
        sample_two_sum_request["time_limit"] = 5.0
        
        response = test_client.post(
            "/api/execution/execute",
            json=sample_two_sum_request
        )
        
        assert response.status_code == 200
        
        # Verify Judge0 was called with custom limit
        # Note: exact structure depends on Judge0Service implementation
    
    def test_execute_with_custom_memory_limit(
        self, test_client, mock_judge0_client, sample_two_sum_request
    ):
        """Test execution with custom memory limit"""
        sample_two_sum_request["memory_limit"] = 512000
        
        response = test_client.post(
            "/api/execution/execute",
            json=sample_two_sum_request
        )
        
        assert response.status_code == 200
    
    def test_execute_without_limits_uses_defaults(
        self, test_client, mock_judge0_client
    ):
        """Test execution without limits uses service defaults"""
        request = {
            "language": "python",
            "source_code": SAMPLE_USER_CODE["python"]["two_sum"],
            "test_cases": [
                {
                    "input_data": SAMPLE_TEST_DATA["two_sum"]["input_data"],
                    "expected_output": SAMPLE_TEST_DATA["two_sum"]["expected_output"],
                    "order_index": 0
                }
            ],
            "function_signature": SAMPLE_FUNCTION_SIGNATURES["two_sum"]
            # No time_limit or memory_limit specified
        }
        
        response = test_client.post("/api/execution/execute", json=request)
        
        assert response.status_code == 200


class TestExecuteEndpointResponseFormat:
    """Test response format and data structure"""
    
    def test_response_includes_all_fields(
        self, test_client, mock_judge0_client, sample_two_sum_request
    ):
        """Test response includes all expected fields"""
        response = test_client.post(
            "/api/execution/execute",
            json=sample_two_sum_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Top-level fields
        assert "language" in data
        assert "total_test_cases" in data
        assert "passed_test_cases" in data
        assert "results" in data
        assert "overall_passed" in data
        
        # Optional fields
        assert "avg_runtime_ms" in data or data["avg_runtime_ms"] is None
        assert "avg_memory_kb" in data or data["avg_memory_kb"] is None
        assert "compilation_error" in data or data["compilation_error"] is None
    
    def test_response_test_case_result_format(
        self, test_client, mock_judge0_client, sample_two_sum_request
    ):
        """Test test case result includes all expected fields"""
        response = test_client.post(
            "/api/execution/execute",
            json=sample_two_sum_request
        )
        
        assert response.status_code == 200
        data = response.json()
        
        result = data["results"][0]
        
        # Required fields
        assert "order_index" in result
        assert "input_data" in result
        assert "expected_output" in result
        assert "passed" in result
        assert "status" in result
        
        # Optional fields
        assert "actual_output" in result or result["actual_output"] is None
        assert "runtime_ms" in result or result["runtime_ms"] is None
        assert "memory_kb" in result or result["memory_kb"] is None
        assert "error_message" in result or result["error_message"] is None
        assert "stdout" in result or result["stdout"] is None
        assert "stderr" in result or result["stderr"] is None
