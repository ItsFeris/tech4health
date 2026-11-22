"""
FastAPI app. Shared file: Dhia only.
Run from backend/:  uvicorn app.main:app --reload
Docs: http://localhost:8000/docs
"""

import logging

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.ai import llm
from app.api import alerts, appointments, chat, checkins, dev, homework, me, patients, questionnaires, sos, specialists, summaries, voice
from app.config import settings
from app.errors import install_error_handlers

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Tech4Health API", version="1.1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
install_error_handlers(app)

for module in (me, specialists, appointments, homework, checkins, patients, alerts, chat, questionnaires, summaries, sos, voice):
    app.include_router(module.router, prefix="/api/v1")

if settings.dev_tools:
    app.include_router(dev.router, prefix="/api/v1")

    @app.get("/dev", include_in_schema=False)
    async def dev_page():
        """Backend test page: http://localhost:8000/dev"""
        return FileResponse(Path(__file__).resolve().parent / "dev" / "playground.html")


@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse("/dev" if settings.dev_tools else "/docs")


@app.get("/health")
async def health():
    return {"ok": True, "database": db.BACKEND, "ai": "groq" if llm.enabled() else "off (canned replies)"}


@app.get("/health/ai")
async def health_ai():
    """Makes one tiny real AI call, to check the key AND the model actually work."""
    if not llm.enabled():
        return {"ok": False, "error": "GROQ_API_KEY is empty in backend/.env"}
    text = await llm.chat_completion([{"role": "user", "content": "Reply with exactly: ahla"}], max_tokens=20, temperature=0)
    return {"ok": bool(text), "model": settings.groq_chat_model, "reply": text, "error": None if text else llm.last_error}
