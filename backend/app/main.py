"""
FastAPI app. Shared file: Dhia only.
Run from backend/:  uvicorn app.main:app --reload
Docs: http://localhost:8000/docs
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.ai import llm
from app.api import alerts, appointments, chat, checkins, homework, me, patients, questionnaires, sos, summaries, voice
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

for module in (me, appointments, homework, checkins, patients, alerts, chat, questionnaires, summaries, sos, voice):
    app.include_router(module.router, prefix="/api/v1")


@app.get("/health")
async def health():
    return {"ok": True, "database": db.BACKEND, "ai": "groq" if llm.enabled() else "off (canned replies)"}
