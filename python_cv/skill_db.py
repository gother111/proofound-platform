from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from python_cv.text_normalize import expand_token_variants, normalize_token

DEFAULT_DB_PATH = Path(__file__).resolve().parent / "data" / "skills_db.json"


class SkillDbUnavailableError(Exception):
    pass


@dataclass(frozen=True)
class SkillRecord:
    code: str
    name: str
    aliases: tuple[str, ...]
    slug: str
    cat_id: int | None
    subcat_id: int | None
    l3_id: int | None
    l1_code: str | None
    l2_code: str | None
    l3_name: str | None
    status: str
    tags: tuple[str, ...]
    search_terms: tuple[str, ...]


@dataclass(frozen=True)
class SkillDb:
    metadata: dict[str, Any]
    skills: tuple[SkillRecord, ...]
    by_code: dict[str, SkillRecord]
    by_name: dict[str, tuple[SkillRecord, ...]]
    by_alias: dict[str, tuple[SkillRecord, ...]]
    term_to_codes: dict[str, tuple[str, ...]]
    term_choices: tuple[str, ...]


_cached_skill_db: SkillDb | None = None


def _default_if_none(value: Any, default: Any) -> Any:
    return value if value is not None else default


def _as_int(value: Any) -> int | None:
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def _tuple_of_strings(value: Any) -> tuple[str, ...]:
    if not isinstance(value, list):
        return ()
    return tuple(item.strip() for item in value if isinstance(item, str) and item.strip())


def _build_skill(record: dict[str, Any]) -> SkillRecord:
    search_terms = _tuple_of_strings(record.get("search_terms"))
    if not search_terms:
        derived_terms = {record.get("name", ""), record.get("slug", "")}
        derived_terms.update(record.get("aliases", []) or [])
        search_terms = tuple(
            term for term in {normalize_token(str(term)) for term in derived_terms} if term
        )

    return SkillRecord(
        code=str(record.get("code", "")).strip(),
        name=str(record.get("name", "")).strip(),
        aliases=_tuple_of_strings(record.get("aliases")),
        slug=str(record.get("slug", "")).strip(),
        cat_id=_as_int(record.get("cat_id")),
        subcat_id=_as_int(record.get("subcat_id")),
        l3_id=_as_int(record.get("l3_id")),
        l1_code=record.get("l1_code"),
        l2_code=record.get("l2_code"),
        l3_name=record.get("l3_name"),
        status=str(_default_if_none(record.get("status"), "active")),
        tags=_tuple_of_strings(record.get("tags")),
        search_terms=search_terms,
    )


def load_skill_db(force_reload: bool = False) -> SkillDb:
    global _cached_skill_db

    if _cached_skill_db and not force_reload:
        return _cached_skill_db

    configured_path = os.environ.get("PYTHON_CV_SKILLS_DB_PATH")
    db_path = Path(configured_path) if configured_path else DEFAULT_DB_PATH

    if not db_path.exists():
        raise SkillDbUnavailableError(f"skills_db.json not found at {db_path}")

    payload = json.loads(db_path.read_text(encoding="utf-8"))
    records = payload.get("skills")
    if not isinstance(records, list):
        raise SkillDbUnavailableError("skills_db.json has invalid format: missing skills array")

    skills = tuple(_build_skill(record) for record in records if isinstance(record, dict))
    skills = tuple(skill for skill in skills if skill.code and skill.name)

    by_code = {skill.code: skill for skill in skills}

    by_name_map: dict[str, list[SkillRecord]] = {}
    by_alias_map: dict[str, list[SkillRecord]] = {}
    term_to_codes: dict[str, set[str]] = {}

    for skill in skills:
        for normalized_name in expand_token_variants(skill.name):
            by_name_map.setdefault(normalized_name, []).append(skill)
            term_to_codes.setdefault(normalized_name, set()).add(skill.code)

        for alias in skill.aliases:
            for normalized_alias in expand_token_variants(alias):
                by_alias_map.setdefault(normalized_alias, []).append(skill)
                term_to_codes.setdefault(normalized_alias, set()).add(skill.code)

        for term in skill.search_terms:
            for normalized_term in expand_token_variants(term):
                term_to_codes.setdefault(normalized_term, set()).add(skill.code)

    by_name = {key: tuple(value) for key, value in by_name_map.items()}
    by_alias = {key: tuple(value) for key, value in by_alias_map.items()}
    term_to_codes_final = {
        key: tuple(sorted(value))
        for key, value in term_to_codes.items()
        if key and value
    }

    _cached_skill_db = SkillDb(
        metadata=payload.get("metadata", {}),
        skills=skills,
        by_code=by_code,
        by_name=by_name,
        by_alias=by_alias,
        term_to_codes=term_to_codes_final,
        term_choices=tuple(term_to_codes_final.keys()),
    )

    return _cached_skill_db
