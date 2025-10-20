from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    ENV: str = "dev"
    PROJECT_NAME: str = "Question Service"
    
    # JWT Authentication settings
    USER_SERVICE_URL: str = "http://user-service:8000"  # URL to User Service
    JWT_SECRET: str = ""  # Fallback for HS256 (should match User Service)
    JWT_ALGORITHM: str = "HS256"  # "HS256" or "RS256"

    # ✅ Only use model_config (remove the inner Config class)
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "allow",  # optional: allows extra env vars
    }

settings = Settings()
