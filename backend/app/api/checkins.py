from typing import Optional

from fastapi import APIRouter, Depends, Query

from app import db
from app.ai import companion
from app.auth import current_patient, current_user, resolve_patient_id
from app.models import Checkin, CheckinBody, CheckinReply, Me
from app.risk import engine
from app.risk.escalate import escalate

router = APIRouter(tags=["checkins"])


@router.post("/checkins", response_model=CheckinReply)
async def create_checkin(body: CheckinBody, me: Me = Depends(current_patient)):
    checkin = await db.save_checkin(me.id, body.mood, body.note)
    ctx = await db.get_patient_context(me.id)  # includes the new check-in for the trend
    risk = engine.highest(engine.assess_trend(ctx), engine.assess_rules(body.note) if body.note else engine.GREEN)
    if body.note and risk.level != "red":
        risk = engine.highest(risk, await engine.assess_llm(ctx, body.note))
    outcome = await escalate(ctx, risk, None)
    ai_reply = (await companion.checkin_reply(ctx, body.mood, body.note)) if risk.level != "red" else outcome.crisis.body if outcome.crisis else ""
    return CheckinReply(checkin=checkin, ai_reply=ai_reply, risk=risk, crisis=outcome.crisis)


@router.get("/checkins", response_model=list[Checkin])
async def list_checkins(
    patient_id: Optional[str] = None,
    date_from: Optional[str] = Query(default=None, alias="from"),
    date_to: Optional[str] = Query(default=None, alias="to"),
    me: Me = Depends(current_user),
):
    return await db.list_checkins(await resolve_patient_id(me, patient_id), date_from, date_to)
