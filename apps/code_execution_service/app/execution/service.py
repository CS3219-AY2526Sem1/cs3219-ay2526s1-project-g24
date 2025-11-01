import asyncio
import json
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.execution.code_generator import LanguageEnum as GeneratorLanguageEnum
from app.execution.code_generator import code_generator
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

# Set up logger
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Judge0 Language IDs
# Reference: https://github.com/judge0/judge0/blob/master/CHANGELOG.md
LANGUAGE_IDS = {
    LanguageEnum.PYTHON: 71,  # Python 3.8.1
    LanguageEnum.JAVASCRIPT: 63,  # JavaScript (Node.js 12.14.0)
    LanguageEnum.JAVA: 89,  # Multi-file program (for GSON support)
    LanguageEnum.CPP: 89,  # Multi-file program (for nlohmann/json support)
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
        self, 
        language: LanguageEnum, 
        source_code: str, 
        input_data: Dict[str, Any],
        function_signature: Optional[Dict[str, Any]] = None
    ) -> tuple[str, str, Optional[str]]:
        """
        Prepare code and stdin for execution based on language.
        Uses the new CodeGenerator for robust, language-agnostic code generation.
        
        Returns (code_to_execute, stdin, additional_files_base64)
        - For Python/JS: (wrapped_code, stdin, None)
        - For Java/C++: ("", stdin, base64_zip)
        """
        if function_signature:
            # Use new code generator approach (preferred)
            wrapper_code, stdin_data, additional_files = code_generator.generate_wrapper(
                language=GeneratorLanguageEnum(language.value),
                user_code=source_code,
                function_signature=function_signature,
                input_data=input_data
            )
            return wrapper_code, stdin_data, additional_files
        else:
            # Fallback to old approach if function_signature not provided
            # (for backward compatibility during migration)
            stdin = json.dumps(input_data)

            if language == LanguageEnum.PYTHON:
                # Wrap user code to instantiate Solution class and call method
                wrapper = f"""
from typing import List, Optional, Dict, Tuple, Set, Union
import json
import sys

{source_code}

# Read input from stdin
input_data = json.loads(sys.stdin.read())

# Instantiate Solution class and call the method
solution = Solution()
# Get the first non-magic method
import inspect
methods = [name for name, obj in inspect.getmembers(solution, predicate=inspect.ismethod) 
           if not name.startswith('_')]
if methods:
    result = getattr(solution, methods[0])(**input_data)
    print(json.dumps(result))
"""
                return wrapper, stdin, None

            elif language == LanguageEnum.JAVASCRIPT:
                wrapper = f"""
{source_code}

// Read input from stdin
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
const inputData = JSON.parse(input);

// Extract function name and parameters from "var functionName = function(params)" pattern
const functionMatch = `{source_code}`.match(/var\\s+(\\w+)\\s*=\\s*function\\s*\\(([^)]*)\\)/);
if (functionMatch) {{
    const functionName = functionMatch[1];
    const paramNames = functionMatch[2].split(',').map(p => p.trim()).filter(p => p);
    
    // Build arguments array in the correct order based on parameter names
    const args = paramNames.map(paramName => inputData[paramName]);
    
    const result = eval(functionName)(...args);
}} else {{
    console.error('No function found');
}}
"""
                return wrapper, stdin, None

            elif language == LanguageEnum.JAVA:
                # Java not fully implemented in fallback
                wrapper = f"""
import java.util.*;
import com.google.gson.*;

{source_code}

public class Main {{
    public static void main(String[] args) {{
        System.out.println("Java execution requires function_signature");
    }}
}}
"""
                return wrapper, stdin, None

            elif language == LanguageEnum.CPP:
                # C++ not fully implemented in fallback
                wrapper = f"""
#include <iostream>

{source_code}

int main() {{
    std::cout << "C++ execution requires function_signature" << std::endl;
    return 0;
}}
"""
                return wrapper, stdin, None

            return source_code, stdin, None

    async def submit_code(
        self,
        language: LanguageEnum,
        source_code: str,
        stdin: str,
        expected_output: Optional[str] = None,
        time_limit: Optional[float] = None,
        memory_limit: Optional[int] = None,
        additional_files: Optional[str] = None,
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
            additional_files=additional_files,
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
                code, stdin, additional_files = self._prepare_code(
                    request.language, 
                    request.source_code, 
                    test_case.input_data,
                    request.function_signature
                )

                # Submit to Judge0
                token = await self.submit_code(
                    language=request.language,
                    source_code=code,
                    stdin=stdin,
                    expected_output=None,  # Don't pass to Judge0, we'll do our own comparison
                    time_limit=request.time_limit,
                    memory_limit=request.memory_limit,
                    additional_files=additional_files,
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

                # Parse stdout if available (regardless of status)
                # Even if Judge0 reports internal_error, if we have stdout, use it
                if judge0_result.stdout and judge0_result.stdout.strip():
                    try:
                        actual_output = json.loads(judge0_result.stdout.strip())
                    except json.JSONDecodeError:
                        actual_output = judge0_result.stdout.strip()
                    
                    # Always do our own comparison (JSON-aware)
                    passed = self._compare_outputs(
                        judge0_result.stdout, test_case.expected_output
                    )
                    # Update status based on our comparison
                    if passed:
                        status = ExecutionStatus.ACCEPTED
                    else:
                        status = ExecutionStatus.WRONG_ANSWER
                
                # Capture stderr as error message only if the test case did not pass
                if not passed and judge0_result.stderr and judge0_result.stderr.strip():
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
