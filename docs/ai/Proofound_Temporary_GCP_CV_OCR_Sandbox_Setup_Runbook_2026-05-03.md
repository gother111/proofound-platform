> Doc Class: `reference-spec`
> Last Verified: `2026-05-03`

# GCP CV/OCR Production Provider Setup Runbook

**Status:** Setup runbook for internal production provider smoke only
**Date:** 2026-05-03
**Audience:** Founder, engineering, ops, privacy, QA
**Authority:** Subordinate to the locked MVP source of truth, aligned PRD/technical requirements, `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`, and `docs/ai/Proofound_Temporary_GCP_CV_OCR_Sandbox_Reference_2026-05-03.md`.

This runbook is docs-only guidance. It must not be treated as approval to process real/pilot data, broaden the CV import surface, or make GCP a required launch dependency.

---

## 0. Non-Negotiable Gates

Do not create or enable the production provider smoke until all of these are true:

- Google Cloud Billing has been checked in the console for exact credit expiration, remaining balance, and eligible products.
- Billing confirms coverage for the products being used: Cloud Run, Document AI or Cloud Vision OCR, Cloud Storage if used, Secret Manager, Cloud Logging, and Cloud Monitoring.
- Gemini API / AI Studio spend is not assumed to be covered. Do not route this sandbox through Gemini unless Billing explicitly confirms that specific product coverage.
- A dedicated, approved GCP project is used. Do not attach this to any unrelated shared project.
- Budget alerts are configured before the first billable call.
- Vercel env vars are disabled by default.
- Only synthetic production smoke files are used until privacy review and route approval pass.
- No real pilot data is processed until privacy review passes and explicit product/route approval exists.

If any item cannot be verified, stop at mock/local mode.

---

## 1. Placeholders

Use placeholders while following this runbook. Do not paste real credentials into tracked files.

```bash
PROJECT_ID=proofound-cv-ocr-prod-YYYYMMDD
BILLING_ACCOUNT_ID=<billing-account-id>
REGION=europe-west1
SERVICE_NAME=proofound-cv-ocr
SERVICE_ACCOUNT_NAME=cv-ocr-runner
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
TEMP_BUCKET="${PROJECT_ID}-temp"
DOC_AI_LOCATION=eu
DOC_AI_PROCESSOR_ID=<processor-id-if-document-ai-is-used>
```

Use a region/location that is compatible with the selected OCR product and the privacy review. Keep Cloud Run, GCS, and Document AI/Vision as close as practical to avoid avoidable latency and cost.

---

## 2. Billing And Credit Verification

Before setup:

1. Open Google Cloud Console -> Billing -> Credits/Promotions.
2. Record the exact credit expiration timestamp in the private ops note, not in this repo.
3. Confirm the temporary credit covers the planned product SKUs.
4. Confirm whether Document AI is covered.
5. Confirm whether Cloud Vision OCR is covered.
6. Confirm whether Cloud Run, Cloud Storage, Secret Manager, Logging, and Monitoring are covered.
7. Confirm whether Gemini API / AI Studio is covered. If not explicitly confirmed, do not use it.
8. Set `GCP_CV_OCR_EXPIRES_AT` to the verified expiration. If still unverified, keep the conservative cutoff at `2026-08-03T00:00:00Z`.

Billing evidence should stay outside the repo because it can include personal billing details.

---

## 3. Create Or Select GCP Project

Create or select the approved OCR project and link billing only after eligibility is confirmed:

```bash
gcloud projects create "$PROJECT_ID" --name="Proofound CV OCR"
gcloud billing projects link "$PROJECT_ID" --billing-account="$BILLING_ACCOUNT_ID"
gcloud config set project "$PROJECT_ID"
```

Apply labels for cleanup and cost reporting:

```bash
gcloud projects update "$PROJECT_ID" \
  --update-labels=owner=proofound,purpose=cv-ocr,expires=2026-08-03,environment=production
```

Do not use this project for real pilot files or long-lived infrastructure until privacy, billing, and route approval gates pass.

---

## 4. Configure Budget Alerts Before APIs

Create a small, founder-approved budget scoped to the sandbox project before enabling billable APIs.

Minimum alert thresholds:

- 10% actual spend
- 25% actual spend
- 50% actual spend
- 75% actual spend
- 90% actual spend
- 100% actual spend
- 100% forecasted spend

Budget alerts notify; they are not a substitute for app-level shutoff. Keep the app-level disabled flag and expiry guard even if budget alerts exist.

Example shape:

```bash
gcloud billing budgets create \
  --billing-account="$BILLING_ACCOUNT_ID" \
  --display-name="Proofound CV OCR Sandbox Budget" \
  --budget-amount=<amount-and-currency> \
  --filter-projects="projects/$PROJECT_ID" \
  --threshold-rule=percent=0.10 \
  --threshold-rule=percent=0.25 \
  --threshold-rule=percent=0.50 \
  --threshold-rule=percent=0.75 \
  --threshold-rule=percent=0.90 \
  --threshold-rule=percent=1.00 \
  --threshold-rule=percent=1.00,basis=forecasted-spend
```

Do not commit the amount if it reveals personal billing details.

---

## 5. Enable Only Required APIs

Enable the smallest API set for the selected path.

Base service:

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

Document AI path:

```bash
gcloud services enable documentai.googleapis.com
```

Cloud Vision path:

```bash
gcloud services enable vision.googleapis.com
```

Optional GCS temp bucket path:

```bash
gcloud services enable storage.googleapis.com
```

Do not enable Vertex AI, Gemini, BigQuery, or other APIs unless the product is explicitly approved and billing coverage is verified.

---

## 6. Service Account And Minimal IAM

Create one user-managed service account for Cloud Run:

```bash
gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
  --display-name="Proofound CV OCR Cloud Run runner"
```

Grant only the roles required by the selected processor path.

For Document AI processing:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/documentai.apiUser"
```

For Cloud Vision with GCS inputs/outputs, grant bucket-scoped storage access only after the bucket exists. Prefer direct upload/in-memory OCR for small synthetic images when possible.

For Secret Manager access:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
```

Avoid these broad grants:

- `roles/owner`
- `roles/editor`
- project-wide `roles/storage.admin` for runtime
- long-lived service account JSON keys

Human deployers may need temporary Cloud Run deploy permissions, but runtime permissions should stay on the service account above.

---

## 7. Configure Cloud Run

Cloud Run hosts the OCR extractor service. It must be authenticated/private unless a separate approved ingress/auth design exists.

Required Cloud Run posture:

- service account: `cv-ocr-runner`
- unauthenticated invocations: disabled
- max instances: low finite number, for example `1` or `2`
- request timeout: at or below the app timeout budget
- concurrency: conservative
- CPU/memory: small synthetic-test size first
- logs: metadata only
- no raw file text, filenames, signed URLs, processor IDs, or secrets in logs

Example deploy shape:

```bash
gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source=<extractor-source-dir> \
  --service-account="$SERVICE_ACCOUNT_EMAIL" \
  --no-allow-unauthenticated \
  --max-instances=2 \
  --timeout=20s \
  --set-env-vars="GCP_CV_OCR_MODE=production,GCP_CV_OCR_RETENTION_HOURS=24"
```

Only a server-side Vercel route or approved staging smoke client may invoke this service. Do not call Cloud Run directly from the browser.

---

## 8. Configure Document AI Or Cloud Vision OCR

Choose exactly one primary OCR path for the first smoke.

### Option A - Document AI

Use Document AI when structured document OCR is needed and Billing confirms product eligibility.

Setup requirements:

- Create an OCR processor in the chosen location.
- Store processor ID and location in Secret Manager or Cloud Run env, not in browser env.
- Grant runtime service account `roles/documentai.apiUser`.
- Process synthetic PDFs only.
- Keep output capped and schema-validated.

Runtime must return only:

- extracted text capped by app limits
- page count
- confidence if available
- elapsed time
- safe provider/status metadata

It must not return original filename, GCS path, signed URL, processor ID, or raw provider debug payload.

### Option B - Cloud Vision OCR

Use Cloud Vision when the smoke can stay image/PDF OCR focused and Billing confirms product eligibility.

Setup requirements:

- Enable Vision API.
- For PDF/TIFF asynchronous processing, use private GCS input/output buckets and bucket-scoped IAM.
- For small synthetic images, prefer direct requests that do not require storage.
- For GCS input, the runtime identity needs object read access.
- For GCS output, the runtime identity needs object create access.

Cloud Vision PDF/TIFF async output writes JSON to GCS, so the GCS lifecycle and cleanup rules are mandatory if this path is used.

---

## 9. Optional Private GCS Temp Bucket

Use GCS only if the selected OCR path requires it.

Create a private bucket with public access prevention:

```bash
gcloud storage buckets create "gs://$TEMP_BUCKET" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --public-access-prevention
```

Grant bucket-scoped access to the Cloud Run service account only:

```bash
gcloud storage buckets add-iam-policy-binding "gs://$TEMP_BUCKET" \
  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
  --role="roles/storage.objectUser"
```

Apply lifecycle deletion with `age` less than or equal to 1 day:

```json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": { "age": 1 }
    }
  ]
}
```

```bash
gcloud storage buckets update "gs://$TEMP_BUCKET" \
  --lifecycle-file=<lifecycle-json-file>
```

Runtime cleanup must still delete objects immediately in a `finally` path. Lifecycle is only the backstop.

---

## 10. Secrets

Use only one of these secret paths:

- Google Secret Manager for Cloud Run runtime secrets.
- Vercel server environment variables for the Next.js caller.

Never use:

- tracked `.env` files for real values
- `NEXT_PUBLIC_*` secrets
- service account JSON keys committed to the repo
- browser-visible OCR provider config

Recommended secret values:

```text
GCP_CV_OCR_SHARED_SECRET
GCP_CV_OCR_BASE_URL
GCP_CV_OCR_PROVIDER
GCP_CV_OCR_EXPIRES_AT
GCP_CV_OCR_DOCUMENT_AI_LOCATION
GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID
GCP_CV_OCR_TEMP_BUCKET
```

If HMAC auth is used, include timestamp, nonce, body hash, and clock-skew enforcement. Rotate the shared secret before any pilot review.

---

## 11. Vercel Environment Variables

The app posture is disabled by default. Set only in staging/preview first.

```bash
GCP_CV_OCR_ENABLED=false
GCP_CV_OCR_EXPIRES_AT=2026-08-03T00:00:00Z
GCP_CV_OCR_BASE_URL=
GCP_CV_OCR_AUTH_MODE=hmac
GCP_CV_OCR_SHARED_SECRET=
GCP_CV_OCR_PROVIDER=document_ai
GCP_CV_OCR_MAX_FILE_SIZE_MB=5
GCP_CV_OCR_MAX_PAGES=4
GCP_CV_OCR_MAX_FILES_PER_REQUEST=1
GCP_CV_OCR_ALLOWED_MIME_TYPES=application/pdf
GCP_CV_OCR_RETENTION_HOURS=24
GCP_CV_OCR_USER_DAILY_LIMIT=5
GCP_CV_OCR_GLOBAL_DAILY_LIMIT=50
GCP_CV_OCR_FAIL_OPEN_TO_FALLBACK=true
```

Rules:

- Production stays `GCP_CV_OCR_ENABLED=false` unless explicitly approved.
- Preview/staging may be enabled only for synthetic smoke after billing and budget setup.
- Env changes require a redeploy before they affect Vercel deployments.
- Missing base URL, missing secret, expired timestamp, budget exhaustion, or disabled flag must result in no Cloud Run call.
- The OCR provider path uses the Cloud Run service account with Google ADC for Document AI. Do not add Google API keys, browser-created Gemini keys, or service account JSON for this path.

---

## 12. Synthetic Staging Smoke Test Only

Use a synthetic PDF/image created for testing. It must contain no real names, emails, phone numbers, addresses, CV history, employer names, customer names, or pilot data.

Production smoke steps:

1. Confirm budget alert exists for the production project.
2. Confirm Cloud Run service is private/authenticated.
3. Confirm temp bucket, if used, rejects public access.
4. Run `npm run ocr:production:status` and confirm the status is only one of `disabled`, `configured`, `expired`, `fallback`, or `provider reachable`.
5. Enable Vercel production only for the approved synthetic smoke window: `GCP_CV_OCR_ENABLED=true`.
6. Run `npm run ocr:production:smoke` to submit exactly one generated synthetic one-page PDF.
7. Confirm OCR response is schema-valid.
8. Confirm status/smoke command output excludes filename, bucket, object path, signed URL, processor ID, service URL, extracted text, and secrets.
9. Confirm logs contain only safe metadata.
10. Confirm temp object is deleted immediately; if still present, confirm lifecycle is <= 24h and record `cleanup_pending`.
11. Set `GCP_CV_OCR_ENABLED=false`, redeploy, and confirm fallback path works.
12. Set `GCP_CV_OCR_EXPIRES_AT` to a past timestamp in staging, redeploy, and confirm no Cloud Run call is made.

Pass condition: synthetic extraction works once, disabled/expired fallback works, production is disabled again after the smoke, and no private data or secret-bearing value appears in responses/logs.

Fail condition: any real/pilot data enters the system, public access is possible, logs include sensitive payloads, budget is missing, or disabled/expired config still calls Cloud Run.

---

## 13. Privacy Review Gate

No real pilot data may be processed until privacy review passes.

Privacy review must verify:

- user disclosure and consent for explicit upload
- no hidden background OCR
- no original filenames in provider calls or logs where avoidable
- no raw text logging
- no signed/private URLs sent to AI/model providers
- no public bucket or public object access
- deletion path for success and failure
- cross-user access denial
- disabled/expired provider calls do not happen
- vendor/data-processing implications are accepted

Until this gate passes, the only allowed data is synthetic staging test data.

---

## 14. Shutdown, Expiry, And Cleanup

Shutdown deadline: `2026-08-03` unless Google Cloud Billing confirms an earlier verified
expiration. The app treats `GCP_CV_OCR_EXPIRES_AT` as disabled at and after the configured
timestamp, even if `GCP_CV_OCR_ENABLED=true`.

Do this on or before the deadline. Do not run deletion from Codex unless a human explicitly
approves the exact target project and resource names in a separate operations session.

1. Set `GCP_CV_OCR_ENABLED=false` in all Vercel environments.
2. Remove GCP OCR base URL, shared secret, processor IDs, bucket names, provider config, and any other GCP OCR env vars from Vercel.
3. Redeploy Vercel so the disabled env state is active.
4. Confirm the app status/fallback path reports OCR unavailable and does not call Cloud Run.
5. Delete or disable the Cloud Run service.
6. Delete Cloud Run revisions that are not required for approved audit retention.
7. Delete or disable the Document AI processor. If Cloud Vision was used instead, disable Vision usage for the sandbox project after confirming no other approved sandbox flow needs it.
8. Empty the private GCS temp bucket, verify it is empty, then delete the bucket.
9. Delete the BigQuery benchmark dataset if one was created.
10. Revoke IAM bindings granted for the sandbox runtime and deployment path.
11. Delete runtime/deployer service accounts if they are not needed for another approved sandbox.
12. Revoke and delete any service account keys if any were created despite the no-long-lived-key preference.
13. Destroy Secret Manager secret versions and delete the secret containers when retention rules allow.
14. Remove or destroy matching Vercel secrets/env values after the disabled deployment is confirmed.
15. Review Cloud Logging for accidental sensitive payloads and apply approved retention/remediation.
16. Verify Google Cloud Billing shows no new Cloud Run, Document AI, Vision, GCS, BigQuery, Secret Manager, Logging, or Monitoring charges after shutdown.
17. Keep budget alerts active until billing shows no new usage, then disable alerts only after all resources are removed.
18. Verify the sandbox project has no billable resources left.
19. Optionally unlink billing or delete the sandbox project.

Post-cleanup smoke:

```bash
GCP_CV_OCR_ENABLED=false
GCP_CV_OCR_EXPIRES_AT=2026-08-03T00:00:00Z
```

Confirm staging still serves the deterministic/browser-side fallback and the core MVP corridor
remains unaffected. Record the smoke result and the billing no-new-usage check in private ops
notes without storing credentials, billing account IDs, processor IDs, bucket names, or secrets in
this repo.

---

## 15. Official Setup References

- [Cloud Billing budgets and alerts](https://cloud.google.com/billing/docs/how-to/budgets)
- [Cloud Run service identity](https://cloud.google.com/run/docs/configuring/services/service-identity)
- [Cloud Run deployment quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-nodejs-service)
- [Document AI OCR](https://cloud.google.com/document-ai/docs/process-documents-ocr)
- [Document AI IAM roles](https://docs.cloud.google.com/document-ai/docs/access-control/iam-roles)
- [Cloud Vision OCR](https://docs.cloud.google.com/vision/docs/ocr)
- [Cloud Vision PDF/TIFF OCR](https://cloud.google.com/vision/docs/pdf)
- [Cloud Vision authentication](https://cloud.google.com/vision/docs/authentication)
- [Cloud Storage public access prevention](https://cloud.google.com/storage/docs/public-access-prevention)
- [Cloud Storage object lifecycle management](https://cloud.google.com/storage/docs/lifecycle)
- [Secret Manager documentation](https://cloud.google.com/secret-manager/docs)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
