from app import models
from app.tech_colors import DEFAULT_COLOR, color_for


def test_color_lookup_ignores_case_and_spaces():
    assert color_for("  PostgreSQL ") == "#336791"


def test_long_and_short_names_get_the_same_color():
    assert color_for("Tailwind CSS") == color_for("Tailwind")
    assert color_for("Drizzle ORM") == color_for("Drizzle")


def test_unknown_tech_gets_the_fallback():
    assert color_for("SomethingNew") == DEFAULT_COLOR
    assert color_for("SomethingNew", fallback="#123456") == "#123456"


def test_api_fixes_colors_stored_before_the_name_was_known(client, db, auth_headers, project_payload):
    # A tech that was created with the default color, like "Tailwind CSS" was on the live site.
    db.add(models.Tech(name="Tailwind CSS", color=DEFAULT_COLOR))
    db.commit()

    payload = {**project_payload, "techs": ["Tailwind CSS", "MadeUpTool"]}
    created = client.post("/projects", json=payload, headers=auth_headers)
    assert created.status_code == 201

    colors = {t["name"]: t["color"] for t in client.get("/projects").json()[0]["techs"]}
    assert colors == {"Tailwind CSS": "#38bdf8", "MadeUpTool": DEFAULT_COLOR}
