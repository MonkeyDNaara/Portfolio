from sqlalchemy import select
from sqlalchemy.orm import Session

from . import models
from .security import hash_password


def ensure_admin(db: Session, username: str, password: str) -> bool:
    """Create the admin user from env settings if it does not exist yet."""
    if not password:
        return False
    if db.scalar(select(models.User).where(models.User.username == username)):
        return False
    db.add(models.User(username=username, password_hash=hash_password(password)))
    db.commit()
    return True


def set_admin_password(db: Session, username: str, password: str) -> str:
    """Create the owner account or reset its password. Returns "created" or "updated"."""
    user = db.scalar(select(models.User).where(models.User.username == username))
    if user is None:
        db.add(models.User(username=username, password_hash=hash_password(password)))
        db.commit()
        return "created"
    user.password_hash = hash_password(password)
    db.commit()
    return "updated"
