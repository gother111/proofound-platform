from __future__ import annotations

from random import Random

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
            tags=("react",),
            search_terms=("react", "react.js", "react js"),
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
            search_terms=("typescript", "ts", "type script"),
        ),
        SkillRecord(
            code="03.001.001.00003",
            name="Kubernetes",
            aliases=("K8s",),
            slug="kubernetes",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-OPS",
            l3_name="Cloud",
            status="active",
            tags=("kubernetes",),
            search_terms=("kubernetes", "k8s"),
        ),
        SkillRecord(
            code="03.001.001.00004",
            name="Node.js",
            aliases=("NodeJS",),
            slug="node-js",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-BACKEND",
            l3_name="Backend",
            status="active",
            tags=("node",),
            search_terms=("node.js", "node js", "nodejs"),
        ),
        SkillRecord(
            code="03.001.001.00005",
            name="PostgreSQL",
            aliases=("Postgres",),
            slug="postgresql",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-DATA",
            l3_name="Databases",
            status="active",
            tags=("postgresql",),
            search_terms=("postgresql", "postgres"),
        ),
        SkillRecord(
            code="03.001.001.00006",
            name="Terraform",
            aliases=(),
            slug="terraform",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-OPS",
            l3_name="Cloud",
            status="active",
            tags=("terraform",),
            search_terms=("terraform",),
        ),
    )

    by_name = {
        "react": (skills[0],),
        "typescript": (skills[1],),
        "kubernetes": (skills[2],),
        "node.js": (skills[3],),
        "postgresql": (skills[4],),
        "terraform": (skills[5],),
    }
    by_alias = {
        "react js": (skills[0],),
        "ts": (skills[1],),
        "k8s": (skills[2],),
        "nodejs": (skills[3],),
        "node js": (skills[3],),
        "postgres": (skills[4],),
    }

    term_to_codes = {
        "react": (skills[0].code,),
        "react.js": (skills[0].code,),
        "react js": (skills[0].code,),
        "typescript": (skills[1].code,),
        "ts": (skills[1].code,),
        "type script": (skills[1].code,),
        "kubernetes": (skills[2].code,),
        "k8s": (skills[2].code,),
        "node.js": (skills[3].code,),
        "nodejs": (skills[3].code,),
        "node js": (skills[3].code,),
        "postgresql": (skills[4].code,),
        "postgres": (skills[4].code,),
        "terraform": (skills[5].code,),
    }

    return SkillDb(
        metadata={"source_mode": "test"},
        skills=skills,
        by_code={skill.code: skill for skill in skills},
        by_name=by_name,
        by_alias=by_alias,
        term_to_codes=term_to_codes,
        term_choices=tuple(sorted(term_to_codes.keys())),
    )


def _leet_variant(value: str) -> str:
    return (
        value.replace("a", "4")
        .replace("A", "4")
        .replace("e", "3")
        .replace("E", "3")
        .replace("i", "1")
        .replace("I", "1")
        .replace("o", "0")
        .replace("O", "0")
    )


def _confusable_variant(value: str) -> str:
    return (
        value.replace("a", "а")
        .replace("A", "А")
        .replace("e", "е")
        .replace("E", "Е")
        .replace("o", "о")
        .replace("O", "О")
    )


def _mutate(value: str, rng: Random) -> str:
    variant = value

    transform = rng.randrange(8)
    if transform == 0:
        variant = value.upper()
    elif transform == 1:
        variant = value.lower()
    elif transform == 2:
        variant = value.title()
    elif transform == 3:
        variant = _leet_variant(value)
    elif transform == 4:
        variant = _confusable_variant(value)
    elif transform == 5:
        variant = value.replace(".", " ")
    elif transform == 6:
        variant = value.replace(" ", "-")

    if rng.random() < 0.35:
        variant = f"  {variant}  "

    if rng.random() < 0.25 and "/" not in variant:
        variant = variant.replace(" ", " / ")

    return variant


def test_1000_mutations_keep_expected_top_match_and_are_deterministic():
    rng = Random(20260301)
    db = _skill_db_fixture()

    canonical = [
        ("React.js", "03.001.001.00001"),
        ("TypeScript", "03.001.001.00002"),
        ("K8s", "03.001.001.00003"),
        ("NodeJS", "03.001.001.00004"),
        ("Postgres", "03.001.001.00005"),
        ("Terraform", "03.001.001.00006"),
    ]

    cases: list[tuple[str, str]] = []
    for i in range(1000):
        base, code = canonical[i % len(canonical)]
        cases.append((_mutate(base, rng), code))

    seeds = [
        CandidateSeed(
            raw_skill_text=text,
            evidence_snippets=(f"Evidence for {text}",),
            confidence=0.8,
            category="technical",
        )
        for text, _ in cases
    ]

    first = match_skill_candidates(seeds, db, suggestions_limit=5)
    second = match_skill_candidates(seeds, db, suggestions_limit=5)

    assert first == second

    for matched, (_, expected_code) in zip(first, cases):
        assert matched.suggestions
        assert matched.suggestions[0].skill_id == expected_code
