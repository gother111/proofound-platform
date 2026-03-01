from __future__ import annotations

import re
import unicodedata

WHITESPACE_RE = re.compile(r"\s+")
NON_ALNUM_RE = re.compile(r"[^a-z0-9+.#\-/\s]")
SLUG_NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")


def normalize_whitespace(value: str) -> str:
    return WHITESPACE_RE.sub(" ", value).strip()


def normalize_token(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = NON_ALNUM_RE.sub(" ", normalized)
    return WHITESPACE_RE.sub(" ", normalized).strip()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = SLUG_NON_ALNUM_RE.sub("-", normalized)
    normalized = normalized.strip("-")
    return normalized or "skill"
