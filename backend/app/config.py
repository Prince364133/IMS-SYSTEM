from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # API configuration
    PROJECT_NAME: str = "Instaura IMS API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./instaura.db"
    
    # JWT & Auth
    SECRET_KEY: str = "your_super_secret_jwt_key_here_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15  # 15 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7    # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]  # In production, change to specific domains
    
    # Uploads
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5242880  # 5MB
    
    # Environment
    ENV: str = "development"
    
    # Pydantic Settings configuration to read from .env file
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

# Global settings instance
settings = Settings()
