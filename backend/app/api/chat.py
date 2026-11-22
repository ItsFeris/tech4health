from typing import Optional

from fastapi import APIRouter, Depends, Query

from app import db
from app.ai import companion
from app.ai.tools import ToolRun
from app.auth import current_patient, current_user, resolve_patient_id
from app.errors import forbidden
from app.models import ChatBody, ChatReply, Me, Message
from app.risk import engine
from app.risk.escalate import escalate

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatReply)
async def chat(body: ChatBody, me: Me = Depends(current_patient)):
    # CONTRACT section 6, steps 1-6 (risk is scored before saving so the stored message keeps its level)
    ctx = await db.get_patient_context(me.id)
    risk = engine.highest(await engine.assess_message(ctx, body.content), engine.assess_trend(ctx))
    user_msg = await db.save_message(me.id, "user", body.content, risk.level)
    outcome = await escalate(ctx, risk, user_msg.id)
    run = ToolRun(ctx=ctx)
    if risk.level == "red" and outcome.crisis:
        text = outcome.crisis.body  # crisis: no AI, no tools, just the crisis payload
    else:
        text = await companion.reply(ctx, body.content, risk, tools=run)
    ai_msg = await db.save_message(me.id, "ai", text, None)
    return ChatReply(
        user_message=user_msg,
        ai_message=ai_msg,
        risk=risk,
        crisis=outcome.crisis,
        urgent_appointment=outcome.urgent_appointment or run.urgent_appointment,
        actions=run.actions,
    )


@router.get("/chat/history", response_model=list[Message])
async def history(patient_id: Optional[str] = None, limit: int = Query(default=50, ge=1, le=500), me: Me = Depends(current_user)):
    pid = await resolve_patient_id(me, patient_id)
    if me.role == "specialist":
        ctx = await db.get_patient_context(pid)
        if ctx.consent != "full_chat":
            raise forbidden("This patient shares summaries only, not the full chat")
    return await db.list_messages(pid, limit)
