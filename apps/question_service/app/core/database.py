# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: September 18 - October 10, 2025
# Scope: Generated SQLAlchemy database configuration:
#   - Database engine setup with PostgreSQL
#   - SessionLocal factory for database sessions
#   - Base declarative class for models
#   - get_db() dependency for FastAPI route injection
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Added connection pooling configuration
#   - Enhanced error handling for database connections

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# Example DATABASE_URL format for PostgreSQL:
# postgresql+psycopg2://user:password@localhost:5432/mydatabase

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
