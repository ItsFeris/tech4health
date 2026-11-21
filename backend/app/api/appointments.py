from fastapi import APIRouter, Depends

from app import db
from app.auth import current_specialist, current_user
from app.errors import forbidden, not_found
from app.models import Appointment, Me, NewAppointmentBody, SessionNote, SessionNoteBody, UpdateAppointmentBody

router = APIRouter(tags=["appointments"])


async def _owned(me: Me, appointment_id: str) -> Appointment:
    appt = await db.get_appointment(appointment_id)
    if not appt:
        raise not_found("Appointment")
    if me.id not in (appt.patient_id, appt.specialist_id):
        raise forbidden("Not your appointment")
    return appt


@router.get("/appointments", response_model=list[Appointment])
async def list_appointments(me: Me = Depends(current_user)):
    return await db.list_appointments(me)


@router.post("/appointments", response_model=Appointment)
async def create_appointment(body: NewAppointmentBody, me: Me = Depends(current_specialist)):
    if not await db.is_my_patient(me.id, body.patient_id):
        raise forbidden("Not your patient")
    return await db.create_appointment(me.id, body)


@router.patch("/appointments/{appointment_id}", response_model=Appointment)
async def update_appointment(appointment_id: str, body: UpdateAppointmentBody, me: Me = Depends(current_user)):
    await _owned(me, appointment_id)
    return await db.update_appointment(appointment_id, body)


@router.put("/appointments/{appointment_id}/notes", response_model=SessionNote)
async def save_notes(appointment_id: str, body: SessionNoteBody, me: Me = Depends(current_specialist)):
    await _owned(me, appointment_id)
    return await db.save_session_note(appointment_id, body)
