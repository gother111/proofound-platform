from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from rapidfuzz import fuzz, process

from python_cv.skill_candidate_extract import CandidateSeed
from python_cv.skill_db import SkillDb
from python_cv.text_normalize import expand_token_variants, normalize_token


@dataclass(frozen=True)
class MatchedSuggestion:
    skill_id: str
    skill_name: str
    match_method: str
    score: float


@dataclass(frozen=True)
class MatchedCandidate:
    candidate_id: str
    raw_skill_text: str
    category: str
    evidence_snippets: tuple[str, ...]
    confidence: float
    suggestions: tuple[MatchedSuggestion, ...]
    unmapped_candidate: bool


def _fuzzy_threshold(normalized_candidate: str) -> int:
    token_count = len(normalized_candidate.split())
    if token_count <= 1 and len(normalized_candidate) <= 2:
        return 100
    if token_count <= 1 and len(normalized_candidate) <= 3:
        return 97
    if token_count <= 1 and len(normalized_candidate) <= 4:
        return 95
    if token_count <= 1 and len(normalized_candidate) <= 6:
        return 92
    if token_count <= 2:
        return 90
    return 86


def _method_rank(method: str) -> int:
    return {"exact": 4, "synonym": 3, "fuzzy": 2, "semantic": 1}.get(method, 0)


def _upsert_suggestion(container: dict[str, MatchedSuggestion], suggestion: MatchedSuggestion) -> None:
    existing = container.get(suggestion.skill_id)
    if existing is None:
        container[suggestion.skill_id] = suggestion
        return

    incoming_rank = _method_rank(suggestion.match_method)
    existing_rank = _method_rank(existing.match_method)

    if incoming_rank > existing_rank or (
        incoming_rank == existing_rank and suggestion.score > existing.score
    ):
        container[suggestion.skill_id] = suggestion


def _dedupe_sorted(values: Iterable[MatchedSuggestion], limit: int) -> tuple[MatchedSuggestion, ...]:
    ordered = sorted(
        values,
        key=lambda item: (-_method_rank(item.match_method), -item.score, item.skill_name.lower()),
    )
    return tuple(ordered[:limit])


def match_skill_candidates(
    candidates: list[CandidateSeed],
    skill_db: SkillDb,
    *,
    suggestions_limit: int,
) -> list[MatchedCandidate]:
    matched_candidates: list[MatchedCandidate] = []

    for index, candidate in enumerate(candidates, start=1):
        normalized_candidate = normalize_token(candidate.raw_skill_text)
        candidate_variants = expand_token_variants(candidate.raw_skill_text)
        suggestion_map: dict[str, MatchedSuggestion] = {}

        if normalized_candidate and candidate_variants:
            for token_variant in candidate_variants:
                for exact_skill in skill_db.by_name.get(token_variant, ()):  # exact name
                    _upsert_suggestion(
                        suggestion_map,
                        MatchedSuggestion(
                            skill_id=exact_skill.code,
                            skill_name=exact_skill.name,
                            match_method="exact",
                            score=1.0,
                        ),
                    )

                for alias_skill in skill_db.by_alias.get(token_variant, ()):  # exact alias
                    _upsert_suggestion(
                        suggestion_map,
                        MatchedSuggestion(
                            skill_id=alias_skill.code,
                            skill_name=alias_skill.name,
                            match_method="synonym",
                            score=0.95,
                        ),
                    )

            fuzzy_variants = sorted(
                set(candidate_variants),
                key=lambda item: (-len(item), item),
            )[:3]

            for fuzzy_variant in fuzzy_variants:
                threshold = _fuzzy_threshold(fuzzy_variant)
                if threshold >= 100:
                    continue

                fuzzy_matches = process.extract(
                    fuzzy_variant,
                    skill_db.term_choices,
                    scorer=fuzz.WRatio,
                    limit=80,
                )

                for term, ratio, _ in fuzzy_matches:
                    if int(ratio) < threshold:
                        continue

                    normalized_term = normalize_token(term)
                    if not normalized_term:
                        continue

                    for code in skill_db.term_to_codes.get(normalized_term, ()):  # fuzzy to code
                        skill = skill_db.by_code.get(code)
                        if skill is None:
                            continue

                        token_score = fuzz.token_set_ratio(fuzzy_variant, normalized_term)
                        combined = max(float(ratio), float(token_score)) / 100.0
                        if combined < threshold / 100.0:
                            continue

                        _upsert_suggestion(
                            suggestion_map,
                            MatchedSuggestion(
                                skill_id=skill.code,
                                skill_name=skill.name,
                                match_method="fuzzy",
                                score=min(0.94, combined),
                            ),
                        )

        suggestions = _dedupe_sorted(suggestion_map.values(), suggestions_limit)

        matched_candidates.append(
            MatchedCandidate(
                candidate_id=f"candidate-{index}",
                raw_skill_text=candidate.raw_skill_text,
                category=candidate.category,
                evidence_snippets=candidate.evidence_snippets,
                confidence=round(max(0.0, min(1.0, candidate.confidence)), 3),
                suggestions=suggestions,
                unmapped_candidate=len(suggestions) == 0,
            )
        )

    return matched_candidates
