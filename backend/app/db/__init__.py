"""
The ONLY code that touches the database (CONTRACT section 3). Dhia only.
Everyone imports from here:  from app import db  ->  await db.save_message(...)
Picks the in-memory demo store when Supabase is not configured.
"""

from app.config import settings

if settings.demo_mode:
    from .memory import *  # noqa: F401,F403
    from .memory import DEMO_TOKENS  # noqa: F401
    BACKEND = "memory"
else:
    from .supabase_repo import *  # noqa: F401,F403
    DEMO_TOKENS: dict[str, str] = {}
    BACKEND = "supabase"
