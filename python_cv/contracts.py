from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

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


class WorkExperienceOut(BaseModel):
    item_id: str
    title: str
    organization: str
    duration: str
    summary: str
    evidence_snippets: list[str] = Field(min_length=1, max_length=3)
    confidence: float = Field(ge=0, le=1)


class LearningExperienceOut(BaseModel):
    item_id: str
    institution: str
    degree: str
    duration: str
    skills: str
    projects: str
    evidence_snippets: list[str] = Field(min_length=1, max_length=3)
    confidence: float = Field(ge=0, le=1)


class VolunteeringOut(BaseModel):
    item_id: str
    title: str
    organization: str
    duration: str
    cause: str
    impact: str
    skills_deployed: str
    personal_why: str
    evidence_snippets: list[str] = Field(min_length=1, max_length=3)
    confidence: float = Field(ge=0, le=1)


class LanguageOut(BaseModel):
    item_id: str
    language_code: str
    language_name: str
    level: Literal["A1", "A2", "B1", "B2", "C1", "C2"]
    evidence_snippets: list[str] = Field(min_length=1, max_length=3)
    confidence: float = Field(ge=0, le=1)


class MetadataLimitsOut(BaseModel):
    max_documents: int
    max_chars_per_document: int
    max_total_chars: int


class MetadataOut(BaseModel):
    semantic_used: bool = False
    semantic_fallback_triggered: bool = False
    unmapped_candidates_count: int = 0
    limits: MetadataLimitsOut


class WizardDocumentOut(BaseModel):
    document_id: str
    file_name: str
    context: Literal["cv"] = "cv"
    parsed_text: str = ""
    parse_error: str | None = None
    parse_error_code: str | None = None
    work_experiences: list[WorkExperienceOut]
    learning_experiences: list[LearningExperienceOut]
    volunteering: list[VolunteeringOut]
    languages: list[LanguageOut]
    skill_candidates: list[SkillCandidateOut]


class WizardSuggestResponse(BaseModel):
    documents: list[WizardDocumentOut]
    metadata: MetadataOut


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
