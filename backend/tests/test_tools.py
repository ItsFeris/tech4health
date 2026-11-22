"""AI tools: intent fallback (no AI) and the tool-calling loop with a fake Groq client."""

import os

os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""

import json  # noqa: E402
from types import SimpleNamespace as NS  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

from app.ai import llm  # noqa: E402
from app.main import app  # noqa: E402

c = TestClient(app)
P = {"Authorization": "Bearer demo-patient"}


def test_intent_fallback_breathing_card():
    r = c.post("/api/v1/chat", json={"content": "can we do a breathing exercise?"}, headers=P).json()
    assert r["risk"]["level"] == "green"
    assert r["actions"][0]["type"] == "breathing"
    assert r["ai_message"]["content"]


def test_intent_fallback_next_session_and_plain_chat():
    r = c.post("/api/v1/chat", json={"content": "when is my next session?"}, headers=P).json()
    assert r["actions"] and r["actions"][0]["type"] == "next_session"
    r = c.post("/api/v1/chat", json={"content": "I had pasta today"}, headers=P).json()
    assert r["actions"] == []


def test_crisis_has_no_tools():
    r = c.post("/api/v1/chat", json={"content": "I want to die, start breathing"}, headers=P).json()
    assert r["risk"]["level"] == "red" and r["actions"] == []


class FakeGroq:
    """First answer: call log_mood + start_breathing_exercise. Second answer: plain text."""

    def __init__(self):
        self.rounds = []
        self.chat = NS(completions=NS(create=self.create))

    async def create(self, **kw):
        if "tools" not in kw:  # risk classifier / plain chat
            return NS(choices=[NS(message=NS(content='{"level": "green", "reason": "ok"}', tool_calls=None))])
        self.rounds.append(kw)
        if len(self.rounds) == 1:
            calls = [
                NS(id="t1", function=NS(name="log_mood", arguments=json.dumps({"mood": 2, "note": "stressed"}))),
                NS(id="t2", function=NS(name="start_breathing_exercise", arguments='{"pattern": "box"}')),
            ]
            return NS(choices=[NS(message=NS(content=None, tool_calls=calls))])
        return NS(choices=[NS(message=NS(content="Saved. Let's breathe together.", tool_calls=None))])


def test_tool_loop_with_fake_model(monkeypatch):
    fake = FakeGroq()
    monkeypatch.setattr(llm, "enabled", lambda: True)
    monkeypatch.setattr(llm, "_groq", lambda: fake)
    r = c.post("/api/v1/chat", json={"content": "feeling a bit stressed today"}, headers=P).json()
    types = [a["type"] for a in r["actions"]]
    assert types == ["mood_logged", "breathing"]
    assert r["actions"][0]["checkin"]["mood"] == 2
    assert r["actions"][1]["pattern"] == "box"
    assert r["ai_message"]["content"] == "Saved. Let's breathe together."
    tool_msgs = [m for m in fake.rounds[1]["messages"] if m["role"] == "tool"]
    assert len(tool_msgs) == 2 and json.loads(tool_msgs[0]["content"])["ok"]
    assert "tools" in fake.rounds[0]


def test_dev_chat_dry_run_saves_nothing(monkeypatch):
    fake = FakeGroq()
    monkeypatch.setattr(llm, "enabled", lambda: True)
    monkeypatch.setattr(llm, "_groq", lambda: fake)
    before = len(c.get("/api/v1/checkins", headers=P).json())
    r = c.post("/api/v1/dev/chat", json={"text": "stressed", "nickname": "Test", "language": "en"}).json()
    assert [t["name"] for t in r["tool_calls"]] == ["log_mood", "start_breathing_exercise"]
    assert len(c.get("/api/v1/checkins", headers=P).json()) == before
