from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    ENV: str = "dev"
    PROJECT_NAME: str = "Question Service"

    # ✅ Only use model_config (remove the inner Config class)
    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "allow",  # optional: allows extra env vars
    }

settings = Settings()
