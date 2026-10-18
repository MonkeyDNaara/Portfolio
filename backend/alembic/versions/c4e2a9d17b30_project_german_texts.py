"""project German texts: optional title_de and description_de

Revision ID: c4e2a9d17b30
Revises: a77445bde3b7
Create Date: 2026-10-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4e2a9d17b30'
down_revision: Union[str, Sequence[str], None] = 'a77445bde3b7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Nullable, so existing rows stay valid and the frontend falls back to English.
    op.add_column('projects', sa.Column('title_de', sa.String(length=120), nullable=True))
    op.add_column('projects', sa.Column('description_de', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('projects', 'description_de')
    op.drop_column('projects', 'title_de')
