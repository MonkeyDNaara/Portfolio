"""Brute-force protection for the login: count failed attempts in a sliding window.

Kept in memory on purpose: the API runs as one process on Render, and a restart only
resets the counters (worst case an attacker gets a few extra tries). With several
instances this would have to move to the database or Redis.
"""

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Request

from .config import get_settings


class FailureLimiter:
    """Allows `max_failures` failed attempts per key within `window` seconds."""

    def __init__(self, max_failures: int, window: float, clock=time.monotonic):
        self.max_failures = max_failures
        self.window = window
        self.clock = clock
        self._failures: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()  # sync routes run in a thread pool

    def _prune(self, key: str, now: float) -> deque[float]:
        times = self._failures[key]
        while times and times[0] <= now - self.window:
            times.popleft()
        if not times:
            del self._failures[key]  # don't keep empty entries for every IP that ever failed once
            return deque()
        return times

    def retry_after(self, key: str) -> int:
        """Seconds until the next attempt is allowed, 0 if it is allowed now."""
        with self._lock:
            now = self.clock()
            times = self._prune(key, now)
            if len(times) < self.max_failures:
                return 0
            # blocked until the oldest failure in the window expires
            return max(1, int(times[0] + self.window - now + 0.999))

    def add_failure(self, key: str) -> None:
        with self._lock:
            self._failures[key].append(self.clock())

    def reset(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)

    def clear(self) -> None:
        with self._lock:
            self._failures.clear()


settings = get_settings()
# Per client IP, plus one shared limit for all clients together. The shared one is a
# backstop in case the client IP is wrong (proxy setup) or an attacker rotates IPs.
per_ip = FailureLimiter(settings.login_max_failures, settings.login_window_seconds)
everyone = FailureLimiter(settings.login_global_max_failures, settings.login_window_seconds)
GLOBAL_KEY = "*"


def client_ip(request: Request) -> str:
    """The client IP, also behind a proxy.

    With TRUSTED_PROXIES=0 (local, Docker) it's the direct peer. Behind proxies that
    append to X-Forwarded-For (Render: 1), the entry that many places from the right was
    written by our own proxy. Entries further left come from the client and can be faked.
    """
    hops = get_settings().trusted_proxies
    if hops > 0:
        forwarded = [ip.strip() for ip in request.headers.get("x-forwarded-for", "").split(",") if ip.strip()]
        if len(forwarded) >= hops:
            return forwarded[-hops]
    return request.client.host if request.client else "unknown"
