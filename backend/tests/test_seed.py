from app.seed import PROJECTS, seed


def test_seed_adds_projects_once(db):
    assert seed(db) == len(PROJECTS)
    assert seed(db) == 0
