from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str = "jM5$kP9#nR3@vL7*wQ2&hX4tB8cY6fD1gA"  # Randomly generated secret key
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    USUARIOS_DB_URI: str = "sqlite:///:memory:"

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env"
    )


settings = Settings()