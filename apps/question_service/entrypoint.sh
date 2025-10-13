#!/bin/sh

# Exit on first error
set -e

echo '🔄 Waiting for database...'
sleep 5

echo '📦 Running migrations...'
/app/.venv/bin/alembic upgrade head

echo '🌱 Seeding database...'
/app/.venv/bin/python -c 'from seed_db import seed_database; from app.questions.models import Topic; from app.core.database import SessionLocal; db = SessionLocal(); existing = db.query(Topic).count(); db.close(); seed_database() if existing == 0 else print("✅ Database already seeded")'

echo '🚀 Starting FastAPI server...'
/app/.venv/bin/fastapi run app/main.py --port 80 --host 0.0.0.0
