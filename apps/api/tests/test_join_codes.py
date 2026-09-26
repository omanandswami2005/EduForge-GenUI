"""Tests for join code generation, normalization, and guess limiting."""
from src.services.join_codes import (
    ALPHABET, CODE_LENGTH, FailedLookupLimiter, format_code, generate_code, normalize_code,
)


def test_alphabet_has_no_lookalikes():
    for ch in "0O1IL":
        assert ch not in ALPHABET


def test_generated_codes_are_valid_and_vary():
    codes = {generate_code() for _ in range(200)}
    assert len(codes) > 190
    assert all(len(c) == CODE_LENGTH and normalize_code(c) == c for c in codes)


def test_normalize_accepts_messy_input():
    assert normalize_code(" fma-234 ") == "FMA234"
    assert normalize_code("fma 234") == "FMA234"
    assert normalize_code("FMA_234") == "FMA234"


def test_normalize_rejects_invalid():
    assert normalize_code("") is None
    assert normalize_code("FMA23") is None          # too short
    assert normalize_code("FMA2345") is None        # too long
    assert normalize_code("F0A234") is None         # contains zero
    assert normalize_code("demo_newtons_laws") is None


def test_format_code():
    assert format_code("FMA234") == "FMA-234"


def test_limiter_blocks_after_max_failures_and_recovers():
    lim = FailedLookupLimiter(max_failures=3, window_seconds=60)
    for t in range(3):
        assert not lim.is_blocked("u", now=100 + t)
        lim.record_failure("u", now=100 + t)
    assert lim.is_blocked("u", now=103)
    assert not lim.is_blocked("other", now=103)
    assert not lim.is_blocked("u", now=200)  # window elapsed
