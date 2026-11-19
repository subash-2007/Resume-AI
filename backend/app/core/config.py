import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResumeAI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "resumeai-enterprise-secret-key-mocha-silver-lavender-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database URL: default SQLite with PostgreSQL dialect compatibility, configurable via env
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resumeai.db")
    
    # Uploads and Reports directories
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    REPORT_DIR: str = os.path.join(BASE_DIR, "generated_reports")
    
    # Default Scoring Weights (Configurable per job)
    WEIGHT_TECHNICAL_SKILLS: float = 0.35
    WEIGHT_SEMANTIC_SIMILARITY: float = 0.25
    WEIGHT_EXPERIENCE: float = 0.15
    WEIGHT_EDUCATION: float = 0.10
    WEIGHT_TECHNOLOGY: float = 0.10
    WEIGHT_DOMAIN: float = 0.05
    
    # Strict 3-color palette constants for system-generated media & reports
    COLOR_MOCHA: str = "#6F4E37"
    COLOR_SILVER: str = "#E5E4E2"
    COLOR_LAVENDER: str = "#E6E0F0"

    class Config:
        case_sensitive = True

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)

