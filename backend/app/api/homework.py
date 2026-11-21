from typing import Optional

from fastapi import APIRouter, Depends

from app import db
from app.auth import current_specialist, current_user, resolve_patient_id
from app.errors import forbidden, not_found
from app.models import Homework, Me, NewHomeworkBody, UpdateHomeworkBody

router = APIRouter(tags=["homework"])


@router.get("/homework", response_model=list[Homework])
async def list_homework(patient_id: Optional[str] = None, me: Me = Depends(current_user)):
    return await db.list_homework(await resolve_patient_id(me, patient_id))


@router.post("/homework", response_model=Homework)
async def create_homework(body: NewHomeworkBody, me: Me = Depends(current_specialist)):
    if not await db.is_my_patient(me.id, body.patient_id):
        raise forbidden("Not your patient")
    return await db.create_homework(me.id, body)


@router.patch("/homework/{homework_id}", response_model=Homework)
async def update_homework(homework_id: str, body: UpdateHomeworkBody, me: Me = Depends(current_user)):
    hw = await db.get_homework(homework_id)
    if not hw:
        raise not_found("Homework")
    if me.role == "specialist":
        await resolve_patient_id(me, hw.patient_id)
    else:
        if hw.patient_id != me.id:
            raise forbidden("Not your homework")
        body = UpdateHomeworkBody(done=body.done)  # patients can only tick it
    return await db.update_homework(homework_id, body)
