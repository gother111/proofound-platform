from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

PYTHON_INTERNAL_SERVICE_NAME = "document_intelligence"
PYTHON_INTERNAL_CONTRACT_VERSION = "2026-03-06.python-internal.v1"

CandidateCategory = Literal[
    "technical",
    "soft_skills",
    "tools_technologies",
    "languages",
    "certifications",
    "other",
]

MatchMethod = Literal["exact", "synonym", "fuzzy", "semantic"]


class CvImportDocumentIn(BaseModel):
    document_id: str = Field(min_length=1, max_length=128)
    file_name: str = Field(min_length=1, max_length=260)
    text: str = Field(min_length=1)
    context: Literal["cv", "jd", "general"] = "cv"


class CvImportSuggestRequest(BaseModel):
    documents: list[CvImportDocumentIn] = Field(min_length=1)
    suggestions_limit: int | None = Field(default=None, ge=5, le=10)


class SuggestionOut(BaseModel):
    skill_id: str
    skill_name: str
    match_method: MatchMethod
    score: float = Field(ge=0, le=1)


class SkillCandidateOut(BaseModel):
    candidate_id: str
    raw_skill_text: str
    category: CandidateCategory
    evidence_snippets: list[str] = Field(min_length=1, max_length=3)
    confidence: float = Field(ge=0, le=1)
    suggestions: list[SuggestionOut]
    unmapped_candidate: bool


class MetadataLimitsOut(BaseModel):
    max_documents: int
    max_chars_per_document: int
    max_total_chars: int


class MetadataOut(BaseModel):
    semantic_used: bool = False
    semantic_fallback_triggered: bool = False
    unmapped_candidates_count: int = 0
    limits: MetadataLimitsOut
    service: str = PYTHON_INTERNAL_SERVICE_NAME
    contract_version: str = PYTHON_INTERNAL_CONTRACT_VERSION


class SuggestDocumentOut(BaseModel):
    document_id: str
    file_name: str
    context: Literal["cv", "jd", "general"]
    parsed_text: str = ""
    parse_error: str | None = None
    parse_error_code: str | None = None
    candidate_count: int
    candidates: list[SkillCandidateOut]


class SuggestResponse(BaseModel):
    documents: list[SuggestDocumentOut]
    metadata: MetadataOut


class ExtractDocumentOut(BaseModel):
    document_id: str
    file_name: str
    context: Literal["cv", "jd", "general"]
    parsed_text: str = ""
    parse_error: str | None = None
    parse_error_code: str | None = None


class ExtractResponse(BaseModel):
    documents: list[ExtractDocumentOut]
    metadata: MetadataOut
