import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select

from . import models
from .config import get_settings
from .database import SessionLocal
from .routers import ai, auth, github, images, projects
from .users import ensure_admin

settings = get_settings()

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create the admin user from ADMIN_USERNAME / ADMIN_PASSWORD on first start.
    log = logging.getLogger("uvicorn.error")
    with SessionLocal() as db:
        if ensure_admin(db, settings.admin_username, settings.admin_password):
            log.info("Owner account '%s' created.", settings.admin_username)
        if db.scalar(select(func.count()).select_from(models.User)) == 0:
            log.warning(
                "No owner account exists, so nobody can log in. Set ADMIN_PASSWORD in backend/.env "
                "and restart, or run: python -m app.create_admin"
            )
    yield


app = FastAPI(title="Portfolio API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],  # so the login form can show how long to wait
)


app.include_router(ai.router)
app.include_router(auth.router)
app.include_router(github.router)
app.include_router(projects.router)
app.include_router(images.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
