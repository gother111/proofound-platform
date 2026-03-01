from __future__ import annotations

import asyncio

from fastapi.responses import JSONResponse
from starlette.requests import Request

import api.python.cv_import as cv_import


def _make_request(endpoint: str) -> Request:
    scope = {
        "type": "http",
        "method": "POST",
        "path": "/api/python/cv_import",
        "query_string": f"endpoint={endpoint}".encode("utf-8"),
        "headers": [],
        "client": ("127.0.0.1", 1234),
        "server": ("testserver", 80),
        "scheme": "http",
        "http_version": "1.1",
    }

    async def receive() -> dict[str, object]:
        return {"type": "http.request", "body": b"", "more_body": False}

    return Request(scope, receive)


def test_dispatch_routes_wizard_suggest_endpoint(monkeypatch):
    async def fake_wizard_suggest(_request):
        return JSONResponse({"handler": "wizard"})

    async def fake_suggest(_request):
        return JSONResponse({"handler": "suggest"})

    monkeypatch.setattr(cv_import, "wizard_suggest", fake_wizard_suggest)
    monkeypatch.setattr(cv_import, "suggest", fake_suggest)

    response = asyncio.run(cv_import.dispatch_import(_make_request("wizard-suggest")))

    assert response.status_code == 200
    assert response.body == b'{"handler":"wizard"}'


def test_dispatch_routes_suggest_endpoint(monkeypatch):
    async def fake_wizard_suggest(_request):
        return JSONResponse({"handler": "wizard"})

    async def fake_suggest(_request):
        return JSONResponse({"handler": "suggest"})

    monkeypatch.setattr(cv_import, "wizard_suggest", fake_wizard_suggest)
    monkeypatch.setattr(cv_import, "suggest", fake_suggest)

    response = asyncio.run(cv_import.dispatch_import(_make_request("suggest")))

    assert response.status_code == 200
    assert response.body == b'{"handler":"suggest"}'


def test_dispatch_rejects_invalid_endpoint():
    response = asyncio.run(cv_import.dispatch_import(_make_request("unknown")))

    assert response.status_code == 400
    assert response.body == (
        b'{"error":"Invalid endpoint parameter","message":"Use endpoint=wizard-suggest or endpoint=suggest."}'
    )
