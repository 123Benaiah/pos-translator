from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings

# backend/.env sits next to app/ (i.e. parent of this file's directory).
# Resolved absolutely so it works whether you run from repo root or backend/.
_BACKEND_ENV = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "pos_translator"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    model_config = {"env_file": str(_BACKEND_ENV), "env_file_encoding": "utf-8"}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
