import pytest

from app.config import get_settings
from app.routers import ai as ai_router
from app.services import ai as ai_service

BODY = {"repo_url": "https://github.com/MonkeyDNaara/Test"}


@pytest.fixture()
def with_key(monkeypatch):
    monkeypatch.setattr(get_settings(), "anthropic_api_key", "sk-test")


def test_parse_repo():
    assert ai_service.parse_repo("https://github.com/MonkeyDNaara/Portfolio") == (
        "MonkeyDNaara",
        "Portfolio",
    )
    assert ai_service.parse_repo("https://github.com/a/b.git/") == ("a", "b")
    with pytest.raises(ValueError):
        ai_service.parse_repo("https://gitlab.com/a/b")


def test_requires_auth(client):
    assert client.post("/ai/generate-description", json=BODY).status_code == 401


def test_not_configured_returns_503(client, auth_headers):
    res = client.post("/ai/generate-description", json=BODY, headers=auth_headers)
    assert res.status_code == 503


def test_happy_path(client, auth_headers, with_key, monkeypatch):
    monkeypatch.setattr(ai_router.ai_service, "fetch_readme", lambda *a, **k: "# Test\nA thing.")
    monkeypatch.setattr(ai_router.ai_service, "draft_description", lambda *a, **k: "I built a thing.")
    res = client.post("/ai/generate-description", json=BODY, headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == {"description": "I built a thing."}


def test_non_github_url_is_422(client, auth_headers, with_key):
    res = client.post(
        "/ai/generate-description",
        json={"repo_url": "https://example.com/a/b"},
        headers=auth_headers,
    )
    assert res.status_code == 422


def test_missing_readme_is_404(client, auth_headers, with_key, monkeypatch):
    def boom(*a, **k):
        raise ai_service.ReadmeNotFound("README not found. Is the repository public?")

    monkeypatch.setattr(ai_router.ai_service, "fetch_readme", boom)
    res = client.post("/ai/generate-description", json=BODY, headers=auth_headers)
    assert res.status_code == 404


def test_upstream_failure_is_502(client, auth_headers, with_key, monkeypatch):
    monkeypatch.setattr(ai_router.ai_service, "fetch_readme", lambda *a, **k: "readme")

    def boom(*a, **k):
        raise ai_service.UpstreamError("The AI service did not answer")

    monkeypatch.setattr(ai_router.ai_service, "draft_description", boom)
    res = client.post("/ai/generate-description", json=BODY, headers=auth_headers)
    assert res.status_code == 502
