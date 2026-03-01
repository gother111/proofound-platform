from __future__ import annotations

import re
from dataclasses import dataclass

from python_cv.text_normalize import normalize_token, normalize_whitespace

MAX_CANDIDATES = 40
MAX_CANDIDATE_LENGTH = 80
MAX_TOKENS = 8

SKILLS_HEADING_RE = re.compile(
    r"\b(skills?|technologies|tooling|competencies|technical skills|core skills|stack|languages)\b",
    re.IGNORECASE,
)

SECTION_HEADING_RE = re.compile(r"^[A-Za-z][A-Za-z\s/&-]{2,60}:?$")

SPLIT_RE = re.compile(r"\s*(?:,|;|\||/|\\u2022|\u2022|\band\b|\bor\b)\s*", re.IGNORECASE)
DATE_LIKE_RE = re.compile(
    r"\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)?\s*\d{4}\b|(?:\b\d{4}\s*[-–]\s*(?:present|current|\d{4}))|(?:\d+\s*(?:years?|months?))",
    re.IGNORECASE,
)
VERB_HEAVY_RE = re.compile(
    r"\b(built|designed|led|delivered|implemented|optimized|coordinated|improved|managed)\b",
    re.IGNORECASE,
)
STOP_SECTION_HEADINGS = {
    "summary",
    "profile",
    "experience",
    "work experience",
    "professional experience",
    "employment",
    "projects",
    "project highlights",
    "education",
    "certifications",
    "languages",
    "achievements",
    "publications",
    "volunteering",
    "references",
}

STOPWORDS = {
    "the",
    "and",
    "or",
    "for",
    "with",
    "from",
    "into",
    "in",
    "of",
    "to",
    "a",
    "an",
    "on",
    "using",
    "used",
    "experience",
    "skills",
    "knowledge",
    "proficient",
}

LANGUAGE_KEYWORDS = {
    "english",
    "swedish",
    "spanish",
    "german",
    "french",
    "italian",
    "portuguese",
    "arabic",
    "hindi",
    "mandarin",
    "japanese",
    "korean",
    "norwegian",
    "danish",
    "finnish",
}

SOFT_SKILL_KEYWORDS = {
    "communication",
    "leadership",
    "collaboration",
    "teamwork",
    "problem solving",
    "critical thinking",
    "stakeholder management",
}

CERT_KEYWORDS = {"certification", "certified", "certificate", "pmp", "iso"}

TOOL_KEYWORDS = {
    "jira",
    "figma",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "github",
    "gitlab",
    "jenkins",
    "tableau",
    "power bi",
    "excel",
    "salesforce",
    "sap",
    "notion",
    "slack",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "react",
    "typescript",
    "python",
    "java",
    "node",
    "nextjs",
    "next.js",
}


@dataclass(frozen=True)
class CandidateSeed:
    raw_skill_text: str
    evidence_snippets: tuple[str, ...]
    confidence: float
    category: str


def _is_valid_candidate(value: str) -> bool:
    normalized = normalize_token(value)
    if not normalized:
        return False
    if len(normalized) > MAX_CANDIDATE_LENGTH:
        return False
    tokens = normalized.split()
    if not tokens or len(tokens) > MAX_TOKENS:
        return False

    if all(token in STOPWORDS for token in tokens):
        return False

    if len(normalized) <= 1:
        return False

    if DATE_LIKE_RE.search(value):
        return False

    if len(tokens) > 4 and VERB_HEAVY_RE.search(normalized):
        return False

    if len(tokens) == 1 and tokens[0] in {"ci", "cd"}:
        return False

    return True


def _infer_category(value: str) -> str:
    normalized = normalize_token(value)

    if normalized in LANGUAGE_KEYWORDS:
        return "languages"

    if normalized in SOFT_SKILL_KEYWORDS:
        return "soft_skills"

    if any(keyword in normalized for keyword in CERT_KEYWORDS):
        return "certifications"

    if any(keyword in normalized for keyword in TOOL_KEYWORDS):
        return "tools_technologies"

    if "management" in normalized or "lead" in normalized:
        return "soft_skills"

    if "data" in normalized or "engineering" in normalized or "development" in normalized:
        return "technical"

    return "other"


def _split_candidate_line(line: str) -> list[str]:
    trimmed = normalize_whitespace(line)
    if not trimmed:
        return []

    if ":" in trimmed and len(trimmed.split(":", 1)[0].split()) <= 4:
        _, right = trimmed.split(":", 1)
        trimmed = normalize_whitespace(right)

    return [segment for segment in SPLIT_RE.split(trimmed) if segment]


def _extract_skill_section_lines(lines: list[str]) -> list[str]:
    section_lines: list[str] = []

    idx = 0
    while idx < len(lines):
        line = normalize_whitespace(lines[idx])
        if not line:
            idx += 1
            continue

        if SKILLS_HEADING_RE.search(line):
            idx += 1
            while idx < len(lines):
                candidate = normalize_whitespace(lines[idx])
                if not candidate:
                    if section_lines and idx + 1 < len(lines):
                        peek = normalize_whitespace(lines[idx + 1])
                        if SECTION_HEADING_RE.match(peek):
                            break
                    idx += 1
                    continue

                if SECTION_HEADING_RE.match(candidate) and not SKILLS_HEADING_RE.search(candidate):
                    break

                normalized_heading = normalize_token(candidate.rstrip(":"))
                if normalized_heading in STOP_SECTION_HEADINGS:
                    break

                section_lines.append(candidate)
                idx += 1
            continue

        idx += 1

    return section_lines


def _extract_ngrams_from_line(line: str) -> list[str]:
    tokens = [token for token in normalize_token(line).split() if token and token not in STOPWORDS]
    ngrams: list[str] = []
    for size in range(1, min(4, len(tokens)) + 1):
        for start in range(0, len(tokens) - size + 1):
            ngram = " ".join(tokens[start : start + size])
            if len(ngram) >= 2:
                ngrams.append(ngram)
    return ngrams


def extract_skill_candidates(text: str, max_candidates: int = MAX_CANDIDATES) -> list[CandidateSeed]:
    lines = [normalize_whitespace(line) for line in text.replace("\r", "\n").split("\n")]
    lines = [line for line in lines if line]

    section_lines = _extract_skill_section_lines(lines)
    candidate_map: dict[str, CandidateSeed] = {}

    def add_candidate(raw_value: str, evidence: str, confidence: float) -> None:
        value = normalize_whitespace(raw_value)
        if not _is_valid_candidate(value):
            return

        normalized = normalize_token(value)
        if not normalized:
            return

        evidence_snippet = normalize_whitespace(evidence)[:240]
        if not evidence_snippet:
            return

        category = _infer_category(value)

        existing = candidate_map.get(normalized)
        if existing is None or confidence > existing.confidence:
            candidate_map[normalized] = CandidateSeed(
                raw_skill_text=value,
                evidence_snippets=(evidence_snippet,),
                confidence=max(0.0, min(1.0, confidence)),
                category=category,
            )

    for line in section_lines:
        for part in _split_candidate_line(line):
            add_candidate(part, line, 0.82)

        for ngram in _extract_ngrams_from_line(line):
            add_candidate(ngram, line, 0.58)

    if not candidate_map:
        for line in lines:
            if len(line.split()) > 14:
                continue
            if not any(keyword in normalize_token(line) for keyword in TOOL_KEYWORDS | LANGUAGE_KEYWORDS):
                continue
            for part in _split_candidate_line(line):
                add_candidate(part, line, 0.66)

    candidates = sorted(candidate_map.values(), key=lambda item: (-item.confidence, item.raw_skill_text))
    return candidates[:max_candidates]
