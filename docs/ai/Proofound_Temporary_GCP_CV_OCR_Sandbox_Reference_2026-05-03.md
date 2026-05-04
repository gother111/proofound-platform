> Doc Class: `reference-spec`
> Last Verified: `2026-05-04`

# Temporary GCP Proof Artifact OCR Sandbox Reference

**Status:** Temporary sandbox reference for invite-only Proof Artifact Text Extraction using Google Cloud Document AI OCR.
**Date:** 2026-05-03
**Audience:** Founder, product, engineering, QA, privacy, ops
**Authority:** This document is subordinate to `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, the aligned PRD/technical requirements, and the existing launch runbook. It must not broaden the locked MVP.

---

## 0. Repo Facts Treated As Binding

`AGENTS.md` says the repository is the source of truth, requires reading files before assumptions, and sets the MVP authority order starting with the locked MVP source of truth, then PRD, technical requirements, launch runbook, and project specification.

The locked MVP defines Proofound as a proof-first, privacy-first hiring credibility corridor centered on Proof Packs, not generic AI recruiting, not an ATS replacement, and not AI candidate scoring/ranking/hiring recommendation software. It allows optional assistive AI only where it strengthens Proof Pack clarity, assignment clarity, claim-scoped verification requests, or privacy preflight. The PRD repeats the hard rule that AI must be button-click, user-reviewed, non-decisional, and must not receive full private files by default.

The launch-binding stack is Next.js/Vercel, Supabase/Postgres/Auth/Storage, Resend, and lightweight telemetry. GCP must not replace any of those. `README.md` confirms the current architecture routes traffic through Vercel/Next.js, Supabase, Resend, Sentry, Vercel Cron, and an optional internal document-intelligence/Python service path.

The most important current-code constraint: the named CV import wizard routes are currently archived/non-launch. `wizard-extract`, `wizard-extract/status`, `wizard-suggest`, and `wizard-apply` all return legacy/non-launch responses. The active launch surface policy also classifies broad `/api/expertise` and `/app/i/expertise` surfaces as archived except for narrow retained taxonomy/user-skill/assignment-expertise endpoints. Therefore, the GCP provider path must remain internal-only unless a separate approved flow connects it through user-clicked, user-reviewed review.

---

## 1. Executive Recommendation

Recommendation: Go only for a temporary invite-only Proof Artifact Text Extraction beta after billing, privacy, app-level hard-cap, and smoke gates pass.

Best feature candidate:

**Google Cloud Document AI OCR for Proof Artifact Text Extraction**

The first implementation slice should be synthetic-document smoke and a mock provider abstraction, then an internal Cloud Run plus Document AI OCR service using synthetic PDFs. Only after privacy review, billing verification, explicit invite-gate approval, and proof-upload integration approval should this connect to real beta proof artifacts.

Why this fits the MVP:

Proofound's MVP allows proof upload and cares about proof clarity, private context, and trust-safe proof creation. A narrow OCR helper can reduce friction when invited users bring proof artifacts into Proof Packs, but only if it returns draft extracted text for user review and does not evaluate the person.

Why it must remain optional/temporary:

The credit window is temporary, user-provided as May 3, 2026 through August 3, 2026, and must be verified in Google Cloud Billing before implementation. The release owner must review the plan on `2026-07-15`, run a disabled-mode drill on `2026-07-25`, make the final disable-or-paid decision on `2026-08-01`, and treat `2026-08-03` as the free-credit expiry. Gemini API/AI Studio coverage must not be assumed. The service must automatically disable after expiry or if env config is removed, and the MVP must continue to work without it.

Explicitly excluded from this sandbox and beta:

- CV import wizard
- AI candidate scoring, ranking, shortlisting, suitability judgments, hiring recommendations, verification decisions, or trust-state decisions
- Gemini skill extractor for employer review
- taxonomy shortlist or reranker
- Cloud Vision OCR
- moving core infrastructure from Vercel/Supabase to Google Cloud

---

## 2. Candidate Decision Matrix

| Candidate                                                                | MVP fit                                   | Implementation effort | Privacy/security risk                                           | Credit usefulness | User value               | Shutdown simplicity | Recommendation                               |
| ------------------------------------------------------------------------ | ----------------------------------------- | --------------------- | --------------------------------------------------------------- | ----------------- | ------------------------ | ------------------- | -------------------------------------------- |
| Temporary Document AI OCR for invite-only Proof Artifact Text Extraction | High, if kept to explicit proof artifacts | Medium                | Medium-high because proof files may expose identity/client data | High              | High if connected safely | Medium              | Best overall candidate, beta only            |
| Synthetic Document AI OCR smoke lab using Cloud Run                      | Medium-high                               | Low-medium            | Low because synthetic files only                                | Medium-high       | Indirect but useful      | High                | Best first implementation slice              |
| Privacy preflight OCR for uploaded proof files                           | High                                      | Medium                | High because proof files may expose identity/client data        | Medium            | High                     | Medium              | Defer until upload/privacy review passes     |
| Cloud Run deterministic parser worker only                               | Medium                                    | Low                   | Low                                                             | Low-medium        | Medium                   | High                | Useful as fallback/mock, not best credit use |

Decision: Build the temporary Document AI OCR sandbox, but start with the synthetic benchmark plus mock provider slice. The current archived CV-import route state means CV import must stay inactive; the only approved beta path is explicit Proof Artifact Text Extraction.

---

## 3. Product Boundary

### 3.1 What The Feature Does

The feature provides an optional extractor for explicit user-uploaded CV/import files or synthetic staging documents. It may:

- accept a user-selected PDF, and optionally JPEG/PNG after later approval;
- extract text and simple metadata such as page count, OCR confidence, extraction provider, processor version, and elapsed time;
- return extracted text into an existing or newly approved import-review flow;
- let the user review, edit, discard, or manually paste extracted text into Proofound;
- support benchmarking OCR quality using synthetic PDFs only;
- fall back to existing deterministic/browser-side extraction when disabled, expired, over budget, or failing.

### 3.2 What It Must Not Do

It must not:

- score, rank, shortlist, recommend, screen, or evaluate candidates;
- generate fit verdicts, hiring recommendations, ATS-style pipeline judgments, or reviewer intelligence;
- make reveal, verification, trust, intro, interview, or hiring decisions;
- run hidden background AI on files;
- analyze full private files by default outside the explicit upload action;
- process files not explicitly selected by the user;
- write profile, skill, proof, or matching records automatically;
- expose raw filenames, storage paths, signed URLs, extracted private text, or secrets in logs or user-facing responses;
- rely on Gemini API spend unless Google Cloud Billing and product eligibility confirm it is covered;
- break the MVP if flags/config are removed.

---

## 4. Proposed Feature

Name: **Temporary GCP Document AI OCR for Proof Artifact Text Extraction**

Initial status: Disabled by default, invite-only beta after staging/sandbox smoke.

Reference env shape:

```bash
GCP_CV_OCR_ENABLED=false
GCP_CV_OCR_KILL_SWITCH=false
GCP_CV_OCR_EXPIRES_AT=2026-08-03T00:00:00Z
GCP_CV_OCR_EMERGENCY_DISABLE_HOURS=72
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
GCP_CV_OCR_GLOBAL_DAILY_LIMIT=20
GCP_CV_OCR_HARD_BUDGET_CAP_SEK=<founder-approved-hard-cap>
GCP_CV_OCR_BUDGET_CAP_EXHAUSTED=false
GCP_CV_OCR_BUDGET_ALERT_CONFIGURED=false
GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES=1
GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES_DOCUMENTED=false
GCP_CV_OCR_CLOUD_RUN_PUBLIC_INVOCATION=false
PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH=false
```

Use a verified expiry value from Google Cloud Billing. Until verified, use the conservative August 3, 2026 UTC cutoff so the service stops before accidental post-credit spend.

Output contract:

```json
{
  "status": "completed",
  "provider": "gcp_document_ai|mock|fallback",
  "requestId": "opaque-id",
  "documentId": "opaque-id",
  "pageCount": 1,
  "text": "extracted text capped by configured character limit",
  "metadata": {
    "confidence": 0.91,
    "elapsedMs": 1200,
    "textLength": 5420,
    "truncated": false,
    "expiryState": "active"
  },
  "warnings": []
}
```

No original filename, raw storage path, signed URL, bucket name, processor ID, user email, or secret-bearing value should be returned.

---

## 5. Architecture

### 5.1 Fit With Current Architecture

Vercel/Next.js remains the public app/API boundary. Supabase remains the auth, database, and storage source of truth. GCP is only an optional external extractor behind server-side flags.

Recommended flow:

1. User explicitly uploads a file in a staging/internal sandbox or approved CV-import/proof-import flow.
2. Next.js validates authenticated session, feature flag, expiry, MIME type, magic bytes, size, page count, and rate limits.
3. Next.js creates an opaque request ID and document ID. It must not use the raw filename in any GCP object name or user-facing response.
4. Next.js sends the file to Cloud Run over HTTPS using service-to-service auth.
5. Cloud Run validates auth, timestamp, nonce, content type, size, pages, and request schema.
6. Cloud Run calls Document AI OCR.
7. If temporary Cloud Storage is needed, Cloud Run writes to a private bucket using opaque object names and deletes objects immediately after processing. Bucket lifecycle must delete any leftovers within 24 hours.
8. Cloud Run returns extracted text and safe metadata only.
9. Next.js validates the response schema, truncates to configured max chars, deletes any temporary Supabase/GCP object, and returns the text for user review.
10. If disabled, expired, over budget, timed out, or failing, Next.js does not call GCP and returns deterministic/browser-side fallback.

### 5.2 GCP Components

- Cloud Run: Yes. Host the temporary extractor service. Keep it private or authenticated.
- Document AI OCR: Use this path only after billing/product eligibility is verified. Cloud Vision OCR is excluded from this rollout.
- Temporary Cloud Storage bucket: Optional. Prefer direct in-memory request processing for small files. Use GCS only when required by the processor or file flow. If used, it must be private, non-public, lifecycle-managed, and immediately cleaned.
- Cloud Logging/Monitoring: Yes, but metadata only. No raw file text, no filenames, no paths, no secrets.
- Optional BigQuery benchmark logging: Only for synthetic/staging benchmark data. Do not log real pilot file text or personal data to BigQuery.

### 5.3 Auth Between Vercel And Cloud Run

Preferred order:

1. Cloud Run IAM-authenticated invocation with OIDC if Vercel can use Workload Identity Federation or another non-long-lived-key mechanism safely.
2. Short-lived HMAC shared secret for the temporary sandbox if OIDC is not practical. Use a server-only secret in Vercel and Cloud Run, include timestamp and nonce, sign the request body, enforce clock skew, and rotate before any pilot.

Do not expose any key to the browser. Do not commit service account JSON.

### 5.4 Data Retention

- In-memory processing preferred.
- Supabase temp upload, if used, follows the existing `cv-import-temp` private bucket pattern with service-role-only access; the repo migration sets that bucket public=false, PDF-only, and service-role-only policies.
- GCS temp objects must be deleted in `finally`.
- GCS lifecycle must delete leftovers within 24 hours.
- Logs may retain only safe metadata: request ID, user hash or internal user ID where policy allows, provider, status, bytes, pages, elapsed time, cost estimate, and error code.
- No extracted text should be stored by default unless the user explicitly applies it through an approved Proofound flow.

### 5.5 Error Handling

Every failure path should produce one of:

- `disabled`: flag off, missing config, or expired;
- `fallback_used`: deterministic/browser-side fallback used;
- `rate_limited`;
- `budget_exhausted`;
- `invalid_file`;
- `provider_timeout`;
- `provider_error`;
- `cleanup_pending`.

No GCP failure should block the existing MVP corridor.

---

## 6. Expiration And Shutdown Plan

### 6.1 Expiry Rule

Use:

```bash
GCP_CV_OCR_EXPIRES_AT=2026-08-03T00:00:00Z
```

until the exact Google Cloud Billing credit expiration timestamp is verified. If Billing shows a different date/time/timezone, update the env value before implementation.

### 6.2 What Happens On August 3, 2026

At or after `GCP_CV_OCR_EXPIRES_AT`:

- Next.js treats the feature as disabled even if `GCP_CV_OCR_ENABLED=true`.
- No new Cloud Run calls are made.
- Users get the existing deterministic/browser-side fallback.
- Operator status reports expired.
- Any pending extraction job should fail closed with a safe fallback message.
- Cleanup runbook should remove the GCP resources and Vercel env vars.

Within the configured emergency-disable window, default `72` hours before expiry in production, the app must treat GCP OCR as unavailable even if `GCP_CV_OCR_ENABLED=true`.

### 6.3 Disable-Or-Pay Timeline

- `2026-07-15`: Review Google Cloud spend, remaining credits, Document AI/Cloud Run usage, and whether OCR beta still justifies a paid path.
- `2026-07-25`: Run a disabled-mode drill by turning off OCR beta and GCP service flags, then verify core Proofound flows and deterministic fallbacks still work.
- `2026-08-01`: Make the final disable-or-paid decision. If no paid decision exists, disable OCR beta and remove provider env vars.
- `2026-08-03`: Free credit expires. OCR must be disabled or explicitly paid, documented, and capped.

### 6.4 Cleanup Steps

Document and, where safe, script these steps without embedding secrets:

1. Set `GCP_CV_OCR_ENABLED=false` in Vercel preview/staging/production.
2. Remove `GCP_CV_OCR_BASE_URL`, shared secret, processor IDs, bucket names, and any GCP service env vars from Vercel.
3. Redeploy Vercel so disabled config is active.
4. Disable or delete Cloud Run service and revisions.
5. Delete or disable Document AI processor.
6. Delete private GCS temp bucket after verifying it is empty.
7. Delete BigQuery benchmark dataset if used.
8. Delete or revoke service accounts, IAM bindings, and any keys.
9. Delete Secret Manager secrets or mark destroyed.
10. Verify Cloud Logging contains no sensitive payloads; reduce retention where appropriate.
11. Disable budget alerts only after all resources are removed.
12. Run staging smoke proving fallback still works.

---

## 7. Cost And Safety Controls

Before any real GCP call, verify in Google Cloud Billing:

- exact credit expiration;
- credit balance;
- eligible products;
- whether Document AI, Cloud Run, Cloud Storage, Logging, Monitoring, and any approved synthetic-only benchmark service are covered;
- whether Gemini API / AI Studio is excluded or separately billed.

Controls:

- Create a dedicated sandbox GCP project under Albina's billing account if allowed.
- Use Google Cloud budget alerts at 25%, 50%, 75%, 90%, and 100%.
- Add app-level hard stop independent of GCP budget alerts.
- Treat Google Cloud budgets as alerts only, not hard caps.
- Set `GCP_CV_OCR_HARD_BUDGET_CAP_SEK`; if missing, launch readiness blocks OCR.
- Set `GCP_CV_OCR_BUDGET_CAP_EXHAUSTED=true` when the app-level hard cap is exhausted; OCR disables without breaking the app.
- Set per-user and global rate limits.
- Start with synthetic PDFs only.
- No real pilot data until privacy review passes.
- Max 1 file/request initially.
- Max 5 MB/file.
- Max 4 pages/file.
- Cloud Run max instances starts at `1` and must not exceed `3` during beta.
- Timeout <= 20 seconds end to end.
- No public buckets.
- No raw filenames or storage paths in responses.
- No secrets, file text, filenames, signed URLs, or processor IDs in logs.
- No client-exposed API keys.
- Minimal IAM: Cloud Run service account can invoke only required Document AI APIs and access only the one temp bucket if used.

Kill switches:

- Global AI kill switch: `AI_GLOBAL_KILL_SWITCH=true` disables all assistive AI routes.
- OCR beta kill switch: `PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH=true` hides/disables Proof Artifact OCR routes.
- GCP OCR service kill switch: `GCP_CV_OCR_KILL_SWITCH=true` prevents any GCP OCR provider call.
- Feature-level AI kill switches: `AI_KILL_SWITCH_PROOF_PACK_ASSISTANT`, `AI_KILL_SWITCH_ASSIGNMENT_CLARITY`, `AI_KILL_SWITCH_VERIFICATION_COMPOSER`, and `AI_KILL_SWITCH_PRIVACY_PREFLIGHT`.

---

## 8. Privacy And Security Requirements

Use the repo privacy rules as the source of truth. The locked MVP requires blind-by-default review, candidate consent before identity-bearing reveal, narrowest-wins visibility, and no PII leaks through metadata, logs, analytics, filenames, or public rendering. The AI technical requirements similarly forbid sending full private files, original filenames, signed/private URLs, tokens, hidden review-stage identity, protected traits, and other sensitive fields to AI by default.

### 8.1 Accepted File Types

Initial staging:

- `application/pdf` only.

Optional later after tests:

- `image/png`
- `image/jpeg`

Reject:

- SVG, HTML, ZIP, DOC/DOCX, XLS/XLSX, PPT/PPTX, executable formats, archives, remote URLs, and files with MIME/magic-byte mismatch.

### 8.2 Retention Period

- In-memory preferred: no raw file retention.
- Supabase temp storage: maximum 24 hours if used.
- GCS temp storage: immediate delete after processing; lifecycle delete <= 24 hours.
- Extracted text: not stored by default.
- Benchmark logs: synthetic-only; no real user text.

### 8.3 Deletion Path

- Delete Supabase temp object after extraction.
- Delete GCS temp object in Cloud Run `finally`.
- If deletion fails, return/record `cleanup_pending` without exposing paths.
- Operator cleanup must identify objects by safe internal IDs, not user-facing paths.

### 8.4 Audit Logging

Log only safe metadata:

- request ID;
- feature name;
- user ID hash or internal ID if policy allows;
- file byte size;
- page count;
- provider;
- status;
- elapsed time;
- error code;
- cost estimate;
- cleanup status.

Do not log:

- raw extracted text;
- raw filenames;
- storage paths;
- signed URLs;
- secrets;
- cookies;
- tokens;
- service account data;
- email/phone/address/protected traits.

### 8.5 SSRF, Path Traversal, And Upload Abuse Protections

- Accept files only via multipart upload from authenticated session.
- Do not accept user-provided URLs for fetching.
- Generate opaque object names server-side.
- Ignore user path fragments.
- Validate MIME and magic bytes.
- Enforce size/page/timeouts before calling GCP.
- Reject nested/embedded remote references.
- Reject filenames with unsupported encodings or normalize them only for internal display.
- Do not forward client cookies or auth headers to Cloud Run.

The existing Python proxy tests already enforce important patterns: no forwarding client auth headers, ignoring attacker-controlled forwarded hosts, multipart boundary handling, timeout/unavailable responses, and invalid-contract rejection. Future implementation should mirror those protections for the GCP extractor.

### 8.6 Service-To-Service Auth

- Use Cloud Run IAM/OIDC if practical without long-lived keys.
- Otherwise use HMAC with timestamp + nonce + body hash.
- Rotate the secret before pilot.
- Store only server-side in Vercel and Cloud Run/Secret Manager.
- Never expose auth config to the browser.

### 8.7 Tests Proving Private Files Are Not Exposed

- Response must not contain original filename, bucket, object path, signed URL, processor ID, or service URL.
- Logs must not contain raw file text or filename.
- Client bundle must not contain GCP/Gemini keys.
- Public bucket access must fail.
- Cross-user job/status lookup must fail.
- Disabled/expired config must not call Cloud Run.

---

## 9. Verification Plan

### 9.1 Unit Tests

- Config parser: disabled by default.
- Expiry parser: disables at/after `GCP_CV_OCR_EXPIRES_AT`.
- Eligibility guard: missing base URL/secret disables provider.
- Provider abstraction: mock success, timeout, invalid JSON, invalid schema, quota error.
- File validation: MIME, magic bytes, size, pages, extension mismatch.
- Redaction/logging: filenames, URLs, emails, phones, tokens not logged.
- Cost guard: budget exhausted blocks provider call.

### 9.2 API Route Tests

- Unauthenticated request returns 401.
- Unauthorized entity access returns 403.
- Flag disabled returns fallback.
- Expired flag returns fallback.
- Invalid MIME/size/pages returns safe error.
- Provider timeout returns fallback.
- Provider error returns fallback.
- Response never includes raw filename, storage path, signed URL, or secret.

### 9.3 Privacy Tests

- No full file payload sent to AI/Gemini.
- No hidden review-stage identity fields sent.
- No raw prompt/file text logging.
- No client-exposed `NEXT_PUBLIC_*GCP*KEY`, `NEXT_PUBLIC_*GEMINI*KEY`, or service secret.
- Public access to temp bucket fails.
- Cross-user job access fails.

### 9.4 Upload/Storage Lifecycle Tests

- Temp object created only in private bucket.
- Temp object deleted after success.
- Temp object deletion attempted after failure.
- Cleanup failure creates safe `cleanup_pending` status.
- GCS lifecycle policy exists in deployment docs.
- No raw user filename in object name if GCS is used.

### 9.5 Mock GCP Tests

- Mock Document AI returns text.
- No Cloud Vision OCR mock or production path is enabled for this rollout.
- Mock quota error triggers budget fallback.
- Mock malformed provider response fails closed.
- Mock long-running request times out.

### 9.6 Optional Staging Smoke Test

Use synthetic PDFs only:

1. Deploy Cloud Run to staging sandbox.
2. Confirm GCP budget alert exists.
3. Upload synthetic 1-page PDF.
4. Confirm extraction completes.
5. Confirm output is schema-valid.
6. Confirm no raw filename/path appears in UI/API/logs.
7. Disable feature flag.
8. Repeat upload and confirm deterministic/browser-side fallback.
9. Set expiry to a past timestamp.
10. Confirm no Cloud Run call is made.

### 9.7 Manual Google Cloud Billing Checklist

- Verify credit start date and expiration date.
- Verify remaining balance.
- Verify products covered.
- Verify Document AI pricing region.
- Verify budget alerts recipients.
- Verify no billing export or BigQuery dataset contains PII.
- Verify Cloud Run request count/cost after smoke.
- Verify zero calls after disabled/expired config.

---

## 10. Rollout Plan

### Phase 0 - Repo Audit And Design Memo

No code. Confirm route state, current upload rules, current AI/provider patterns, active launch surface, and exact integration options.

### Phase 1 - Local Mock Mode

Add disabled-by-default config and a mock extractor contract. No GCP calls. No production route activation.

### Phase 2 - Staging/Sandbox GCP Project

Create a sandbox Cloud Run service and Document AI processor after billing verification. Synthetic PDFs only.

### Phase 3 - Internal Dogfood

Internal team tests with synthetic and founder-approved non-sensitive sample files. Still no real pilot CVs.

### Phase 4 - Optional Limited Pilot

Only after privacy review, route-surface approval, budget verification, and explicit user disclosure. Process only explicit uploads.

### Phase 5 - Disable And Cleanup

Disable before or on August 3, 2026, remove env vars, clean GCP resources, and verify fallback.

Production dependency rule:

No production dependency until explicitly approved. The MVP must remain functional when this feature is absent.
