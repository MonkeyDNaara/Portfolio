import os

# Must be set before the app is imported.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-" + "x" * 40
os.environ["ADMIN_USERNAME"] = "admin"
os.environ["ADMIN_PASSWORD"] = ""
os.environ["ANTHROPIC_API_KEY"] = ""

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import rate_limit  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.users import ensure_admin  # noqa: E402

ADMIN_PASSWORD = "correct-horse-battery"
# SQLite in memory by default. Set TEST_DATABASE_URL to run the same tests against Postgres.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "sqlite://")


@pytest.fixture()
def db():
    if TEST_DATABASE_URL.startswith("sqlite"):
        engine = create_engine(
            TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
        )
    else:
        url = TEST_DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
        engine = create_engine(url)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def reset_login_limits():
    # the limiters live in memory for the whole process, so every test starts fresh
    rate_limit.per_ip.clear()
    rate_limit.everyone.clear()


@pytest.fixture()
def client(db):
    app.dependency_overrides[get_db] = lambda: db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    res = client.post("/auth/login", json={"username": "admin", "password": ADMIN_PASSWORD})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture()
def project_payload():
    return {
        "title": "Test project",
        "description": "Something I built.",
        "repo_url": "https://github.com/MonkeyDNaara/Test",
        "live_url": None,
        "techs": ["Python", "FastAPI"],
    }
