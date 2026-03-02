from __future__ import annotations

import asyncio
import json

import pytest

import api.python.cv_import as cv_import


class _MultipartErrorRequest:
    def __init__(self, exc: BaseException):
        self.headers = {"content-type": "multipart/form-data; boundary=----pytest"}
        self.query_params = {}
        self._exc = exc

    async def form(self):
        raise self._exc


@pytest.mark.parametrize("handler", [cv_import.suggest, cv_import.wizard_suggest, cv_import.extract])
def test_multipart_utf8_decode_errors_are_normalized(handler):
    request = _MultipartErrorRequest(
        UnicodeDecodeError("utf-8", b"\xc4", 0, 1, "invalid continuation byte")
    )

    response = asyncio.run(handler(request))
    payload = json.loads(response.body)

    assert response.status_code == 400
    assert payload["error"] == cv_import.UPLOAD_METADATA_ENCODING_ERROR_MESSAGE
    assert payload["code"] == cv_import.ERROR_CODE_MULTIPART_METADATA_INVALID
    assert "utf-8" not in payload["error"].lower()


@pytest.mark.parametrize("handler", [cv_import.suggest, cv_import.wizard_suggest, cv_import.extract])
def test_multipart_wrapped_utf8_decode_errors_are_normalized(handler):
    request = _MultipartErrorRequest(
        RuntimeError(
            "'utf-8' codec can't decode byte 0xc4 in position 177: invalid continuation byte"
        )
    )

    response = asyncio.run(handler(request))
    payload = json.loads(response.body)

    assert response.status_code == 400
    assert payload["error"] == cv_import.UPLOAD_METADATA_ENCODING_ERROR_MESSAGE
    assert payload["code"] == cv_import.ERROR_CODE_MULTIPART_METADATA_INVALID
    assert "invalid continuation byte" not in payload["error"].lower()
