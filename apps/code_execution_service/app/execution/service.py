import asyncio
import json
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.execution.schemas import (
    CodeExecutionRequest,
    CodeExecutionResponse,
    ExecutionStatus,
    Judge0Result,
    Judge0SubmissionRequest,
    Judge0SubmissionResponse,
    LanguageEnum,
    TestCaseResult,
)

# Judge0 Language IDs
# Reference: https://github.com/judge0/judge0/blob/master/CHANGELOG.md
LANGUAGE_IDS = {
    LanguageEnum.PYTHON: 71,  # Python 3.8.1
    LanguageEnum.JAVASCRIPT: 63,  # JavaScript (Node.js 12.14.0)
    LanguageEnum.JAVA: 62,  # Java (OpenJDK 13.0.1)
    LanguageEnum.CPP: 54,  # C++ (GCC 9.2.0)
}


class Judge0Service:
    """Service for interacting with Judge0 API"""

    def __init__(self):
        self.base_url = settings.judge0_url
        self.auth_token = settings.judge0_auth_token
        self.default_time_limit = settings.default_time_limit
        self.default_memory_limit = settings.default_memory_limit

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Judge0 API requests"""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def _prepare_code(
        self, language: LanguageEnum, source_code: str, input_data: Dict[str, Any]
    ) -> tuple[str, str]:
        """
        Prepare code and stdin for execution based on language.
        Returns (code_to_execute, stdin)
        """
        # Convert input_data to JSON for stdin
        stdin = json.dumps(input_data)

        if language == LanguageEnum.PYTHON:
            # Wrap user code to read from stdin and call function
            wrapper = f"""
import json
import sys

{source_code}

# Read input from stdin
input_data = json.loads(sys.stdin.read())

# Call the function (assume first function defined)
import inspect
functions = [obj for name, obj in locals().items() 
             if inspect.isfunction(obj) and not name.startswith('_')]
if functions:
    result = functions[0](**input_data)
    print(json.dumps(result))
"""
            return wrapper, stdin

        elif language == LanguageEnum.JAVASCRIPT:
            wrapper = f"""
{source_code}

// Read input from stdin
const input = require('fs').readFileSync(0, 'utf-8');
const inputData = JSON.parse(input);

// Get first function
const functions = Object.keys(global).filter(key => typeof global[key] === 'function');
if (functions.length > 0) {{
    const result = global[functions[0]](inputData);
    console.log(JSON.stringify(result));
}}
"""
            return wrapper, stdin

        elif language == LanguageEnum.JAVA:
            # For Java, we need a more complex wrapper
            wrapper = f"""
import java.util.*;
import com.google.gson.*;

public class Main {{
    {source_code}
    
    public static void main(String[] args) {{
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        Gson gson = new Gson();
        Map<String, Object> inputData = gson.fromJson(input, Map.class);
        
        // Call solution method
        Object result = solution(inputData);
        System.out.println(gson.toJson(result));
    }}
}}
"""
            return wrapper, stdin

        elif language == LanguageEnum.CPP:
            # C++ wrapper with JSON parsing
            wrapper = f"""
#include <iostream>
#include <string>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

{source_code}

int main() {{
    std::string input;
    std::getline(std::cin, input);
    json inputData = json::parse(input);
    
    // Call solution function
    auto result = solution(inputData);
    std::cout << json(result).dump() << std::endl;
    
    return 0;
}}
"""
            return wrapper, stdin

        return source_code, stdin

    async def submit_code(
        self,
        language: LanguageEnum,
        source_code: str,
        stdin: str,
        expected_output: Optional[str] = None,
        time_limit: Optional[float] = None,
        memory_limit: Optional[int] = None,
    ) -> str:
        """
        Submit code to Judge0 for execution.
        Returns submission token.
        """
        language_id = LANGUAGE_IDS[language]

        submission = Judge0SubmissionRequest(
            source_code=source_code,
            language_id=language_id,
            stdin=stdin,
            expected_output=expected_output,
            cpu_time_limit=time_limit or self.default_time_limit,
            memory_limit=memory_limit or self.default_memory_limit,
            wall_time_limit=(time_limit or self.default_time_limit) * 2,
        )

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/submissions",
                json=submission.model_dump(exclude_none=True),
                headers=self._get_headers(),
                params={"base64_encoded": "false"},
            )
            response.raise_for_status()
            result = Judge0SubmissionResponse(**response.json())
            return result.token

    async def get_submission_result(self, token: str) -> Judge0Result:
        """
        Get submission result from Judge0.
        Polls until execution is complete.
        """
        async with httpx.AsyncClient() as client:
            max_attempts = 20
            for _ in range(max_attempts):
                response = await client.get(
                    f"{self.base_url}/submissions/{token}",
                    headers=self._get_headers(),
                    params={"base64_encoded": "false", "fields": "*"},
                )
                response.raise_for_status()
                result = Judge0Result(**response.json())

                # Status IDs: 1=In Queue, 2=Processing
                if result.status.id not in [1, 2]:
                    return result

                await asyncio.sleep(0.5)

            raise TimeoutError("Submission execution timed out")

    def _parse_status(self, judge0_result: Judge0Result) -> ExecutionStatus:
        """Parse Judge0 status to our ExecutionStatus"""
        status_map = {
            3: ExecutionStatus.ACCEPTED,  # Accepted
            4: ExecutionStatus.WRONG_ANSWER,  # Wrong Answer
            5: ExecutionStatus.TIME_LIMIT_EXCEEDED,  # TLE
            6: ExecutionStatus.COMPILATION_ERROR,  # Compilation Error
            7: ExecutionStatus.RUNTIME_ERROR,  # Runtime Error (SIGSEGV)
            8: ExecutionStatus.RUNTIME_ERROR,  # Runtime Error (SIGXFSZ)
            9: ExecutionStatus.RUNTIME_ERROR,  # Runtime Error (SIGFPE)
            10: ExecutionStatus.RUNTIME_ERROR,  # Runtime Error (SIGABRT)
            11: ExecutionStatus.RUNTIME_ERROR,  # Runtime Error (NZEC)
            12: ExecutionStatus.RUNTIME_ERROR,  # Runtime Error (Other)
            13: ExecutionStatus.INTERNAL_ERROR,  # Internal Error
            14: ExecutionStatus.INTERNAL_ERROR,  # Exec Format Error
        }
        return status_map.get(judge0_result.status.id, ExecutionStatus.INTERNAL_ERROR)

    def _compare_outputs(self, actual: str, expected: Any) -> bool:
        """Compare actual output with expected output"""
        try:
            # Try to parse as JSON
            actual_parsed = json.loads(actual.strip())
            return actual_parsed == expected
        except json.JSONDecodeError:
            # Fallback to string comparison
            return actual.strip() == str(expected).strip()

    async def execute_code(self, request: CodeExecutionRequest) -> CodeExecutionResponse:
        """
        Execute code against multiple test cases.
        Main entry point for code execution.
        """
        results: List[TestCaseResult] = []
        compilation_error = None
        total_runtime = 0
        total_memory = 0
        successful_runs = 0

        for test_case in request.test_cases:
            try:
                # Prepare code with test case
                code, stdin = self._prepare_code(
                    request.language, request.source_code, test_case.input_data
                )

                # Submit to Judge0
                token = await self.submit_code(
                    language=request.language,
                    source_code=code,
                    stdin=stdin,
                    expected_output=json.dumps(test_case.expected_output),
                    time_limit=request.time_limit,
                    memory_limit=request.memory_limit,
                )

                # Get result
                judge0_result = await self.get_submission_result(token)
                status = self._parse_status(judge0_result)

                # Handle compilation errors (affects all test cases)
                if status == ExecutionStatus.COMPILATION_ERROR:
                    compilation_error = (
                        judge0_result.compile_output or judge0_result.stderr or "Compilation failed"
                    )
                    # Mark all remaining tests as failed due to compilation error
                    for tc in request.test_cases:
                        results.append(
                            TestCaseResult(
                                order_index=tc.order_index,
                                input_data=tc.input_data,
                                expected_output=tc.expected_output,
                                actual_output=None,
                                passed=False,
                                status=ExecutionStatus.COMPILATION_ERROR,
                                error_message=compilation_error,
                            )
                        )
                    break

                # Parse output
                actual_output = None
                passed = False
                error_message = None

                if status == ExecutionStatus.ACCEPTED and judge0_result.stdout:
                    passed = self._compare_outputs(
                        judge0_result.stdout, test_case.expected_output
                    )
                    if not passed:
                        status = ExecutionStatus.WRONG_ANSWER
                    try:
                        actual_output = json.loads(judge0_result.stdout.strip())
                    except json.JSONDecodeError:
                        actual_output = judge0_result.stdout.strip()
                elif judge0_result.stderr:
                    error_message = judge0_result.stderr

                # Parse runtime and memory
                runtime_ms = None
                memory_kb = None
                if judge0_result.time:
                    runtime_ms = int(float(judge0_result.time) * 1000)
                    total_runtime += runtime_ms
                    successful_runs += 1
                if judge0_result.memory:
                    memory_kb = judge0_result.memory
                    total_memory += memory_kb

                results.append(
                    TestCaseResult(
                        order_index=test_case.order_index,
                        input_data=test_case.input_data,
                        expected_output=test_case.expected_output,
                        actual_output=actual_output,
                        passed=passed,
                        runtime_ms=runtime_ms,
                        memory_kb=memory_kb,
                        status=status,
                        error_message=error_message,
                        stdout=judge0_result.stdout,
                        stderr=judge0_result.stderr,
                    )
                )

            except Exception as e:
                # Handle unexpected errors
                results.append(
                    TestCaseResult(
                        order_index=test_case.order_index,
                        input_data=test_case.input_data,
                        expected_output=test_case.expected_output,
                        actual_output=None,
                        passed=False,
                        status=ExecutionStatus.INTERNAL_ERROR,
                        error_message=str(e),
                    )
                )

        # Calculate statistics
        passed_count = sum(1 for r in results if r.passed)
        avg_runtime = int(total_runtime / successful_runs) if successful_runs > 0 else None
        avg_memory = int(total_memory / successful_runs) if successful_runs > 0 else None

        return CodeExecutionResponse(
            language=request.language.value,
            total_test_cases=len(request.test_cases),
            passed_test_cases=passed_count,
            results=results,
            overall_passed=passed_count == len(request.test_cases),
            avg_runtime_ms=avg_runtime,
            avg_memory_kb=avg_memory,
            compilation_error=compilation_error,
        )


# Singleton instance
judge0_service = Judge0Service()
