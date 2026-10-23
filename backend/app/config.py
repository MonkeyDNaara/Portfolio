from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./portfolio.db"
    jwt_secret: str = ""
    jwt_expire_minutes: int = 60
    admin_username: str = "admin"
    admin_password: str = ""
    cors_origins: str = "http://localhost:5173"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5"
    github_token: str = ""
    # login brute-force protection (see rate_limit.py)
    login_max_failures: int = 5
    login_global_max_failures: int = 50
    login_window_seconds: int = 15 * 60
    # Proxies whose X-Forwarded-For entries are skipped, e.g. "private,cloudflare" on Render.
    # Empty (local, Docker): the direct peer is the client. See rate_limit.client_ip.
    trusted_proxy_networks: str = ""

    @property
    def sqlalchemy_url(self) -> str:
        """Neon/Render hand out postgres:// URLs, SQLAlchemy wants the driver name."""
        url = self.database_url
        for prefix in ("postgres://", "postgresql://"):
            if url.startswith(prefix):
                return "postgresql+psycopg2://" + url[len(prefix):]
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
