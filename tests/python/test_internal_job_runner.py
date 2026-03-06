from __future__ import annotations

import asyncio
import json

from starlette.requests import Request

import api.python.cv_import as cv_import


def _make_request(payload: dict[str, object]) -> Request:
    body = json.dumps(payload).encode("utf-8")
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/python/cv_import",
        "query_string": b"",
        "headers": [
            (b"x-python-service-secret", b"proofound-local-python-service"),
            (b"content-type", b"application/json"),
        ],
        "client": ("127.0.0.1", 1234),
        "server": ("testserver", 80),
        "scheme": "http",
        "http_version": "1.1",
    }

    async def receive() -> dict[str, object]:
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(scope, receive)


def test_internal_job_returns_contract_version(monkeypatch):
    monkeypatch.setattr(cv_import, "_load_skill_db_or_response", lambda: (object(), None))
    monkeypatch.setattr(
        cv_import,
        "process_skill_documents",
        lambda *args, **kwargs: {
            "documents": [
                {
                    "document_id": "doc-1",
                    "file_name": "cv.pdf",
                    "context": "cv",
                    "parsed_text": "React TypeScript",
                    "candidate_count": 1,
                    "candidates": [
                        {
                            "candidate_id": "cand-1",
                            "raw_skill_text": "React",
                            "category": "technical",
                            "evidence_snippets": ["React"],
                            "confidence": 0.93,
                            "suggestions": [
                                {
                                    "skill_id": "skill_react",
                                    "skill_name": "React",
                                    "match_method": "exact",
                                    "score": 1.0,
                                }
                            ],
                            "unmapped_candidate": False,
                        }
                    ],
                }
            ],
            "metadata": {
                "semantic_used": False,
                "semantic_fallback_triggered": False,
                "unmapped_candidates_count": 0,
                "service": "document_intelligence",
                "contract_version": "2026-03-06.python-internal.v1",
                "limits": {
                    "max_documents": 5,
                    "max_chars_per_document": 30000,
                    "max_total_chars": 90000,
                },
            },
        },
    )

    response = asyncio.run(
        cv_import.internal_job(
            _make_request(
                {
                    "job_id": "7f3fa932-5187-420f-ab86-0408a42fd2f5",
                    "job_type": "document_intelligence_quality_report",
                    "payload": {
                        "documents": [
                            {
                                "document_id": "doc-1",
                                "file_name": "cv.pdf",
                                "text": "React TypeScript",
                                "context": "cv",
                            }
                        ]
                    },
                }
            )
        )
    )

    assert response.status_code == 200
    assert b'"contract_version":"2026-03-06.python-internal.v1"' in response.body
    assert b'"service":"document_intelligence"' in response.body
