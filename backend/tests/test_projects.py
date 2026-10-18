from sqlalchemy import func, select

from app import models


def test_list_is_public_and_empty_at_start(client):
    res = client.get("/projects")
    assert res.status_code == 200
    assert res.json() == []


def test_write_routes_require_auth(client, project_payload):
    assert client.post("/projects", json=project_payload).status_code == 401
    assert client.put("/projects/1", json=project_payload).status_code == 401
    assert client.delete("/projects/1").status_code == 401


def test_create_and_read_project(client, auth_headers, project_payload):
    res = client.post("/projects", json=project_payload, headers=auth_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Test project"
    assert [t["name"] for t in body["techs"]] == ["Python", "FastAPI"]
    assert body["techs"][0]["color"] == "#3776ab"

    assert client.get(f"/projects/{body['id']}").json()["title"] == "Test project"


def test_techs_are_reused_case_insensitively(client, db, auth_headers, project_payload):
    client.post("/projects", json=project_payload, headers=auth_headers)
    second = {**project_payload, "title": "Second", "techs": ["python", "React"]}
    client.post("/projects", json=second, headers=auth_headers)
    assert db.scalar(select(func.count()).select_from(models.Tech)) == 3


def test_validation_errors(client, auth_headers, project_payload):
    bad_url = {**project_payload, "repo_url": "not a url"}
    assert client.post("/projects", json=bad_url, headers=auth_headers).status_code == 422
    blank = {**project_payload, "title": "   "}
    assert client.post("/projects", json=blank, headers=auth_headers).status_code == 422
    too_long = {**project_payload, "description": "x" * 2001}
    assert client.post("/projects", json=too_long, headers=auth_headers).status_code == 422


def test_get_unknown_project_is_404(client):
    assert client.get("/projects/999").status_code == 404


def test_update_project(client, auth_headers, project_payload):
    pid = client.post("/projects", json=project_payload, headers=auth_headers).json()["id"]
    changed = {**project_payload, "title": "Renamed", "techs": ["Docker"]}
    res = client.put(f"/projects/{pid}", json=changed, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["title"] == "Renamed"
    assert [t["name"] for t in res.json()["techs"]] == ["Docker"]
    assert client.put("/projects/999", json=changed, headers=auth_headers).status_code == 404


def test_delete_project(client, auth_headers, project_payload):
    pid = client.post("/projects", json=project_payload, headers=auth_headers).json()["id"]
    assert client.delete(f"/projects/{pid}", headers=auth_headers).status_code == 204
    assert client.get(f"/projects/{pid}").status_code == 404
    assert client.delete(f"/projects/{pid}", headers=auth_headers).status_code == 404


def test_list_returns_newest_first(client, auth_headers, project_payload):
    for title in ("first", "second", "third"):
        client.post("/projects", json={**project_payload, "title": title}, headers=auth_headers)
    titles = [p["title"] for p in client.get("/projects").json()]
    assert titles == ["third", "second", "first"]


def _make(client, headers, payload, **overrides):
    return client.post("/projects", json={**payload, **overrides}, headers=headers).json()


def test_hidden_projects_are_only_visible_to_admin(client, auth_headers, project_payload):
    visible = _make(client, auth_headers, project_payload, title="visible")
    hidden = _make(client, auth_headers, project_payload, title="hidden", is_published=False)

    public = [p["title"] for p in client.get("/projects").json()]
    assert public == ["visible"]
    assert client.get(f"/projects/{hidden['id']}").status_code == 404
    assert client.get(f"/projects/{visible['id']}").status_code == 200

    admin = [p["title"] for p in client.get("/projects", headers=auth_headers).json()]
    assert admin == ["hidden", "visible"]
    assert client.get(f"/projects/{hidden['id']}", headers=auth_headers).status_code == 200


def test_featured_flag_roundtrip(client, auth_headers, project_payload):
    created = _make(client, auth_headers, project_payload, featured=True)
    assert created["featured"] is True
    changed = {**project_payload, "featured": False}
    res = client.put(f"/projects/{created['id']}", json=changed, headers=auth_headers)
    assert res.json()["featured"] is False


def test_new_projects_go_to_the_top(client, auth_headers, project_payload):
    first = _make(client, auth_headers, project_payload, title="first")
    second = _make(client, auth_headers, project_payload, title="second")
    assert second["position"] < first["position"]


def test_reorder(client, auth_headers, project_payload):
    ids = [_make(client, auth_headers, project_payload, title=t)["id"] for t in "abc"]
    new_order = [ids[0], ids[2], ids[1]]
    res = client.post("/projects/reorder", json={"ids": new_order}, headers=auth_headers)
    assert res.status_code == 204
    assert [p["id"] for p in client.get("/projects").json()] == new_order


def test_reorder_validation_and_auth(client, auth_headers, project_payload):
    pid = _make(client, auth_headers, project_payload)["id"]
    assert client.post("/projects/reorder", json={"ids": [pid]}).status_code == 401
    assert client.post("/projects/reorder", json={"ids": [pid, pid]}, headers=auth_headers).status_code == 400
    assert client.post("/projects/reorder", json={"ids": [pid, 999]}, headers=auth_headers).status_code == 404
    assert client.post("/projects/reorder", json={"ids": []}, headers=auth_headers).status_code == 422
