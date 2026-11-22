"""What happens at each risk level (CONTRACT section 6). Dhia only."""

from typing import Optional

from app import db
from app.ai.prompts import crisis_texts
from app.models import Crisis, EscalationOutcome, PatientContext, RiskResult
from app.notify import email


def crisis_payload(lang: str) -> Crisis:
    texts = crisis_texts()
    return Crisis(**texts.get(lang, texts["en"]))


async def escalate(ctx: PatientContext, result: RiskResult, message_id: Optional[str]) -> EscalationOutcome:
    if result.level == "green":
        return EscalationOutcome()
    if not ctx.specialist_id:
        # No specialist (never chose one, or left): nobody to alert, but a crisis still gets the crisis screen.
        if result.level == "red":
            await email.alert_emergency_contact(ctx)
            return EscalationOutcome(crisis=crisis_payload(ctx.language))
        return EscalationOutcome()
    alert = await db.create_alert(ctx.patient_id, result, message_id)
    if result.level == "orange":
        return EscalationOutcome(alert=alert, urgent_appointment=await db.request_urgent_slot(ctx.patient_id))
    # red
    await email.alert_specialist(ctx, alert)
    await email.alert_emergency_contact(ctx)
    return EscalationOutcome(alert=alert, crisis=crisis_payload(ctx.language))
