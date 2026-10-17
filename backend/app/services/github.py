import httpx

from .ai import UpstreamError, parse_repo  # noqa: F401  (parse_repo is re-used by the router)

LANGUAGE_NAMES: dict[str, str | None] = {
    "HTML": "HTML5",
    "CSS": "CSS3",
    "SCSS": "CSS3",
    "Dockerfile": "Docker",
    "Jupyter Notebook": None,
    "Shell": None,
    "Makefile": None,
    "Batchfile": None,
}

TOPIC_NAMES = {
    "fastapi": "FastAPI",
    "react": "React",
    "nextjs": "Next.js",
    "tailwindcss": "Tailwind",
    "tailwind": "Tailwind",
    "daisyui": "DaisyUI",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "docker": "Docker",
    "github-actions": "GitHub Actions",
    "jwt": "JWT",
    "vite": "Vite",
    "neon": "Neon",
    "pytest": "pytest",
    "tkinter": "Tkinter",
    "sqlalchemy": "SQLAlchemy",
    "typescript": "TypeScript",
    "javascript": "JavaScript",
    "python": "Python",
    "nodejs": "Node.js",
    "express": "Express",
}

MAX_TECHS = 10


class RepoNotFound(Exception):
    pass


def _get(path: str, token: str) -> dict:
    headers = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        res = httpx.get(
            f"https://api.github.com{path}", headers=headers, timeout=10, follow_redirects=True
        )
    except httpx.HTTPError as exc:
        raise UpstreamError("Could not reach GitHub") from exc
    if res.status_code == 404:
        raise RepoNotFound("Repository not found. Is it public?")
    if res.status_code != 200:
        raise UpstreamError(f"GitHub answered with status {res.status_code}")
    return res.json()


def import_repo(owner: str, repo: str, token: str = "") -> dict:
    """Collect title, description, links and technologies from a public GitHub repo."""
    info = _get(f"/repos/{owner}/{repo}", token)
    languages = _get(f"/repos/{owner}/{repo}/languages", token)

    techs: list[str] = []

    def add(name: str | None) -> None:
        if name and name.lower() not in {t.lower() for t in techs} and len(techs) < MAX_TECHS:
            techs.append(name)

    for lang in sorted(languages, key=languages.get, reverse=True)[:4]:
        add(LANGUAGE_NAMES.get(lang, lang))
    for topic in info.get("topics") or []:
        add(TOPIC_NAMES.get(topic))

    homepage = (info.get("homepage") or "").strip()
    return {
        "title": info.get("name") or repo,
        "description": (info.get("description") or "")[:2000],
        "repo_url": info.get("html_url") or f"https://github.com/{owner}/{repo}",
        "live_url": homepage if homepage.startswith(("http://", "https://")) else None,
        "techs": techs,
    }
