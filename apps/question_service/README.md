# Question Service

A FastAPI service for managing coding questions, test cases, and user progress tracking.

## Getting Started

### Prerequisites
- Docker Desktop

### Quick Setup

From the project root:

```bash
# Optional: copy environment config (uses defaults if skipped)
cp .env.example .env

# Start everything
docker-compose up -d
```

This starts the PostgreSQL database, runs migrations, seeds initial data, and launches the API server.

**API available at:** http://localhost:8000/docs

### Teardown

```bash
# Stop and remove everything (including data)
docker-compose down -v

# Or just stop containers (keep data)
docker-compose down
```

## What's Included

After setup, the database contains:
- 8 sample questions (Two Sum, Reverse String, FizzBuzz, etc.)
- 20 topics (Arrays, Strings, Dynamic Programming, etc.)
- 15 companies (Google, Amazon, Meta, etc.)

## Common Tasks

### Development

```bash
# View logs
docker-compose logs -f question_service

# Rebuild after code changes
docker-compose up -d --build question_service

# Access database
docker exec -it question_db psql -U questionuser -d questiondb
```

### Database Migrations

After modifying models:

```bash
# Create migration
docker exec -it question_service /app/.venv/bin/alembic revision --autogenerate -m "description"

# Apply migration
docker exec -it question_service /app/.venv/bin/alembic upgrade head
```

## API Examples

### Create a Question

```python
POST /api/questions
{
  "title": "Two Sum",
  "description": "Given an array...",
  "difficulty": "easy",
  "code_templates": {
    "python": "def twoSum(nums, target):\n    pass"
  },
  "function_signature": {
    "function_name": "twoSum",
    "params": [{"name": "nums", "type": "int[]"}],
    "return_type": "int[]"
  },
  "topic_ids": [1, 2],
  "company_ids": [1],
  "test_cases": [
    {
      "input_data": {"nums": [2,7,11,15], "target": 9},
      "expected_output": [0, 1],
      "visibility": "sample",
      "order_index": 0
    }
  ]
}
```

### List Questions with Filters

```bash
GET /api/questions?difficulties=easy,medium&topic_ids=1,2&page=1&page_size=20
```

### Get Random Question

```bash
GET /api/questions/random?difficulties=medium&user_id=user123
```

### Get Daily Challenge

```bash
GET /api/questions/daily?user_id=user123
```

### Submit Solution

```python
POST /api/questions/1/submit?user_id=user123
{
  "question_id": 1,
  "language": "python",
  "code": "def twoSum(nums, target):\n    return [0, 1]"
}
```

### Get User Stats

```bash
GET /api/users/user123/stats
```

Response:
```json
{
  "user_id": "user123",
  "total_solved": 42,
  "easy_solved": 20,
  "medium_solved": 18,
  "hard_solved": 4,
  "total_attempted": 60,
  "acceptance_rate": 70.5,
  "total_submissions": 150
}
```

### Key Endpoints

- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc
- OpenAPI spec: http://localhost:8000/openapi.json

## Project Structure

```
app/
├── main.py                          # FastAPI app
├── api/
│   └── router.py                    # Main API router (includes all)
├── core/
│   ├── config.py
│   └── database.py
└── questions/
    ├── models.py                    # SQLAlchemy models
    ├── schemas.py                   # Pydantic schemas
    ├── crud.py                      # Database operations
    ├── router.py                    # Question endpoints
    ├── test_case_router.py          # Test case endpoints
    ├── topic_router.py              # Topic endpoints
    ├── company_router.py            # Company endpoints
    └── user_router.py               # User progress endpoints
```

## API Routes

| Router | Prefix | Endpoints |
|--------|--------|-----------|
| Questions | `/api/questions` | 11 endpoints |
| Test Cases | `/api/test-cases` | 2 endpoints |
| Topics | `/api/topics` | 4 endpoints |
| Companies | `/api/companies` | 4 endpoints |
| Users | `/api/users` | 4 endpoints |

## Query Filters

### Questions by Difficulty
```
GET /api/questions?difficulties=easy
GET /api/questions?difficulties=easy,medium
```

### Questions by Topics
```
GET /api/questions?topic_ids=1,2,3
```

### Questions by Company
```
GET /api/questions?company_ids=1
```

### Search by Title
```
GET /api/questions?search=sum
```

### User's Solved Questions
```
GET /api/questions?solved_only=true&user_id=user123
```

### Combined Filters
```
GET /api/questions?difficulties=medium&topic_ids=1,2&search=array&page=1&page_size=10&sort_by=acceptance_rate&sort_order=desc
```

## Data Schemas

### Request Schemas
- `QuestionCreate` - Create question
- `QuestionUpdate` - Update question (all fields optional)
- `TopicCreate` - Create/update topic
- `CompanyCreate` - Create/update company
- `TestCaseCreate` - Create/update test case
- `UserAttemptCreate` - Record user attempt
- `CodeExecutionRequest` - Run code
- `SubmissionRequest` - Submit solution

### Response Schemas
- `QuestionListResponse` - Paginated question list
- `QuestionDetail` - Full question details
- `QuestionListItem` - Lightweight question
- `TestCaseResponse` - Test case with ID
- `TestCasePublic` - Public test case only
- `UserStats` - User statistics
- `CodeExecutionResponse` - Execution results
- `SubmissionResponse` - Submission results

## Testing with curl

### Create Topic
```bash
curl -X POST http://localhost:8000/api/topics \
  -H "Content-Type: application/json" \
  -d '{"name": "Arrays", "description": "Array problems"}'
```

### Create Company
```bash
curl -X POST http://localhost:8000/api/companies \
  -H "Content-Type: application/json" \
  -d '{"name": "Google"}'
```

### List Questions
```bash
curl "http://localhost:8000/api/questions?page=1&page_size=10"
```

### Get Question
```bash
curl http://localhost:8000/api/questions/1
```

## Notes

- Use `/docs` for interactive API testing
- User ID is optional for most GET endpoints but required for user-specific data
- Admin endpoints (POST, PUT, DELETE) don't require auth yet
- Code execution endpoints return stub data (not yet implemented)
- Daily question is deterministic based on date
- Similar questions match by difficulty and overlapping topics

## Troubleshooting

**Port conflicts:** If 8000 or 5433 are in use, change the port mappings in `docker-compose.yml`

**Database issues:** Run `docker-compose down -v` to reset everything

**Container won't start:** Check logs with `docker-compose logs question_service`
