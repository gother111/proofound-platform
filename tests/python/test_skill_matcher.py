from __future__ import annotations

from python_cv.skill_candidate_extract import CandidateSeed
from python_cv.skill_db import SkillDb, SkillRecord
from python_cv.skill_matcher import match_skill_candidates


def _skill_db_fixture() -> SkillDb:
    skills = (
        SkillRecord(
            code="03.001.001.00001",
            name="React",
            aliases=("React.js",),
            slug="react",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-WEB",
            l3_name="Frontend",
            status="active",
            tags=("react", "frontend"),
            search_terms=("react", "react js"),
        ),
        SkillRecord(
            code="03.001.001.00002",
            name="TypeScript",
            aliases=("TS",),
            slug="typescript",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-WEB",
            l3_name="Frontend",
            status="active",
            tags=("typescript",),
            search_terms=("typescript", "ts"),
        ),
    )

    return SkillDb(
        metadata={"source_mode": "test"},
        skills=skills,
        by_code={skill.code: skill for skill in skills},
        by_name={"react": (skills[0],), "typescript": (skills[1],)},
        by_alias={"react js": (skills[0],), "ts": (skills[1],)},
        term_to_codes={
            "react": (skills[0].code,),
            "react js": (skills[0].code,),
            "typescript": (skills[1].code,),
            "ts": (skills[1].code,),
        },
        term_choices=("react", "react js", "typescript", "ts"),
    )


def test_matches_exact_and_alias_and_fuzzy_candidates():
    db = _skill_db_fixture()
    candidates = [
        CandidateSeed(
            raw_skill_text="React",
            evidence_snippets=("Built React apps",),
            confidence=0.9,
            category="technical",
        ),
        CandidateSeed(
            raw_skill_text="React.js",
            evidence_snippets=("Used React.js",),
            confidence=0.85,
            category="technical",
        ),
        CandidateSeed(
            raw_skill_text="Typescript",
            evidence_snippets=("Strong Typescript skills",),
            confidence=0.8,
            category="technical",
        ),
    ]

    matched = match_skill_candidates(candidates, db, suggestions_limit=5)

    assert matched[0].suggestions[0].match_method == "exact"
    assert matched[0].suggestions[0].skill_name == "React"

    assert matched[1].suggestions[0].match_method in {"synonym", "exact"}
    assert matched[1].suggestions[0].skill_name == "React"

    assert any(item.match_method in {"fuzzy", "exact"} for item in matched[2].suggestions)


def test_avoids_short_token_false_positive():
    db = _skill_db_fixture()
    candidates = [
        CandidateSeed(
            raw_skill_text="ts",
            evidence_snippets=("Environment setup",),
            confidence=0.6,
            category="technical",
        )
    ]

    matched = match_skill_candidates(candidates, db, suggestions_limit=5)

    # Very short terms require strict threshold and should not overmatch broadly.
    assert len(matched[0].suggestions) <= 1


def test_matches_noisy_variants_with_confusables_and_leet_text():
    db = _skill_db_fixture()
    candidates = [
        CandidateSeed(
            # Cyrillic confusables for "React.js"
            raw_skill_text="Rеаct.js",
            evidence_snippets=("Built UI with React.js",),
            confidence=0.8,
            category="technical",
        ),
        CandidateSeed(
            raw_skill_text="Typ3Scr1pt",
            evidence_snippets=("Strong Typ3Scr1pt experience",),
            confidence=0.76,
            category="technical",
        ),
    ]

    matched = match_skill_candidates(candidates, db, suggestions_limit=5)

    assert matched[0].suggestions
    assert matched[0].suggestions[0].skill_name == "React"
    assert matched[0].suggestions[0].match_method in {"exact", "synonym", "fuzzy"}

    assert matched[1].suggestions
    assert matched[1].suggestions[0].skill_name == "TypeScript"
    assert matched[1].suggestions[0].match_method in {"exact", "synonym", "fuzzy"}
