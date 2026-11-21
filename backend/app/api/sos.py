from fastapi import APIRouter, Depends

from app import db
from app.auth import current_patient
from app.errors import ApiError
from app.models import Me, RiskResult, SosReply
from app.risk.escalate import escalate

router = APIRouter(tags=["sos"])


@router.post("/sos", response_model=SosReply)
async def sos(me: Me = Depends(current_patient)):
    ctx = await db.get_patient_context(me.id)
    if not ctx.specialist_id:
        raise ApiError(409, "no_specialist", "No specialist assigned yet")
    outcome = await escalate(ctx, RiskResult(level="red", source="sos", reason="Patient pressed the SOS button."), None)
    return SosReply(alert=outcome.alert, crisis=outcome.crisis)
