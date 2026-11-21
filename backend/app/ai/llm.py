"""The ONLY code that calls the Groq chat API (CONTRACT section 3). Dhia only."""

import json
import logging
from typing import Optional

from app.config import settings

log = logging.getLogger("t4h.llm")
_client = None


def enabled() -> bool:
    return bool(settings.groq_api_key)


def _groq():
    global _client
    if _client is None:
        from groq import AsyncGroq

        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def chat_completion(messages: list[dict], json_mode: bool = False, max_tokens: int = 400, temperature: float = 0.6) -> Optional[str]:
    """Returns the model's text, or None if the AI is off or the call failed (callers must have a fallback)."""
    if not enabled():
        return None
    try:
        res = await _groq().chat.completions.create(
            model=settings.groq_chat_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"} if json_mode else None,
            timeout=20,
        )
        return res.choices[0].message.content
    except Exception as e:  # network, rate limit, bad key
        log.warning("Groq call failed: %s", e)
        return None


async def chat_json(messages: list[dict], max_tokens: int = 400) -> Optional[dict]:
    text = await chat_completion(messages, json_mode=True, max_tokens=max_tokens, temperature=0.2)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None
