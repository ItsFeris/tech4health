from typing import Optional

from fastapi import APIRouter, Depends

from app import db
from app.ai import questionnaires
from app.auth import current_patient, current_user, resolve_patient_id
from app.models import Me, QuestionnaireBody, QuestionnaireReply, QuestionnaireResult
from app.risk import engine
from app.risk.escalate import escalate

router = APIRouter(tags=["questionnaires"])


@router.post("/questionnaires", response_model=QuestionnaireReply)
async def submit(body: QuestionnaireBody, me: Me = Depends(current_patient)):
    score, severity = questionnaires.score(body.kind, body.answers)
    result = await db.save_questionnaire(me.id, body.kind, body.answers, score, severity)
    risk = engine.assess_questionnaire(body.kind, body.answers)
    outcome = await escalate(await db.get_patient_context(me.id), risk, None)
    return QuestionnaireReply(result=result, risk=risk, crisis=outcome.crisis)


@router.get("/questionnaires", response_model=list[QuestionnaireResult])
async def list_results(patient_id: Optional[str] = None, me: Me = Depends(current_user)):
    return await db.list_questionnaires(await resolve_patient_id(me, patient_id))
