"""Badge colors per technology, used when a new tech is created."""

DEFAULT_COLOR = "#2d8b8b"

TECH_COLORS = {
    "python": "#3776ab",
    "fastapi": "#009688",
    "html5": "#e34f26",
    "css3": "#1572b6",
    "tailwind": "#38bdf8",
    "daisyui": "#5a0ef8",
    "javascript": "#f7df1e",
    "typescript": "#3178c6",
    "react": "#61dafb",
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
}


def color_for(name: str) -> str:
    return TECH_COLORS.get(name.strip().lower(), DEFAULT_COLOR)
