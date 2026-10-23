import pytest

from app import rate_limit
from app.config import get_settings
from app.rate_limit import FailureLimiter
from app.users import ensure_admin
from tests.conftest import ADMIN_PASSWORD


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now


# ---------- the limiter on its own ----------


def test_blocks_after_max_failures_and_says_how_long():
    clock = FakeClock()
    limiter = FailureLimiter(max_failures=3, window=60, clock=clock)
    for _ in range(2):
        limiter.add_failure("a")
    assert limiter.retry_after("a") == 0

    limiter.add_failure("a")
    assert limiter.retry_after("a") == 60

    clock.now += 45
    assert limiter.retry_after("a") == 15


def test_old_failures_expire_one_by_one():
    clock = FakeClock()
    limiter = FailureLimiter(max_failures=2, window=60, clock=clock)
    limiter.add_failure("a")
    clock.now += 30
    limiter.add_failure("a")
    assert limiter.retry_after("a") == 30

    clock.now += 30  # first failure is out of the window now
    assert limiter.retry_after("a") == 0


def test_keys_are_independent_and_reset_works():
    limiter = FailureLimiter(max_failures=1, window=60, clock=FakeClock())
    limiter.add_failure("a")
    assert limiter.retry_after("a") > 0
    assert limiter.retry_after("b") == 0

    limiter.reset("a")
    assert limiter.retry_after("a") == 0


def test_expired_keys_are_removed():
    clock = FakeClock()
    limiter = FailureLimiter(max_failures=5, window=60, clock=clock)
    limiter.add_failure("a")
    clock.now += 61
    limiter.retry_after("a")
    assert limiter._failures == {}


# ---------- the login route ----------


def fail(client, ip="1.1.1.1"):
    return client.post(
        "/auth/login",
        json={"username": "admin", "password": "wrong"},
        headers={"X-Forwarded-For": ip},
    )


@pytest.fixture()
def behind_render_proxy(monkeypatch):
    monkeypatch.setattr(get_settings(), "trusted_proxies", 1)


def test_login_is_blocked_after_five_failures(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for _ in range(5):
        assert fail(client).status_code == 401

    res = client.post("/auth/login", json={"username": "admin", "password": ADMIN_PASSWORD})
    assert res.status_code == 429
    assert 0 < int(res.headers["Retry-After"]) <= 15 * 60


def test_successful_login_resets_the_counter(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for _ in range(4):
        fail(client)
    ok = client.post("/auth/login", json={"username": "admin", "password": ADMIN_PASSWORD})
    assert ok.status_code == 200

    for _ in range(4):
        assert fail(client).status_code == 401


def test_other_ips_are_not_blocked(client, db, behind_render_proxy):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for _ in range(5):
        fail(client, ip="1.1.1.1")
    assert fail(client, ip="1.1.1.1").status_code == 429
    assert fail(client, ip="2.2.2.2").status_code == 401


def test_faked_forwarded_for_entries_dont_help(client, db, behind_render_proxy):
    # The client sends its own X-Forwarded-For, the proxy appends the real IP at the end.
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for i in range(5):
        fail(client, ip=f"10.0.0.{i}, 1.1.1.1")
    assert fail(client, ip="10.0.0.99, 1.1.1.1").status_code == 429


def test_two_proxies_like_on_render(client, db, monkeypatch):
    # Render: the edge proxy appends the client IP, the internal load balancer appends its own 10.x address.
    monkeypatch.setattr(get_settings(), "trusted_proxies", 2)
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for i in range(5):
        fail(client, ip=f"6.6.6.{i}, 1.1.1.1, 10.30.89.{i}")
    assert fail(client, ip="1.1.1.1, 10.30.89.99").status_code == 429
    assert fail(client, ip="2.2.2.2, 10.30.89.5").status_code == 401


def test_forwarded_for_is_ignored_without_a_trusted_proxy(client, db):
    # Locally (no proxy) the header is fully client-controlled, so all of these are one client.
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for i in range(5):
        fail(client, ip=f"10.0.0.{i}")
    assert fail(client, ip="10.0.0.99").status_code == 429


def test_global_limit_catches_many_ips(client, db, behind_render_proxy, monkeypatch):
    monkeypatch.setattr(rate_limit.everyone, "max_failures", 3)
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for i in range(3):
        fail(client, ip=f"9.9.9.{i}")
    assert fail(client, ip="8.8.8.8").status_code == 429


def test_retry_after_header_is_readable_by_the_frontend(client, db):
    ensure_admin(db, "admin", ADMIN_PASSWORD)
    for _ in range(5):
        fail(client)
    res = client.post(
        "/auth/login",
        json={"username": "admin", "password": "wrong"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert res.status_code == 429
    assert "retry-after" in res.headers["access-control-expose-headers"].lower()
