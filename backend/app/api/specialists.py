"""v1.4: choosing a specialist, specialist verification, the session takeaways a patient sees. Dhia only."""

from typing import Optional

from fastapi import APIRouter, Depends

from app import db
from app.auth import current_patient, current_specialist, current_user_id
from app.errors import ApiError, not_found
from app.models import Me, SpecialistCard, Takeaways, VerifyBody

router = APIRouter(tags=["specialists"])


@router.get("/specialists", response_model=list[SpecialistCard])
async def list_specialists(_: str = Depends(current_user_id)):
    """Verified specialists accepting patients. Any logged-in user (patients call it during onboarding, before a profile exists)."""
    return await db.list_specialists()


@router.get("/specialists/{specialist_id}", response_model=SpecialistCard)
async def get_specialist(specialist_id: str, _: str = Depends(current_user_id)):
    card = await db.get_specialist(specialist_id)
    if not card:
        raise not_found("Specialist")
    return card


@router.post("/me/verify", response_model=SpecialistCard)
async def verify_me(body: VerifyBody, me: Me = Depends(current_specialist)):
    """Hackathon: the ID card, license and selfie checks run in the app (simulated). All three must pass."""
    if not (body.id_card and body.license and body.selfie):
        raise ApiError(422, "validation_error", "ID card, license and selfie must all pass")
    return await db.verify_specialist(me.id)


@router.get("/takeaways/latest", response_model=Optional[Takeaways])
async def latest_takeaways(me: Me = Depends(current_patient)):
    """The specialist's note for the patient after their last session (null if none)."""
    return await db.latest_takeaways(me.id)
