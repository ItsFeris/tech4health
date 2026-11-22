"""The /dev test page endpoints (DEV_TOOLS=true). Run from backend/:  pytest -q"""

import os

os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""
os.environ["DEV_TOOLS"] = "true"

import importlib  # noqa: E402

import app.config  # noqa: E402

importlib.reload(app.config)
import app.main  # noqa: E402

importlib.reload(app.main)
from fastapi.testclient import TestClient  # noqa: E402

c = TestClient(app.main.app)


def test_page_and_info():
    r = c.get("/dev")
    assert r.status_code == 200 and "Backend test page" in r.text
    i = c.get("/api/v1/dev/info").json()
    assert i["keywords"]["red"] > 5 and "companion.md" in i["prompts"]
    assert c.post("/api/v1/dev/reload").status_code == 200


def test_chat_layers():
    r = c.post("/api/v1/dev/chat", json={"text": "ma3adch nheb n3ich", "language": "darija"}).json()
    assert r["risk"]["rules"]["level"] == "red" and r["risk"]["final"]["level"] == "red" and r["crisis"]
    g = c.post("/api/v1/dev/chat", json={"text": "lyoum mezyen", "language": "fr", "history": [{"sender": "user", "content": "salut"}]}).json()
    assert g["risk"]["final"]["level"] == "green" and g["reply"]
    t = c.post("/api/v1/dev/chat", json={"text": "ok", "moods": [4, 4, 4, 2, 1, 2]}).json()
    assert t["risk"]["trend"]["level"] == "orange"


def test_risk_checkin_summary():
    assert c.post("/api/v1/dev/risk", json={"text": "je n'en peux plus"}).json()["final"]["level"] == "orange"
    k = c.post("/api/v1/dev/checkin", json={"mood": 1, "note": "bad day", "moods": [4, 3]}).json()
    assert k["risk"]["level"] == "orange" and k["reply"]
    s = c.post("/api/v1/dev/summary", json={"week_start": "2026-11-16", "checkins": [{"day": "2026-11-16", "mood": 4}, {"day": "2026-11-17", "mood": 3}, {"day": "2026-11-18", "mood": 1, "note": "empty"}], "homework": [{"title": "Sleep diary"}]}).json()
    assert s["summary"]["mood_trend"] == "declining" and s["summary"]["homework"][0]["title"] == "Sleep diary"
