from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import select

from app import models
from app.config import get_settings
from app.security import ALGORITHM, hash_password, verify_password
from app.users import ensure_admin
from tests.conftest import ADMIN_PASSWORD


def test_login_success_returns_token(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    res = client.post("/auth/login", json={"username": "admin", "password": ADMIN_PASSWORD})
    assert res.status_code == 200
    assert res.json()["token_type"] == "bearer"
    assert res.json()["access_token"]


def test_login_wrong_password(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    res = client.post("/auth/login", json={"username": "admin", "password": "nope"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid username or password"


def test_login_unknown_user_gives_same_error(client):
    res = client.post("/auth/login", json={"username": "ghost", "password": "whatever"})
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid username or password"


def test_me_requires_token(client, auth_headers):
    assert client.get("/auth/me").status_code == 401
    res = client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == {"username": "admin"}


def test_garbage_token_is_rejected(client):
    res = client.get("/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert res.status_code == 401


def test_expired_token_is_rejected(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    expired = jwt.encode(
        {"sub": "admin", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        get_settings().jwt_secret,
        algorithm=ALGORITHM,
    )
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert res.status_code == 401


def test_token_for_deleted_user_is_rejected(client, db, auth_headers):
    db.delete(db.scalar(select(models.User)))
    db.commit()
    assert client.get("/auth/me", headers=auth_headers).status_code == 401


def test_password_hashes_are_salted_and_verifiable():
    a, b = hash_password("secret"), hash_password("secret")
    assert a != b
    assert verify_password("secret", a)
    assert not verify_password("other", a)
    assert not verify_password("secret", "garbage")


def test_ensure_admin_is_idempotent_and_needs_password(db):
    assert ensure_admin(db, "admin", "") is False
    assert ensure_admin(db, "admin", ADMIN_PASSWORD) is True
    assert ensure_admin(db, "admin", "changed") is False
    assert len(db.scalars(select(models.User)).all()) == 1
