from fastapi import APIRouter, Depends

from app import db
from app.auth import current_patient, current_user, current_user_id
from app.errors import ApiError
from app.models import ConsentBody, Me, PatientOnboardingBody, SpecialistOnboardingBody

router = APIRouter(tags=["me"])


@router.get("/me", response_model=Me)
async def get_me(me: Me = Depends(current_user)):
    return me


@router.post("/onboarding/patient", response_model=Me)
async def onboard_patient(body: PatientOnboardingBody, user_id: str = Depends(current_user_id)):
    if await db.get_profile(user_id):
        raise ApiError(409, "conflict", "Profile already exists")
    return await db.create_patient_profile(user_id, body)


@router.post("/onboarding/specialist", response_model=Me)
async def onboard_specialist(body: SpecialistOnboardingBody, user_id: str = Depends(current_user_id)):
    if await db.get_profile(user_id):
        raise ApiError(409, "conflict", "Profile already exists")
    return await db.create_specialist_profile(user_id, body)


@router.patch("/me/consent", response_model=Me)
async def update_consent(body: ConsentBody, me: Me = Depends(current_patient)):
    return await db.update_consent(me.id, body.consent)
