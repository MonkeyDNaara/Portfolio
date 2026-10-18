from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..deps import get_current_user, get_optional_user

router = APIRouter(prefix="/projects", tags=["projects"])

# Reading is public, every write needs a valid admin token.
WRITE_DEPS = [Depends(get_current_user)]


@router.get("", response_model=list[schemas.ProjectOut])
def list_projects(
    db: Session = Depends(get_db), user: models.User | None = Depends(get_optional_user)
):
    """Visitors only get published projects. The logged-in admin gets everything."""
    stmt = select(models.Project).order_by(models.Project.position, models.Project.id.desc())
    if user is None:
        stmt = stmt.where(models.Project.is_published.is_(True))
    return db.scalars(stmt).all()


@router.post("/reorder", status_code=status.HTTP_204_NO_CONTENT, dependencies=WRITE_DEPS)
def reorder_projects(data: schemas.ReorderIn, db: Session = Depends(get_db)):
    """Set the display order. Send the ids of all projects in the order you want."""
    if len(set(data.ids)) != len(data.ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Duplicate ids")
    found = {
        p.id: p
        for p in db.scalars(select(models.Project).where(models.Project.id.in_(data.ids)))
    }
    if len(found) != len(data.ids):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown project id")
    for position, project_id in enumerate(data.ids):
        found[project_id].position = position
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_optional_user),
):
    project = crud.get_project_or_404(db, project_id)
    if not project.is_published and user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    return project


@router.post(
    "",
    response_model=schemas.ProjectOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=WRITE_DEPS,
)
def create_project(data: schemas.ProjectIn, db: Session = Depends(get_db)):
    project = models.Project(position=crud.next_top_position(db))
    crud.apply_project_data(db, project, data)
    db.add(project)
    db.commit()
    return project


@router.put("/{project_id}", response_model=schemas.ProjectOut, dependencies=WRITE_DEPS)
def update_project(project_id: int, data: schemas.ProjectIn, db: Session = Depends(get_db)):
    project = crud.get_project_or_404(db, project_id)
    crud.apply_project_data(db, project, data)
    db.commit()
    return project


@router.delete(
    "/{project_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=WRITE_DEPS
)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db.delete(crud.get_project_or_404(db, project_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
