from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    
    # Judge0 Configuration
    judge0_url: str = "http://judgezero-server:2358"
    judge0_auth_token: Optional[str] = None
    
    # Execution Limits
    default_time_limit: float = 5.0  # seconds
    default_memory_limit: int = 128000  # KB (128 MB)
    max_time_limit: float = 15.0  # seconds
    max_memory_limit: int = 512000  # KB (512 MB)
    
    # Server Configuration
    port: int = 3010


settings = Settings()
