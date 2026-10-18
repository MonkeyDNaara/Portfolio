"""Create the owner account or reset its password.

Usage (from backend/, with the venv active):  python -m app.create_admin
It uses the database from backend/.env and asks for the password, nothing is written to a file.
"""
import getpass
import sys

from .config import get_settings
from .database import SessionLocal, engine
from .users import set_admin_password

MIN_LENGTH = 8


def main() -> None:
    settings = get_settings()
    print(f"Database: {engine.url.render_as_string(hide_password=True)}")
    username = input(f"Username [{settings.admin_username}]: ").strip() or settings.admin_username
    password = getpass.getpass(f"New password (at least {MIN_LENGTH} characters): ")
    if len(password) < MIN_LENGTH:
        sys.exit(f"Password is too short (minimum {MIN_LENGTH} characters).")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("The passwords do not match.")
    with SessionLocal() as db:
        result = set_admin_password(db, username, password)
    print(f"Account '{username}' {result}. You can log in now.")


if __name__ == "__main__":
    main()
