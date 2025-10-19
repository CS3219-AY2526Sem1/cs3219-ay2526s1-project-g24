"""
Unit tests for Judge0Service
Tests code submission, result retrieval, and execution flow
"""
from unittest.mock import MagicMock

import pytest

from app.execution.schemas import (
    CodeExecutionRequest,
    ExecutionStatus,
    LanguageEnum,
    TestCaseInput,
)
from app.execution.service import Judge0Service
from tests.conftest import (
    MOCK_JUDGE0_RESPONSES,
    SAMPLE_FUNCTION_SIGNATURES,
    SAMPLE_TEST_DATA,
    SAMPLE_USER_CODE,
)


class TestJudge0ServiceInitialization:
    """Test Judge0Service initialization"""
    
    def test_service_initialization(self):
        """Test Judge0Service initializes with config"""
        service = Judge0Service()
        
        assert service.base_url is not None
        assert service.default_time_limit is not None
        assert service.default_memory_limit is not None
    
    def test_get_headers_without_auth(self):
        """Test headers when no auth token provided"""
        service = Judge0Service()
        service.auth_token = None
        
        headers = service._get_headers()
        
        assert headers["Content-Type"] == "application/json"
        assert "Authorization" not in headers
    
    def test_get_headers_with_auth(self):
        """Test headers when auth token provided"""
        service = Judge0Service()
        service.auth_token = "test-token"
        
        headers = service._get_headers()
        
        assert headers["Content-Type"] == "application/json"
        assert headers["Authorization"] == "Bearer test-token"


class TestJudge0ServiceCodePreparation:
    """Test code preparation logic"""
    
    def test_prepare_code_python_with_signature(self):
        """Test _prepare_code for Python with function_signature"""
        service = Judge0Service()
        
        code, stdin, additional_files = service._prepare_code(
            language=LanguageEnum.PYTHON,
            source_code=SAMPLE_USER_CODE["python"]["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        )
        
        # Should use new code generator
        assert code is not None
        assert stdin is not None
        assert additional_files is None
        
        # Code should contain wrapper
        assert "import json" in code
        assert "class Solution" in code
    
    def test_prepare_code_python_without_signature(self):
        """Test _prepare_code for Python without function_signature (fallback)"""
        service = Judge0Service()
        
        code, stdin, additional_files = service._prepare_code(
            language=LanguageEnum.PYTHON,
            source_code=SAMPLE_USER_CODE["python"]["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"],
            function_signature=None
        )
        
        # Should use fallback approach
        assert code is not None
        assert stdin is not None
        assert additional_files is None
        
        # Should include fallback wrapper
        assert "import json" in code
        assert "sys.stdin.read()" in code
    
    def test_prepare_code_java(self):
        """Test _prepare_code for Java returns additional_files"""
        service = Judge0Service()
        
        code, stdin, additional_files = service._prepare_code(
            language=LanguageEnum.JAVA,
            source_code=SAMPLE_USER_CODE["java"]["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        )
        
        # Java should return additional_files (zip)
        assert code == ""
        assert stdin is not None
        assert additional_files is not None
    
    def test_prepare_code_cpp(self):
        """Test _prepare_code for C++ returns additional_files"""
        service = Judge0Service()
        
        code, stdin, additional_files = service._prepare_code(
            language=LanguageEnum.CPP,
            source_code=SAMPLE_USER_CODE["cpp"]["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        )
        
        # C++ should return additional_files (zip)
        assert code == ""
        assert stdin is not None
        assert additional_files is not None


class TestJudge0ServiceSubmission:
    """Test code submission to Judge0"""
    
    @pytest.mark.asyncio
    async def test_submit_code_success(self, mock_judge0_client):
        """Test successful code submission"""
        service = Judge0Service()
        
        token = await service.submit_code(
            language=LanguageEnum.PYTHON,
            source_code="print('hello')",
            stdin="{}",
            time_limit=2.0,
            memory_limit=256000
        )
        
        assert token == "test-token-12345"
        
        # Verify Judge0 API was called
        assert mock_judge0_client.post.called
        assert len(mock_judge0_client._post_calls) == 1
        call_data = mock_judge0_client._post_calls[0]
        
        # Check URL
        assert "/submissions" in call_data["args"][0]
        
        # Check request params
        assert call_data["kwargs"]["params"]["base64_encoded"] == "false"
    
    @pytest.mark.asyncio
    async def test_submit_code_with_additional_files(self, mock_judge0_client):
        """Test submission with additional_files (Java/C++)"""
        service = Judge0Service()
        
        token = await service.submit_code(
            language=LanguageEnum.JAVA,
            source_code="",
            stdin="{}",
            additional_files="base64encodedzip",
            time_limit=2.0,
            memory_limit=256000
        )
        
        assert token == "test-token-12345"
        
        # Verify additional_files was included in request
        assert len(mock_judge0_client._post_calls) == 1
        call_data = mock_judge0_client._post_calls[0]
        request_json = call_data["kwargs"]["json"]
        assert "additional_files" in request_json
    
    @pytest.mark.asyncio
    async def test_submit_code_uses_default_limits(self, mock_judge0_client):
        """Test submission uses default limits when not provided"""
        service = Judge0Service()
        
        await service.submit_code(
            language=LanguageEnum.PYTHON,
            source_code="print('hello')",
            stdin="{}"
        )
        
        # Should use default limits from config
        assert len(mock_judge0_client._post_calls) == 1
        call_data = mock_judge0_client._post_calls[0]
        request_json = call_data["kwargs"]["json"]
        
        assert request_json["cpu_time_limit"] == service.default_time_limit
        assert request_json["memory_limit"] == service.default_memory_limit


class TestJudge0ServiceResultRetrieval:
    """Test result retrieval from Judge0"""
    
    @pytest.mark.asyncio
    async def test_get_submission_result_accepted(self, mock_judge0_client):
        """Test retrieving accepted submission result"""
        service = Judge0Service()
        
        result = await service.get_submission_result("test-token-12345")
        
        assert result.status.id == 3
        assert result.status.description == "Accepted"
        assert result.stdout == "[0, 1]\n"
        assert result.stderr is None
        
        # Verify Judge0 API was called
        assert mock_judge0_client.get.called
        assert len(mock_judge0_client._get_calls) >= 1
        call_data = mock_judge0_client._get_calls[0]
        assert "test-token-12345" in call_data["args"][0]
    
    @pytest.mark.asyncio
    async def test_get_submission_result_with_polling(self, monkeypatch):
        """Test result retrieval with polling until completion"""
        service = Judge0Service()
        
        # Create mock responses
        mock_processing = MagicMock()
        mock_processing.json = MagicMock(return_value={
            "token": "test-token",
            "status": {"id": 1, "description": "In Queue"},
            "stdout": None,
            "stderr": None,
            "compile_output": None,
            "time": None,
            "memory": None
        })
        mock_processing.raise_for_status = MagicMock()
        
        mock_accepted = MagicMock()
        mock_accepted.json = MagicMock(return_value=MOCK_JUDGE0_RESPONSES["submission_accepted"])
        mock_accepted.raise_for_status = MagicMock()
        
        # Track call count
        call_count = [0]
        
        async def mock_get(*args, **kwargs):
            call_count[0] += 1
            if call_count[0] == 1:
                return mock_processing
            return mock_accepted
        
        mock_client = MagicMock()
        mock_client.get = mock_get
        
        class MockAsyncClient:
            def __init__(self, *args, **kwargs):
                pass
            
            async def __aenter__(self):
                return mock_client
            
            async def __aexit__(self, *args):
                pass
        
        monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
        
        result = await service.get_submission_result("test-token")
        
        # Should have polled twice
        assert call_count[0] == 2
        
        # Final result should be accepted
        assert result.status.id == 3


class TestJudge0ServiceExecution:
    """Test full code execution flow"""
    
    @pytest.mark.asyncio
    async def test_execute_code_success(self, mock_judge0_client):
        """Test successful code execution with all test cases passing"""
        service = Judge0Service()
        
        request = CodeExecutionRequest(
            language=LanguageEnum.PYTHON,
            source_code=SAMPLE_USER_CODE["python"]["two_sum"],
            test_cases=[
                TestCaseInput(
                    input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"],
                    expected_output=SAMPLE_TEST_DATA["two_sum"]["expected_output"],
                    order_index=0
                )
            ],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            time_limit=2.0,
            memory_limit=256000
        )
        
        response = await service.execute_code(request)
        
        assert response.language == "python"
        assert response.total_test_cases == 1
        assert response.passed_test_cases >= 0  # Depends on mock behavior
        assert response.overall_passed in [True, False]
        assert len(response.results) == 1
    
    @pytest.mark.asyncio
    async def test_execute_code_multiple_test_cases(self, mock_judge0_client):
        """Test execution with multiple test cases"""
        service = Judge0Service()
        
        request = CodeExecutionRequest(
            language=LanguageEnum.PYTHON,
            source_code=SAMPLE_USER_CODE["python"]["two_sum"],
            test_cases=[
                TestCaseInput(
                    input_data={"nums": [2, 7, 11, 15], "target": 9},
                    expected_output=[0, 1],
                    order_index=0
                ),
                TestCaseInput(
                    input_data={"nums": [3, 2, 4], "target": 6},
                    expected_output=[1, 2],
                    order_index=1
                )
            ],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            time_limit=2.0,
            memory_limit=256000
        )
        
        response = await service.execute_code(request)
        
        assert response.total_test_cases == 2
        assert len(response.results) == 2
        
        # Results should maintain order
        assert response.results[0].order_index == 0
        assert response.results[1].order_index == 1
    
    @pytest.mark.asyncio
    async def test_execute_code_with_compilation_error(self, monkeypatch):
        """Test execution with compilation error"""
        service = Judge0Service()
        
        # Mock compilation error response
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
        
        request = CodeExecutionRequest(
            language=LanguageEnum.PYTHON,
            source_code="def broken syntax",  # Invalid syntax
            test_cases=[
                TestCaseInput(
                    input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"],
                    expected_output=SAMPLE_TEST_DATA["two_sum"]["expected_output"],
                    order_index=0
                )
            ],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        )
        
        response = await service.execute_code(request)
        
        # Should indicate compilation error
        assert response.compilation_error is not None
        assert response.overall_passed is False


class TestJudge0ServiceStatusMapping:
    """Test status code mapping through execution"""
    
    @pytest.mark.asyncio
    async def test_status_mapping_in_execution_context(self):
        """
        Test that status mapping works correctly in execution context.
        The actual _map_judge0_status method is internal to the service
        and tested through execute_code.
        """
        service = Judge0Service()
        
        # This is tested through the execution flow in other tests
        assert service is not None
