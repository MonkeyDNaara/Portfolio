from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl

from ..config import get_settings
from ..deps import get_current_user
from ..services import ai as ai_service

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(get_current_user)])


class GenerateIn(BaseModel):
    repo_url: HttpUrl


class GenerateOut(BaseModel):
    description: str


@router.post("/generate-description", response_model=GenerateOut)
def generate_description(data: GenerateIn):
    """Draft a project description from a public GitHub repo's README. Nothing is saved."""
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI feature is not configured")
    try:
        owner, repo = ai_service.parse_repo(str(data.repo_url))
        readme = ai_service.fetch_readme(owner, repo, settings.github_token)
        text = ai_service.draft_description(readme, f"{owner}/{repo}", settings)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except ai_service.ReadmeNotFound as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except ai_service.UpstreamError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc
    return GenerateOut(description=text)
