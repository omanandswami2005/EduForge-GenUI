"""Short, human-friendly lesson join codes (e.g. "K7M-Q2P").

Codes replace sharing raw Firestore lesson IDs with students. The alphabet
drops look-alike characters (0/O, 1/I/L) so a code read off a projector or
said aloud can't be mistyped into a different valid code.
"""
import re
import secrets
import time
from collections import defaultdict, deque

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # 31 chars, no 0 O 1 I L
CODE_LENGTH = 6  # 31^6 ≈ 887M combinations

_VALID = re.compile(rf"^[{ALPHABET}]{{{CODE_LENGTH}}}$")


def generate_code() -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(CODE_LENGTH))


def normalize_code(raw: str) -> str | None:
    """Canonical form ("K7MQ2P") of user input like " k7m-q2p ", or None if it can't be a code."""
    cleaned = re.sub(r"[\s\-_]", "", raw or "").upper()
    return cleaned if _VALID.match(cleaned) else None


def format_code(code: str) -> str:
    """Display form: "K7M-Q2P"."""
    return f"{code[:3]}-{code[3:]}"


class FailedLookupLimiter:
    """Per-user cap on wrong-code guesses, so codes can't be brute-forced.

    In-memory and per-process — enough for a single API instance; a
    multi-instance deployment would move this to a shared store.
    """

    def __init__(self, max_failures: int = 15, window_seconds: int = 600):
        self.max_failures = max_failures
        self.window = window_seconds
        self._failures: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, uid: str, now: float) -> deque[float]:
        q = self._failures[uid]
        while q and now - q[0] > self.window:
            q.popleft()
        return q

    def is_blocked(self, uid: str, now: float | None = None) -> bool:
        return len(self._prune(uid, now or time.monotonic())) >= self.max_failures

    def record_failure(self, uid: str, now: float | None = None) -> None:
        now = now or time.monotonic()
        self._prune(uid, now).append(now)
