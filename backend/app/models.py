from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Table,
    Text,
    false,
    true,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

project_tech = Table(
    "project_tech",
    Base.metadata,
    Column("project_id", ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True),
    Column("tech_id", ForeignKey("techs.id", ondelete="CASCADE"), primary_key=True),
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Tech(Base):
    __tablename__ = "techs"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    color: Mapped[str] = mapped_column(String(7), default="#2d8b8b")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    # Optional German texts. Empty = the frontend shows the English ones.
    title_de: Mapped[str | None] = mapped_column(String(120), default=None)
    description_de: Mapped[str | None] = mapped_column(Text, default=None)
    repo_url: Mapped[str] = mapped_column(String(300))
    live_url: Mapped[str | None] = mapped_column(String(300), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    featured: Mapped[bool] = mapped_column(Boolean, default=False, server_default=false())
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, server_default=true())
    # Lower position = shown first. New projects get min(position) - 1, so they appear on top.
    position: Mapped[int] = mapped_column(Integer, default=0, server_default="0", index=True)
    # None = no image. Increases on every upload so browsers refetch (used as ?v= in the URL).
    image_version: Mapped[int | None] = mapped_column(Integer, default=None)

    techs: Mapped[list[Tech]] = relationship(secondary=project_tech, lazy="selectin")
    image: Mapped["ProjectImage | None"] = relationship(
        cascade="all, delete-orphan", uselist=False
    )


class ProjectImage(Base):
    """Image bytes live in their own table so listing projects never loads them."""

    __tablename__ = "project_images"

    project_id: Mapped[int] = mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    content_type: Mapped[str] = mapped_column(String(50))
    data: Mapped[bytes] = mapped_column(LargeBinary)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
