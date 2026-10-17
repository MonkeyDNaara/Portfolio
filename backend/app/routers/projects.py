from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/projects", tags=["projects"])

# Write routes get `dependencies=[Depends(get_current_user)]` in the auth epic.
WRITE_DEPS: list = []


def _get_or_404(db: Session, project_id: int) -> models.Project:
    project = db.get(models.Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return db.scalars(
        select(models.Project).order_by(models.Project.created_at.desc(), models.Project.id.desc())
    ).all()


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, project_id)


@router.post(
    "",
    response_model=schemas.ProjectOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=WRITE_DEPS,
)
def create_project(data: schemas.ProjectIn, db: Session = Depends(get_db)):
    project = models.Project()
    crud.apply_project_data(db, project, data)
    db.add(project)
    db.commit()
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut, dependencies=WRITE_DEPS)
def update_project(project_id: int, data: schemas.ProjectIn, db: Session = Depends(get_db)):
    project = _get_or_404(db, project_id)
    crud.apply_project_data(db, project, data)
    db.commit()
    return project


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=WRITE_DEPS
)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db.delete(_get_or_404(db, project_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
