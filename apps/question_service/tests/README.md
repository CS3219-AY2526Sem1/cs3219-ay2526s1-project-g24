# Question Service Testing Guide

This directory contains comprehensive tests for the Question Service API.

## Test Structure

```
tests/
├── conftest.py              # Test configuration and fixtures
├── test_crud.py             # CRUD operation tests (39 tests)
├── test_question_router.py  # Question API endpoint tests (30+ tests)
├── test_topic_router.py     # Topic API endpoint tests (10 tests)
├── test_company_router.py   # Company API endpoint tests (10 tests)
├── test_user_router.py      # User progress endpoint tests (12 tests)
├── test_models.py           # Database model tests (20+ tests)
└── test_integration.py      # Integration and edge case tests (25+ tests)
```

## Running Tests

### Quick Start

```bash
# Run all tests with coverage
./run_tests.sh

# Or using uv directly
uv run pytest tests/ --cov=app --cov-report=term-missing -v
```

### Test Categories

```bash
# Run only unit tests
./run_tests.sh unit

# Run only integration tests
./run_tests.sh integration

# Run fast tests only (exclude slow tests)
./run_tests.sh fast

# Run specific test modules
./run_tests.sh crud
./run_tests.sh routers
./run_tests.sh models
```

### Run Specific Test Files

```bash
# Test CRUD operations
uv run pytest tests/test_crud.py -v

# Test question endpoints
uv run pytest tests/test_question_router.py -v

# Test models and relationships
uv run pytest tests/test_models.py -v

# Test integration scenarios
uv run pytest tests/test_integration.py -v
```

### Run Specific Test Classes or Methods

```bash
# Run a specific test class
uv run pytest tests/test_crud.py::TestQuestionCRUD -v

# Run a specific test method
uv run pytest tests/test_crud.py::TestQuestionCRUD::test_create_question -v
```

## Test Markers

Tests are organized with pytest markers:

- `@pytest.mark.unit` - Unit tests for individual components
- `@pytest.mark.integration` - Integration tests for workflows
- `@pytest.mark.slow` - Tests that take longer to run

```bash
# Run only unit tests
uv run pytest -m unit

# Run everything except slow tests
uv run pytest -m "not slow"

# Run integration tests only
uv run pytest -m integration
```

## Test Coverage

### View Coverage Report

```bash
# Generate and view HTML coverage report
./run_tests.sh all
open htmlcov/index.html
```

### Coverage Goals

- **Overall**: 80%+ code coverage
- **CRUD Operations**: 90%+ coverage
- **API Endpoints**: 85%+ coverage
- **Models**: 80%+ coverage

## Fixtures

The `conftest.py` file provides reusable fixtures:

### Database Fixtures

- `db` - In-memory SQLite database session
- `client` - FastAPI TestClient with overridden dependencies

### Data Fixtures

- `sample_topics` - List of 3 test topics
- `sample_companies` - List of 2 test companies
- `sample_question` - Single question with topics, companies, and test cases
- `sample_questions` - List of 3 questions with relationships
- `sample_user_attempt` - User attempt for testing progress tracking

## Test Coverage by Module

### CRUD Tests (`test_crud.py`)
- ✅ Question CRUD (15 tests)
- ✅ Topic CRUD (5 tests)
- ✅ Company CRUD (5 tests)
- ✅ Test Case CRUD (5 tests)
- ✅ User Progress (6 tests)
- ✅ Analytics (3 tests)

### Router Tests
- ✅ Question endpoints (30+ tests)
  - List with filters, pagination, sorting
  - Get, create, update, delete
  - Random, daily, similar questions
  - Code execution (run, submit)
  - Analytics (stats, submissions)
- ✅ Topic endpoints (10 tests)
- ✅ Company endpoints (10 tests)
- ✅ User progress endpoints (12 tests)

### Model Tests (`test_models.py`)
- ✅ Model creation and validation (20+ tests)
- ✅ Relationship tests (many-to-many)
- ✅ Cascade deletion tests
- ✅ Enum validation tests

### Integration Tests (`test_integration.py`)
- ✅ Error handling (10 tests)
- ✅ Edge cases (8 tests)
- ✅ Complex workflows (7 tests)
- ✅ Data consistency (4 tests)

## Writing New Tests

### Example Test

```python
class TestNewFeature:
    """Tests for new feature"""

    def test_feature_works(self, client, sample_question):
        """Test that feature works as expected"""
        response = client.get(f"/api/new-feature/{sample_question.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert "expected_field" in data
```

### Best Practices

1. **Use descriptive test names** - `test_get_question_returns_404_when_not_found`
2. **Test one thing per test** - Keep tests focused and simple
3. **Use fixtures** - Reuse sample data from conftest.py
4. **Test edge cases** - Empty data, invalid input, boundary conditions
5. **Test error paths** - Not just happy paths
6. **Clean up resources** - Use fixtures with proper cleanup
7. **Add docstrings** - Explain what each test verifies

### Test Organization

```python
class TestFeatureName:
    """Group related tests in a class"""

    def test_happy_path(self, client):
        """Test the normal success case"""
        pass

    def test_error_case(self, client):
        """Test error handling"""
        pass

    def test_edge_case(self, client):
        """Test boundary conditions"""
        pass
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    cd apps/question_service
    uv run pytest tests/ --cov=app --cov-report=xml
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
```

## Debugging Tests

### Run with verbose output

```bash
uv run pytest tests/ -vv
```

### Run with print statements

```bash
uv run pytest tests/ -s
```

### Run last failed tests

```bash
uv run pytest --lf
```

### Run with debugger

```bash
uv run pytest --pdb
```

### Show fixtures

```bash
uv run pytest --fixtures
```

## Test Database

Tests use an in-memory SQLite database that is:
- Created fresh for each test
- Isolated from production database
- Fast (no disk I/O)
- Automatically cleaned up

The database is configured in `conftest.py`:

```python
@pytest.fixture(scope="function")
def db():
    """Create a fresh test database for each test"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    # ... session creation
```

## Common Issues

### Import Errors
If you see `ModuleNotFoundError`, make sure you're using `uv run pytest` instead of just `pytest`.

### Database Errors
Tests use in-memory SQLite. If you see database errors, check that:
- Models are imported in conftest.py
- Fixtures properly commit/rollback transactions

### Fixture Scope
- Use `scope="function"` for isolated test data
- Use `scope="session"` for shared read-only data

## Performance

Average test execution times:
- CRUD tests: ~0.5s
- Router tests: ~1.5s
- Model tests: ~0.3s
- Integration tests: ~2.0s
- **Total**: ~5 seconds for all tests

For faster feedback during development:
```bash
./run_tests.sh fast  # Skip slow tests
```

## Next Steps

1. **Run the tests**: `./run_tests.sh`
2. **Check coverage**: Open `htmlcov/index.html`
3. **Fix any failures**: Read test output carefully
4. **Add new tests**: When adding new features
5. **Keep coverage high**: Aim for 80%+ coverage
