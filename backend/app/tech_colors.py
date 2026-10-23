"""Badge colors per technology.

The color is looked up again every time a tech is returned by the API (see TechOut),
so adding a name here also fixes techs that already exist in the database.
Keys are lowercase; long and short names ("Tailwind" / "Tailwind CSS") both need an entry.
"""

DEFAULT_COLOR = "#2d8b8b"

TECH_COLORS = {
    "python": "#3776ab",
    "fastapi": "#009688",
    "html5": "#e34f26",
    "css3": "#1572b6",
    "tailwind": "#38bdf8",
    "tailwind css": "#38bdf8",
    "daisyui": "#5a0ef8",
    "javascript": "#f7df1e",
    "typescript": "#3178c6",
    "react": "#61dafb",
    "react router": "#ca4245",
    "react testing library": "#e33332",
    "next.js": "#8a8a8a",
    "vite": "#9466ff",
    "tkinter": "#ffd43b",
    "postgresql": "#336791",
    "neon": "#00e599",
    "docker": "#2496ed",
    "github actions": "#2088ff",
    "jwt": "#d63aff",
    "cryptography": "#c0392b",
    "pytest": "#0a9edc",
    "sqlalchemy": "#d71f00",
    "alembic": "#6ba539",
    "drizzle": "#9bc23a",
    "drizzle orm": "#9bc23a",
    "node.js": "#5fa04e",
    "express": "#8a8a8a",
    "render": "#46e3b7",
    "claude api": "#d97757",
    "vitest": "#6e9f18",
    "pwa": "#5a0fc8",
}


def color_for(name: str, fallback: str = DEFAULT_COLOR) -> str:
    """Brand color for a tech name (any case), or `fallback` if the name is unknown."""
    return TECH_COLORS.get(name.strip().lower(), fallback)
