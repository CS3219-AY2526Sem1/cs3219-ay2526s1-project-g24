# Code Execution Service

A FastAPI-based service for executing code submissions using Judge0.

## Features

- Execute code in multiple languages (Python, JavaScript, Java, C++)
- Configurable time and memory limits
- Integration with Judge0 for secure code execution
- Support for test case execution and validation

## Setup

1. Install dependencies:
```bash
uv sync
```

2. Configure environment variables in `.env`:
```
JUDGE0_URL=http://judgezero-server:2358
JUDGE0_AUTH_TOKEN=your-token-here
DEFAULT_TIME_LIMIT=5.0
DEFAULT_MEMORY_LIMIT=128000
```

3. Run the service:
```bash
uv run fastapi dev app/main.py
```

## API Endpoints

### POST /api/execute
Execute code against test cases

Request body:
```json
{
  "language": "python",
  "source_code": "def solution(a, b): return a + b",
  "test_cases": [
    {
      "input_data": {"a": 1, "b": 2},
      "expected_output": 3
    }
  ],
  "time_limit": 5.0,
  "memory_limit": 128000
}
```

## Supported Languages

- Python (3.11+)
- JavaScript (Node.js)
- Java
- C++ (17)
