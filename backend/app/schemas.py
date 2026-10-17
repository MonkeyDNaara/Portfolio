from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class TechOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    color: str


class ProjectIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=2000)
    repo_url: HttpUrl
    live_url: HttpUrl | None = None
    techs: list[str] = Field(default_factory=list, max_length=15)

    @field_validator("title", "description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("must not be blank")
        return v

    @field_validator("techs")
    @classmethod
    def clean_techs(cls, v: list[str]) -> list[str]:
        seen, out = set(), []
        for name in v:
            name = name.strip()
            if not name or len(name) > 50:
                raise ValueError("tech names must be 1-50 characters")
            if name.lower() not in seen:
                seen.add(name.lower())
                out.append(name)
        return out


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    repo_url: str
    live_url: str | None
    created_at: datetime
    techs: list[TechOut]
