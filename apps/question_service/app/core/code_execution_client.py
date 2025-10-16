"""
HTTP client for code execution service
"""
from typing import Any, Dict, List

import httpx

from app.questions import schemas


class CodeExecutionClient:
    """Client for code execution service"""

    def __init__(self, base_url: str = "http://code-execution-service:3010"):
        self.base_url = base_url

    async def execute_code(
        self,
        language: str,
        source_code: str,
        test_cases: List[Dict[str, Any]],
        time_limit: float = 5.0,
        memory_limit: int = 128000,
    ) -> Dict[str, Any]:
        """
        Execute code against test cases.
        
        Args:
            language: Programming language (python, javascript, java, cpp)
            source_code: User's source code
            test_cases: List of test cases with input_data and expected_output
            time_limit: Time limit in seconds
            memory_limit: Memory limit in KB
            
        Returns:
            Execution results dictionary
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/api/execution/execute",
                json={
                    "language": language,
                    "source_code": source_code,
                    "test_cases": test_cases,
                    "time_limit": time_limit,
                    "memory_limit": memory_limit,
                },
            )
            response.raise_for_status()
            return response.json()


# Singleton instance
code_execution_client = CodeExecutionClient()
