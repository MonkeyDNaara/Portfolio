import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import get_settings

ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    """Salted PBKDF2-HMAC-SHA256, stored as pbkdf2_sha256$iterations$salt$hash."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PBKDF2_ITERATIONS,
        base64.b64encode(salt).decode(),
        base64.b64encode(digest).decode(),
    )


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt_b64, hash_b64 = stored.split("$")
        if scheme != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(iterations))
    except (ValueError, TypeError):
        return False
    return hmac.compare_digest(digest, expected)


# Used when the username does not exist, so a login attempt takes the same time either way.
DUMMY_HASH = hash_password(secrets.token_urlsafe(16))


def _secret() -> str:
    secret = get_settings().jwt_secret
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET is missing or too short (use at least 32 characters).")
    return secret


def create_access_token(username: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=get_settings().jwt_expire_minutes)
    return jwt.encode({"sub": username, "exp": expires}, _secret(), algorithm=ALGORITHM)


def decode_access_token(token: str) -> str | None:
    """Returns the username, or None if the token is invalid or expired."""
    try:
        payload = jwt.decode(token, _secret(), algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None
