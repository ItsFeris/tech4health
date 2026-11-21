"""Alert emails. Prints to the console when SMTP is not configured. Dhia only."""

import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.config import settings
from app.models import Alert, PatientContext

log = logging.getLogger("t4h.email")


def _send(to: str, subject: str, body: str) -> None:
    if not (settings.smtp_host and settings.smtp_user and to):
        log.warning("EMAIL (not sent, SMTP off) to=%s | %s | %s", to or "-", subject, body)
        return
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = settings.smtp_user, to, subject
    msg.set_content(body)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as s:
        s.starttls()
        s.login(settings.smtp_user, settings.smtp_pass)
        s.send_message(msg)


async def send(to: str, subject: str, body: str) -> None:
    try:
        await asyncio.to_thread(_send, to, subject, body)
    except Exception as e:  # an email failure must never block the crisis flow
        log.error("Email failed: %s", e)


async def alert_specialist(ctx: PatientContext, alert: Alert) -> None:
    # Specialist emails are not stored yet: the live dashboard alert is the main channel.
    log.warning("RED ALERT for specialist %s: patient %s — %s", ctx.specialist_id, ctx.nickname, alert.reason)


async def alert_emergency_contact(ctx: PatientContext) -> None:
    if ctx.emergency_email:
        await send(
            ctx.emergency_email,
            "Tech4Health: please check on someone close to you",
            f"Hello {ctx.emergency_name or ''},\n\n{ctx.nickname} listed you as their trusted contact on Tech4Health. "
            "Our safety system detected that they may need support right now. Please reach out to them.\n\n"
            "Their specialist has also been alerted.",
        )
