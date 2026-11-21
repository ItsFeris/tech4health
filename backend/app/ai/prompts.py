"""Loads B's prompt files from app/ai/prompts/. Dhia only (B edits the .md / .json files)."""

import json
from functools import lru_cache
from pathlib import Path

DIR = Path(__file__).resolve().parent / "prompts"


@lru_cache
def load(name: str) -> str:
    return (DIR / name).read_text(encoding="utf-8")


@lru_cache
def crisis_texts() -> dict:
    return json.loads(load("crisis.json"))
