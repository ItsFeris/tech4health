"""Smoke tests in DEMO mode (no Supabase, no Groq). Run from backend/:  pytest -q"""

import os

os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

c = TestClient(app)
P = {"Authorization": "Bearer demo-patient"}
S = {"Authorization": "Bearer demo-specialist"}
B_ID = "00000000-0000-4000-8000-0000000000b1"
C_ID = "00000000-0000-4000-8000-0000000000c1"


def test_health_and_auth():
    assert c.get("/health").json()["database"] == "memory"
    r = c.get("/api/v1/me")
    assert r.status_code == 401 and r.json()["error"]["code"] == "unauthorized"
    assert c.get("/api/v1/me", headers=P).json()["role"] == "patient"
    assert c.get("/api/v1/me", headers=S).json()["role"] == "specialist"


def test_role_checks():
    assert c.get("/api/v1/patients", headers=P).status_code == 403
    assert c.post("/api/v1/chat", json={"content": "hi"}, headers=S).status_code == 403
    assert c.get("/api/v1/homework", params={"patient_id": "nope"}, headers=S).status_code == 403


def test_patients_sorted_by_risk():
    rows = c.get("/api/v1/patients", headers=S).json()
    assert [r["current_risk"] for r in rows][0] == "orange"
    assert len(rows[0]["mood_7d"]) == 7


def test_green_chat():
    r = c.post("/api/v1/chat", json={"content": "Lyoum mezyen, 3malt el exercice"}, headers=P).json()
    assert r["risk"]["level"] == "green" and r["crisis"] is None and r["ai_message"]["content"]
    hist = c.get("/api/v1/chat/history", headers=P).json()
    assert hist[-1]["sender"] == "ai"


def test_red_chat_creates_live_alert():
    before = len(c.get("/api/v1/alerts", params={"status": "open"}, headers=S).json())
    r = c.post("/api/v1/chat", json={"content": "ma3adch nheb n3ich"}, headers=P).json()
    assert r["risk"]["level"] == "red" and r["risk"]["source"] == "rules"
    assert r["crisis"]["title"] == "Enti mouch wa7dek"  # demo patient speaks darija
    alerts = c.get("/api/v1/alerts", params={"status": "open"}, headers=S).json()
    assert len(alerts) == before + 1
    assert alerts[0]["level"] == "red" and alerts[0]["message_excerpt"] == "ma3adch nheb n3ich"
    rows = c.get("/api/v1/patients", headers=S).json()
    assert rows[0]["patient_id"] == C_ID and rows[0]["current_risk"] == "red"
    fixed = c.patch(f"/api/v1/alerts/{alerts[0]['id']}", json={"status": "false_alarm"}, headers=S).json()
    assert fixed["status"] == "false_alarm"


def test_checkin_questionnaire_sos():
    r = c.post("/api/v1/checkins", json={"mood": 4, "note": "good day"}, headers=P).json()
    assert r["risk"]["level"] == "green" and r["ai_reply"]
    q = c.post("/api/v1/questionnaires", json={"kind": "phq9", "answers": [1, 1, 2, 1, 0, 1, 1, 0, 2]}, headers=P).json()
    assert q["result"]["score"] == 9 and q["result"]["severity"] == "mild" and q["risk"]["level"] == "red"
    bad = c.post("/api/v1/questionnaires", json={"kind": "gad7", "answers": [1, 2]}, headers=P)
    assert bad.status_code == 422 and bad.json()["error"]["code"] == "validation"
    s = c.post("/api/v1/sos", headers=P).json()
    assert s["alert"]["source"] == "sos" and s["crisis"]["actions"]


def test_homework_and_appointments():
    hw = c.post("/api/v1/homework", json={"patient_id": C_ID, "title": "Breathing 2x a day"}, headers=S).json()
    assert c.patch(f"/api/v1/homework/{hw['id']}", json={"done": True}, headers=P).json()["done"] is True
    assert any(h["id"] == hw["id"] for h in c.get("/api/v1/homework", headers=P).json())
    appt = c.post("/api/v1/appointments", json={"patient_id": C_ID, "starts_at": "2026-12-01T15:00:00Z", "type": "weekly"}, headers=S).json()
    note = c.put(f"/api/v1/appointments/{appt['id']}/notes", json={"notes": "private", "takeaways": "Keep breathing"}, headers=S).json()
    assert note["takeaways"] == "Keep breathing"
    assert any(a["id"] == appt["id"] for a in c.get("/api/v1/appointments", headers=P).json())


def test_orange_trend_books_urgent_slot_and_summary():
    r = c.post("/api/v1/chat", json={"content": "je n'en peux plus"}, headers=P).json()
    assert r["risk"]["level"] == "orange" and r["urgent_appointment"]["type"] == "urgent"
    from datetime import date, timedelta

    monday = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    s = c.post("/api/v1/summaries/generate", json={"patient_id": B_ID, "week_start": monday}, headers=S).json()
    assert s["content"]["mood_trend"] in ("improving", "stable", "declining")
    assert c.get("/api/v1/summaries", params={"patient_id": B_ID}, headers=S).json()[0]["id"] == s["id"]
    assert c.post("/api/v1/summaries/generate", json={"patient_id": B_ID, "week_start": "2026-11-18"}, headers=S).status_code == 422


def test_consent_gates_chat_history():
    assert c.get("/api/v1/chat/history", params={"patient_id": C_ID}, headers=S).status_code == 403
    c.patch("/api/v1/me/consent", json={"consent": "full_chat"}, headers=P)
    assert c.get("/api/v1/chat/history", params={"patient_id": C_ID}, headers=S).status_code == 200


def test_voice_postponed():
    assert c.post("/api/v1/voice/tts", json={"text": "hi", "language": "en"}, headers=P).status_code == 501
