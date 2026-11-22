"""v1.4: choose a specialist, verification, takeaways (DEMO mode)."""

import os

os.environ["SUPABASE_URL"] = ""
os.environ["SUPABASE_SERVICE_KEY"] = ""
os.environ["GROQ_API_KEY"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app import db  # noqa: E402
from app.main import app  # noqa: E402

c = TestClient(app)
P = {"Authorization": "Bearer demo-patient"}
S = {"Authorization": "Bearer demo-specialist"}


def test_list_and_get_specialists():
    cards = c.get("/api/v1/specialists", headers=P).json()
    assert len(cards) == 4 and all(x["verified"] for x in cards)
    salma = c.get(f"/api/v1/specialists/{db.SPECIALIST_ID}", headers=P).json()
    assert salma["nickname"] == "Dr. Salma Trabelsi" and salma["price"] == 70
    assert c.get("/api/v1/specialists/nope", headers=P).status_code == 404
    assert c.get("/api/v1/specialists").status_code == 401


def test_patient_onboarding_with_choice(monkeypatch):
    monkeypatch.setitem(db.DEMO_TOKENS, "new-patient", "00000000-0000-4000-8000-00000000aaaa")
    H = {"Authorization": "Bearer new-patient"}
    omar = "00000000-0000-4000-8000-000000000004"
    me = c.post("/api/v1/onboarding/patient", json={"nickname": "Sara", "language": "fr", "consent": "summary_only", "specialist_id": omar}, headers=H).json()
    assert me["specialist_id"] == omar


def test_specialist_verification(monkeypatch):
    monkeypatch.setitem(db.DEMO_TOKENS, "new-spec", "00000000-0000-4000-8000-00000000bbbb")
    H = {"Authorization": "Bearer new-spec"}
    body = {"nickname": "Dr. Test", "language": "fr", "specialty": "Psychologist", "languages": ["fr", "en"], "years": 3, "price": 55}
    assert c.post("/api/v1/onboarding/specialist", json=body, headers=H).status_code == 200
    card = c.get("/api/v1/specialists/00000000-0000-4000-8000-00000000bbbb", headers=H).json()
    assert card["verified"] is False and card["price"] == 55
    assert "00000000-0000-4000-8000-00000000bbbb" not in [x["id"] for x in c.get("/api/v1/specialists", headers=H).json()]
    assert c.post("/api/v1/me/verify", json={"id_card": True, "license": True, "selfie": False}, headers=H).status_code == 422
    assert c.post("/api/v1/me/verify", json={"id_card": True, "license": True, "selfie": True}, headers=H).json()["verified"] is True
    assert c.post("/api/v1/me/verify", json={"id_card": True, "license": True, "selfie": True}, headers=P).status_code == 403


def test_takeaways():
    t = c.get("/api/v1/takeaways/latest", headers=P).json()
    assert t and t["takeaways"] and t["session_date"]
    assert c.get("/api/v1/takeaways/latest", headers=S).status_code == 403
