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


last_error: Optional[str] = None


def _is_reasoning_model() -> bool:
    return settings.groq_chat_model.startswith("openai/gpt-oss")


async def chat_completion(messages: list[dict], json_mode: bool = False, max_tokens: int = 400, temperature: float = 0.6) -> Optional[str]:
    """Returns the model's text, or None if the AI is off or the call failed (callers must have a fallback)."""
    global last_error
    if not enabled():
        return None
    extra: dict = {}
    if _is_reasoning_model():
        # gpt-oss "thinks" first and those tokens count in the budget: keep thinking short, give room for the answer.
        extra = {"reasoning_effort": "low", "include_reasoning": False}
        max_tokens = max_tokens * 3
    try:
        res = await _groq().chat.completions.create(
            model=settings.groq_chat_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            response_format={"type": "json_object"} if json_mode else None,
            timeout=25,
            extra_body=extra or None,
        )
        text = res.choices[0].message.content
        last_error = None if text else "empty answer from the model"
        return text or None
    except Exception as e:  # network, rate limit, bad key, retired model
        last_error = f"{type(e).__name__}: {e}"[:300]
        log.warning("Groq call failed: %s", last_error)
        return None


async def chat_json(messages: list[dict], max_tokens: int = 400) -> Optional[dict]:
    text = await chat_completion(messages, json_mode=True, max_tokens=max_tokens, temperature=0.2)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def chat_with_tools(messages: list[dict], tools: list[dict], run_tool, max_rounds: int = 3, max_tokens: int = 500) -> Optional[str]:
    """
    Tool-calling loop: the model may call tools, we run them with run_tool(name, args) and send back the results,
    until it answers in plain text. Returns None if the AI is off or fails (caller falls back).
    If the model or API rejects tools, retries once as a plain chat so the user still gets an answer.
    """
    global last_error
    if not enabled():
        return None
    from app.ai.tools import parse_args

    extra: dict = {}
    if _is_reasoning_model():
        extra = {"reasoning_effort": "low", "include_reasoning": False}
        max_tokens = max_tokens * 3
    convo = list(messages)
    for _ in range(max_rounds):
        try:
            res = await _groq().chat.completions.create(
                model=settings.groq_chat_model,
                messages=convo,
                tools=tools,
                tool_choice="auto",
                max_tokens=max_tokens,
                temperature=0.6,
                timeout=30,
                extra_body=extra or None,
            )
        except Exception as e:
            last_error = f"{type(e).__name__}: {e}"[:300]
            log.warning("Groq tool call failed, retrying without tools: %s", last_error)
            return await chat_completion(messages)
        msg = res.choices[0].message
        calls = getattr(msg, "tool_calls", None) or []
        if not calls:
            last_error = None if msg.content else "empty answer from the model"
            return msg.content or None
        convo.append({
            "role": "assistant",
            "content": msg.content or "",
            "tool_calls": [{"id": c.id, "type": "function", "function": {"name": c.function.name, "arguments": c.function.arguments or "{}"}} for c in calls],
        })
        for c in calls:
            result = await run_tool(c.function.name, parse_args(c.function.arguments))
            convo.append({"role": "tool", "tool_call_id": c.id, "content": json.dumps(result, ensure_ascii=False)})
    # too many rounds: ask for a final answer without tools
    return await chat_completion(convo + [{"role": "system", "content": "Answer the user now in 1 to 3 short sentences, without calling tools."}])
