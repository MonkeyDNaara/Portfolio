import pytest

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"0" * 64
WEBP = b"RIFF\x00\x00\x00\x00WEBP" + b"0" * 64


@pytest.fixture()
def pid(client, auth_headers, project_payload):
    return client.post("/projects", json=project_payload, headers=auth_headers).json()["id"]


def upload(client, headers, pid, data, name="x.bin"):
    return client.put(f"/projects/{pid}/image", files={"file": (name, data)}, headers=headers)


@pytest.mark.parametrize("data,ctype", [(PNG, "image/png"), (JPEG, "image/jpeg"), (WEBP, "image/webp")])
def test_upload_and_download(client, auth_headers, pid, data, ctype):
    res = upload(client, auth_headers, pid, data)
    assert res.status_code == 200
    assert res.json()["image_version"] == 1

    img = client.get(f"/projects/{pid}/image")
    assert img.status_code == 200
    assert img.headers["content-type"] == ctype
    assert img.content == data
    assert "immutable" in img.headers["cache-control"]


def test_reupload_bumps_version(client, auth_headers, pid):
    upload(client, auth_headers, pid, PNG)
    assert upload(client, auth_headers, pid, JPEG).json()["image_version"] == 2
    assert client.get(f"/projects/{pid}/image").headers["content-type"] == "image/jpeg"


def test_upload_requires_auth(client, pid):
    assert upload(client, {}, pid, PNG).status_code == 401


def test_rejects_non_images_and_big_files(client, auth_headers, pid):
    assert upload(client, auth_headers, pid, b"<svg onload=alert(1)>", "evil.png").status_code == 415
    assert upload(client, auth_headers, pid, PNG + b"0" * 1_000_001).status_code == 413


def test_unknown_project(client, auth_headers):
    assert upload(client, auth_headers, 999, PNG).status_code == 404
    assert client.get("/projects/999/image").status_code == 404


def test_delete_image(client, auth_headers, pid):
    upload(client, auth_headers, pid, PNG)
    assert client.delete(f"/projects/{pid}/image").status_code == 401
    assert client.delete(f"/projects/{pid}/image", headers=auth_headers).status_code == 204
    assert client.get(f"/projects/{pid}/image").status_code == 404
    assert client.get(f"/projects/{pid}").json()["image_version"] is None


def test_deleting_project_removes_its_image(client, auth_headers, pid, db):
    from app import models

    upload(client, auth_headers, pid, PNG)
    client.delete(f"/projects/{pid}", headers=auth_headers)
    assert db.get(models.ProjectImage, pid) is None


def test_hidden_project_image_is_not_public(client, auth_headers, pid, project_payload):
    upload(client, auth_headers, pid, PNG)
    client.put(f"/projects/{pid}", json={**project_payload, "is_published": False}, headers=auth_headers)
    assert client.get(f"/projects/{pid}/image").status_code == 404
    assert client.get(f"/projects/{pid}/image", headers=auth_headers).status_code == 200
