# Temporary GCP CV/OCR Cloud Run Skeleton

This directory contains a disabled-by-default service skeleton for the temporary CV/OCR extractor sandbox.

It is intentionally not deployment wiring. It contains no GCP project IDs, processor IDs, bucket names, service account JSON, credentials, or secrets.

## Endpoints

- `GET /health`
- `POST /extract`

## Auth Posture

Preferred deployment auth is private Cloud Run invocation through IAM-authenticated OIDC between the Proofound server boundary and Cloud Run. That should be used if the caller can mint short-lived identity tokens without committing long-lived keys.

This runnable skeleton implements the fallback temporary sandbox path: HMAC request verification with timestamp, nonce replay protection, and a request-body SHA-256 hash.

Required request headers for `POST /extract`:

- `x-proofound-timestamp`: Unix timestamp in seconds
- `x-proofound-nonce`: one-time opaque nonce
- `x-proofound-content-sha256`: hex SHA-256 of the exact request body
- `x-proofound-signature`: `sha256=` plus HMAC-SHA256 over `timestamp.nonce.bodyHash`

The shared secret is read from `GCP_CV_OCR_SHARED_SECRET` at runtime only.

## Local Skeleton

The service accepts JSON with a base64 document body:

```json
{
  "contentType": "application/pdf",
  "fileBase64": "JVBERi0xLjQK..."
}
```

The service generates opaque `requestId` and `documentId` values. Do not send filenames, storage paths, buckets, processor IDs, headers, or secrets in the payload.

The default provider is a mock Document AI/Vision-style client.

To enable the live Document AI path inside Cloud Run, set these service-only values:

```text
GCP_CV_OCR_PROVIDER=document_ai
GCP_CV_OCR_PROJECT_ID=<sandbox-project-id>
GCP_CV_OCR_DOCUMENT_AI_LOCATION=eu
GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID=<processor-id>
```

The Document AI provider uses the Cloud Run service account through Google Application Default Credentials. Do not create or commit service account JSON keys. Unit tests mock the provider response and must not require Google credentials or live cloud access.
