from __future__ import annotations

import pytest

from python_cv.pdf_extract import PdfEmptyTextError, PdfParseError, extract_text_from_pdf_bytes


class _FakePdf:
    def __init__(self, pages):
        self.pages = pages

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return None


class _FakePage:
    def __init__(self, text: str):
        self._text = text

    def extract_text(self):
        return self._text


def test_extracts_text_in_page_order(monkeypatch):
    fake_pdf = _FakePdf([_FakePage("Hello"), _FakePage("World")])

    def _open(_):
        return fake_pdf

    monkeypatch.setattr("python_cv.pdf_extract.pdfplumber.open", _open)

    extracted = extract_text_from_pdf_bytes(b"dummy", max_pages=10, max_total_chars=1000)

    assert extracted.text == "Hello\n\nWorld"
    assert extracted.total_pages == 2
    assert extracted.parsed_pages == 2
    assert extracted.truncated is False


def test_raises_empty_text_when_pdf_has_no_extractable_content(monkeypatch):
    fake_pdf = _FakePdf([_FakePage("   "), _FakePage("")])

    monkeypatch.setattr("python_cv.pdf_extract.pdfplumber.open", lambda _: fake_pdf)

    with pytest.raises(PdfEmptyTextError):
        extract_text_from_pdf_bytes(b"dummy", max_pages=5, max_total_chars=100)


def test_wraps_parser_errors(monkeypatch):
    def _explode(_):
        raise RuntimeError("broken parser")

    monkeypatch.setattr("python_cv.pdf_extract.pdfplumber.open", _explode)

    with pytest.raises(PdfParseError) as exc:
        extract_text_from_pdf_bytes(b"dummy", max_pages=5, max_total_chars=100)

    assert "broken parser" in str(exc.value)
