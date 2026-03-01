from __future__ import annotations

from python_cv.contracts import CvImportSuggestRequest, SuggestResponse, WizardSuggestResponse


def test_request_contract_accepts_expected_shape():
    request = CvImportSuggestRequest.model_validate(
        {
            "documents": [
                {
                    "document_id": "doc-1",
                    "file_name": "cv.pdf",
                    "text": "React TypeScript",
                    "context": "cv",
                }
            ],
            "suggestions_limit": 8,
        }
    )

    assert request.documents[0].document_id == "doc-1"
    assert request.suggestions_limit == 8


def test_wizard_response_contract_roundtrip():
    payload = {
        "documents": [
            {
                "document_id": "doc-1",
                "file_name": "cv.pdf",
                "context": "cv",
                "parsed_text": "React TypeScript",
                "parse_error": None,
                "work_experiences": [],
                "learning_experiences": [],
                "volunteering": [],
                "languages": [],
                "skill_candidates": [],
            }
        ],
        "metadata": {
            "semantic_used": False,
            "semantic_fallback_triggered": False,
            "unmapped_candidates_count": 0,
            "limits": {
                "max_documents": 5,
                "max_chars_per_document": 30000,
                "max_total_chars": 90000,
            },
        },
    }

    validated = WizardSuggestResponse.model_validate(payload)
    assert validated.documents[0].file_name == "cv.pdf"


def test_suggest_response_contract_roundtrip():
    payload = {
        "documents": [
            {
                "document_id": "doc-1",
                "file_name": "cv.pdf",
                "context": "cv",
                "parsed_text": "React TypeScript",
                "parse_error": None,
                "candidate_count": 0,
                "candidates": [],
            }
        ],
        "metadata": {
            "semantic_used": False,
            "semantic_fallback_triggered": False,
            "unmapped_candidates_count": 0,
            "limits": {
                "max_documents": 5,
                "max_chars_per_document": 30000,
                "max_total_chars": 90000,
            },
        },
    }

    validated = SuggestResponse.model_validate(payload)
    assert validated.documents[0].context == "cv"
