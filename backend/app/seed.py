"""Seed the database with my existing projects. Safe to run more than once.

Usage (from backend/):  python -m app.seed
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import SessionLocal

GH = "https://github.com/MonkeyDNaara"

# Newest first. Only used for ordering on the site.
PROJECTS = [
    {
        "title": "Portfolio",
        "description": (
            "This site. A full-stack portfolio with a FastAPI + PostgreSQL backend, JWT login "
            "and a React frontend where I can add projects through an admin page. Tested with "
            "pytest, built by GitHub Actions and planned through epics and issues."
        ),
        "repo_url": f"{GH}/Portfolio",
        "techs": ["Python", "FastAPI", "PostgreSQL", "React", "JWT", "Docker", "GitHub Actions"],
    },
    {
        "title": "MorgenMachIch",
        "description": (
            "A local-first to-do app with a card view, a calendar view, custom labels and "
            "recurring tasks that can be completed independently. I use it every day and built "
            "it with an AI-assisted workflow, planned epic by epic with one branch and PR per issue."
        ),
        "repo_url": f"{GH}/MorgenMachIch",
        "live_url": "https://morgenmachich.de",
        "techs": ["Next.js", "React", "TypeScript", "Tailwind", "DaisyUI", "Neon"],
    },
    {
        "title": "byteMe",
        "description": (
            "A kitchen companion app: discover recipes, cook step by step with timers and turn "
            "missing ingredients into a shopping list. Has accounts, favorites and a cooking mode "
            "that keeps the screen awake."
        ),
        "repo_url": f"{GH}/ByteMe",
        "live_url": "https://byteme-pb2e.onrender.com",
        "techs": ["Next.js", "React", "TypeScript", "Tailwind", "DaisyUI", "Neon"],
    },
    {
        "title": "FilmFieber",
        "description": (
            "A movie diary built with vanilla JavaScript. Browse and search movies from the TMDB "
            "API, save favorites to a journal and write notes for each movie. Everything is stored "
            "in the browser."
        ),
        "repo_url": f"{GH}/FilmFieber",
        "techs": ["JavaScript", "Vite", "Tailwind"],
    },
    {
        "title": "GedankenSalat",
        "description": (
            "A small journaling app for dumping thoughts as quick entries. Create, edit and "
            "delete entries in a modal, validate duplicate dates and switch between a light and "
            "a dark theme. Persists to localStorage."
        ),
        "repo_url": f"{GH}/GedankenSalat",
        "techs": ["React", "Vite", "Tailwind", "DaisyUI"],
    },
    {
        "title": "PasswordManager",
        "description": (
            "A command-line password manager in Python that I built to learn symmetric "
            "encryption hands-on. Entries are encrypted with Fernet, the master password is "
            "stored as a salted PBKDF2 hash and the encryption key never lives in the repo."
        ),
        "repo_url": f"{GH}/PasswordManager",
        "techs": ["Python", "cryptography"],
    },
    {
        "title": "AdventureGame",
        "description": (
            "A dungeon crawler with Python and Tkinter, built together with Eric. Explore a maze "
            "with fog of war, fight goblins round by round, collect items and find the exit. "
            "Good practice for classes and OOP."
        ),
        "repo_url": f"{GH}/AdventureGame",
        "techs": ["Python", "Tkinter"],
    },
    {
        "title": "BonsaiShop",
        "description": (
            "My first multi-page website, built with Elias. A subscription shop concept where "
            "sponsoring a bonsai also funds rainforest conservation. Plain HTML and CSS to "
            "practice semantic markup."
        ),
        "repo_url": f"{GH}/BonsaiShop",
        "techs": ["HTML5", "CSS3"],
    },
]


def seed(db: Session) -> int:
    """Insert missing projects (matched by repo_url). Returns how many were added."""
    now = datetime.now(timezone.utc)
    added = 0
    for i, item in enumerate(PROJECTS):
        exists = db.scalar(select(models.Project).where(models.Project.repo_url == item["repo_url"]))
        if exists:
            continue
        project = models.Project(created_at=now - timedelta(seconds=i))
        crud.apply_project_data(db, project, schemas.ProjectIn(**item))
        db.add(project)
        added += 1
    db.commit()
    return added


if __name__ == "__main__":
    with SessionLocal() as session:
        print(f"Added {seed(session)} project(s).")
