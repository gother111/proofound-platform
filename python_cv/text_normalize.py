from __future__ import annotations

import re
import unicodedata

WHITESPACE_RE = re.compile(r"\s+")
NON_ALNUM_RE = re.compile(r"[^a-z0-9+.#\-/\s]")
SLUG_NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
TOKEN_COMPACT_RE = re.compile(r"[\s\-_/\.#+]+")

# Common cross-script confusables seen in CV/PDF text where Latin skills are
# rendered with Cyrillic/Greek lookalikes after copy/paste or OCR.
CONFUSABLES: dict[str, str] = {
    "а": "a",
    "А": "A",
    "е": "e",
    "Е": "E",
    "о": "o",
    "О": "O",
    "р": "p",
    "Р": "P",
    "с": "c",
    "С": "C",
    "у": "y",
    "У": "Y",
    "х": "x",
    "Х": "X",
    "к": "k",
    "К": "K",
    "м": "m",
    "М": "M",
    "т": "t",
    "Т": "T",
    "н": "h",
    "Н": "H",
    "в": "b",
    "В": "B",
    "і": "i",
    "І": "I",
    "ј": "j",
    "Ј": "J",
    "ѕ": "s",
    "Ѕ": "S",
    "Α": "A",
    "Β": "B",
    "Ε": "E",
    "Ζ": "Z",
    "Η": "H",
    "Ι": "I",
    "Κ": "K",
    "Μ": "M",
    "Ν": "N",
    "Ο": "O",
    "Ρ": "P",
    "Τ": "T",
    "Χ": "X",
    "α": "a",
    "β": "b",
    "γ": "y",
    "ι": "i",
    "κ": "k",
    "ν": "v",
    "ο": "o",
    "ρ": "p",
    "τ": "t",
    "χ": "x",
}

LEET_MAP: dict[str, str] = {
    "0": "o",
    "1": "i",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
}

TOKEN_EXPANSIONS: dict[str, str] = {
    "k8s": "kubernetes",
    "js": "javascript",
    "ts": "typescript",
    "py": "python",
    "cpp": "c++",
    "csharp": "c#",
    "dotnet": ".net",
    "nodejs": "node.js",
}

TRANSLATION_TABLE = str.maketrans(CONFUSABLES)


def normalize_whitespace(value: str) -> str:
    return WHITESPACE_RE.sub(" ", value).strip()


def _ascii_fold(value: str) -> str:
    return unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")


def normalize_token(value: str) -> str:
    normalized = value.translate(TRANSLATION_TABLE)
    normalized = _ascii_fold(normalized)
    normalized = normalized.casefold()
    normalized = normalized.replace("&", " and ")
    normalized = NON_ALNUM_RE.sub(" ", normalized)
    return WHITESPACE_RE.sub(" ", normalized).strip()


def _compact_token(value: str) -> str:
    return TOKEN_COMPACT_RE.sub("", value)


def _leet_variant(value: str) -> str:
    tokens = value.split()
    normalized_tokens: list[str] = []

    for token in tokens:
        if any(char.isalpha() for char in token) and any(char.isdigit() for char in token):
            normalized_tokens.append("".join(LEET_MAP.get(char, char) for char in token))
        else:
            normalized_tokens.append(token)

    return " ".join(normalized_tokens)


def expand_token_variants(value: str) -> tuple[str, ...]:
    base = normalize_token(value)
    if not base:
        return ()

    variants = {base}

    punctuation_as_space = normalize_token(base.replace(".", " ").replace("/", " ").replace("-", " "))
    if punctuation_as_space:
        variants.add(punctuation_as_space)

    punctuation_removed = normalize_token(base.replace(".", "").replace("/", "").replace("-", ""))
    if punctuation_removed:
        variants.add(punctuation_removed)

    compact = _compact_token(base)
    if compact:
        variants.add(compact)
        expanded = TOKEN_EXPANSIONS.get(compact)
        if expanded:
            variants.add(normalize_token(expanded))

    leet_variant = normalize_token(_leet_variant(base))
    if leet_variant:
        variants.add(leet_variant)

    # Keep stable ordering for deterministic behavior in tests and runtime.
    return tuple(sorted(variant for variant in variants if variant))


def slugify(value: str) -> str:
    normalized = _ascii_fold(value.translate(TRANSLATION_TABLE)).casefold()
    normalized = SLUG_NON_ALNUM_RE.sub("-", normalized)
    normalized = normalized.strip("-")
    return normalized or "skill"
