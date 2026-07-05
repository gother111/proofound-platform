# Environment Variables Reference

> Doc Class: `active`
> Last Verified: `2026-06-21`

Complete guide to all environment variables used in Proofound, including which features require which variables and how to configure them.

> **📍 PRODUCTION DOMAIN**
>
> Current production domain: **`https://proofound.io`**
>
> Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables to match your actual domain.
> Use only the canonical production domain for app URLs and callbacks.

## Quick Reference

```env
# ============================================================================
# CRITICAL - Required for app to function
# ============================================================================
DATABASE_URL=postgresql://user:pass@host:6543/db  # Pooled (transaction) recommended for runtime
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://proofound.io

# ============================================================================
# IMPORTANT - Required for specific features
# ============================================================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Proofound <no-reply@proofound.io>"
LINKEDIN_VERIFICATION_ADMIN_EMAILS=admin1@proofound.io,admin2@proofound.io
CRON_SECRET=your_secure_random_token_here
CRON_API_KEY=your_cron_job_org_api_token
PYTHON_INTERNAL_SERVICE_SECRET=your_python_internal_secret_here
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=/api/integrations/zoom/callback
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=/api/integrations/google/callback
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
E2E_PROVIDER_USER_ID=deterministic_user_uuid
E2E_PROVIDER_USER_EMAIL=provider-e2e@test.proofound.io
E2E_PROVIDER_USER_PASSWORD=your_deterministic_test_password
STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true
STRICT_PROVIDER_E2E_REQUIRE_BOTH=true
DIRECT_URL=postgresql://user:pass@host:5432/db  # Direct (non-pooled) recommended for migrations and tooling

# ============================================================================
# OPTIONAL - Enhance functionality
# ============================================================================
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
MATCHING_FEATURE_ENABLED=true
NEXT_PUBLIC_WIREFRAME_MODE=false
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX=30
PYTHON_CV_IMPORT_BASE_URL=https://python-internal.proofound.internal
PYTHON_INTERNAL_JOBS_ENABLED=false # legacy/non-launch helper toggle only
PYTHON_INTERNAL_WORKER_BATCH_SIZE=10 # legacy/non-launch helper only
PYTHON_INTERNAL_WORKER_CONCURRENCY=2 # legacy/non-launch helper only
PYTHON_INTERNAL_WORKER_LEASE_SECONDS=180 # legacy/non-launch helper only
PYTHON_INTERNAL_MAX_ATTEMPTS=3 # legacy/non-launch helper only
AI_ASSISTANTS_ENABLED=false
AI_MODEL_DEFAULT=gemini-3.1-flash-lite
AI_MODEL_FALLBACK=
AI_MODEL_FALLBACK_VERIFIED=false
AI_PROVIDER_SMOKE_LAST_SUCCESS_AT=
AI_GEMINI_PROD_API_KEY=AIza...
AI_GEMINI_STAGING_API_KEY=AIza...
AI_MONTHLY_HARD_CAP_SEK=500
AI_PROD_MONTHLY_HARD_CAP_SEK=500
AI_GLOBAL_DAILY_LIMIT=250
AI_USER_DAILY_LIMIT=20
AI_ORG_DAILY_LIMIT=50
AI_RAW_PROMPT_LOGGING_ENABLED=false
GCP_CV_OCR_ENABLED=false
GCP_CV_OCR_EXPIRES_AT=2026-08-01T00:00:00Z
GCP_CV_OCR_PROVIDER=document_ai
GCP_CV_OCR_MAX_FILE_SIZE_MB=5
GCP_CV_OCR_MAX_PAGES=4
GCP_CV_OCR_GLOBAL_DAILY_LIMIT=20
```

---

## Critical Variables (🔴 Required)

These variables are **essential** - the application will not work properly without them.

### DATABASE_URL

**Purpose**: PostgreSQL database connection string

**Format**:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**Used By**:

- Drizzle ORM for database queries
- All data persistence operations
- Schema migrations
- Drizzle migrations also accept `DIRECT_URL`; if set, it is preferred, otherwise `DATABASE_URL` is used.

**Where to Get It**:

- **Supabase**: Project Settings → Database → Connection string (URI)
- **Vercel Postgres**: Vercel Dashboard → Storage → Copy connection string
- **Other PostgreSQL**: Provided by your hosting service

**Validation**:

```typescript
// Check in src/db/index.ts
if (!DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production');
}
```

**Common Issues**:

- ❌ Missing `?sslmode=require` for SSL connections
- ❌ Wrong credentials (user/password)
- ❌ Incorrect port (should be 5432 for PostgreSQL)
- ❌ Network access not configured in database provider

---

### NEXT_PUBLIC_SUPABASE_URL

**Purpose**: Supabase project URL for client-side access

**Format**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

**Used By**:

- Supabase client initialization
- Authentication flows
- Real-time subscriptions
- Storage access

**Where to Get It**:

- Supabase Dashboard → Project Settings → API → Project URL

**Important**:

- ⚠️ Prefix `NEXT_PUBLIC_` makes it accessible in browser
- ✅ Safe to expose (designed to be public)

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose**: Supabase anonymous/public API key

**Format**:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Used By**:

- Client-side Supabase operations
- Authentication
- Row-level security enforcement
- Public data access

**Where to Get It**:

- Supabase Dashboard → Project Settings → API → `anon public` key

**Important**:

- ✅ Safe to expose (respects RLS policies)
- ✅ Has limited permissions by default
- ❌ Do NOT confuse with service role key

---

### SUPABASE_SERVICE_ROLE_KEY

**Purpose**: Supabase service role key for server-side admin operations

**Format**:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Used By**:

- Server-side API routes
- Admin operations
- Bypassing RLS policies
- Cron jobs

**Where to Get It**:

- Supabase Dashboard → Project Settings → API → `service_role` key

**Security**:

- ⚠️ **NEVER expose to client/browser**
- ⚠️ **Full database access** - bypasses all security
- ⚠️ Store in server environment variables only
- ⚠️ Rotate if compromised

---

### NEXT_PUBLIC_USE_MOCK_SUPABASE

**Purpose**: Local/test-only switch for mock Supabase clients.

**Production value**:

```env
NEXT_PUBLIC_USE_MOCK_SUPABASE=false
```

**Security**:

- ⚠️ Do not enable in production or production deploys.
- ⚠️ Production runtime and deploy-readiness checks fail fast when this flag or mock admin/auth modes are enabled.
- ✅ May be set to `true` for local UI smoke checks and mock E2E runs.

---

### NEXT_PUBLIC_SITE_URL

**Purpose**: Your application's production URL

**Format**:

```env
NEXT_PUBLIC_SITE_URL=https://proofound.io
```

**Used By**:

- Email link generation
- OAuth redirects
- Cron job callbacks
- API endpoint construction

**Examples**:

- Production: `https://proofound.io`
- Staging: `https://staging.proofound.io`
- Vercel Preview: `https://proofound-git-branch.vercel.app`
- Local: `http://localhost:3000`

**Important**:

- ✅ Canonical domain: `https://proofound.io`
- ❌ Parked legacy domains for app callbacks
- ✅ No trailing slash: `https://proofound.io`
- ❌ No trailing slash: `https://proofound.io/`
- ✅ Include protocol (http/https)

---

## Important Variables (🟡 Required for Features)

These variables are needed for specific features to work properly.

### RESEND_API_KEY

**Purpose**: Resend transactional email service API key

**Format**:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Used By**:

- Email verification
- Password reset emails
- Organization invitations
- Skill verification requests
- Match notifications
- Account deletion notifications

**Where to Get It**:

1. Sign up at [resend.com](https://resend.com)
2. Create API key in dashboard
3. See [RESEND_SETUP.md](./RESEND_SETUP.md) for detailed guide

**Without This**:

- ❌ Users can't verify email addresses
- ❌ Password reset won't work
- ❌ No email notifications sent
- ⚠️ App still functions, but email features break

**Cost**: FREE (3,000 emails/month)

---

### EMAIL_FROM

**Purpose**: Sender email address for all outgoing emails

**Format**:

```env
EMAIL_FROM="Proofound <no-reply@proofound.io>"
```

**Format Rules**:

- Display Name + Email: `"Proofound <no-reply@domain.com>"` ✅
- Email only: `no-reply@domain.com` ✅
- Must be verified domain in Resend

**Default Value**:

```typescript
const fromEmail = process.env.EMAIL_FROM || 'Proofound <no-reply@proofound.io>';
```

**Important**:

- ✅ Use professional domain (not gmail/yahoo)
- ✅ Verify domain in Resend dashboard
- ✅ Configure SPF/DKIM records for deliverability

---

### LINKEDIN_VERIFICATION_ADMIN_EMAILS

**Purpose**: Comma-separated admin recipients for LinkedIn manual-review notifications.

**Format**:

```env
LINKEDIN_VERIFICATION_ADMIN_EMAILS=admin1@proofound.io,admin2@proofound.io
```

**Behavior**:

- Used when a LinkedIn verification request remains in manual-review (`pending`) state.
- If unset or empty, the app falls back to `PLATFORM_ADMIN_EMAILS`.
- If both are unset, notification emails are skipped (request still succeeds).

---

### CRON_SECRET

**Purpose**: Authentication token for scheduled task endpoints

**Format**:

```env
CRON_SECRET=K7x9mP2nQ4vL8wR6yT3zC5bN1aM0hF
```

**Used By**:

Active launch and observability routes:

- `/api/cron/decision-reminders`
- `/api/cron/refresh-matches`
- `/api/cron/refresh-matches-worker`
- `/api/cron/sla-enforcement`
- `/api/cron/performance-check`
- `/api/cron/health-check`

Manual or archived compatibility routes may still check the same secret if explicitly invoked, but they are not active launch infrastructure. The canonical schedule classification is in [CRON_SETUP.md](./CRON_SETUP.md).

**How to Generate**:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# https://1password.com/password-generator/
```

**Without This**:

- ⚠️ Cron endpoints are **publicly accessible**
- ⚠️ Anyone can trigger expensive operations
- ⚠️ Security vulnerability - DOS risk

**Setup Guide**: See [CRON_SETUP.md](./CRON_SETUP.md)

---

### CRON_API_KEY

**Purpose**: API token for reconciling the managed cron-job.org job set from the repo

**Format**:

```env
CRON_API_KEY=your_cron_job_org_api_token
```

**Used By**:

- `npm run cron:sync`
- `scripts/sync-cron-job-org.mjs`

**Behavior**:

- Lets the repo reconcile the managed cron-job.org job set via `npm run cron:sync`.
- Ensures the intended observability jobs remain enabled or disabled according to repo policy.
- Disables overlapping, manual-only, retired, or non-MVP external jobs such as Vercel-owned launch jobs, `/api/cron/account-deletion-workflow`, `/api/cron/python-internal-worker`, `/api/cron/cv-import-temp-cleanup`, `/api/cron/weekly-digest`, `/api/cron/fairness-note`, and `/api/cron/fairness-report`.
- Intended for Hobby deployments where Vercel cron cannot run sub-daily schedules.

**Without This**:

- External cron-job.org jobs must be created and reconciled manually in the dashboard.
- `npm run cron:sync` will fail fast with a configuration error.

---

### PYTHON_INTERNAL_SERVICE_SECRET

**Purpose**: Shared secret for internal TypeScript-to-Python document-intelligence calls

**Format**:

```env
PYTHON_INTERNAL_SERVICE_SECRET=your_strong_internal_secret_here
```

**Used By**:

- `src/lib/expertise/python-cv-proxy.ts`
- `src/lib/python-internal/client.ts`
- `api/python/cv_import.py`

**Behavior**:

- Preferred secret for all internal Python calls.
- Fallback order is `PYTHON_INTERNAL_SERVICE_SECRET` → `CV_IMPORT_PROXY_INTERNAL_SECRET` → `INTERNAL_API_SECRET` → `CRON_SECRET`.
- Local non-production fallback uses an in-process development secret only when none of the above are configured.

**Without This**:

- ⚠️ Production Python internal calls fail with `503` if no fallback secret is configured.
- ⚠️ Cross-service deployments cannot authenticate safely.

---

### PYTHON_CV_IMPORT_BASE_URL

**Purpose**: Optional base URL for a dedicated Python document-intelligence deployment

**Format**:

```env
PYTHON_CV_IMPORT_BASE_URL=https://python-internal.proofound.internal
```

**Used By**:

- `src/lib/expertise/python-cv-proxy.ts`
- `src/lib/python-internal/client.ts`

**Behavior**:

- If set, TypeScript routes call the Python service at this base URL instead of looping back through the current Next.js deployment.
- Keep public clients on the Next.js routes. This variable is for server-to-server traffic only.

**Without This**:

- The app falls back to the current request origin or `NEXT_PUBLIC_SITE_URL`.

---

### PYTHON_INTERNAL_JOBS_ENABLED

**Purpose**: Toggle the archived Postgres-backed Python internal job queue helpers

**Format**:

```env
PYTHON_INTERNAL_JOBS_ENABLED=true
```

**Used By**:

- `src/lib/python-internal/job-queue.ts`

**Behavior**:

- This now only affects archived internal helper code. It is no longer part of the locked MVP launch surface.
- `true` or unset: helper functions still consider the queue enabled.
- `false`: helper functions return skip behavior if they are invoked by non-launch code.

---

### PYTHON_INTERNAL_WORKER_BATCH_SIZE

**Purpose**: Maximum number of Python internal jobs to lease per worker run

**Default**: `10`

### PYTHON_INTERNAL_WORKER_CONCURRENCY

**Purpose**: Maximum concurrent Python internal job executions per worker run

**Default**: `2`

### PYTHON_INTERNAL_WORKER_LEASE_SECONDS

**Purpose**: Lease timeout for claimed Python internal jobs before they are eligible for retry

**Default**: `180`

### PYTHON_INTERNAL_MAX_ATTEMPTS

**Purpose**: Maximum retry attempts for queued Python internal jobs

**Default**: `3`

**Used By**:

- `src/lib/python-internal/job-queue.ts`

**Behavior**:

- Failed jobs are returned to `pending` with exponential backoff until `max_attempts` is reached.
- Once the attempt limit is reached, the job is marked `failed` with the last error message.

---

### Zoom & Video OAuth

**Purpose**: Enable interview scheduling via Zoom (and Google as an alternative).

**Required Vars**:

- `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET` — Zoom OAuth app credentials.
- `ZOOM_REDIRECT_URI` — Must match the redirect URL in your Zoom app (recommended runtime value: `/api/integrations/zoom/callback`).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — Required for Google Meet integration and Google social login through Supabase.
- `GOOGLE_REDIRECT_URI` — Must match the app integration callback (recommended runtime value: `/api/integrations/google/callback`).
- `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` — Required for LinkedIn settings integration callback and LinkedIn social login through Supabase.
- `LINKEDIN_REDIRECT_URI` - Set to your canonical app callback (recommended: `https://yourdomain.com/api/auth/linkedin/callback`).
- `LINKEDIN_API_VERSION` - Optional LinkedIn REST version header for Verified APIs (`/rest/verificationReport`, `/rest/identityMe`). Defaults to `202510`.
- `NEXT_PUBLIC_SITE_URL` — Canonical app base URL used for OAuth callback construction (`NEXT_PUBLIC_URL` is legacy fallback only).
- LinkedIn verification tier behavior (no extra env needed):
  - `IDENTITY` label maps to `identity_verified`
  - `WORKPLACE` label maps to `workplace_verified`
  - Pending/manual-review applies only when no official LinkedIn label is present.

**Provider callback split (important)**:

- Google integration callback (app route): `https://yourdomain.com/api/integrations/google/callback`
- Google social auth callback (Supabase): `https://<supabase-project>.supabase.co/auth/v1/callback`
- LinkedIn integration callback (app route): `https://yourdomain.com/api/auth/linkedin/callback`
- LinkedIn social auth callback (Supabase): `https://<supabase-project>.supabase.co/auth/v1/callback`
- Zoom integration callback (app route): `https://yourdomain.com/api/integrations/zoom/callback`

**Used By**:

- `src/app/api/integrations/zoom/connect/route.ts`, `src/app/api/integrations/zoom/callback/route.ts`
- `src/app/api/integrations/google/connect/route.ts`, `src/app/api/integrations/google/callback/route.ts`
- `src/app/api/integrations/video/[provider]/auth/route.ts` (returns connect URLs)
- `src/lib/integrations/zoom.ts`, `src/lib/integrations/google-meet.ts`

**Without These**:

- ❌ OAuth URL generation fails for Zoom/Google.
- ❌ LinkedIn integration callback cannot exchange OAuth codes.
- ❌ Users cannot connect their video provider for interviews.
- ❌ Social login through Google and LinkedIn cannot be initiated reliably.

**Setup**:

1. Create a Zoom OAuth app and copy the client ID/secret.
2. Set `ZOOM_REDIRECT_URI` to `/api/integrations/zoom/callback` for multi-domain runtime support and add each fully-qualified callback URL to Zoom app settings.
3. Configure one Google OAuth client with callback URIs for each app host plus Supabase social auth:
   - `https://yourdomain.com/api/integrations/google/callback`
   - `http://localhost:3000/api/integrations/google/callback`
   - `https://preview.yourdomain.com/api/integrations/google/callback`
   - `https://<supabase-project>.supabase.co/auth/v1/callback`
4. Configure LinkedIn app callback URIs:
   - `https://yourdomain.com/api/auth/linkedin/callback`
   - `https://<supabase-project>.supabase.co/auth/v1/callback`
   - Optional local callback for local OAuth testing: `http://localhost:3000/api/auth/linkedin/callback`
   - Optional additional live-domain callbacks for each domain that can initiate `/api/auth/linkedin` (for example `https://demo.yourdomain.com/api/auth/linkedin/callback`)
   - For LinkedIn verification, ensure OAuth scopes include `r_profile_basicinfo` and `r_verify` in addition to `openid profile email`.
5. Set `NEXT_PUBLIC_SITE_URL` to your canonical domain (for example `https://proofound.io`).

---

### Strict Provider E2E (Deterministic User)

**Purpose**: Make provider flows launch-blocking with real tokens in strict suites.

**Required Vars**:

- `E2E_PROVIDER_USER_ID`
- `E2E_PROVIDER_USER_EMAIL`
- `E2E_PROVIDER_USER_PASSWORD`
- `STRICT_PROVIDER_E2E_REQUIRE_CONNECTED=true`
- `STRICT_PROVIDER_E2E_REQUIRE_BOTH=true`

**Requirement**:

- The deterministic user must already have both `zoom` and `google_meet` rows in `user_video_integrations`.
- Strict provider suite enforces both Zoom and Google scheduling when `STRICT_PROVIDER_E2E_REQUIRE_BOTH=true`.

---

## Optional Variables (🟢 Enhance Functionality)

These variables are optional but recommended for production.

### NODE_ENV

**Purpose**: Specify runtime environment

**Format**:

```env
NODE_ENV=production
```

**Values**:

- `production` - Production deployment
- `development` - Local development
- `test` - Testing environment

**Used By**:

- Database connection validation
- Error handling behavior
- Logging levels
- Build optimizations

**Default**: Automatically set by hosting providers

---

### NEXT_PUBLIC_APP_ENV

**Purpose**: Application environment identifier

**Format**:

```env
NEXT_PUBLIC_APP_ENV=production
```

**Values**:

- `local` - Local development
- `development` - Development server
- `staging` - Staging environment
- `production` - Production

**Used By**:

- Feature flags
- Analytics tracking
- Debug mode toggles

---

### MATCHING_FEATURE_ENABLED

**Purpose**: Toggle matching system on/off

**Format**:

```env
MATCHING_FEATURE_ENABLED=true
```

**Values**:

- `true` - Matching system enabled
- `false` - Matching system disabled

**Used By**:

- Matching algorithm endpoints
- Profile matching UI
- Match notifications

**Default**: `true`

---

### CV_IMPORT_ENGINE_MODE

**Purpose**: Legacy/non-launch control for archived CV import suggest requests.

**Launch status**: CV import wizard is not an active MVP feature and is excluded from the controlled AI/OCR rollout. These variables are retained only for archived-route compatibility, legacy tests, or an explicitly approved future route-surface change.

**Format**:

```env
CV_IMPORT_ENGINE_MODE=auto
```

**Values**:

- `auto` - JSON uses TypeScript path, multipart uses Python path.
- `typescript` - Force JSON through TypeScript path (multipart still Python-only).
- `python` - Force JSON and multipart through Python path.
- `gemini` - JSON uses Gemini extraction with deterministic fallback; multipart first runs Python `extract` then Gemini.

**Default**: `auto`

---

### CV_IMPORT_WIZARD_TIMEOUT_MS / CV_IMPORT_SERVER_TIMEOUT_MS

**Purpose**: Controls CV wizard request timeout budgets.

**Format**:

```env
CV_IMPORT_WIZARD_TIMEOUT_MS=45000
CV_IMPORT_SERVER_TIMEOUT_MS=15000
```

**Behavior**:

- Wizard route timeout resolution precedence:
  1. `CV_IMPORT_WIZARD_TIMEOUT_MS`
  2. `CV_IMPORT_SERVER_TIMEOUT_MS`
  3. hard default `45000`
- `CV_IMPORT_SERVER_TIMEOUT_MS` remains a global fallback for non-wizard CV routes.

**Default**:

- Wizard route effective default: `45000` ms
- Server fallback default: `15000` ms

---

### AI_GEMINI_PROD_API_KEY / AI_GEMINI_STAGING_API_KEY

**Purpose**: Server-only Gemini API keys for the assistive AI layer. Legacy CV import Gemini paths may still read these names only where archived compatibility code exists.

**Format**:

```env
AI_GEMINI_PROD_API_KEY=AIza...
AI_GEMINI_STAGING_API_KEY=AIza...
```

**Notes**:

- Stored only in server environments (for example Vercel server env vars).
- Never exposed to the browser.
- Not used by the Cloud Run + Document AI Proof Artifact OCR beta path. That path uses the Cloud Run service account / Google ADC.
- Archived CV import compatibility code may still record spend against its `primary` and `secondary` slots if explicitly invoked in non-launch contexts. `AI_GEMINI_PROD_API_KEY` maps to `primary`; `AI_GEMINI_STAGING_API_KEY` maps to `secondary`.
- `CV_IMPORT_GEMINI_PRIMARY_API_KEY` and `CV_IMPORT_GEMINI_SECONDARY_API_KEY` remain accepted as legacy fallbacks for existing deployments, but new setup should use the `AI_GEMINI_*` names.

---

### CV_IMPORT_GEMINI_PRIMARY_MONTHLY_BUDGET_SEK / CV_IMPORT_GEMINI_SECONDARY_MONTHLY_BUDGET_SEK

**Purpose**: Legacy/non-launch monthly spend caps in SEK per key slot for archived CV import Gemini compatibility.

**Format**:

```env
CV_IMPORT_GEMINI_PRIMARY_MONTHLY_BUDGET_SEK=80
CV_IMPORT_GEMINI_SECONDARY_MONTHLY_BUDGET_SEK=80
```

**Default**:

- Primary: `80`
- Secondary: `80`

---

### CV_IMPORT_GEMINI_USD_TO_SEK_RATE

**Purpose**: Legacy/non-launch fixed FX conversion rate used to convert Gemini USD pricing to SEK for archived CV import compatibility.

**Format**:

```env
CV_IMPORT_GEMINI_USD_TO_SEK_RATE=10.5
```

**Default**: `10.5`

---

### AI_ASSISTANTS_ENABLED

**Purpose**: Server-side kill switch for Proofound assistive AI features.

**Format**:

```env
AI_ASSISTANTS_ENABLED=false
```

**Default**: `false`

**Security**:

- When set to `false`, provider calls fail closed before contacting Gemini.
- Keep disabled by default unless a pilot enablement has passed the AI launch gates.
- This is server-only policy. Do not mirror API keys or prompt text into browser variables.

---

### AI_GEMINI_API_KEY / GEMINI_API_KEY

**Purpose**: Legacy server-only Gemini API key aliases for the assistive AI layer.

**Format**:

```env
AI_GEMINI_API_KEY=AIza...
GEMINI_API_KEY=AIza...
```

**Precedence**:

1. `AI_GEMINI_PROD_API_KEY`
2. `AI_GEMINI_API_KEY`
3. `GEMINI_API_KEY`
4. `CV_IMPORT_GEMINI_PRIMARY_API_KEY` as legacy fallback for shared Gemini infrastructure

**Security**:

- Never configure `NEXT_PUBLIC_GEMINI_API_KEY` or any `NEXT_PUBLIC_*GEMINI*KEY`.
- Launch guardrails fail when a browser-exposed Gemini key exists.
- Keys are used only by server-side routes and are never returned by API responses or launch status.

---

### AI_MODEL_DEFAULT / AI_MODEL_FALLBACK / CV_IMPORT_GEMINI_MODEL_DEFAULT / CV_IMPORT_GEMINI_MODEL_FALLBACK

**Purpose**: Model policy for assistive AI, extraction, and schema-quality retry.

**Format**:

```env
AI_MODEL_DEFAULT=gemini-3.1-flash-lite
AI_MODEL_FALLBACK=
AI_MODEL_FALLBACK_VERIFIED=false
AI_PROVIDER_SMOKE_LAST_SUCCESS_AT=
CV_IMPORT_GEMINI_MODEL_DEFAULT=gemini-3.1-flash-lite
CV_IMPORT_GEMINI_MODEL_FALLBACK=
```

**Default**:

- Default model: `gemini-3.1-flash-lite`
- Fallback model: unset

**Notes**:

- `AI_MODEL_DEFAULT` is the provider-wide default for assistive AI calls.
- `AI_MODEL_FALLBACK` is optional, provider-wide, and is ignored unless `AI_MODEL_FALLBACK_VERIFIED=true`.
- Run `npm run ai:provider:smoke` before marking a fallback model verified. The smoke writes `.artifacts/ai-provider-smoke.json` by default, and launch status requires that artifact to match the configured default and verified fallback model before it treats provider smoke as current evidence. Current smoke artifacts also record value-free prerequisite booleans for `DATABASE_URL`, server-only provider-key presence, production-like runtime, and AI monthly hard-cap presence so stale or under-configured smoke files cannot satisfy launch readiness.
- `CV_IMPORT_GEMINI_MODEL_DEFAULT` remains accepted for the CV import feature, but `AI_MODEL_DEFAULT` takes precedence.
- `CV_IMPORT_GEMINI_MODEL_FALLBACK` remains accepted only by legacy/non-launch CV import helpers. It must not act as the active assistive AI provider fallback.
- Gemini API keys remain server-only and must not use `NEXT_PUBLIC_` prefixes.
- The current configured default uses Gemini 3.1 Flash-Lite through `gemini-3.1-flash-lite`; keep the exact provider model identifier environment-driven so it can be updated without product behavior changes.

---

### AI_MONTHLY_HARD_CAP_SEK / AI_PROD_MONTHLY_HARD_CAP_SEK

**Purpose**: Monthly SEK spend caps for the assistive AI layer.

**Format**:

```env
AI_MONTHLY_HARD_CAP_SEK=500
AI_PROD_MONTHLY_HARD_CAP_SEK=500
```

**Behavior**:

- `AI_MONTHLY_HARD_CAP_SEK` applies globally when set.
- `AI_PROD_MONTHLY_HARD_CAP_SEK` applies in production-like environments.
- In production-like environments, `AI_ASSISTANTS_ENABLED=true` fails closed unless at least one hard cap is configured.
- When both apply, the stricter cap is shown in launch status as `aiMonthlyCapSek`.
- Spend state is exposed to operators through `/api/monitoring/launch-status` without exposing prompts, model responses, or keys.
- Assistive AI is production-eligible only after live model smoke, app-level hard-cap tests, launch-status checks, privacy tests, and raw-prompt logging checks pass.
- Production-like readiness is blocked if raw prompt logging is enabled.

---

### AI_GLOBAL_DAILY_LIMIT / AI_USER_DAILY_LIMIT / AI_ORG_DAILY_LIMIT / AI\*<FEATURE>\_DAILY_LIMIT

**Purpose**: Daily rate limits for assistive AI requests.

**Format**:

```env
AI_GLOBAL_DAILY_LIMIT=250
AI_USER_DAILY_LIMIT=20
AI_ORG_DAILY_LIMIT=50
AI_PROOF_PACK_ASSISTANT_DAILY_LIMIT=500
AI_ASSIGNMENT_CLARITY_DAILY_LIMIT=500
AI_VERIFICATION_REQUEST_COMPOSER_DAILY_LIMIT=500
AI_PRIVACY_PREFLIGHT_DAILY_LIMIT=500
```

**Default**:

- Global daily limit: `250`
- User daily limit: `20`
- Organization daily limit: `50`
- Feature daily limit: `500`

---

### AI\_<FEATURE>\_MAX_OUTPUT_TOKENS

**Purpose**: Per-feature output token caps for server-side AI responses.

**Format**:

```env
AI_PROOF_PACK_ASSISTANT_MAX_OUTPUT_TOKENS=700
AI_ASSIGNMENT_CLARITY_MAX_OUTPUT_TOKENS=900
AI_VERIFICATION_REQUEST_COMPOSER_MAX_OUTPUT_TOKENS=900
AI_PRIVACY_PREFLIGHT_MAX_OUTPUT_TOKENS=280
AI_CV_IMPORT_MAX_OUTPUT_TOKENS=3200
```

**Notes**:

- Feature keys are derived from the feature name in uppercase with non-alphanumeric characters replaced by underscores.
- The provider still enforces hard in-code caps if an environment value is missing or too high.

---

### AI_RAW_PROMPT_LOGGING_ENABLED

**Purpose**: Emergency diagnostic switch for raw prompt logging.

**Format**:

```env
AI_RAW_PROMPT_LOGGING_ENABLED=false
```

**Default**: `false`

**Security**:

- Must remain `false` for production and pilot launch.
- Launch status blocks readiness when raw prompt logging is enabled in production-like environments.
- Normal AI usage logs store hashes, token counts, redaction summaries, and safe metadata only.

---

### CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS

**Purpose**: Legacy/non-launch output token cap for archived CV import Gemini structured extraction responses.

**Format**:

```env
CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS=1600
```

**Default**: `1600`

---

### CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS

**Purpose**: Lower output token cap used automatically for short CV text to reduce spend while keeping structured quality.

**Format**:

```env
CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS=1000
```

**Default**: `1000`

---

### CV_IMPORT_GEMINI_TAXONOMY_GUIDED

**Purpose**: Legacy/non-launch toggle for archived CV import Gemini taxonomy grounding.

**Launch status**: taxonomy shortlist behavior is excluded from the controlled production rollout and must not be used for employer review, ranking, matching, or shortlisting.

**Format**:

```env
CV_IMPORT_GEMINI_TAXONOMY_GUIDED=false
```

**Values**:

- `true` - Legacy archived behavior only; do not enable for controlled rollout.
- `false` - Use free extraction prompt with post-mapping only.

**Default**: `false` for controlled rollout.

---

### CV_IMPORT_GEMINI_SHORTLIST_MAX_ENTRIES / CV_IMPORT_GEMINI_SHORTLIST_MAX_TOKENS

**Purpose**: Caps taxonomy shortlist size sent to Gemini per document.

**Format**:

```env
CV_IMPORT_GEMINI_SHORTLIST_MAX_ENTRIES=120
CV_IMPORT_GEMINI_SHORTLIST_MAX_TOKENS=1200
```

**Default**:

- Max entries: `120`
- Max shortlist token budget: `1200`

---

### CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT / CV_IMPORT_GEMINI_SHORTLIST_CONCURRENCY / CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS / CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS / CV_IMPORT_GEMINI_SHORTLIST_CACHE_TTL_MS / CV_IMPORT_GEMINI_TAXONOMY_VERSION

**Purpose**: Controls shortlist candidate seed breadth, lookup concurrency, timeout budgets, cache lifetime, and taxonomy versioning for cache keys.

**Format**:

```env
CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT=8
CV_IMPORT_GEMINI_SHORTLIST_CONCURRENCY=4
CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS=1500
CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS=8000
CV_IMPORT_GEMINI_SHORTLIST_CACHE_TTL_MS=600000
CV_IMPORT_GEMINI_TAXONOMY_VERSION=v1
```

**Default**:

- Seed limit: `8`
- Concurrency: `4`
- Per-seed timeout: `1500` ms
- Per-document timeout: `8000` ms
- Cache TTL: `600000` ms
- Taxonomy version: `v1`

---

### CV_IMPORT_MAX_FILE_SIZE_MB / CV_IMPORT_MAX_PDF_PAGES

**Purpose**: Legacy/non-launch upload guardrails applied by archived CV import/Python extraction paths.

**Format**:

```env
CV_IMPORT_MAX_FILE_SIZE_MB=5
CV_IMPORT_MAX_PDF_PAGES=4
```

**Default**:

- Max file size: `5` MB
- Max pages: `4`

---

### NEXT_PUBLIC_CV_IMPORT_REVIEW_V3

**Purpose**: Legacy/non-launch flag for the archived V3 skills-first CV review UX.

**Launch status**: CV import wizard is excluded from MVP launch and from the Google Cloud Document AI OCR beta.

**Format**:

```env
NEXT_PUBLIC_CV_IMPORT_REVIEW_V3=true
```

**Values**:

- `true` - Use V3 review UX (recommended).
- `false` - Keep legacy review UX.

**Default**: `true`

---

### NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED

**Purpose**: Legacy/non-launch browser OCR fallback for the archived CV Import Wizard.

**Format**:

```env
NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED=false
```

**Values**:

- `true` - Enable OCR retry in CV Import Wizard.
- `false` - Disable OCR fallback and prompt for a text-based PDF.

**Launch status**: keep `false` for controlled rollout. Browser-side CV import OCR is not part of the authenticated-user Proof Artifact Text Extraction or Start from CV betas.

**Default**: `false`

---

### OCR Client Limits and Timeouts

**Purpose**: Controls browser OCR execution bounds.

**Format**:

```env
NEXT_PUBLIC_CV_IMPORT_OCR_MAX_FILE_SIZE_MB=5
NEXT_PUBLIC_CV_IMPORT_OCR_MAX_PAGES=4
NEXT_PUBLIC_CV_IMPORT_OCR_PAGE_TIMEOUT_MS=8000
NEXT_PUBLIC_CV_IMPORT_OCR_TIMEOUT_MS=25000
NEXT_PUBLIC_CV_IMPORT_OCR_RENDER_SCALE=2
NEXT_PUBLIC_CV_IMPORT_OCR_LANGUAGE=eng
```

**Defaults**:

- File size: `5` MB
- Pages: `4`
- Per-page timeout: `8000` ms
- Total timeout: `25000` ms
- Render scale: `2`
- OCR language: `eng`

---

### GCP_CV_OCR_ENABLED / GCP_CV_OCR_EXPIRES_AT

**Purpose**: Disabled-by-default server-side switch for the Cloud Run + Google Cloud Document AI Proof Artifact Text Extraction beta.

**Format**:

```env
PROOF_ARTIFACT_OCR_BETA_ENABLED=false
PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH=false
GCP_CV_OCR_ENABLED=false
GCP_CV_OCR_KILL_SWITCH=false
GCP_CV_OCR_EXPIRES_AT=
GCP_CV_OCR_EMERGENCY_DISABLE_HOURS=72
GCP_CV_OCR_BASE_URL=
GCP_CV_OCR_AUTH_MODE=oidc
GCP_CV_OCR_SHARED_SECRET=
GCP_CV_OCR_OIDC_AUDIENCE=
GCP_CV_OCR_OIDC_PROJECT_NUMBER=
GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID=
GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID=
GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL=
GCP_CV_OCR_PROVIDER=document_ai
GCP_CV_OCR_PROJECT_ID=
GCP_CV_OCR_DOCUMENT_AI_LOCATION=
GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID=
GCP_CV_OCR_ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png
GCP_CV_OCR_MAX_FILE_SIZE_MB=5
GCP_CV_OCR_MAX_PAGES=4
GCP_CV_OCR_MAX_FILES_PER_REQUEST=1
GCP_CV_OCR_RETENTION_HOURS=24
GCP_CV_OCR_USER_DAILY_LIMIT=5
GCP_CV_OCR_GLOBAL_DAILY_LIMIT=20
GCP_CV_OCR_HARD_BUDGET_CAP_SEK=
GCP_CV_OCR_BUDGET_CAP_EXHAUSTED=false
GCP_CV_OCR_BUDGET_ALERT_CONFIGURED=false
GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES=1
GCP_CV_OCR_CLOUD_RUN_MAX_INSTANCES_DOCUMENTED=false
GCP_CV_OCR_CLOUD_RUN_PUBLIC_INVOCATION=false
```

**Behavior**:

- Keep `PROOF_ARTIFACT_OCR_BETA_ENABLED=false` and `GCP_CV_OCR_ENABLED=false` by default in local, staging, and production.
- Enable in production only for approved authenticated-user beta surfaces after privacy, billing, budget alert, app-level hard-cap, credential, live smoke, launch-status, and operator-review gates pass.
- The app route also requires `FF_PROOF_ARTIFACT_OCR_BETA` audience eligibility, so global enablement alone is not sufficient.
- Accepted source MIME types are PDF, PNG, and JPG/JPEG only; browser CV import OCR remains separately disabled.
- OCR requires explicit user consent per document.
- OCR output is draft text only. It must not auto-publish, auto-verify, auto-score, auto-rank, shortlist, recommend, or affect match, review, verification, reveal, trust-state, or hiring-decision state.
- Use a future `GCP_CV_OCR_EXPIRES_AT` for any temporary smoke window. Default to `2026-08-01T00:00:00Z` so the beta expires before the current credit cutoff window.
- The disable-or-pay timeline is: review on `2026-07-15`, disabled-mode drill on `2026-07-25`, final disable-or-paid decision on `2026-08-01`, free-credit expiry on `2026-08-03`.
- Google Cloud budget alerts must be set at 25%, 50%, 75%, 90%, and 100%. Budgets are alerts only, not hard caps.
- App/service code must enforce hard caps before any Document AI call with `GCP_CV_OCR_HARD_BUDGET_CAP_SEK`, page/request/user/global caps, `GCP_CV_OCR_BUDGET_CAP_EXHAUSTED`, expiry gates, and kill switches.
- Cloud Run max instances starts at `1` and must not exceed `3` during beta.
- Use `GCP_CV_OCR_AUTH_MODE=oidc` for production Cloud Run invocation. `hmac` is only for short local/staging smoke windows.
- OIDC mode uses Vercel OIDC plus Google Workload Identity Federation to mint a short-lived Cloud Run identity token. It does not require `GCP_CV_OCR_SHARED_SECRET`.
- The app status check reports only `disabled`, `configured`, `expired`, `fallback`, or `provider reachable`.
- Production readiness blocks when GCP OCR is enabled without expiry, page caps, hard budget cap, auth mode, retention limit, Cloud Run max instance documentation, private invocation, or when Cloud Vision provider is selected.
- Kill switches are `AI_GLOBAL_KILL_SWITCH`, feature-level AI switches, `PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH`, and `GCP_CV_OCR_KILL_SWITCH`.
- The OCR path uses Cloud Run service account / Google ADC inside the service. Do not configure Google API keys, browser-created Gemini keys, or service account JSON for this path.
- Cloud Vision OCR is excluded from this rollout.
- Do not expose base URLs, project IDs, processor IDs, secrets, signed URLs, filenames, or extracted text in status responses, logs, or smoke artifacts.

**Smoke commands**:

```bash
npm run ocr:production:status
npm run ocr:production:smoke
```

---

### START_FROM_CV_BETA_ENABLED

**Purpose**: Disabled-by-default Start from CV beta. This is an individual onboarding helper that turns a user-owned CV into private editable drafts. It can run as an authenticated-individual open beta when `START_FROM_CV_OPEN_BETA_ENABLED=true`, or as a legacy invite-scoped beta when the open-beta flag is off. It is not CV screening, candidate evaluation, employer-side parsing, matching, ranking, shortlisting, verification, trust state, or public portfolio publication.

**Format**:

```env
START_FROM_CV_BETA_ENABLED=false
START_FROM_CV_OPEN_BETA_ENABLED=false
START_FROM_CV_ALLOWED_USER_IDS=
START_FROM_CV_ALLOWED_ORG_IDS=
START_FROM_CV_USE_GCP_OCR=false
START_FROM_CV_USE_GEMINI_STRUCTURING=false
START_FROM_CV_AI_PROVIDER=gemini
START_FROM_CV_DEEPSEEK_API_KEY=
START_FROM_CV_DEEPSEEK_BASE_URL=https://api.deepseek.com
START_FROM_CV_DEEPSEEK_MODEL=deepseek-v4-flash
START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED=false
START_FROM_CV_DEEPSEEK_PRODUCTION_ENABLED=false
START_FROM_CV_MAX_FILE_SIZE_MB=5
START_FROM_CV_MAX_PAGES=4
START_FROM_CV_USER_DAILY_LIMIT=3
START_FROM_CV_GLOBAL_DAILY_LIMIT=20
START_FROM_CV_RETENTION_HOURS=24
START_FROM_CV_DELETE_SOURCE_AFTER_EXTRACTION=true
NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED=false
```

**Behavior**:

- Keep `START_FROM_CV_BETA_ENABLED=false` by default.
- Set `START_FROM_CV_OPEN_BETA_ENABLED=true` only when the beta is approved for all authenticated individual users. If it remains `false`, enabling requires an invite audience through `START_FROM_CV_ALLOWED_USER_IDS`, `START_FROM_CV_ALLOWED_ORG_IDS`, or a beta-testing individual profile.
- `NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED` must remain `false`; the archived browser CV OCR path is not part of this beta.
- Accepted file types are PDF, PNG, and JPG/JPEG only. DOCX is not supported in this beta.
- Default limits are 5 MB, 4 pages, 3 sessions per user per day, 20 sessions globally per day, and 24-hour retention.
- `START_FROM_CV_USE_GCP_OCR=true` may call only the guarded Document AI provider path when `GCP_CV_OCR_*` governance gates pass. Cloud Vision remains blocked.
- `START_FROM_CV_USE_GEMINI_STRUCTURING=true` is the legacy live-structuring gate name. It may call the provider allowed by `START_FROM_CV_AI_PROVIDER` only when the provider policy passes. Supported live providers are `gemini` and `deepseek-v4-flash`; `nvidia-deepseek-v4-flash`, `mock`, and `disabled` remain fail-closed for live Start from CV calls. If unavailable or blocked, deterministic draft structuring is used.
- `START_FROM_CV_AI_PROVIDER=deepseek-v4-flash` calls DeepSeek's OpenAI-compatible chat completions endpoint with JSON mode, `thinking: disabled`, and `deepseek-v4-flash` by default. It requires `START_FROM_CV_DEEPSEEK_API_KEY`, `AI_ASSISTANTS_ENABLED=true`, and `START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED=true` before redacted CV text may be sent to DeepSeek. Production-like environments also require `START_FROM_CV_DEEPSEEK_PRODUCTION_ENABLED=true` plus the normal AI hard-cap configuration.
- Raw CV bytes are request-local. Raw OCR text, prompts, and responses must not be logged or permanently stored.
- Accepted work, education, and volunteering items become private draft context only. Proof Pack ideas, artifact/link suggestions, and unsupported skill drafts stay draft-only until the user creates proof-backed records manually.
- `/api/monitoring/launch-status` reports Start from CV beta state and blocks readiness if the beta is enabled with unsafe or incomplete gates.

---

### MATCHING_TWO_STAGE_ENABLED

**Purpose**: Enables ANN-hybrid assignment retrieval for `/api/core/matching/profile`.

**Format**:

```env
MATCHING_TWO_STAGE_ENABLED=true
```

**Values**:

- `true` - Enable ANN-hybrid retrieval (default).
- `false` - Disable ANN stage and use full-scan retrieval.

**Default**: `true`

---

### MATCHING_NEAR_SCAN_LIMIT

**Purpose**: Caps active-assignment scan size for `/api/core/matching/near-matches`.

**Format**:

```env
MATCHING_NEAR_SCAN_LIMIT=300
```

**Default**: `300` (clamped internally to safe min/max).

---

### MATCHING_REFRESH_QUEUE_ENABLED

**Purpose**: Toggles durable queue mode for match refresh cron/worker.

**Format**:

```env
MATCHING_REFRESH_QUEUE_ENABLED=true
```

**Values**:

- `true` - `/api/cron/refresh-matches` enqueues jobs and worker drains them.
- `false` - Queue processing is skipped.

**Default**: `true`

---

### MATCHING_REFRESH_WORKER_BATCH_SIZE

**Purpose**: Max jobs claimed per worker run.

**Format**:

```env
MATCHING_REFRESH_WORKER_BATCH_SIZE=100
```

**Default**: `100`

---

### MATCHING_REFRESH_WORKER_CONCURRENCY

**Purpose**: Parallel job-processing concurrency within one worker run.

**Format**:

```env
MATCHING_REFRESH_WORKER_CONCURRENCY=4
```

**Default**: `4`

---

### MATCHING_REFRESH_MAX_ATTEMPTS

**Purpose**: Max retry attempts for one refresh job before marking failed.

**Format**:

```env
MATCHING_REFRESH_MAX_ATTEMPTS=3
```

**Default**: `3`

---

### PERF_API_P95_BUDGET_MS

**Purpose**: Unified API latency p95 budget for health checks and CI perf budgets.

**Format**:

```env
PERF_API_P95_BUDGET_MS=1500
```

**Default**: `1500`

---

### NEXT_PUBLIC_WIREFRAME_MODE

**Purpose**: Enable wireframe/design mode

**Format**:

```env
NEXT_PUBLIC_WIREFRAME_MODE=false
```

**Values**:

- `true` - Show wireframe borders for development
- `false` - Normal production styling

**Default**: `false`

---

### RATE_LIMIT_WINDOW_SECONDS

**Purpose**: Rate limiting time window

**Format**:

```env
RATE_LIMIT_WINDOW_SECONDS=60
```

**Used By**:

- API rate limiting middleware
- Authentication endpoints
- Public API routes

**Default**: `60` (1 minute)

---

### RATE_LIMIT_MAX

**Purpose**: Maximum requests per time window

**Format**:

```env
RATE_LIMIT_MAX=30
```

**Used By**:

- API rate limiting middleware
- Prevents abuse

**Default**: `30` requests per minute

---

## How to Set Environment Variables

### Vercel (Production/Staging)

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **"Add Variable"**
5. Enter name and value
6. Select environments (Production, Preview, Development)
7. Click **"Save"**
8. **Redeploy** for changes to take effect

**Tips**:

- Use different values for different environments
- Sensitive keys: Only set in Production
- Public keys: Set in all environments

---

### Local Development

**File**: `.env.local` (create in project root)

```env
# Copy from .env.example
# Add your local values

DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_...
EMAIL_FROM="Proofound <no-reply@proofound.io>"
LINKEDIN_VERIFICATION_ADMIN_EMAILS=admin1@proofound.io,admin2@proofound.io
CRON_SECRET=your_local_secret
```

**Important**:

- ✅ `.env.local` is git-ignored (never commit)
- ✅ Use `.env.example` as template
- ✅ Copy `.env.example` to `.env.local` to start

---

### GitHub Actions / CI

Add secrets in repository settings:

1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add each environment variable
4. Reference in workflows: `${{ secrets.DATABASE_URL }}`

---

## Validation & Testing

### Check if Variables are Set

**Script**: `scripts/check-deploy-readiness.mjs`

```bash
npm run prebuild
```

**Output**:

```
✅ Deploy readiness: all required env vars present.
```

Or:

```
❌ Missing required environment variables:
   - DATABASE_URL
   - NEXT_PUBLIC_SUPABASE_URL
```

### Test Locally

```bash
# Start development server
npm run dev

# Check if variables are loaded
# In browser console:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

# Server-side check (in API route):
console.log(process.env.DATABASE_URL);
```

### Verify in Deployment

1. Deploy to Vercel
2. Check **Deployment Logs**
3. Look for environment variable references
4. Test features that depend on specific variables

---

## Security Best Practices

### Never Commit Secrets

❌ **Never commit these to Git**:

```env
# Bad - in .env file committed to repo
DATABASE_URL=postgresql://user:password@host/db
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RESEND_API_KEY=re_xxx...
CRON_SECRET=secret123
```

✅ **Use .env.local (git-ignored)**:

```env
# Good - in .env.local (not committed)
DATABASE_URL=postgresql://...
```

---

### Public vs Private Variables

**Public (safe to expose)**:

- `NEXT_PUBLIC_*` prefix variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

**Private (server-only)**:

- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`

---

### Rotate Keys Regularly

**Schedule**:

- Database passwords: Every 90 days
- API keys: Every 180 days
- CRON_SECRET: Every 180 days

**How to Rotate**:

1. Generate new key/password
2. Update in Vercel environment variables
3. Redeploy application
4. Remove old key from services
5. Update external services (cron-job.org)

---

## Troubleshooting

### "Missing required environment variables"

**Problem**: Build fails with missing variable error

**Solution**:

1. Check variable is set in Vercel
2. Check spelling matches exactly (case-sensitive)
3. Redeploy after adding variables
4. Verify in correct environment (Production/Preview)

---

### "Invalid API key"

**Problem**: Supabase/Resend API key errors

**Solution**:

1. Verify key is copied completely (no spaces)
2. Check key is not expired/revoked
3. Regenerate key in service dashboard
4. Update in Vercel environment variables

---

### "Cannot connect to database"

**Problem**: DATABASE_URL connection fails

**Solution**:

1. Verify connection string format
2. Check SSL mode: `?sslmode=require`
3. Verify IP allowlist in database provider
4. Test connection locally first
5. Check database is running/accessible

---

### Variables Not Loading

**Problem**: Environment variables undefined in code

**Solution**:

**Server-side variables**:

```typescript
// ✅ Works in API routes, server components
const dbUrl = process.env.DATABASE_URL;
```

**Client-side variables**:

```typescript
// ❌ Doesn't work (server-only variable)
const dbUrl = process.env.DATABASE_URL; // undefined

// ✅ Works (NEXT_PUBLIC prefix)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
```

---

## Feature → Variable Matrix

| Feature                                           | Required Variables                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Database**                                      | `DATABASE_URL`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Authentication**                                | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Email Sending**                                 | `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`, `LINKEDIN_VERIFICATION_ADMIN_EMAILS` (or `PLATFORM_ADMIN_EMAILS`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Cron Jobs**                                     | `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **File Uploads**                                  | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Matching System**                               | `DATABASE_URL`, `MATCHING_FEATURE_ENABLED` (optional), `MATCHING_TWO_STAGE_ENABLED`, `MATCHING_NEAR_SCAN_LIMIT`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Matching Refresh**                              | `MATCHING_REFRESH_QUEUE_ENABLED`, `MATCHING_REFRESH_WORKER_BATCH_SIZE`, `MATCHING_REFRESH_WORKER_CONCURRENCY`, `MATCHING_REFRESH_MAX_ATTEMPTS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Legacy CV Import Engine (archived/non-launch)** | `CV_IMPORT_ENGINE_MODE`, `CV_IMPORT_WIZARD_TIMEOUT_MS`, `CV_IMPORT_SERVER_TIMEOUT_MS`, `CV_IMPORT_MAX_FILE_SIZE_MB`, `CV_IMPORT_MAX_PDF_PAGES`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Assistive AI**                                  | `AI_ASSISTANTS_ENABLED`, `AI_GEMINI_PROD_API_KEY`, `AI_GEMINI_STAGING_API_KEY`, `AI_MODEL_DEFAULT`, `AI_MODEL_FALLBACK`, `AI_MODEL_FALLBACK_VERIFIED`, `AI_PROVIDER_SMOKE_LAST_SUCCESS_AT`, `AI_PROVIDER_SMOKE_ARTIFACT_PATH`, `AI_MONTHLY_HARD_CAP_SEK`, `AI_PROD_MONTHLY_HARD_CAP_SEK`, `AI_GLOBAL_DAILY_LIMIT`, `AI_USER_DAILY_LIMIT`, `AI_ORG_DAILY_LIMIT`, `AI_<FEATURE>_DAILY_LIMIT`, `AI_<FEATURE>_MAX_OUTPUT_TOKENS`, `AI_RAW_PROMPT_LOGGING_ENABLED`                                                                                                                                                                                                                                                                                                                                 |
| **Legacy CV Import Gemini (archived/non-launch)** | `AI_ASSISTANTS_ENABLED`, `AI_MODEL_DEFAULT`, `AI_GEMINI_PROD_API_KEY`, `AI_GEMINI_STAGING_API_KEY`, `CV_IMPORT_GEMINI_PRIMARY_MONTHLY_BUDGET_SEK`, `CV_IMPORT_GEMINI_SECONDARY_MONTHLY_BUDGET_SEK`, `CV_IMPORT_GEMINI_USD_TO_SEK_RATE`, `CV_IMPORT_GEMINI_MODEL_DEFAULT`, `CV_IMPORT_GEMINI_MODEL_FALLBACK`, `CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS`, `CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS`, `CV_IMPORT_GEMINI_TAXONOMY_GUIDED`, `CV_IMPORT_GEMINI_SHORTLIST_MAX_ENTRIES`, `CV_IMPORT_GEMINI_SHORTLIST_MAX_TOKENS`, `CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT`, `CV_IMPORT_GEMINI_SHORTLIST_CONCURRENCY`, `CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS`, `CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS`, `CV_IMPORT_GEMINI_SHORTLIST_CACHE_TTL_MS`, `CV_IMPORT_GEMINI_TAXONOMY_VERSION` |
| **Legacy CV Import OCR (archived/non-launch)**    | `NEXT_PUBLIC_CV_IMPORT_REVIEW_V3`, `NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED`, `NEXT_PUBLIC_CV_IMPORT_OCR_MAX_FILE_SIZE_MB`, `NEXT_PUBLIC_CV_IMPORT_OCR_MAX_PAGES`, `NEXT_PUBLIC_CV_IMPORT_OCR_PAGE_TIMEOUT_MS`, `NEXT_PUBLIC_CV_IMPORT_OCR_TIMEOUT_MS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Proof Artifact OCR Beta (Document AI)**         | `PROOF_ARTIFACT_OCR_BETA_ENABLED`, `GCP_CV_OCR_ENABLED`, `GCP_CV_OCR_EXPIRES_AT`, `GCP_CV_OCR_BASE_URL`, `GCP_CV_OCR_AUTH_MODE`, `GCP_CV_OCR_SHARED_SECRET`, `GCP_CV_OCR_OIDC_AUDIENCE`, `GCP_CV_OCR_OIDC_PROJECT_NUMBER`, `GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_POOL_ID`, `GCP_CV_OCR_OIDC_WORKLOAD_IDENTITY_PROVIDER_ID`, `GCP_CV_OCR_OIDC_SERVICE_ACCOUNT_EMAIL`, `GCP_CV_OCR_PROVIDER`, `GCP_CV_OCR_PROJECT_ID`, `GCP_CV_OCR_DOCUMENT_AI_LOCATION`, `GCP_CV_OCR_DOCUMENT_AI_PROCESSOR_ID`                                                                                                                                                                                                                                                                                                    |
| **Start from CV Beta**                            | `START_FROM_CV_BETA_ENABLED`, `START_FROM_CV_OPEN_BETA_ENABLED`, `START_FROM_CV_ALLOWED_USER_IDS`, `START_FROM_CV_ALLOWED_ORG_IDS`, `START_FROM_CV_USE_GCP_OCR`, `START_FROM_CV_USE_GEMINI_STRUCTURING`, `START_FROM_CV_AI_PROVIDER`, `START_FROM_CV_DEEPSEEK_API_KEY`, `START_FROM_CV_DEEPSEEK_BASE_URL`, `START_FROM_CV_DEEPSEEK_MODEL`, `START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED`, `START_FROM_CV_DEEPSEEK_PRODUCTION_ENABLED`, `START_FROM_CV_MAX_FILE_SIZE_MB`, `START_FROM_CV_MAX_PAGES`, `START_FROM_CV_USER_DAILY_LIMIT`, `START_FROM_CV_GLOBAL_DAILY_LIMIT`, `START_FROM_CV_RETENTION_HOURS`, `START_FROM_CV_DELETE_SOURCE_AFTER_EXTRACTION`, `NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED`                                                                                               |
| **Performance Budgets**                           | `PERF_API_P95_BUDGET_MS`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Real-time Messaging**                           | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## Environment Variable Checklist

Use this checklist when setting up a new environment:

### Core Infrastructure

- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Admin API key
- [ ] `NEXT_PUBLIC_SITE_URL` - Your domain URL

### Email & Notifications

- [ ] `RESEND_API_KEY` - Resend API key
- [ ] `EMAIL_FROM` - Sender email address
- [ ] `LINKEDIN_VERIFICATION_ADMIN_EMAILS` or `PLATFORM_ADMIN_EMAILS` - LinkedIn manual-review recipients
- [ ] Domain verified in Resend
- [ ] DNS records configured (SPF, DKIM)

### Scheduled Tasks

- [ ] `CRON_SECRET` - Cron authentication token
- [ ] Cron jobs configured in cron-job.org
- [ ] Cron endpoints tested

### Optional Configuration

- [ ] `NODE_ENV` - Environment identifier
- [ ] `NEXT_PUBLIC_APP_ENV` - App environment
- [ ] `MATCHING_FEATURE_ENABLED` - Toggle matching
- [ ] `CV_IMPORT_ENGINE_MODE` - Legacy archived CV import runtime selection, not active MVP rollout
- [ ] `CV_IMPORT_WIZARD_TIMEOUT_MS` - Wizard timeout override for CV analyze
- [ ] `CV_IMPORT_SERVER_TIMEOUT_MS` - Global fallback timeout for CV routes
- [ ] `CV_IMPORT_MAX_FILE_SIZE_MB` - Upload file size cap for CV parsing
- [ ] `CV_IMPORT_MAX_PDF_PAGES` - Upload page cap for CV parsing
- [ ] `AI_ASSISTANTS_ENABLED` - Server-side AI assistants kill switch
- [ ] `AI_GEMINI_PROD_API_KEY` - Server-only production Gemini key for assistive AI
- [ ] `AI_GEMINI_STAGING_API_KEY` - Server-only staging Gemini key for assistive AI
- [ ] `AI_MODEL_DEFAULT` - Provider-wide default AI model
- [ ] `AI_MODEL_FALLBACK` - Optional fallback AI model, unset unless smoke-verified
- [ ] `AI_MODEL_FALLBACK_VERIFIED=false` - Fallback stays disabled until live smoke proves it
- [ ] `AI_PROVIDER_SMOKE_LAST_SUCCESS_AT` - Optional smoke timestamp for non-model-gated contexts; launch readiness uses model-matching smoke artifact evidence
- [ ] `AI_MONTHLY_HARD_CAP_SEK` - Global monthly assistive AI spend cap
- [ ] `AI_PROD_MONTHLY_HARD_CAP_SEK` - Production monthly assistive AI spend cap
- [ ] `AI_GLOBAL_DAILY_LIMIT` - Global daily assistive AI request limit
- [ ] `AI_USER_DAILY_LIMIT` - Per-user daily assistive AI request limit
- [ ] `AI_ORG_DAILY_LIMIT` - Per-organization daily assistive AI request limit
- [ ] `AI_<FEATURE>_DAILY_LIMIT` - Optional per-feature daily assistive AI request limit
- [ ] `AI_<FEATURE>_MAX_OUTPUT_TOKENS` - Optional per-feature assistive AI output cap
- [ ] `AI_RAW_PROMPT_LOGGING_ENABLED=false` - Raw prompt logging must remain off for launch
- [ ] `CV_IMPORT_GEMINI_PRIMARY_MONTHLY_BUDGET_SEK` - Monthly SEK cap for primary slot
- [ ] `CV_IMPORT_GEMINI_SECONDARY_MONTHLY_BUDGET_SEK` - Monthly SEK cap for secondary slot
- [ ] `CV_IMPORT_GEMINI_USD_TO_SEK_RATE` - Fixed FX conversion for cost ledger
- [ ] `CV_IMPORT_GEMINI_MODEL_DEFAULT` - Primary Gemini model
- [ ] `CV_IMPORT_GEMINI_MODEL_FALLBACK` - Retry Gemini model
- [ ] `CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS` - Gemini output cap
- [ ] `CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS` - Adaptive output cap for short CV text
- [ ] `CV_IMPORT_GEMINI_TAXONOMY_GUIDED=false` - Legacy taxonomy shortlist stays disabled for controlled rollout
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_MAX_ENTRIES` - Legacy archived shortlist item cap per document
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_MAX_TOKENS` - Legacy archived shortlist token budget cap per document
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT` - Legacy archived seed phrase cap before shortlist lookup
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_CONCURRENCY` - Legacy archived concurrent shortlist DB lookups
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS` - Legacy archived per-seed shortlist timeout
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS` - Legacy archived per-document shortlist budget
- [ ] `CV_IMPORT_GEMINI_SHORTLIST_CACHE_TTL_MS` - Legacy archived in-memory shortlist cache TTL
- [ ] `CV_IMPORT_GEMINI_TAXONOMY_VERSION` - Taxonomy cache-key version anchor
- [ ] `NEXT_PUBLIC_CV_IMPORT_REVIEW_V3` - Enable V3 skills-first review UX
- [ ] `NEXT_PUBLIC_CV_IMPORT_OCR_ENABLED` - Enable browser OCR fallback
- [ ] `NEXT_PUBLIC_CV_IMPORT_OCR_MAX_FILE_SIZE_MB` - OCR file-size cap
- [ ] `NEXT_PUBLIC_CV_IMPORT_OCR_MAX_PAGES` - OCR page cap
- [ ] `NEXT_PUBLIC_CV_IMPORT_OCR_PAGE_TIMEOUT_MS` - OCR per-page timeout
- [ ] `NEXT_PUBLIC_CV_IMPORT_OCR_TIMEOUT_MS` - OCR total timeout
- [ ] `PROOF_ARTIFACT_OCR_BETA_ENABLED=false` - App-level Proof Artifact OCR beta gate stays disabled by default
- [ ] `PROOF_ARTIFACT_OCR_BETA_KILL_SWITCH=false` - OCR beta route kill switch
- [ ] `GCP_CV_OCR_ENABLED=false` - Document AI Proof Artifact OCR provider stays disabled by default until authenticated-user beta approval
- [ ] `GCP_CV_OCR_KILL_SWITCH=false` - GCP service kill switch
- [ ] `GCP_CV_OCR_EXPIRES_AT=2026-08-01T00:00:00Z` - Future timestamp required for any temporary production smoke window before the current credit cutoff window
- [ ] GCP budget alerts at 25%, 50%, 75%, 90%, and 100%; app-level caps are the hard stop
- [ ] Proof Artifact OCR review `2026-07-15`, disabled-mode drill `2026-07-25`, final disable-or-paid decision `2026-08-01`, free-credit expiry `2026-08-03`
- [ ] `MATCHING_TWO_STAGE_ENABLED` - ANN-hybrid matching toggle
- [ ] `MATCHING_NEAR_SCAN_LIMIT` - Near-match scan cap
- [ ] `MATCHING_REFRESH_QUEUE_ENABLED` - Refresh queue toggle
- [ ] `MATCHING_REFRESH_WORKER_BATCH_SIZE` - Worker claim batch size
- [ ] `MATCHING_REFRESH_WORKER_CONCURRENCY` - Worker concurrency
- [ ] `MATCHING_REFRESH_MAX_ATTEMPTS` - Worker retry cap
- [ ] `PERF_API_P95_BUDGET_MS` - API p95 threshold
- [ ] `RATE_LIMIT_WINDOW_SECONDS` - Rate limit window
- [ ] `RATE_LIMIT_MAX` - Rate limit max requests

---

## Additional Resources

- [Resend Setup Guide](./RESEND_SETUP.md)
- [Cron Job Setup Guide](./CRON_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Support

If you need help with environment variables:

1. Check `.env.example` for reference
2. Review service-specific setup guides
3. Test locally before deploying
4. Check Vercel deployment logs
5. Contact support if issues persist
