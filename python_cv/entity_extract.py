from __future__ import annotations

import re
from dataclasses import dataclass

from python_cv.text_normalize import normalize_whitespace

MAX_ITEMS_PER_ENTITY = 10
EVIDENCE_WINDOW = 180

SECTION_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "work": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"\bexperience\b",
            r"\bwork\s+history\b",
            r"\bemployment\b",
            r"\bprofessional\s+experience\b",
            r"\bcareer\s+history\b",
        ]
    ],
    "learning": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"\beducation\b",
            r"\blearning\b",
            r"\bacademic\b",
            r"\bcertifications?\b",
            r"\btraining\b",
        ]
    ],
    "volunteering": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"\bvolunteer(?:ing)?\b",
            r"\bcommunity\s+service\b",
            r"\bnon[-\s]?profit\b",
        ]
    ],
    "languages": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"\blanguages?\b",
            r"\blanguage\s+skills\b",
        ]
    ],
}

DATE_RANGE_PATTERN = re.compile(
    r"(\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*\d{4}\s*[-–]\s*(?:present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*\d{4})\b)|(\b\d{4}\s*[-–]\s*(?:present|current|\d{4})\b)",
    re.IGNORECASE,
)

INSTITUTION_PATTERN = re.compile(
    r"\b(university|college|school|institute|academy|polytechnic|bootcamp|faculty)\b",
    re.IGNORECASE,
)
DEGREE_PATTERN = re.compile(
    r"\b(bachelor|master|phd|doctorate|diploma|certificate|bootcamp|course|mba|msc|bsc|ba)\b",
    re.IGNORECASE,
)

LANGUAGE_CODE_MAP = {
    "english": "en",
    "swedish": "sv",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "italian": "it",
    "portuguese": "pt",
    "chinese": "zh",
    "mandarin": "zh",
    "japanese": "ja",
    "korean": "ko",
    "arabic": "ar",
    "hindi": "hi",
    "russian": "ru",
    "dutch": "nl",
    "polish": "pl",
}

CEFR_RE = re.compile(r"\b(A1|A2|B1|B2|C1|C2)\b")


@dataclass(frozen=True)
class Block:
    text: str
    start: int
    end: int


def _split_lines(text: str) -> list[tuple[str, int, int]]:
    lines = text.replace("\r", "\n").split("\n")
    entries: list[tuple[str, int, int]] = []
    cursor = 0
    for line in lines:
        start = cursor
        end = start + len(line)
        entries.append((line, start, end))
        cursor = end + 1
    return entries


def _heading_type(line: str) -> str | None:
    trimmed = normalize_whitespace(line).rstrip(":-")
    if not trimmed or len(trimmed) > 80:
        return None
    for section_type, patterns in SECTION_PATTERNS.items():
        if any(pattern.search(trimmed) for pattern in patterns):
            return section_type
    return None


def _detect_sections(lines: list[tuple[str, int, int]]) -> dict[str, tuple[int, int]]:
    headings: list[tuple[str, int]] = []
    for idx, (line, _, _) in enumerate(lines):
        t = _heading_type(line)
        if t:
            headings.append((t, idx))

    sections: dict[str, tuple[int, int]] = {}
    for i, (t, start_idx) in enumerate(headings):
        next_idx = headings[i + 1][1] if i + 1 < len(headings) else len(lines)
        section_start = start_idx + 1
        if section_start < next_idx and t not in sections:
            sections[t] = (section_start, next_idx)
    return sections


def _extract_blocks(lines: list[tuple[str, int, int]], section: tuple[int, int] | None) -> list[Block]:
    if section is None:
        return []
    start, end = section
    blocks: list[Block] = []
    block_start: int | None = None

    for idx in range(start, end):
        text, _, _ = lines[idx]
        is_empty = not normalize_whitespace(text)
        if not is_empty and block_start is None:
            block_start = idx
            continue
        if is_empty and block_start is not None:
            chunk = lines[block_start:idx]
            block_text = "\n".join(item[0] for item in chunk).strip()
            if block_text:
                blocks.append(Block(text=block_text, start=chunk[0][1], end=chunk[-1][2]))
            block_start = None

    if block_start is not None:
        chunk = lines[block_start:end]
        block_text = "\n".join(item[0] for item in chunk).strip()
        if block_text:
            blocks.append(Block(text=block_text, start=chunk[0][1], end=chunk[-1][2]))

    return blocks


def _snippet(full_text: str, start: int, end: int) -> list[str]:
    s = max(0, start - EVIDENCE_WINDOW)
    e = min(len(full_text), end + EVIDENCE_WINDOW)
    snippet = normalize_whitespace(full_text[s:e])
    return [snippet] if snippet else ["CV evidence snippet unavailable"]


def _parse_role_org(first_line: str) -> tuple[str, str]:
    at_match = re.match(r"^(.+?)\s+(?:at|@)\s+(.+)$", first_line, re.IGNORECASE)
    if at_match:
        return normalize_whitespace(at_match.group(1)), normalize_whitespace(at_match.group(2))

    comma_match = re.match(r"^([^,]{2,120}),\s*(.{2,120})$", first_line)
    if comma_match:
        return normalize_whitespace(comma_match.group(1)), normalize_whitespace(comma_match.group(2))

    return first_line[:120] or "Imported Experience", "Organization not specified"


def _parse_duration(text: str) -> str:
    match = DATE_RANGE_PATTERN.search(text)
    if match:
        return normalize_whitespace(match.group(0))
    return "Duration not specified"


def extract_work_experiences(text: str) -> list[dict[str, object]]:
    lines = _split_lines(text)
    sections = _detect_sections(lines)
    blocks = _extract_blocks(lines, sections.get("work"))
    if not blocks:
        return []

    items: list[dict[str, object]] = []
    for idx, block in enumerate(blocks[:MAX_ITEMS_PER_ENTITY], start=1):
        first_line = normalize_whitespace(block.text.split("\n")[0])
        title, organization = _parse_role_org(first_line)
        summary = normalize_whitespace(block.text)[:2000]
        items.append(
            {
                "item_id": f"work-{idx}",
                "title": title,
                "organization": organization,
                "duration": _parse_duration(block.text),
                "summary": summary,
                "evidence_snippets": _snippet(text, block.start, block.end),
                "confidence": 0.74,
            }
        )
    return items


def extract_learning_experiences(text: str) -> list[dict[str, object]]:
    lines = _split_lines(text)
    sections = _detect_sections(lines)
    blocks = _extract_blocks(lines, sections.get("learning"))
    if not blocks:
        return []

    items: list[dict[str, object]] = []
    for idx, block in enumerate(blocks[:MAX_ITEMS_PER_ENTITY], start=1):
        content = normalize_whitespace(block.text)
        first_line = normalize_whitespace(block.text.split("\n")[0])

        institution = first_line if INSTITUTION_PATTERN.search(content) else "Institution not specified"
        degree_match = DEGREE_PATTERN.search(content)
        degree = degree_match.group(0).title() if degree_match else first_line[:120]

        items.append(
            {
                "item_id": f"learning-{idx}",
                "institution": institution[:200],
                "degree": degree[:200],
                "duration": _parse_duration(block.text),
                "skills": content[:1000],
                "projects": content[:1000],
                "evidence_snippets": _snippet(text, block.start, block.end),
                "confidence": 0.69,
            }
        )
    return items


def extract_volunteering(text: str) -> list[dict[str, object]]:
    lines = _split_lines(text)
    sections = _detect_sections(lines)
    blocks = _extract_blocks(lines, sections.get("volunteering"))
    if not blocks:
        return []

    items: list[dict[str, object]] = []
    for idx, block in enumerate(blocks[:MAX_ITEMS_PER_ENTITY], start=1):
        first_line = normalize_whitespace(block.text.split("\n")[0])
        title, organization = _parse_role_org(first_line)
        cause = normalize_whitespace(block.text)[:300] or title
        impact = normalize_whitespace(block.text)[:1000] or title

        items.append(
            {
                "item_id": f"volunteering-{idx}",
                "title": title,
                "organization": organization,
                "duration": _parse_duration(block.text),
                "cause": cause,
                "impact": impact,
                "skills_deployed": impact,
                "personal_why": impact,
                "evidence_snippets": _snippet(text, block.start, block.end),
                "confidence": 0.67,
            }
        )

    return items


def _extract_language_rows(section_text: str) -> list[str]:
    rows = []
    for line in section_text.split("\n"):
        row = normalize_whitespace(line)
        if row:
            rows.append(row)
    return rows


def extract_languages(text: str) -> list[dict[str, object]]:
    lines = _split_lines(text)
    sections = _detect_sections(lines)
    language_rows: list[tuple[str, int, int]] = []

    section = sections.get("languages")
    if section:
        for idx in range(section[0], section[1]):
            line, start, end = lines[idx]
            normalized = normalize_whitespace(line)
            if normalized:
                language_rows.append((normalized, start, end))

    if not language_rows:
        for line, start, end in lines:
            normalized = normalize_whitespace(line)
            if any(lang in normalized.lower() for lang in LANGUAGE_CODE_MAP.keys()):
                language_rows.append((normalized, start, end))

    items: list[dict[str, object]] = []
    used_codes: set[str] = set()

    for idx, (row, start, end) in enumerate(language_rows[: MAX_ITEMS_PER_ENTITY * 2], start=1):
        row_lower = row.lower()
        found = [(name, code) for name, code in LANGUAGE_CODE_MAP.items() if name in row_lower]
        if not found:
            continue

        level_match = CEFR_RE.search(row)
        level = level_match.group(1) if level_match else "B2"

        for name, code in found:
            if code in used_codes:
                continue
            used_codes.add(code)
            items.append(
                {
                    "item_id": f"language-{idx}-{code}",
                    "language_code": code,
                    "language_name": name.title(),
                    "level": level,
                    "evidence_snippets": _snippet(text, start, end),
                    "confidence": 0.78,
                }
            )
            if len(items) >= MAX_ITEMS_PER_ENTITY:
                return items

    return items


def extract_all_entities(text: str) -> dict[str, list[dict[str, object]]]:
    return {
        "work_experiences": extract_work_experiences(text),
        "learning_experiences": extract_learning_experiences(text),
        "volunteering": extract_volunteering(text),
        "languages": extract_languages(text),
    }
