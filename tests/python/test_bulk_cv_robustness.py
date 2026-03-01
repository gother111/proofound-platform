from __future__ import annotations

from random import Random
from time import perf_counter

from python_cv.service import ImportLimits, process_skill_documents
from python_cv.skill_db import SkillDb, SkillRecord
from python_cv.text_normalize import expand_token_variants, normalize_token


def _build_skill_db() -> SkillDb:
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
            search_terms=("react", "react js", "reactjs"),
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
            l2_code="T-WEB",
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
            name="C++",
            aliases=("CPP",),
            slug="c-plus-plus",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-LANG",
            l3_name="Languages",
            status="active",
            tags=("c++",),
            search_terms=("c++", "cpp"),
        ),
        SkillRecord(
            code="03.001.001.00007",
            name="C#",
            aliases=("CSharp",),
            slug="c-sharp",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-LANG",
            l3_name="Languages",
            status="active",
            tags=("c#",),
            search_terms=("c#", "csharp"),
        ),
        SkillRecord(
            code="03.001.001.00008",
            name="Machine Learning",
            aliases=("ML",),
            slug="machine-learning",
            cat_id=3,
            subcat_id=1,
            l3_id=1,
            l1_code="T",
            l2_code="T-AI",
            l3_name="AI",
            status="active",
            tags=("machine-learning",),
            search_terms=("machine learning", "ml"),
        ),
    )

    by_name_map: dict[str, list[SkillRecord]] = {}
    by_alias_map: dict[str, list[SkillRecord]] = {}
    term_to_codes: dict[str, set[str]] = {}

    for skill in skills:
        for term in expand_token_variants(skill.name):
            by_name_map.setdefault(term, []).append(skill)
            term_to_codes.setdefault(term, set()).add(skill.code)

        for alias in skill.aliases:
            for term in expand_token_variants(alias):
                by_alias_map.setdefault(term, []).append(skill)
                term_to_codes.setdefault(term, set()).add(skill.code)

        for term in skill.search_terms:
            for normalized in expand_token_variants(term):
                term_to_codes.setdefault(normalized, set()).add(skill.code)

    return SkillDb(
        metadata={"source_mode": "test"},
        skills=skills,
        by_code={skill.code: skill for skill in skills},
        by_name={key: tuple(value) for key, value in by_name_map.items()},
        by_alias={key: tuple(value) for key, value in by_alias_map.items()},
        term_to_codes={key: tuple(sorted(value)) for key, value in term_to_codes.items()},
        term_choices=tuple(sorted(term_to_codes.keys())),
    )


def _mutate_token(value: str, rng: Random) -> str:
    forms = [
        value,
        value.upper(),
        value.lower(),
        value.title(),
        value.replace("a", "а").replace("e", "е").replace("o", "о"),
        value.replace("i", "1").replace("e", "3").replace("a", "4"),
    ]
    chosen = forms[rng.randrange(len(forms))]
    if rng.random() < 0.25:
        chosen = f"  {chosen}  "
    return chosen


def _build_documents(total: int) -> list[dict[str, str]]:
    rng = Random(42)
    pool = [
        "React.js",
        "TypeScript",
        "K8s",
        "NodeJS",
        "Postgres",
        "C++",
        "CSharp",
        "Machine Learning",
    ]

    documents: list[dict[str, str]] = []
    for index in range(total):
        count = rng.randint(2, 4)
        selected = [_mutate_token(pool[rng.randrange(len(pool))], rng) for _ in range(count)]
        skills_line = ", ".join(selected)
        text = (
            "Experience\n"
            "Senior Engineer at Example Org\n"
            "2018 - Present\n"
            "Built and shipped production systems.\n\n"
            "Skills\n"
            f"{skills_line}\n"
            "Communication, leadership, project delivery\n"
        )
        documents.append(
            {
                "document_id": f"doc-{index + 1}",
                "file_name": f"cv-{index + 1}.pdf",
                "text": text,
                "context": "cv",
            }
        )
    return documents


def test_bulk_1000_cv_processing_is_deterministic_and_high_recall():
    db = _build_skill_db()
    documents = _build_documents(1000)
    limits = ImportLimits(
        max_documents=1200,
        max_chars_per_document=50000,
        max_total_chars=50_000_000,
    )

    started = perf_counter()
    first = process_skill_documents(documents, db, limits=limits, suggestions_limit=8)
    elapsed = perf_counter() - started
    second = process_skill_documents(documents, db, limits=limits, suggestions_limit=8)

    assert first == second
    assert len(first["documents"]) == 1000
    # Keep this generous for CI variability while still protecting regressions.
    assert elapsed < 20

    mapped_docs = sum(
        1
        for document in first["documents"]
        if any(candidate["suggestions"] for candidate in document["candidates"])
    )
    assert mapped_docs >= 980

    # Verify the normalization path catches noisy variants frequently.
    normalized_hits = 0
    for document in first["documents"][:200]:
        for candidate in document["candidates"]:
            if normalize_token(candidate["raw_skill_text"]) in {"react.js", "typescript", "k8s"}:
                if candidate["suggestions"]:
                    normalized_hits += 1
    assert normalized_hits > 0
