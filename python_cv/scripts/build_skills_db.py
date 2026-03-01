from __future__ import annotations

import argparse
import hashlib
import json
import os
import zlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from python_cv.text_normalize import normalize_token, slugify

ROOT_DIR = Path(__file__).resolve().parents[2]
OUTPUT_PATH = ROOT_DIR / "python_cv" / "data" / "skills_db.json"
FALLBACK_DATA_PATH = ROOT_DIR / "data" / "expertise-atlas-20k-l4-final.json"

L1_TO_CAT_ID = {
    "U": 1,
    "F": 2,
    "T": 3,
    "L": 4,
    "M": 5,
    "D": 6,
}


class BuildError(Exception):
    pass


def _stable_id(value: str, modulo: int) -> int:
    token = normalize_token(value) or value.lower()
    return (zlib.crc32(token.encode("utf-8")) % modulo) + 1


def _parse_name_i18n(value: Any) -> str:
    if isinstance(value, dict):
        maybe = value.get("en")
        if isinstance(maybe, str):
            return maybe.strip()
    if isinstance(value, str):
        return value.strip()
    return ""


def _parse_aliases(value: Any) -> list[str]:
    aliases: list[str] = []

    if isinstance(value, list):
        for item in value:
            if isinstance(item, str) and item.strip():
                aliases.append(item.strip())
            elif isinstance(item, dict):
                maybe = item.get("en")
                if isinstance(maybe, str) and maybe.strip():
                    aliases.append(maybe.strip())

    if isinstance(value, dict):
        maybe = value.get("en")
        if isinstance(maybe, list):
            aliases.extend([entry.strip() for entry in maybe if isinstance(entry, str) and entry.strip()])

    deduped = []
    seen = set()
    for alias in aliases:
        key = normalize_token(alias)
        if key and key not in seen:
            seen.add(key)
            deduped.append(alias)

    return deduped


def _record_search_terms(name: str, slug: str, aliases: list[str], tags: list[str]) -> list[str]:
    terms = {normalize_token(name), normalize_token(slug)}
    for alias in aliases:
        terms.add(normalize_token(alias))
    for tag in tags:
        terms.add(normalize_token(tag))
    return sorted(term for term in terms if term)


def _build_from_database(database_url: str) -> list[dict[str, Any]]:
    try:
        import psycopg
    except Exception as exc:  # pragma: no cover
        raise BuildError(f"psycopg is required for DB snapshot mode: {exc}") from exc

    skills: dict[str, dict[str, Any]] = {}

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT code, slug, name_i18n, aliases_i18n, cat_id, subcat_id, l3_id, status, tags
                FROM skills_taxonomy
                WHERE status = 'active'
                ORDER BY code
                """
            )
            for (
                code,
                slug,
                name_i18n,
                aliases_i18n,
                cat_id,
                subcat_id,
                l3_id,
                status,
                tags,
            ) in cur.fetchall():
                name = _parse_name_i18n(name_i18n)
                aliases = _parse_aliases(aliases_i18n)

                l1_code = next((key for key, value in L1_TO_CAT_ID.items() if value == cat_id), None)
                l2_code = tags[1].upper() if isinstance(tags, list) and len(tags) > 1 else None
                l3_name = None

                skills[code] = {
                    "code": str(code),
                    "name": name,
                    "aliases": aliases,
                    "slug": str(slug),
                    "cat_id": int(cat_id) if cat_id is not None else None,
                    "subcat_id": int(subcat_id) if subcat_id is not None else None,
                    "l3_id": int(l3_id) if l3_id is not None else None,
                    "l1_code": l1_code,
                    "l2_code": l2_code,
                    "l3_name": l3_name,
                    "status": status or "active",
                    "tags": [str(tag) for tag in tags] if isinstance(tags, list) else [],
                }

            try:
                cur.execute(
                    """
                    SELECT skill_code, alias
                    FROM skills_taxonomy_aliases
                    WHERE status = 'active' AND locale = 'en'
                    """
                )
                for skill_code, alias in cur.fetchall():
                    if skill_code not in skills:
                        continue
                    if not isinstance(alias, str) or not alias.strip():
                        continue
                    cleaned = alias.strip()
                    aliases = skills[skill_code]["aliases"]
                    alias_tokens = {normalize_token(entry) for entry in aliases}
                    normalized = normalize_token(cleaned)
                    if normalized and normalized not in alias_tokens:
                        aliases.append(cleaned)
            except Exception:
                # Alias table can be unavailable in some environments; keep base aliases.
                pass

    records = []
    for code in sorted(skills.keys()):
        record = skills[code]
        record["search_terms"] = _record_search_terms(
            record["name"], record["slug"], record["aliases"], record["tags"]
        )
        records.append(record)

    return records


def _build_from_fallback_file(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise BuildError(f"Fallback data file not found: {path}")

    payload = json.loads(path.read_text(encoding="utf-8"))
    items = payload.get("skills")
    if not isinstance(items, list):
        raise BuildError("Fallback file has invalid shape: expected skills[]")

    records: list[dict[str, Any]] = []
    for idx, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            continue
        name = str(item.get("name", "")).strip()
        if not name:
            continue

        l1_code = str(item.get("l1_code", "")).strip().upper() or None
        cat_id = L1_TO_CAT_ID.get(l1_code or "", 0)
        l2_code = str(item.get("l2_code", "")).strip() or None
        l3_name = str(item.get("l3_name", "")).strip() or None
        subcat_id = _stable_id(l2_code or "unknown-l2", 999)
        l3_id = _stable_id(l3_name or "unknown-l3", 999)
        slug = slugify(name)
        code = f"{cat_id:02d}.{subcat_id:03d}.{l3_id:03d}.{idx:05d}"

        aliases = []
        raw_aliases = item.get("aliases")
        if isinstance(raw_aliases, list):
            aliases = [alias.strip() for alias in raw_aliases if isinstance(alias, str) and alias.strip()]

        tags = [
            (l1_code or "").lower(),
            (l2_code or "").lower(),
            slugify(l3_name or ""),
        ]

        records.append(
            {
                "code": code,
                "name": name,
                "aliases": aliases,
                "slug": f"{slug}-{idx}",
                "cat_id": cat_id if cat_id > 0 else None,
                "subcat_id": subcat_id,
                "l3_id": l3_id,
                "l1_code": l1_code,
                "l2_code": l2_code,
                "l3_name": l3_name,
                "status": "active",
                "tags": [tag for tag in tags if tag],
                "search_terms": _record_search_terms(name, slug, aliases, [tag for tag in tags if tag]),
            }
        )

    return records


def _checksum(records: list[dict[str, Any]]) -> str:
    payload = json.dumps(records, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def build_skills_db(output_path: Path, source_mode: str | None = None) -> dict[str, Any]:
    requested_mode = (source_mode or os.environ.get("PYTHON_CV_SKILLS_SOURCE_MODE") or "auto").lower()
    database_url = os.environ.get("DATABASE_URL")

    records: list[dict[str, Any]]
    resolved_mode: str

    if requested_mode in {"auto", "db"} and database_url:
        try:
            records = _build_from_database(database_url)
            resolved_mode = "database"
        except Exception as exc:
            if requested_mode == "db":
                raise
            print(f"[build_skills_db] DB mode failed, falling back to repo data: {exc}")
            records = _build_from_fallback_file(FALLBACK_DATA_PATH)
            resolved_mode = "repo_fallback"
    else:
        records = _build_from_fallback_file(FALLBACK_DATA_PATH)
        resolved_mode = "repo_fallback"

    checksum = _checksum(records)

    payload = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source_mode": resolved_mode,
            "record_count": len(records),
            "checksum": checksum,
        },
        "skills": records,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Build canonical Python CV skills_db.json")
    parser.add_argument(
        "--output",
        default=str(OUTPUT_PATH),
        help="Output path for skills_db.json",
    )
    parser.add_argument(
        "--source-mode",
        choices=["auto", "db", "repo"],
        default="auto",
        help="Source mode preference",
    )
    args = parser.parse_args()

    source_mode = "repo_fallback" if args.source_mode == "repo" else args.source_mode
    payload = build_skills_db(Path(args.output), source_mode=source_mode)

    print("[build_skills_db] done")
    print(f"  source_mode: {payload['metadata']['source_mode']}")
    print(f"  record_count: {payload['metadata']['record_count']}")
    print(f"  output: {args.output}")


if __name__ == "__main__":
    main()
