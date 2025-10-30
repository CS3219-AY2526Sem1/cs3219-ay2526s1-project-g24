#!/bin/bash
# Database setup script for Question Service
# This script creates the database schema and seeds it with realistic data

set -e  # Exit on error

echo "🚀 Question Service Database Setup"
echo "=================================="
echo ""

# Check if alembic is available
if ! command -v alembic &> /dev/null; then
    echo "⚠️  Alembic not found. Installing dependencies..."
    uv sync
fi

# Step 1: Create migration if needed
echo "📝 Step 1: Checking for migrations..."
if [ -z "$(ls -A alembic/versions)" ]; then
    echo "   No migrations found. Creating initial migration..."
    alembic revision --autogenerate -m "Initial schema with all models"
else
    echo "   ✓ Migrations already exist"
fi

# Step 2: Apply migrations
echo ""
echo "⬆️  Step 2: Applying database migrations..."
alembic upgrade head
echo "   ✓ Database schema is up to date"

# Step 3: Seed the database
echo ""
echo "🌱 Step 3: Seeding database with realistic data..."
uv run python seed_db.py

echo ""
echo "=================================="
echo "✨ Setup complete!"
echo ""
echo "You can now start the API server:"
echo "  uv run fastapi dev"
echo ""
echo "Then visit:"
echo "  http://localhost:8000/docs"
echo "=================================="
