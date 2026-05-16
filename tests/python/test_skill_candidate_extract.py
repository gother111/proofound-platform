from __future__ import annotations

from python_cv.skill_candidate_extract import extract_skill_candidates


def test_fallback_skill_candidate_scan_normalizes_each_line_once():
    candidates = extract_skill_candidates(
        """
        Built Docker automation.
        Kubernetes
        """,
        max_candidates=10,
    )

    raw_values = {candidate.raw_skill_text for candidate in candidates}

    assert "Kubernetes" in raw_values
