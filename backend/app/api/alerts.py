from typing import Optional

from fastapi import APIRouter, Depends

from app import db
from app.auth import current_specialist
from app.errors import forbidden, not_found
from app.models import Alert, AlertStatus, AlertStatusBody, Me

router = APIRouter(tags=["alerts"])


@router.get("/alerts", response_model=list[Alert])
async def list_alerts(status: Optional[AlertStatus] = None, me: Me = Depends(current_specialist)):
    return await db.list_alerts(me.id, status)


@router.patch("/alerts/{alert_id}", response_model=Alert)
async def update_alert(alert_id: str, body: AlertStatusBody, me: Me = Depends(current_specialist)):
    owner = await db.get_alert_specialist(alert_id)
    if owner is None:
        raise not_found("Alert")
    if owner != me.id:
        raise forbidden("Not your alert")
    return await db.update_alert(alert_id, body.status)
