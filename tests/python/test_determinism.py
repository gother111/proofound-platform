from __future__ import annotations

from python_cv.service import ImportLimits, process_skill_documents
from python_cv.skill_db import SkillDb, SkillRecord


def _db() -> SkillDb:
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
        by_code={s.code: s for s in skills},
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


def test_skill_processing_is_deterministic_for_same_input():
    documents = [
        {
            "document_id": "doc-1",
            "file_name": "cv.pdf",
            "text": "Skills: React, TypeScript, React.js",
            "context": "cv",
        }
    ]
    limits = ImportLimits(max_documents=5, max_chars_per_document=30000, max_total_chars=90000)
    db = _db()

    first = process_skill_documents(documents, db, limits=limits, suggestions_limit=8)
    second = process_skill_documents(documents, db, limits=limits, suggestions_limit=8)

    assert first == second
