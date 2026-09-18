"""
Application Configuration
"""

import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "KOHLER AI Bathroom Designer & Planner"
    version: str = "1.0.0"
    app_env: str = os.getenv("APP_ENV", "development")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
