from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, schemas
from .tech_colors import color_for


def resolve_techs(db: Session, names: list[str]) -> list[models.Tech]:
    techs = []
    for name in names:
        tech = db.scalar(select(models.Tech).where(func.lower(models.Tech.name) == name.lower()))
        if tech is None:
            tech = models.Tech(name=name, color=color_for(name))
            db.add(tech)
            db.flush()  # autoflush is off, so make the new row visible to the next lookup
        techs.append(tech)
    return techs


def apply_project_data(db: Session, project: models.Project, data: schemas.ProjectIn) -> None:
    project.title = data.title
    project.description = data.description
    project.repo_url = str(data.repo_url)
    project.live_url = str(data.live_url) if data.live_url else None
    project.featured = data.featured
    project.is_published = data.is_published
    project.techs = resolve_techs(db, data.techs)


def next_top_position(db: Session) -> int:
    lowest = db.scalar(select(func.min(models.Project.position)))
    return 0 if lowest is None else lowest - 1


def get_project_or_404(db: Session, project_id: int) -> models.Project:
    project = db.get(models.Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project
