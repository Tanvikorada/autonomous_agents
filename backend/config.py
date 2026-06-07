"""
config.py — Centralized application settings.
All values are read from .env (or system environment).
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # LLM provider selection
    llm_provider: Literal["groq", "openai"] = "groq"

    # API keys
    groq_api_key: str = ""
    openai_api_key: str = ""

    # Model names
    groq_model: str = "llama3-70b-8192"
    openai_model: str = "gpt-4o-mini"

    # App
    app_env: str = "development"
    log_level: str = "INFO"

    @field_validator("llm_provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in ("groq", "openai"):
            raise ValueError("LLM_PROVIDER must be 'groq' or 'openai'")
        return v

    @property
    def active_model(self) -> str:
        return self.groq_model if self.llm_provider == "groq" else self.openai_model

    @property
    def active_api_key(self) -> str:
        return self.groq_api_key if self.llm_provider == "groq" else self.openai_api_key


# Singleton — import this everywhere
settings = Settings()
