from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl

from ..config import get_settings
from ..deps import get_current_user
from ..services import github as github_service

router = APIRouter(prefix="/github", tags=["github"], dependencies=[Depends(get_current_user)])


class ImportIn(BaseModel):
    repo_url: HttpUrl


class ImportOut(BaseModel):
    title: str
    description: str
    repo_url: str
    live_url: str | None
    techs: list[str]


@router.post("/import", response_model=ImportOut)
def import_from_github(data: ImportIn):
    """Prefill the project form from a public GitHub repo. Nothing is saved."""
    try:
        owner, repo = github_service.parse_repo(str(data.repo_url))
        result = github_service.import_repo(owner, repo, get_settings().github_token)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except github_service.RepoNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except github_service.UpstreamError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc
    return result
