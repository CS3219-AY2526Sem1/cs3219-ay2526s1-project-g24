# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: September 18 - October 10, 2025
# Scope: Generated Pydantic Settings configuration:
#   - Database connection URL
#   - Environment settings (dev/prod)
#   - JWT authentication settings (RS256 with JWKS)
#   - Service URLs for inter-service communication
#   - Code Execution Service integration
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Added validation for required environment variables
#   - Enhanced security settings for production

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    ENV: str = "dev"
    PROJECT_NAME: str = "Question Service"
    
    # JWT Authentication settings
    USER_SERVICE_URL: str = "http://user-service:8000"  # URL to User Service (internal Docker network port)
    JWT_SECRET: str = ""  # Fallback for HS256 (not used with RS256)
    JWT_ALGORITHM: str = "RS256"  # Use RS256 asymmetric encryption to match User Service
    
    # Code Execution Service settings
    CODE_EXECUTOR_URL: str = "http://code-execution-service:3010"  # URL to Code Execution Service

    # ✅ Only use model_config (remove the inner Config class)
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "allow",  # optional: allows extra env vars
    }

settings = Settings()
