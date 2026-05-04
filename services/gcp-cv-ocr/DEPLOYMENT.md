> Doc Class: `runbook`
> Last Verified: `2026-05-04`

# Private Cloud Run Deployment Checklist

This runbook is for the invite-only Proof Artifact Text Extraction OCR beta only. It is not for CV import, public OCR, candidate scoring, ranking, recommendation, or automated review decisions.

## Provider

- Use Document AI Enterprise Document OCR only.
- Do not use Cloud Vision, Form Parser, Custom Extractor, service account JSON keys, public API keys, signed URLs, raw filenames, bucket names, or storage paths.
- The Cloud Run service uses Google Application Default Credentials from its runtime service account.

## Cloud Run

- Keep unauthenticated invocation disabled.
- Grant `roles/run.invoker` only to the production Vercel-to-GCP invoker service account path.
- Use `GCP_CV_OCR_AUTH_MODE=oidc` for production.
- Use HMAC only for local or explicitly synthetic smoke windows.
- Set min instances to `0` unless a written beta reliability note justifies otherwise.
- Set max instances to `1` by default. The hard beta ceiling is `3`.
- Keep any temporary provider-side data retention at `24` hours or less.

Example shape:

```sh
gcloud run deploy SERVICE_NAME \
  --source services/gcp-cv-ocr \
  --no-allow-unauthenticated \
  --min-instances 0 \
  --max-instances 1
```

## Required Production Gates

Production config is not ready unless all of these are explicit:

- `GCP_CV_OCR_ENABLED=true`
- `GCP_CV_OCR_AUTH_MODE=oidc`
- `GCP_CV_OCR_EXPIRES_AT` set to a short future beta window
- `GCP_CV_OCR_MAX_FILE_SIZE_MB`
- `GCP_CV_OCR_MAX_PAGES`
- `GCP_CV_OCR_MAX_FILES_PER_REQUEST=1`
- `GCP_CV_OCR_USER_DAILY_LIMIT`
- `GCP_CV_OCR_GLOBAL_DAILY_LIMIT`
- `GCP_CV_OCR_RETENTION_HOURS` no higher than `24`
- `GCP_CV_OCR_BUDGET_ALERT_CONFIGURED=true`
- OIDC Workload Identity Federation and Cloud Run audience values

The app code treats missing budget alerts or missing hard caps as not production-ready. Google Cloud budgets are alerts, not hard caps, so the service and Vercel integration must enforce daily limits before provider calls.

## Logging

- Log request state, safe status, elapsed time, provider status, and opaque request IDs only.
- Do not log extracted text, original filenames, object paths, bucket names, signed URLs, processor IDs, user emails, cookies, bearer tokens, secrets, or credential material.
- Before enabling a live smoke window, inspect Vercel logs, Cloud Run logs, Cloud Logging, and Document AI logs for payload safety.

## Smoke Testing

- Use `npm run ocr:production:status` to confirm safe status.
- Use `npm run ocr:production:smoke` only for a live synthetic one-page PDF smoke window.
- Do not process real user, pilot, or customer documents in smoke tests.
- Disable the feature flag or expire `GCP_CV_OCR_EXPIRES_AT` immediately after the smoke window unless the beta gate is intentionally open.
