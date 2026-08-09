import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
class Settings(BaseSettings):
    PROJECT_NAME: str = "EduShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    MYSQL_HOST: str = Field(default="localhost", env="MYSQL_HOST")
    MYSQL_PORT: int = Field(default=3306, env="MYSQL_PORT")
    MYSQL_USER: str = Field(default="root", env="MYSQL_USER")
    MYSQL_PASSWORD: str = Field(default="password", env="MYSQL_PASSWORD")
    MYSQL_DB: str = Field(default="edushield_db", env="MYSQL_DB")
    DATABASE_URL: str | None = None
    SECRET_KEY: str = Field(
        default="09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7",
        env="SECRET_KEY",
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    # --- AI & LLM Services ---
    GROQ_API_KEY: str = Field(default="", env="GROQ_API_KEY")
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")

    # Pydantic v2 Settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    @property
    def mysql_connection_string(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"mysql+pymysql://{self.MYSQL_USER}:{self.MYSQL_PASSWORD}"
            f"@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        )
settings = Settings()