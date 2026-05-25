import sys

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://desiface:desiface@localhost:5432/desiface"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Email (optional — if not set, links are logged to console)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = "noreply@desiface.com"
    FRONTEND_URL: str = "http://localhost:3001"

    # Dev mode: return tokens in API responses — MUST be False in production
    DEV_MODE: bool = False

    class Config:
        env_file = ".env"


settings = Settings()

if settings.SECRET_KEY == "change-me-in-production" and not settings.DEV_MODE:
    print("FATAL: SECRET_KEY is not set. Set it in .env before running in production.", file=sys.stderr)
    sys.exit(1)
