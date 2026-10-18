
from app.routers import github as github_router
from app.services import github as gh

BODY = {"repo_url": "https://github.com/MonkeyDNaara/Test"}

REPO = {
    "name": "Test",
    "description": "A test repo",
    "html_url": "https://github.com/MonkeyDNaara/Test",
    "homepage": "https://test.example.com",
    "topics": ["fastapi", "react", "unknown-topic", "python"],
}
LANGS = {"Python": 5000, "HTML": 3000, "Jupyter Notebook": 9000, "Dockerfile": 10, "CSS": 1}


def fake_get(path, token):
    return LANGS if path.endswith("/languages") else REPO


def test_import_repo_maps_languages_and_topics(monkeypatch):
    monkeypatch.setattr(gh, "_get", fake_get)
    result = gh.import_repo("MonkeyDNaara", "Test")
    assert result["title"] == "Test"
    assert result["description"] == "A test repo"
    assert result["live_url"] == "https://test.example.com"
    # Jupyter is skipped, Python is not duplicated by the topic, unknown topics are ignored
    assert result["techs"] == ["Python", "HTML5", "Docker", "FastAPI", "React"]


def test_import_ignores_non_http_homepage(monkeypatch):
    evil_repo = {**REPO, "homepage": "javascript:alert(1)"}
    monkeypatch.setattr(gh, "_get", lambda p, t: LANGS if p.endswith("/languages") else evil_repo)
    assert gh.import_repo("a", "b")["live_url"] is None


def test_endpoint_requires_auth(client):
    assert client.post("/github/import", json=BODY).status_code == 401


def test_endpoint_happy_path(client, auth_headers, monkeypatch):
    monkeypatch.setattr(gh, "_get", fake_get)
    res = client.post("/github/import", json=BODY, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Test"


def test_endpoint_errors(client, auth_headers, monkeypatch):
    bad = client.post("/github/import", json={"repo_url": "https://example.com/a/b"}, headers=auth_headers)
    assert bad.status_code == 422

    def not_found(*a, **k):
        raise gh.RepoNotFound("Repository not found. Is it public?")

    monkeypatch.setattr(github_router.github_service, "import_repo", not_found)
    assert client.post("/github/import", json=BODY, headers=auth_headers).status_code == 404

    def broken(*a, **k):
        raise gh.UpstreamError("Could not reach GitHub")

    monkeypatch.setattr(github_router.github_service, "import_repo", broken)
    assert client.post("/github/import", json=BODY, headers=auth_headers).status_code == 502
