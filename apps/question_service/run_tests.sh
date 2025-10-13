#!/bin/bash
# Test runner script for the Question Service

set -e

echo "🧪 Running Question Service Tests"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to run tests with coverage
run_tests() {
    echo -e "${YELLOW}Running all tests with coverage...${NC}"
    uv run pytest tests/ \
        --cov=app \
        --cov-report=term-missing \
        --cov-report=html \
        -v
}

# Function to run specific test categories
run_unit_tests() {
    echo -e "${YELLOW}Running unit tests only...${NC}"
    uv run pytest tests/ -m unit -v
}

run_integration_tests() {
    echo -e "${YELLOW}Running integration tests only...${NC}"
    uv run pytest tests/ -m integration -v
}

run_fast_tests() {
    echo -e "${YELLOW}Running fast tests only (excluding slow)...${NC}"
    uv run pytest tests/ -m "not slow" -v
}

# Function to run tests for specific modules
run_crud_tests() {
    echo -e "${YELLOW}Running CRUD tests...${NC}"
    uv run pytest tests/test_crud.py -v
}

run_router_tests() {
    echo -e "${YELLOW}Running router tests...${NC}"
    uv run pytest tests/test_*_router.py -v
}

run_model_tests() {
    echo -e "${YELLOW}Running model tests...${NC}"
    uv run pytest tests/test_models.py -v
}

# Parse command line arguments
case "${1:-all}" in
    all)
        run_tests
        ;;
    unit)
        run_unit_tests
        ;;
    integration)
        run_integration_tests
        ;;
    fast)
        run_fast_tests
        ;;
    crud)
        run_crud_tests
        ;;
    routers)
        run_router_tests
        ;;
    models)
        run_model_tests
        ;;
    *)
        echo -e "${RED}Unknown test category: $1${NC}"
        echo "Usage: $0 {all|unit|integration|fast|crud|routers|models}"
        echo ""
        echo "Examples:"
        echo "  $0 all          - Run all tests with coverage"
        echo "  $0 unit         - Run only unit tests"
        echo "  $0 integration  - Run only integration tests"
        echo "  $0 fast         - Run all tests except slow ones"
        echo "  $0 crud         - Run CRUD tests only"
        echo "  $0 routers      - Run router tests only"
        echo "  $0 models       - Run model tests only"
        exit 1
        ;;
esac

# Print summary
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tests passed!${NC}"
    echo ""
    echo "Coverage report saved to htmlcov/index.html"
    echo "Run 'open htmlcov/index.html' to view detailed coverage report"
else
    echo -e "${RED}❌ Tests failed!${NC}"
    exit 1
fi
