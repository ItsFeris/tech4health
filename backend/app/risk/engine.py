"""
Risk engine (CONTRACT section 6). Dhia only (B edits keywords.txt).
Three layers, the highest level wins:
  1. rules  — B's keyword list, instant, works even when the AI is down
  2. llm    — Groq classifier for what keywords miss
  3. trend  — falling mood over the last check-ins
"""

import re
import unicodedata
from functools import lru_cache
from pathlib import Path

from app.ai import llm
from app.ai.anonymize import anonymize
from app.ai.prompts import load
from app.models import PatientContext, RiskResult

LEVEL = {"green": 0, "orange": 1, "red": 2}
GREEN = RiskResult(level="green", source="rules", reason="No warning signs.")


def highest(*results: RiskResult) -> RiskResult:
    return max(results, key=lambda r: LEVEL[r.level])


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).lower()
    return re.sub(r"\s+", " ", text)


@lru_cache
def keywords() -> dict[str, list[str]]:
    out: dict[str, list[str]] = {"red": [], "orange": []}
    section = None
    for raw in (Path(__file__).resolve().parent / "keywords.txt").read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line in ("[red]", "[orange]"):
            section = line[1:-1]
        elif section:
            out[section].append(_norm(line))
    return out


def assess_rules(text: str) -> RiskResult:
    t = _norm(text)
    for level in ("red", "orange"):
        hit = next((k for k in keywords()[level] if k in t), None)
        if hit:
            return RiskResult(level=level, source="rules", reason=f'Keyword "{hit}" detected.')
    return GREEN


async def assess_llm(ctx: PatientContext, text: str) -> RiskResult:
    history = "\n".join(f"{m.sender}: {anonymize(m.content, [ctx.nickname])}" for m in ctx.recent_messages[-6:])
    out = await llm.chat_json([
        {"role": "system", "content": load("risk_classifier.md")},
        {"role": "user", "content": f"Recent conversation:\n{history}\n\nLAST MESSAGE:\n{anonymize(text, [ctx.nickname])}"},
    ], max_tokens=120)
    if not out or out.get("level") not in LEVEL:
        return RiskResult(level="green", source="llm", reason="AI check unavailable.")
    return RiskResult(level=out["level"], source="llm", reason=str(out.get("reason", ""))[:200] or "Flagged by the AI check.")


async def assess_message(ctx: PatientContext, text: str) -> RiskResult:
    rules = assess_rules(text)
    if rules.level == "red":
        return rules  # no need to wait for the AI
    return highest(rules, await assess_llm(ctx, text))


def assess_trend(ctx: PatientContext) -> RiskResult:
    moods = [c.mood for c in ctx.recent_checkins]
    if len(moods) >= 4:
        recent, before = moods[-3:], moods[:-3]
        if sum(recent) / 3 <= 2 and sum(before) / len(before) - sum(recent) / 3 >= 1:
            return RiskResult(level="orange", source="trend", reason=f"Mood fell to {recent} over the last check-ins.")
    if moods and moods[-1] == 1:
        return RiskResult(level="orange", source="trend", reason="Lowest possible mood in the latest check-in.")
    return RiskResult(level="green", source="trend", reason="Mood is steady.")


def assess_questionnaire(kind: str, answers: list[int]) -> RiskResult:
    """PHQ-9 question 9 (thoughts of self-harm): 1 -> orange, >= 2 -> red. Team rule, to check with a specialist."""
    if kind == "phq9" and len(answers) == 9:
        if answers[8] >= 2:
            return RiskResult(level="red", source="questionnaire", reason="PHQ-9 question 9 answered 'more than half the days' or more.")
        if answers[8] == 1:
            return RiskResult(level="orange", source="questionnaire", reason="PHQ-9 question 9 answered 'several days'.")
    return RiskResult(level="green", source="questionnaire", reason="No warning signs in the questionnaire.")
