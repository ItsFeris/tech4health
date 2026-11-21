from datetime import date

from fastapi import APIRouter, Depends

from app import db
from app.ai.summary import generate_weekly_summary
from app.auth import current_specialist, resolve_patient_id
from app.errors import ApiError
from app.models import GenerateSummaryBody, Me, WeeklySummary

router = APIRouter(tags=["summaries"])


@router.post("/summaries/generate", response_model=WeeklySummary)
async def generate(body: GenerateSummaryBody, me: Me = Depends(current_specialist)):
    pid = await resolve_patient_id(me, body.patient_id)
    try:
        if date.fromisoformat(body.week_start).weekday() != 0:
            raise ValueError
    except ValueError:
        raise ApiError(422, "validation", "week_start must be a Monday, YYYY-MM-DD")
    content = await generate_weekly_summary(pid, body.week_start)
    return await db.save_summary(pid, body.week_start, content)


@router.get("/summaries", response_model=list[WeeklySummary])
async def list_summaries(patient_id: str, me: Me = Depends(current_specialist)):
    return await db.list_summaries(await resolve_patient_id(me, patient_id))
