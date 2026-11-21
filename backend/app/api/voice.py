"""Voice is postponed (CONTRACT v1.1). These return 501 until Dhia adds Groq Whisper (STT) and edge-tts (TTS)."""

from fastapi import APIRouter, Depends, File, UploadFile

from app.auth import current_patient
from app.errors import ApiError
from app.models import Me, TtsBody

router = APIRouter(tags=["voice"])


@router.post("/voice/stt")
async def stt(audio: UploadFile = File(...), me: Me = Depends(current_patient)):
    raise ApiError(501, "not_implemented", "Voice is postponed")


@router.post("/voice/tts")
async def tts(body: TtsBody, me: Me = Depends(current_patient)):
    raise ApiError(501, "not_implemented", "Voice is postponed")
