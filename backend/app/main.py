from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import SessionLocal
from .routers import ai, auth, projects
from .users import ensure_admin

settings = get_settings()

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create the admin user from ADMIN_USERNAME / ADMIN_PASSWORD on first start.
    with SessionLocal() as db:
        ensure_admin(db, settings.admin_username, settings.admin_password)
    yield


app = FastAPI(title="Portfolio API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(ai.router)
app.include_router(auth.router)
app.include_router(projects.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}
