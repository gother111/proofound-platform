from __future__ import annotations

from python_cv.text_normalize import expand_token_variants, normalize_token


def test_normalize_token_handles_case_accents_and_confusables():
    # Cyrillic confusables mixed with accent marks should still normalize.
    raw = " RÉаct.JS "
    assert normalize_token(raw) == "react.js"


def test_expand_token_variants_handles_punctuation_and_compact_forms():
    variants = set(expand_token_variants("Node.js"))
    assert "node.js" in variants
    assert "node js" in variants
    assert "nodejs" in variants


def test_expand_token_variants_handles_leet_substitutions():
    variants = set(expand_token_variants("Typ3Scr1pt"))
    assert "typescript" in variants
