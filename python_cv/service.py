from __future__ import annotations

from dataclasses import dataclass

from python_cv.entity_extract import extract_all_entities
from python_cv.skill_candidate_extract import extract_skill_candidates
from python_cv.skill_db import SkillDb
from python_cv.skill_matcher import MatchedCandidate, match_skill_candidates


@dataclass(frozen=True)
class ImportLimits:
    max_documents: int
    max_chars_per_document: int
    max_total_chars: int


def default_limits() -> ImportLimits:
    return ImportLimits(max_documents=5, max_chars_per_document=30000, max_total_chars=90000)


def _clamp_suggestions_limit(value: int | None) -> int:
    if value is None:
        return 8
    return max(5, min(10, int(value)))


def _serialize_candidate(candidate: MatchedCandidate) -> dict[str, object]:
    return {
        "candidate_id": candidate.candidate_id,
        "raw_skill_text": candidate.raw_skill_text,
        "category": candidate.category,
        "evidence_snippets": list(candidate.evidence_snippets),
        "confidence": candidate.confidence,
        "suggestions": [
            {
                "skill_id": item.skill_id,
                "skill_name": item.skill_name,
                "match_method": item.match_method,
                "score": item.score,
            }
            for item in candidate.suggestions
        ],
        "unmapped_candidate": candidate.unmapped_candidate,
    }


def _metadata(limits: ImportLimits, unmapped_count: int) -> dict[str, object]:
    return {
        "semantic_used": False,
        "semantic_fallback_triggered": False,
        "unmapped_candidates_count": unmapped_count,
        "limits": {
            "max_documents": limits.max_documents,
            "max_chars_per_document": limits.max_chars_per_document,
            "max_total_chars": limits.max_total_chars,
        },
    }


def validate_documents_limit(documents_count: int, limits: ImportLimits) -> None:
    if documents_count > limits.max_documents:
        raise ValueError(f"Too many documents. Maximum allowed is {limits.max_documents}.")


def validate_text_limits(text: str, limits: ImportLimits) -> str:
    if len(text) > limits.max_chars_per_document:
        raise ValueError(
            f"Document exceeds max size of {limits.max_chars_per_document} characters."
        )
    return text


def validate_total_chars(total_chars: int, limits: ImportLimits) -> None:
    if total_chars > limits.max_total_chars:
        raise ValueError(f"Total payload too large. Maximum is {limits.max_total_chars} characters.")


def process_wizard_documents(
    documents: list[dict[str, str]],
    skill_db: SkillDb,
    *,
    limits: ImportLimits,
    suggestions_limit: int | None,
) -> dict[str, object]:
    validate_documents_limit(len(documents), limits)

    total_chars = 0
    output_documents: list[dict[str, object]] = []
    unmapped = 0
    suggestion_limit = _clamp_suggestions_limit(suggestions_limit)

    for source in documents:
        document_text = validate_text_limits(source.get("text", ""), limits)
        total_chars += len(document_text)
        validate_total_chars(total_chars, limits)

        entities = extract_all_entities(document_text)
        candidates = extract_skill_candidates(document_text)
        matched = match_skill_candidates(candidates, skill_db, suggestions_limit=suggestion_limit)

        unmapped += sum(1 for item in matched if item.unmapped_candidate)

        output_documents.append(
            {
                "document_id": source["document_id"],
                "file_name": source["file_name"],
                "context": "cv",
                "parsed_text": document_text,
                "parse_error": source.get("parse_error"),
                "work_experiences": entities["work_experiences"],
                "learning_experiences": entities["learning_experiences"],
                "volunteering": entities["volunteering"],
                "languages": entities["languages"],
                "skill_candidates": [_serialize_candidate(item) for item in matched],
            }
        )

    return {
        "documents": output_documents,
        "metadata": _metadata(limits, unmapped),
    }


def process_skill_documents(
    documents: list[dict[str, str]],
    skill_db: SkillDb,
    *,
    limits: ImportLimits,
    suggestions_limit: int | None,
) -> dict[str, object]:
    validate_documents_limit(len(documents), limits)

    total_chars = 0
    output_documents: list[dict[str, object]] = []
    unmapped = 0
    suggestion_limit = _clamp_suggestions_limit(suggestions_limit)

    for source in documents:
        document_text = validate_text_limits(source.get("text", ""), limits)
        total_chars += len(document_text)
        validate_total_chars(total_chars, limits)

        candidates = extract_skill_candidates(document_text)
        matched = match_skill_candidates(candidates, skill_db, suggestions_limit=suggestion_limit)

        unmapped += sum(1 for item in matched if item.unmapped_candidate)

        output_documents.append(
            {
                "document_id": source["document_id"],
                "file_name": source["file_name"],
                "context": source.get("context", "cv"),
                "parsed_text": document_text,
                "parse_error": source.get("parse_error"),
                "candidate_count": len(matched),
                "candidates": [_serialize_candidate(item) for item in matched],
            }
        )

    return {
        "documents": output_documents,
        "metadata": _metadata(limits, unmapped),
    }
