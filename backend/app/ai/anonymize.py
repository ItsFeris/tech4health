"""Runs on every text before it reaches llm.py: removes names, emails and phone numbers. Dhia only."""

import re

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
PHONE = re.compile(r"(?:\+?216[\s-]?)?\b\d{2}[\s-]?\d{3}[\s-]?\d{3}\b")


def anonymize(text: str, names: list[str]) -> str:
    out = EMAIL.sub("[email]", text)
    out = PHONE.sub("[phone]", out)
    for name in names:
        if name and len(name) > 1:
            out = re.sub(rf"\b{re.escape(name)}\b", "[name]", out, flags=re.IGNORECASE)
    return out
