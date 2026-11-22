"""Settings read from backend/.env. Shared file: Dhia only."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


@dataclass(frozen=True)
class Settings:
    supabase_url: str = _env("SUPABASE_URL")
    supabase_service_key: str = _env("SUPABASE_SERVICE_KEY")
    supabase_jwt_secret: str = _env("SUPABASE_JWT_SECRET")
    groq_api_key: str = _env("GROQ_API_KEY")
    groq_chat_model: str = _env("GROQ_CHAT_MODEL", "openai/gpt-oss-120b")
    groq_stt_model: str = _env("GROQ_STT_MODEL", "whisper-large-v3")
    smtp_host: str = _env("SMTP_HOST")
    smtp_port: int = int(_env("SMTP_PORT", "587") or 587)
    smtp_user: str = _env("SMTP_USER")
    smtp_pass: str = _env("SMTP_PASS")
    frontend_origin: str = _env("FRONTEND_ORIGIN", "http://localhost:5173")
    # Test page at /dev + /api/v1/dev/*. Keep true on your laptop, set false on any public server.
    dev_tools: bool = _env("DEV_TOOLS", "false").lower() in ("1", "true", "yes")

    @property
    def demo_mode(self) -> bool:
        """No Supabase configured: in-memory data and demo tokens."""
        return not (self.supabase_url and self.supabase_service_key)


settings = Settings()
