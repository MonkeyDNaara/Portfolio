"""Brute-force protection for the login: count failed attempts in a sliding window.

Kept in memory on purpose: the API runs as one process on Render, and a restart only
resets the counters (worst case an attacker gets a few extra tries). With several
instances this would have to move to the database or Redis.
"""

import ipaddress
import time
from collections import defaultdict, deque
from functools import lru_cache
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


# Networks that `TRUSTED_PROXY_NETWORKS` can name instead of writing the CIDRs out.
PRIVATE = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8", "fc00::/7", "::1/128"]
# From https://www.cloudflare.com/ips/ (checked 2026-10-23). Cloudflare rarely changes them.
CLOUDFLARE = [
    "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
    "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
    "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
    "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
    "2a06:98c0::/29", "2c0f:f248::/32",
]
ALIASES = {"private": PRIVATE, "cloudflare": CLOUDFLARE}


@lru_cache
def proxy_networks(setting: str) -> tuple:
    """'private,cloudflare,203.0.113.0/24' -> parsed networks. Empty -> no proxy trusted."""
    networks = []
    for part in (p.strip().lower() for p in setting.split(",")):
        for cidr in ALIASES.get(part, [part] if part else []):
            networks.append(ipaddress.ip_network(cidr))
    return tuple(networks)


def is_trusted(address: str, networks) -> bool:
    try:
        ip = ipaddress.ip_address(address)
    except ValueError:
        return False  # garbage is never one of our proxies
    return any(ip in net for net in networks)


settings = get_settings()
# Per client IP, plus one shared limit for all clients together. The shared one is a
# backstop in case the client IP is wrong (proxy setup) or an attacker rotates IPs.
per_ip = FailureLimiter(settings.login_max_failures, settings.login_window_seconds)
everyone = FailureLimiter(settings.login_global_max_failures, settings.login_window_seconds)
GLOBAL_KEY = "*"


def client_ip(request: Request) -> str:
    """The client IP, also behind proxies.

    Without TRUSTED_PROXY_NETWORKS (local, Docker) it's the direct peer. Behind proxies,
    every proxy appends the address it got the request from to X-Forwarded-For, and
    the client can send its own fake entries on the left. So the list is read from the
    right and every address from a trusted network (our own proxies) is skipped. The
    first address that isn't trusted is the client. This works no matter how many
    proxies there are (on Render: Cloudflare, Render's edge, an internal load balancer).

    Known limit: a request sent through Cloudflare Workers comes from a Cloudflare IP and
    can bring its own X-Forwarded-For. The shared limit for all IPs still catches that.
    """
    networks = proxy_networks(get_settings().trusted_proxy_networks)
    forwarded = request.headers.get("x-forwarded-for", "")
    if networks and forwarded:
        hops = [h.strip() for h in forwarded.split(",") if h.strip()]
        for hop in reversed(hops):
            if not is_trusted(hop, networks):
                return hop
        return hops[0]  # every entry is one of our proxies
    return request.client.host if request.client else "unknown"
