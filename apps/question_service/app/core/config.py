from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    ENV: str = "dev"
    PROJECT_NAME: str = "Question Service"
    
    # JWT Authentication settings
    USER_SERVICE_URL: str = "http://user-service:8000"  # URL to User Service (internal Docker network port)
    JWT_SECRET: str = ""  # Fallback for HS256 (not used with RS256)
    JWT_ALGORITHM: str = "RS256"  # Use RS256 asymmetric encryption to match User Service

    # ✅ Only use model_config (remove the inner Config class)
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "allow",  # optional: allows extra env vars
    }

settings = Settings()
