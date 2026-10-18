from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..database import get_db
from ..deps import get_current_user, get_optional_user

router = APIRouter(prefix="/projects", tags=["images"])

MAX_BYTES = 1_000_000


def sniff_content_type(data: bytes) -> str | None:
    """Trust the file's magic bytes, not the name or the declared type."""
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


@router.put(
    "/{project_id}/image",
    response_model=schemas.ProjectOut,
    dependencies=[Depends(get_current_user)],
)
def upload_image(project_id: int, file: UploadFile, db: Session = Depends(get_db)):
    project = crud.get_project_or_404(db, project_id)
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image is larger than 1 MB")
    content_type = sniff_content_type(data)
    if content_type is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Use a PNG, JPEG or WebP image")

    image = db.get(models.ProjectImage, project_id)
    if image is None:
        db.add(models.ProjectImage(project_id=project_id, content_type=content_type, data=data))
    else:
        image.content_type, image.data = content_type, data
    project.image_version = (project.image_version or 0) + 1
    db.commit()
    return project


@router.delete(
    "/{project_id}/image",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_user)],
)
def delete_image(project_id: int, db: Session = Depends(get_db)):
    project = crud.get_project_or_404(db, project_id)
    image = db.get(models.ProjectImage, project_id)
    if image is not None:
        db.delete(image)
    project.image_version = None
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}/image")
def get_image(
    project_id: int,
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_optional_user),
):
    project = db.get(models.Project, project_id)
    image = db.get(models.ProjectImage, project_id)
    if project is None or image is None or (not project.is_published and user is None):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    return Response(
        content=image.data,
        media_type=image.content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )
