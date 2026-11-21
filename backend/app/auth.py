"""
Who is calling? Dhia only.
- DEMO mode (no Supabase): send `Authorization: Bearer demo-patient` or `Bearer demo-specialist`.
- Real mode: the Supabase access token from the frontend login.
"""

from typing import Optional

import jwt
from fastapi import Depends, Header

from app import db
from app.config import settings
from app.errors import ApiError, forbidden
from app.models import Me


def _user_id_from_token(token: str) -> str:
    if settings.demo_mode:
        uid = db.DEMO_TOKENS.get(token)
        if not uid:
            raise ApiError(401, "unauthorized", "Demo mode: use the token demo-patient or demo-specialist")
        return uid
    if settings.supabase_jwt_secret:
        try:
            claims = jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
            return claims["sub"]
        except jwt.PyJWTError:
            raise ApiError(401, "unauthorized", "Invalid or expired login, please log in again")
    from app.db.supabase_repo import sb

    try:
        user = sb().auth.get_user(token).user
    except Exception:
        user = None
    if not user:
        raise ApiError(401, "unauthorized", "Invalid or expired login, please log in again")
    return user.id


async def current_user_id(authorization: Optional[str] = Header(default=None)) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ApiError(401, "unauthorized", "Missing login token")
    return _user_id_from_token(authorization.split(" ", 1)[1].strip())


async def current_user(user_id: str = Depends(current_user_id)) -> Me:
    me = await db.get_profile(user_id)
    if not me:
        raise ApiError(404, "not_onboarded", "Account has no profile yet: finish onboarding")
    return me


async def current_patient(me: Me = Depends(current_user)) -> Me:
    if me.role != "patient":
        raise forbidden("Patients only")
    return me


async def current_specialist(me: Me = Depends(current_user)) -> Me:
    if me.role != "specialist":
        raise forbidden("Specialists only")
    return me


async def resolve_patient_id(me: Me, patient_id: Optional[str]) -> str:
    """Patient -> always themselves. Specialist -> the given patient, only if it is theirs."""
    if me.role == "patient":
        return me.id
    if not patient_id:
        raise ApiError(400, "bad_request", "patient_id is required")
    if not await db.is_my_patient(me.id, patient_id):
        raise forbidden("Not your patient")
    return patient_id
