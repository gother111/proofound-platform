from __future__ import annotations

import asyncio

from starlette.requests import Request

import api.python.cv_import as cv_import


def _make_request() -> Request:
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
        return {"type": "http.request", "body": b"{}", "more_body": False}

    return Request(scope, receive)


def test_internal_job_runner_is_archived():
    response = asyncio.run(cv_import.internal_job(_make_request()))

    assert response.status_code == 410
    assert b"archived" in response.body.lower()
