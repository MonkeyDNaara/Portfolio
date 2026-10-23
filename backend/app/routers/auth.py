import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import models, rate_limit
from ..database import get_db
from ..deps import get_current_user
from ..security import DUMMY_HASH, create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("uvicorn.error")


class LoginIn(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=200)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeOut(BaseModel):
    username: str


@router.post(
    "/login",
    response_model=TokenOut,
    responses={429: {"description": "Too many failed logins, see the Retry-After header"}},
)
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    ip = rate_limit.client_ip(request)
    # Checked before the password, so a blocked client can't keep guessing.
    wait = max(rate_limit.per_ip.retry_after(ip), rate_limit.everyone.retry_after(rate_limit.GLOBAL_KEY))
    if wait:
        log.warning("Login blocked for %s, %s s left", ip, wait)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many failed logins. Try again later.",
            headers={"Retry-After": str(wait)},
        )

    user = db.scalar(select(models.User).where(models.User.username == data.username))
    password_ok = verify_password(data.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok:
        rate_limit.per_ip.add_failure(ip)
        rate_limit.everyone.add_failure(rate_limit.GLOBAL_KEY)
        log.warning("Failed login from %s", ip)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")

    rate_limit.per_ip.reset(ip)
    return TokenOut(access_token=create_access_token(user.username))


@router.get("/me", response_model=MeOut)
def me(user: models.User = Depends(get_current_user)):
    return MeOut(username=user.username)
