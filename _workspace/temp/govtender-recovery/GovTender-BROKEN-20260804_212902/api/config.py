from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "govtender"
    db_user: str = "govtender"
    db_password: str = ""

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def sync_database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # App
    app_env: str = "development"
    app_url: str = "http://localhost:8000"
    app_secret_key: str = ""
    app_jwt_secret: str = ""

    # Vault
    vault_master_secret: str = ""

    # AI
    anthropic_api_key: str = ""

    # Email
    resend_api_key: str = ""
    mail_from: str = "noreply@govtender.co.za"

    # Storage
    storage_path: str = "uploads/"
    s3_endpoint: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket: str = "govtender-proposals"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_scout: str = ""
    stripe_price_respond: str = ""
    stripe_price_command: str = ""

    # Observability (Pattern 21)
    debug_mode: bool = False
    task_id: str = ""

    # Agent workforce
    agent_session_log_path: str = "sessions/"
    agent_memory_path: str = "memory/"


@lru_cache
def get_settings() -> Settings:
    return Settings()
