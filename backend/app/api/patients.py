from fastapi import APIRouter, Depends

from app import db
from app.auth import current_specialist
from app.models import Me, PatientRow

router = APIRouter(tags=["patients"])


@router.get("/patients", response_model=list[PatientRow])
async def list_patients(me: Me = Depends(current_specialist)):
    return await db.list_patients(me.id)
