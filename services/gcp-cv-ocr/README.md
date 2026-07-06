> Doc Class: `reference-spec`
> Last Verified: `2026-05-21`

# GCP Document AI Proof Artifact OCR Cloud Run Service

This directory contains the disabled-by-default Cloud Run service for the invite-only Proof Artifact Text Extraction beta using Google Cloud Document AI OCR.

It is intentionally not deployment wiring. It contains no GCP project IDs, processor IDs, bucket names, service account JSON, credentials, or secrets.

This service is not CV import, not broad OCR, and not a proof-review participant evaluation system. OCR output is draft text only and must not auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or affect match, review, verification, reveal, trust-state, or workflow-decision state. Cloud Vision OCR is excluded from this rollout.

## Endpoints

- `GET /health`
- `POST /extract`

## Auth Posture

Preferred deployment auth is private Cloud Run invocation through IAM-authenticated OIDC between the Proofound server boundary and Cloud Run. Production deployments should use `GCP_CV_OCR_AUTH_MODE=oidc`, keep Cloud Run private, and grant `roles/run.invoker` only to the service account that Vercel can impersonate through Workload Identity Federation.

This runnable service also implements the fallback auth path for short local/staging smoke windows: HMAC request verification with timestamp, nonce replay protection, and a request-body SHA-256 hash.

Required request headers for `POST /extract`:

- `x-proofound-timestamp`: Unix timestamp in seconds
- `x-proofound-nonce`: one-time opaque nonce
- `x-proofound-content-sha256`: hex SHA-256 of the exact request body
- `x-proofound-signature`: `sha256=` plus HMAC-SHA256 over `timestamp.nonce.bodyHash`

The shared secret is read from `GCP_CV_OCR_SHARED_SECRET` at runtime only and is not used by the production OIDC path.

## Local Service

The service accepts JSON with a base64 document body:

```json
{
  "contentType": "application/pdf",
  "fileBase64": "JVBERi0xLjQK...",
  "requesterRef": "req_opaque_daily_limit_ref"
}
```

The service generates opaque `requestId` and `documentId` values. Do not send filenames, storage paths, buckets, processor IDs, headers, or secrets in the payload.

The default provider is a mock Document AI-style client. Production-beta deployments should set `GCP_CV_OCR_PROVIDER=document_ai`.

Cloud Run max instances should start at `1` and must not exceed `3` during beta. Google Cloud budgets are alerts only; app/service code must enforce hard caps before Document AI calls.

To enable the live Document AI path inside Cloud Run, set these service-only values:

```text
GCP_CV_OCR_PROVIDER=document_ai
GCP_CV_OCR_PROJECT_ID=<gcp-project-id>
GCP_CV_OCR_DOCUMENT_AI_LOCATION=eu
GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID=<processor-id>
```

The Document AI provider uses the Cloud Run service account through Google Application Default Credentials. Do not create or commit service account JSON keys. Unit tests mock the provider response and must not require Google credentials or live cloud access.

See `DEPLOYMENT.md` for the private Cloud Run, max-instance, budget, logging, and synthetic-smoke deployment checklist.
