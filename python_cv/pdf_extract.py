from __future__ import annotations

import io
from dataclasses import dataclass

import pdfplumber

from python_cv.text_normalize import normalize_whitespace


class PdfParseError(Exception):
    pass


class PdfEmptyTextError(Exception):
    pass


@dataclass(frozen=True)
class ExtractedPdf:
    text: str
    total_pages: int
    parsed_pages: int
    truncated: bool


def _normalize_page_text(page_text: str) -> str:
    lines = [normalize_whitespace(line) for line in page_text.replace("\r", "\n").split("\n")]
    return "\n".join(line for line in lines if line)


def extract_text_from_pdf_bytes(
    pdf_bytes: bytes,
    *,
    max_pages: int,
    max_total_chars: int,
) -> ExtractedPdf:
    if not pdf_bytes:
        raise PdfParseError("PDF file is empty")

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            total_pages = len(pdf.pages)
            parsed_pages = min(total_pages, max_pages)
            chunks: list[str] = []
            current_chars = 0
            truncated = False

            for page in pdf.pages[:parsed_pages]:
                page_text_raw = page.extract_text() or ""
                page_text = _normalize_page_text(page_text_raw)
                if not page_text:
                    continue

                remaining = max_total_chars - current_chars
                if remaining <= 0:
                    truncated = True
                    break

                if len(page_text) > remaining:
                    chunks.append(page_text[:remaining])
                    current_chars += remaining
                    truncated = True
                    break

                chunks.append(page_text)
                current_chars += len(page_text)

            extracted_text = "\n\n".join(chunks).strip()

            if not extracted_text:
                raise PdfEmptyTextError("No text could be extracted. OCR is not supported in V1.")

            return ExtractedPdf(
                text=extracted_text,
                total_pages=total_pages,
                parsed_pages=parsed_pages,
                truncated=truncated,
            )
    except PdfEmptyTextError:
        raise
    except Exception as exc:  # pragma: no cover - third-party parser errors vary
        raise PdfParseError(str(exc) or "Failed to parse PDF") from exc
