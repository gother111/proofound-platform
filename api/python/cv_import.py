from __future__ import annotations

import json
import os
import re
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from python_cv.contracts import (
    CvImportSuggestRequest,
    CvImportWizardSuggestRequest,
    PYTHON_INTERNAL_CONTRACT_VERSION,
    PYTHON_INTERNAL_SERVICE_NAME,
    PythonInternalJobRequest,
    PythonInternalJobResponse,
)
from python_cv.pdf_extract import PdfEmptyTextError, PdfParseError, extract_text_from_pdf_bytes
from python_cv.service import ImportLimits, default_limits, process_skill_documents, process_wizard_documents
from python_cv.skill_db import SkillDbUnavailableError, load_skill_db

LOCAL_DEV_PYTHON_SERVICE_SECRET = "proofound-local-python-service"

app = FastAPI(title="Proofound Python Internal Service")

GENERIC_WIZARD_ERROR = "Failed to process CV wizard suggestions"
GENERIC_SUGGEST_ERROR = "Failed to process CV documents"
GENERIC_EXTRACT_ERROR = "Failed to extract CV text"

ERROR_CODE_PDF_PARSE_FAILED = "PDF_PARSE_FAILED"
ERROR_CODE_PDF_EMPTY_TEXT = "PDF_EMPTY_TEXT"
ERROR_CODE_SKILL_DB_UNAVAILABLE = "SKILL_DB_UNAVAILABLE"
ERROR_CODE_MATCHING_FAILED = "MATCHING_FAILED"
ERROR_CODE_MULTIPART_METADATA_INVALID = "CV_IMPORT_MULTIPART_METADATA_INVALID"
UPLOAD_METADATA_ENCODING_ERROR_MESSAGE = (
    "Upload metadata contains unsupported characters. Please rename the PDF and retry."
)


def _env_int(name: str, fallback: int) -> int:
    raw = os.environ.get(name)
    if not raw:
        return fallback
    try:
        value = int(raw)
    except ValueError:
        return fallback
    return value if value > 0 else fallback


def _load_limits() -> ImportLimits:
    base = default_limits()
    return ImportLimits(
        max_documents=_env_int("CV_IMPORT_MAX_DOCUMENTS", base.max_documents),
        max_chars_per_document=_env_int(
            "CV_IMPORT_MAX_CHARS_PER_DOCUMENT", base.max_chars_per_document
        ),
        max_total_chars=_env_int("CV_IMPORT_MAX_TOTAL_CHARS", base.max_total_chars),
    )


def _safe_context(value: Any, default: str = "cv") -> str:
    if value in {"cv", "jd", "general"}:
        return str(value)
    return default


def _document_from_error(
    document_id: str,
    file_name: str,
    context: str,
    parse_error: str,
    *,
    parse_error_code: str | None = None,
) -> dict[str, Any]:
    return {
        "document_id": document_id,
        "file_name": file_name,
        "context": context,
        "parsed_text": "",
        "parse_error": parse_error,
        "parse_error_code": parse_error_code,
    }


def _wizard_error_document(
    document_id: str,
    file_name: str,
    parse_error: str,
    parse_error_code: str | None = None,
) -> dict[str, Any]:
    return {
        "document_id": document_id,
        "file_name": file_name,
        "context": "cv",
        "parsed_text": "",
        "parse_error": parse_error,
        "parse_error_code": parse_error_code,
        "work_experiences": [],
        "learning_experiences": [],
        "volunteering": [],
        "languages": [],
        "skill_candidates": [],
    }


def _skill_error_document(
    document_id: str,
    file_name: str,
    context: str,
    parse_error: str,
    parse_error_code: str | None = None,
) -> dict[str, Any]:
    return {
        "document_id": document_id,
        "file_name": file_name,
        "context": context,
        "parsed_text": "",
        "parse_error": parse_error,
        "parse_error_code": parse_error_code,
        "candidate_count": 0,
        "candidates": [],
    }


def _extract_result_document(
    document_id: str,
    file_name: str,
    context: str,
    parsed_text: str,
    parse_error: str | None = None,
    parse_error_code: str | None = None,
) -> dict[str, Any]:
    return {
        "document_id": document_id,
        "file_name": file_name,
        "context": context,
        "parsed_text": parsed_text,
        "parse_error": parse_error,
        "parse_error_code": parse_error_code,
    }


def _resolve_internal_service_secret() -> str:
    for name in (
        "PYTHON_INTERNAL_SERVICE_SECRET",
        "CV_IMPORT_PROXY_INTERNAL_SECRET",
        "INTERNAL_API_SECRET",
        "CRON_SECRET",
    ):
        value = os.environ.get(name, "").strip()
        if value:
            return value

    if os.environ.get("NODE_ENV") != "production" and os.environ.get("VERCEL_ENV") != "production":
        return LOCAL_DEV_PYTHON_SERVICE_SECRET

    return ""


def _validate_internal_service_secret(request: Request) -> JSONResponse | None:
    expected_secret = _resolve_internal_service_secret()
    if not expected_secret:
        return JSONResponse(
            {"error": "Python internal service secret is not configured."},
            status_code=503,
        )

    provided_secret = (
        request.headers.get("x-python-service-secret", "").strip()
        or request.headers.get("x-cv-proxy-secret", "").strip()
    )
    if provided_secret != expected_secret:
        return JSONResponse({"error": "Unauthorized"}, status_code=401)

    return None


def _contains_utf8_decode_error(exc: BaseException | None) -> bool:
    if exc is None:
        return False

    stack: list[BaseException] = [exc]
    seen: set[int] = set()

    while stack:
        current = stack.pop()
        current_id = id(current)
        if current_id in seen:
            continue
        seen.add(current_id)

        if isinstance(current, UnicodeDecodeError):
            return True

        message = str(current).lower()
        if "utf-8" in message and "can't decode byte" in message:
            return True
        if "invalid continuation byte" in message and "utf-8" in message:
            return True

        cause = getattr(current, "__cause__", None)
        if isinstance(cause, BaseException):
            stack.append(cause)

        context = getattr(current, "__context__", None)
        if isinstance(context, BaseException):
            stack.append(context)

        nested = getattr(current, "exceptions", None)
        if isinstance(nested, (list, tuple)):
            for nested_exc in nested:
                if isinstance(nested_exc, BaseException):
                    stack.append(nested_exc)

    return False


def _sanitize_document_id(raw_value: Any, idx: int) -> str:
    text = str(raw_value).strip() if raw_value is not None else ""
    if not text:
        return f"doc-{idx}"

    safe_chars: list[str] = []
    for char in text:
        if char.isascii() and (char.isalnum() or char in {"-", "_"}):
            safe_chars.append(char)
        else:
            safe_chars.append("-")

    normalized = re.sub(r"-{2,}", "-", "".join(safe_chars)).strip("-_")
    if not normalized:
        return f"doc-{idx}"

    return normalized[:128]


def _load_skill_db_or_response() -> tuple[Any | None, JSONResponse | None]:
    try:
        return load_skill_db(), None
    except SkillDbUnavailableError as exc:
        return None, JSONResponse(
            {
                "error": GENERIC_SUGGEST_ERROR,
                "message": f"Skills database is unavailable: {exc}",
                "code": ERROR_CODE_SKILL_DB_UNAVAILABLE,
            },
            status_code=503,
        )


def _unique_top_skill_ids(candidate_documents: list[dict[str, Any]], key: str) -> list[str]:
    ordered_ids: list[str] = []

    for document in candidate_documents:
        for candidate in document.get(key, []):
            for suggestion in candidate.get("suggestions") or []:
                skill_id = suggestion.get("skill_id")
                if isinstance(skill_id, str) and skill_id not in ordered_ids:
                    ordered_ids.append(skill_id)

    return ordered_ids[:10]


def _build_skill_report(result: dict[str, Any]) -> dict[str, Any]:
    documents = result.get("documents", [])
    candidate_count = sum(len(document.get("candidates", [])) for document in documents)

    return {
        "documents_total": len(documents),
        "documents_with_parse_errors": sum(1 for document in documents if document.get("parse_error")),
        "candidates_total": candidate_count,
        "mapped_candidates": sum(
            1
            for document in documents
            for candidate in document.get("candidates", [])
            if candidate.get("suggestions")
        ),
        "unmapped_candidates": result.get("metadata", {}).get("unmapped_candidates_count", 0),
        "top_skill_ids": _unique_top_skill_ids(documents, "candidates"),
    }


def _build_wizard_report(result: dict[str, Any]) -> dict[str, Any]:
    documents = result.get("documents", [])

    return {
        "documents_total": len(documents),
        "documents_with_parse_errors": sum(1 for document in documents if document.get("parse_error")),
        "work_experiences_total": sum(len(document.get("work_experiences", [])) for document in documents),
        "learning_experiences_total": sum(
            len(document.get("learning_experiences", [])) for document in documents
        ),
        "volunteering_total": sum(len(document.get("volunteering", [])) for document in documents),
        "languages_total": sum(len(document.get("languages", [])) for document in documents),
        "mapped_skill_candidates": sum(
            1
            for document in documents
            for candidate in document.get("skill_candidates", [])
            if candidate.get("suggestions")
        ),
        "top_skill_ids": _unique_top_skill_ids(documents, "skill_candidates"),
    }


def _build_quality_report(result: dict[str, Any]) -> dict[str, Any]:
    documents = result.get("documents", [])
    candidates = [
        candidate
        for document in documents
        for candidate in document.get("candidates", [])
    ]
    total_candidates = len(candidates)

    return {
        "documents_total": len(documents),
        "parse_success_ratio": (
            round(
                sum(1 for document in documents if not document.get("parse_error")) / len(documents),
                4,
            )
            if documents
            else 0.0
        ),
        "candidates_total": total_candidates,
        "mapped_ratio": (
            round(sum(1 for candidate in candidates if candidate.get("suggestions")) / total_candidates, 4)
            if total_candidates
            else 0.0
        ),
        "average_confidence": (
            round(
                sum(float(candidate.get("confidence", 0.0)) for candidate in candidates) / total_candidates,
                4,
            )
            if total_candidates
            else 0.0
        ),
        "high_confidence_candidates": sum(
            1 for candidate in candidates if float(candidate.get("confidence", 0.0)) >= 0.85
        ),
        "top_skill_ids": _unique_top_skill_ids(documents, "candidates"),
    }


async def _parse_multipart_documents(
    request: Request, *, default_context: str, limits: ImportLimits
) -> tuple[list[dict[str, str]], list[dict[str, Any]]]:
    try:
        form = await request.form()
    except Exception as exc:  # pragma: no cover - parser exceptions vary across runtime versions
        if _contains_utf8_decode_error(exc):
            raise ValueError(UPLOAD_METADATA_ENCODING_ERROR_MESSAGE) from exc
        raise

    files = form.getlist("files")
    document_ids = form.getlist("document_ids")
    contexts = form.getlist("contexts")

    if len(files) > limits.max_documents:
        raise ValueError(f"Too many documents. Maximum allowed is {limits.max_documents}.")

    max_file_size_bytes = _env_int("CV_IMPORT_MAX_FILE_SIZE_MB", 5) * 1024 * 1024
    max_pdf_pages = _env_int("CV_IMPORT_MAX_PDF_PAGES", 4)
    max_extracted_chars = _env_int("CV_IMPORT_MAX_CHARS_PER_DOCUMENT", 30000)

    parsed_documents: list[dict[str, str]] = []
    failed_documents: list[dict[str, Any]] = []

    for idx, upload in enumerate(files, start=1):
        file_name = getattr(upload, "filename", None) or f"upload-{idx}.pdf"
        raw_document_id = document_ids[idx - 1] if idx - 1 < len(document_ids) else None
        document_id = _sanitize_document_id(raw_document_id, idx)
        context = _safe_context(contexts[idx - 1] if idx - 1 < len(contexts) else default_context, default_context)

        content_type = getattr(upload, "content_type", None) or ""
        if "pdf" not in content_type.lower() and not file_name.lower().endswith(".pdf"):
            failed_documents.append(
                _document_from_error(
                    document_id,
                    file_name,
                    context,
                    "Only PDF files are supported in V1.",
                    parse_error_code=ERROR_CODE_PDF_PARSE_FAILED,
                )
            )
            continue

        file_bytes = await upload.read()
        if len(file_bytes) > max_file_size_bytes:
            failed_documents.append(
                _document_from_error(
                    document_id,
                    file_name,
                    context,
                    f"File exceeds max size of {max_file_size_bytes // (1024 * 1024)}MB.",
                    parse_error_code=ERROR_CODE_PDF_PARSE_FAILED,
                )
            )
            continue

        try:
            extracted = extract_text_from_pdf_bytes(
                file_bytes,
                max_pages=max_pdf_pages,
                max_total_chars=max_extracted_chars,
            )
            parsed_documents.append(
                {
                    "document_id": document_id,
                    "file_name": file_name,
                    "text": extracted.text,
                    "context": context,
                }
            )
        except PdfEmptyTextError as exc:
            failed_documents.append(
                _document_from_error(
                    document_id,
                    file_name,
                    context,
                    str(exc),
                    parse_error_code=ERROR_CODE_PDF_EMPTY_TEXT,
                )
            )
        except PdfParseError as exc:
            error_message = str(exc).lower()
            if "password" in error_message or "encrypted" in error_message:
                parse_error = (
                    "PDF is encrypted or password-protected. Please export an unlocked copy and retry."
                )
            elif "not a pdf" in error_message or "syntax" in error_message:
                parse_error = "The uploaded file is not a valid PDF. Please re-export and try again."
            else:
                parse_error = "PDF parser could not start. Please refresh and re-upload the file."
            failed_documents.append(
                _document_from_error(
                    document_id,
                    file_name,
                    context,
                    parse_error,
                    parse_error_code=ERROR_CODE_PDF_PARSE_FAILED,
                )
            )

    return parsed_documents, failed_documents


async def _parse_json_documents(request: Request) -> tuple[list[dict[str, str]], int | None]:
    payload = CvImportSuggestRequest.model_validate(await request.json())
    return [doc.model_dump() for doc in payload.documents], payload.suggestions_limit


def _metadata(limits: ImportLimits, unmapped_count: int = 0) -> dict[str, Any]:
    return {
        "semantic_used": False,
        "semantic_fallback_triggered": False,
        "unmapped_candidates_count": unmapped_count,
        "limits": {
            "max_documents": limits.max_documents,
            "max_chars_per_document": limits.max_chars_per_document,
            "max_total_chars": limits.max_total_chars,
        },
    }


def _value_error_payload(message: str) -> dict[str, str]:
    payload: dict[str, str] = {"error": message}
    if message == UPLOAD_METADATA_ENCODING_ERROR_MESSAGE:
        payload["code"] = ERROR_CODE_MULTIPART_METADATA_INVALID
    return payload


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/wizard-suggest")
async def wizard_suggest(request: Request):
    limits = _load_limits()
    content_type = request.headers.get("content-type", "")
    unauthorized = _validate_internal_service_secret(request)
    if unauthorized:
        return unauthorized

    try:
        suggestions_limit: int | None = None
        if content_type.startswith("multipart/form-data"):
            parsed_documents, failed_documents = await _parse_multipart_documents(
                request,
                default_context="cv",
                limits=limits,
            )
            suggestions_limit_raw = request.query_params.get("suggestions_limit")
            if suggestions_limit_raw and suggestions_limit_raw.isdigit():
                suggestions_limit = int(suggestions_limit_raw)
        else:
            parsed_documents, suggestions_limit = await _parse_json_documents(request)
            failed_documents = []

        if not parsed_documents and failed_documents:
            return JSONResponse(
                {
                    "documents": [
                        _wizard_error_document(
                            document_id=item["document_id"],
                            file_name=item["file_name"],
                            parse_error=item["parse_error"],
                            parse_error_code=item.get("parse_error_code"),
                        )
                        for item in failed_documents
                    ],
                    "metadata": _metadata(limits, 0),
                }
            )

        skill_db, error_response = _load_skill_db_or_response()
        if error_response:
            return error_response
        result = process_wizard_documents(
            parsed_documents,
            skill_db,
            limits=limits,
            suggestions_limit=suggestions_limit,
        )

        failed_result_docs = [
            _wizard_error_document(
                document_id=item["document_id"],
                file_name=item["file_name"],
                parse_error=item["parse_error"],
                parse_error_code=item.get("parse_error_code"),
            )
            for item in failed_documents
        ]

        result["documents"] = failed_result_docs + result["documents"]
        return JSONResponse(result)

    except ValueError as exc:
        message = str(exc)
        status = 413 if "max size" in message or "payload" in message or "Too many documents" in message else 400
        return JSONResponse(_value_error_payload(message), status_code=status)
    except ValidationError as exc:
        return JSONResponse({"error": "Invalid request payload", "message": str(exc)}, status_code=400)
    except json.JSONDecodeError:
        return JSONResponse({"error": "Invalid request payload"}, status_code=400)
    except Exception as exc:  # pragma: no cover
        return JSONResponse(
            {
                "error": GENERIC_WIZARD_ERROR,
                "message": f"CV wizard processing failed: {exc}",
                "code": ERROR_CODE_MATCHING_FAILED,
            },
            status_code=500,
        )


@app.post("/suggest")
async def suggest(request: Request):
    limits = _load_limits()
    content_type = request.headers.get("content-type", "")
    unauthorized = _validate_internal_service_secret(request)
    if unauthorized:
        return unauthorized

    try:
        suggestions_limit: int | None = None
        if content_type.startswith("multipart/form-data"):
            parsed_documents, failed_documents = await _parse_multipart_documents(
                request,
                default_context="cv",
                limits=limits,
            )
            suggestions_limit_raw = request.query_params.get("suggestions_limit")
            if suggestions_limit_raw and suggestions_limit_raw.isdigit():
                suggestions_limit = int(suggestions_limit_raw)
        else:
            parsed_documents, suggestions_limit = await _parse_json_documents(request)
            failed_documents = []

        if not parsed_documents and failed_documents:
            return JSONResponse(
                {
                    "documents": [
                        _skill_error_document(
                            document_id=item["document_id"],
                            file_name=item["file_name"],
                            context=item.get("context", "cv"),
                            parse_error=item["parse_error"],
                            parse_error_code=item.get("parse_error_code"),
                        )
                        for item in failed_documents
                    ],
                    "metadata": _metadata(limits, 0),
                }
            )

        skill_db, error_response = _load_skill_db_or_response()
        if error_response:
            return error_response
        result = process_skill_documents(
            parsed_documents,
            skill_db,
            limits=limits,
            suggestions_limit=suggestions_limit,
        )

        failed_result_docs = [
            _skill_error_document(
                document_id=item["document_id"],
                file_name=item["file_name"],
                context=item.get("context", "cv"),
                parse_error=item["parse_error"],
                parse_error_code=item.get("parse_error_code"),
            )
            for item in failed_documents
        ]

        result["documents"] = failed_result_docs + result["documents"]
        return JSONResponse(result)

    except ValueError as exc:
        message = str(exc)
        status = 413 if "max size" in message or "payload" in message or "Too many documents" in message else 400
        return JSONResponse(_value_error_payload(message), status_code=status)
    except ValidationError as exc:
        return JSONResponse({"error": "Invalid request payload", "message": str(exc)}, status_code=400)
    except json.JSONDecodeError:
        return JSONResponse({"error": "Invalid request payload"}, status_code=400)
    except Exception as exc:  # pragma: no cover
        return JSONResponse(
            {
                "error": GENERIC_SUGGEST_ERROR,
                "message": f"CV import processing failed: {exc}",
                "code": ERROR_CODE_MATCHING_FAILED,
            },
            status_code=500,
        )


@app.post("/extract")
async def extract(request: Request):
    limits = _load_limits()
    content_type = request.headers.get("content-type", "")
    unauthorized = _validate_internal_service_secret(request)
    if unauthorized:
        return unauthorized

    try:
        documents: list[dict[str, Any]] = []
        if content_type.startswith("multipart/form-data"):
            parsed_documents, failed_documents = await _parse_multipart_documents(
                request,
                default_context="cv",
                limits=limits,
            )

            documents.extend(
                [
                    _extract_result_document(
                        document_id=item["document_id"],
                        file_name=item["file_name"],
                        context=item.get("context", "cv"),
                        parsed_text=item["text"],
                    )
                    for item in parsed_documents
                ]
            )
            documents.extend(
                [
                    _extract_result_document(
                        document_id=item["document_id"],
                        file_name=item["file_name"],
                        context=item.get("context", "cv"),
                        parsed_text="",
                        parse_error=item["parse_error"],
                        parse_error_code=item.get("parse_error_code"),
                    )
                    for item in failed_documents
                ]
            )
        else:
            parsed_documents, _suggestions_limit = await _parse_json_documents(request)
            documents.extend(
                [
                    _extract_result_document(
                        document_id=item["document_id"],
                        file_name=item["file_name"],
                        context=item.get("context", "cv"),
                        parsed_text=item["text"],
                    )
                    for item in parsed_documents
                ]
            )

        return JSONResponse(
            {
                "documents": documents,
                "metadata": _metadata(limits, 0),
            }
        )
    except ValueError as exc:
        message = str(exc)
        status = (
            413 if "max size" in message or "payload" in message or "Too many documents" in message else 400
        )
        return JSONResponse(_value_error_payload(message), status_code=status)
    except ValidationError as exc:
        return JSONResponse({"error": "Invalid request payload", "message": str(exc)}, status_code=400)
    except json.JSONDecodeError:
        return JSONResponse({"error": "Invalid request payload"}, status_code=400)
    except Exception as exc:  # pragma: no cover
        return JSONResponse(
            {
                "error": GENERIC_EXTRACT_ERROR,
                "message": f"CV extraction failed: {exc}",
                "code": ERROR_CODE_MATCHING_FAILED,
            },
            status_code=500,
        )


@app.post("/internal-job")
async def internal_job(request: Request):
    unauthorized = _validate_internal_service_secret(request)
    if unauthorized:
        return unauthorized

    try:
        job = PythonInternalJobRequest.model_validate(await request.json())
    except ValidationError as exc:
        return JSONResponse({"error": "Invalid request payload", "message": str(exc)}, status_code=400)
    except json.JSONDecodeError:
        return JSONResponse({"error": "Invalid request payload"}, status_code=400)

    try:
        skill_db, error_response = _load_skill_db_or_response()
        if error_response:
            return error_response

        if job.job_type == "document_intelligence_skill_report":
            parsed = CvImportSuggestRequest.model_validate(job.payload)
            result = process_skill_documents(
                [doc.model_dump() for doc in parsed.documents],
                skill_db,
                limits=_load_limits(),
                suggestions_limit=parsed.suggestions_limit,
            )
            response_payload = PythonInternalJobResponse(
                job_id=job.job_id,
                job_type=job.job_type,
                result=_build_skill_report(result),
            )
            return JSONResponse(response_payload.model_dump())

        if job.job_type == "document_intelligence_wizard_report":
            parsed = CvImportWizardSuggestRequest.model_validate(job.payload)
            result = process_wizard_documents(
                [doc.model_dump() for doc in parsed.documents],
                skill_db,
                limits=_load_limits(),
                suggestions_limit=parsed.suggestions_limit,
            )
            response_payload = PythonInternalJobResponse(
                job_id=job.job_id,
                job_type=job.job_type,
                result=_build_wizard_report(result),
            )
            return JSONResponse(response_payload.model_dump())

        parsed = CvImportSuggestRequest.model_validate(job.payload)
        result = process_skill_documents(
            [doc.model_dump() for doc in parsed.documents],
            skill_db,
            limits=_load_limits(),
            suggestions_limit=parsed.suggestions_limit,
        )
        response_payload = PythonInternalJobResponse(
            job_id=job.job_id,
            job_type=job.job_type,
            result=_build_quality_report(result),
        )
        return JSONResponse(response_payload.model_dump())
    except ValueError as exc:
        message = str(exc)
        status = 413 if "payload" in message or "Too many documents" in message else 400
        return JSONResponse(_value_error_payload(message), status_code=status)
    except ValidationError as exc:
        return JSONResponse({"error": "Invalid request payload", "message": str(exc)}, status_code=400)
    except Exception as exc:  # pragma: no cover
        return JSONResponse(
            {
                "error": "Failed to process internal Python job",
                "message": str(exc),
                "service": PYTHON_INTERNAL_SERVICE_NAME,
                "contract_version": PYTHON_INTERNAL_CONTRACT_VERSION,
            },
            status_code=500,
        )


def _resolve_dispatch_endpoint(request: Request) -> str | None:
    endpoint = request.query_params.get("endpoint", "").strip().lower()
    if endpoint in {"wizard-suggest", "suggest", "extract", "internal-job"}:
        return endpoint
    return None


@app.post("/")
@app.post("/api/python/cv_import")
async def dispatch_import(request: Request):
    endpoint = _resolve_dispatch_endpoint(request)
    if endpoint == "wizard-suggest":
        return await wizard_suggest(request)
    if endpoint == "suggest":
        return await suggest(request)
    if endpoint == "extract":
        return await extract(request)
    if endpoint == "internal-job":
        return await internal_job(request)

    return JSONResponse(
        {
            "error": "Invalid endpoint parameter",
            "message": "Use endpoint=wizard-suggest, endpoint=suggest, endpoint=extract, or endpoint=internal-job.",
        },
        status_code=400,
    )
