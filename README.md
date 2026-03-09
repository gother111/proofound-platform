# Proofound Platform MVP

> Doc Class: `active`
> Last Verified: `2026-02-26`

Production-ready scaffold for a credibility and connection platform with Individual and Organization personas.

## Overview

Proofound is a platform built for authenticity, not algorithms. It features:

- **Dual Personas**: Individual contributors and Organizations (companies, NGOs, governments, networks)
- **Proof-first Profiles**: Verifiable achievements and transparent operations
- **Privacy by Design**: Row-level security, user-controlled visibility
- **Steward-owned Governance**: Built for long-term sustainability

Launch contract highlights:

- Interactive web auth uses Supabase SSR session cookies.
- Public portfolio publication is explicit and non-indexed by default until publication criteria are met.
- Uploads are quarantine-first and private by default, with public promotion limited to approved safe image types.

## Visual Architecture (quick view)

```mermaid
graph TD
  A[User Browser] --> B[Vercel Edge]
  B --> C[Next.js App Router]
  C -->|SSR session cookies| D[Supabase Auth]
  C -->|Reads/Writes| E[Supabase Postgres (RLS on)]
  C -->|Internal document intelligence| J[Python internal service]
  C -->|Emails| F[Resend]
  C -->|Telemetry| G[Sentry]
  H[Vercel Cron] --> C
  C -->|Internal API calls| C
  E -. secure storage .- I[Supabase Storage (assets)]
  E -->|Queue-backed jobs| K[Python internal job queue]
```

- Traffic enters via Vercel edge, hits the Next.js app, and all data flows through Supabase with RLS enforced.
- Cron jobs call the same API routes, so logic stays in one place.
- Resend handles transactional email; Sentry captures errors and performance traces.

## Persona & App Flow

```mermaid
flowchart LR
  U[Sign up / Login] --> V{Email verified?}
  V -- No --> X[Send magic link / verify email]
  V -- Yes --> W{Persona chosen?}
  W -- Individual --> I[(Individual profile + matches)]
  W -- Organization --> O[(Organization + members + roles)]
  I --> S[App Shell /app/i/*]
  O --> T[App Shell /app/o/[slug]/*]
  S & T --> R[Supabase (RLS enforces data per user/org)]
```

- After email verification, users branch into either the Individual or Organization shell.
- Both shells read/write through the same Supabase backend with RLS guarding visibility.

## Documentation map

- Canonical launch contract: `PRD_TECHNICAL_REQUIREMENTS.md` Section 7, `project/Architecture.md`, `LAUNCH_RUNBOOK.md`, `PRODUCTION_CHECKLIST.md`.
- Historical architecture context only: `SYSTEM_ARCHITECTURE_COMPREHENSIVE.md`, `SYSTEM_ARCHITECTURE_SUPPLEMENT.md`, `PRD_for_a_web_platform_MVP.md`.
- APIs: `docs/API_REFERENCE.md` (generated from `src/app/api/**/route.ts` via `node scripts/generate-api-reference.mjs`; historical API specs remain archived under `docs/archive/legacy-platform/api-reference-history/`).
- Runbooks: `LAUNCH_RUNBOOK.md`, `PRODUCTION_CHECKLIST.md`, `APPLY_MIGRATIONS_MANUAL.md`, `RUN_MIGRATIONS_GUIDE.md`, `OAUTH_SETUP_GUIDE.md`, `SETUP_SUPABASE.md`.
- Archives: historical docs are grouped under `docs/archive/legacy-platform/`, status reports under `docs/archive/status-reports/`, demo artifacts under `docs/archive/demos/`.
- Public/legal pages and metadata surfaces: `/about`, `/manifesto`, `/careers`, `/contact`, `/support`, `/privacy`, `/terms`, `/cookies`, `/cookies/settings`, `src/lib/seo/public-metadata.ts`, `src/app/sitemap.ts`, `src/app/layout.tsx`, and `public/favicon.svg`.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript + React Server Components
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Database**: Supabase Postgres + Drizzle ORM
- **Auth**: Supabase Auth with SSR session cookies (email/password + Google + LinkedIn)
- **Email**: Resend + React Email
- **i18n**: next-intl with English launch baseline; Swedish deferred
- **Testing**: Vitest (unit) + Playwright (e2e) + @axe-core (a11y)
- **CI/CD**: GitHub Actions + Vercel

## Brand Tokens

Design system extracted from Figma "Proofound Style Guidelines":

- **Colors**: Forest Green (primary), Parchment (background), Terracotta (accent)
- **Typography**: Crimson Pro (display), Inter (UI)
- **Motion**: Calm, purposeful animations (100-600ms durations)

## Prerequisites

- Node.js 20.20.0 (see `.nvmrc`) and npm
- Python 3.12 recommended for local document-intelligence work (`.venv311` or `python3.11` also work for the bundled Python tests)
- Supabase account (free tier works)
- Resend account (free tier works)
- Vercel account (optional, for deployment)

## Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd proofound-platform
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and anon key
4. Copy your service role key (keep this secret!)
5. Go to Project Settings → Database
6. Copy your connection string

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` (you will copy these values into Vercel later):

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=local

# Supabase (from step 2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
PII_HASH_SALT=your-salt

# Resend
RESEND_API_KEY=re_your_key
EMAIL_FROM="Proofound <no-reply@proofound.io>"

# Rate Limiting
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX=30

# Sentry (error monitoring)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
SENTRY_DEBUG=false

# Cron jobs
CRON_SECRET=your-cron-bearer-token
PYTHON_INTERNAL_SERVICE_SECRET=your-python-internal-secret

# Optional Python compute routing
PYTHON_CV_IMPORT_BASE_URL=http://127.0.0.1:3000
PYTHON_INTERNAL_JOBS_ENABLED=true
PYTHON_INTERNAL_WORKER_BATCH_SIZE=10
PYTHON_INTERNAL_WORKER_CONCURRENCY=2
PYTHON_INTERNAL_WORKER_LEASE_SECONDS=180
PYTHON_INTERNAL_MAX_ATTEMPTS=3
```

> **Heads up:** Once this works locally, open your Vercel project, go to **Settings → Environment Variables**, and add each of the keys above (Production, Preview, and Development tabs). For `DATABASE_URL`, copy the Supabase value from **Project Settings → Database → Connection string → Node.js**.

### 4. Set Up Database

Run migrations and triggers:

```bash
# Apply ordered SQL migrations + policy/trigger supplements
PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:migrate

# Optional but recommended for matching
PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:seed-taxonomy
```

**Quick guide to DB scripts:**

- `npm run db:generate` — Create a new migration from schema changes.
- `npm run db:migrate` — Apply ordered `src/db/migrations/*.sql` plus ledgered policy/trigger SQL.
- `npm run db:drift-check` — Enforce canonical migration-path discipline in CI.
- `npm run db:push` — Dev-only. Push the current schema directly to a database (bypasses migration files). Do not use this for production.
- `npm run db:backup:checkpoint` — Create a database checkpoint before risky DDL.
- `npm run db:audit:migrations` — Audit canonical migration ledger drift (`src/db/migrations` + supplemental policy/trigger versions vs `public.app_migration_ledger`).
  - Strict legacy baseline audit: `npm run db:audit:migrations -- --mode legacy-supabase-baseline --baseline supabase/ledger-baseline/schema_migrations.current-db.json`.
  - Optional diagnostics-only file inventory audit: `npm run db:audit:migrations -- --mode legacy-supabase`.
- `npm run db:seed` — Seed feature flags (and demo data when enabled).
- `npm run db:seed-taxonomy` — Seed the expertise taxonomy slice used by matching.

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

This creates feature flags. Demo users should be created via the signup flow.

### 6. Set Up Resend

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Configure DNS records (SPF, DKIM, DMARC):
   - **SPF**: Add TXT record: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM**: Add CNAME records provided by Resend
   - **DMARC**: Add TXT record: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com`
4. Get your API key from the dashboard
5. Update `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local`

**Email previews (optional):**

Run `npm run email:dev` to open the React Email preview server. If your Next.js dev server is already on port 3000, pass `--port 3001` (e.g., `npm run email:dev -- --port 3001`).

### 3b. Set Up Sentry (error monitoring)

1. Create a Sentry project (Platform: Next.js).
2. In Sentry Settings → Projects → Client Keys (DSN), copy the `SENTRY_DSN`.
3. Add these env vars (local + Vercel): `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` (auth token is only for source map upload in CI/build; keep it secret).
4. Deploy or restart dev to pick up the vars. Errors will be captured via `@sentry/nextjs` wrapping in `next.config.js`.

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── actions/              # Server Actions (auth, profile, org, onboarding)
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Auth pages (login, signup, reset)
│   ├── app/             # Protected app routes
│   │   ├── i/          # Individual shell
│   │   └── o/[slug]/   # Organization shell
│   ├── onboarding/     # Onboarding wizard
│   └── page.tsx        # Landing page
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── brand/          # Logo, Wordmark, ThemeToggle
│   ├── auth/           # Auth forms
│   ├── onboarding/     # Onboarding steps
│   ├── individual/     # Individual-specific
│   ├── organization/   # Org-specific
│   └── landing/        # Landing page sections
├── db/                 # Database schema, policies, seed
├── design/             # Brand tokens (JSON)
├── i18n/               # Internationalization (en, sv)
├── lib/                # Utilities (auth, supabase, email, motion)
└── middleware.ts       # Session refresh, route guards

emails/                 # React Email templates
e2e/                    # Playwright E2E tests
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Lint code
npm run format           # Format with Prettier
npm run typecheck        # TypeScript type checking

# Database
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run ordered SQL migrations + policy/trigger supplements
npm run db:drift-check   # Check migration path drift
npm run db:push          # Dev-only schema push (do not use for production)
npm run db:backup:checkpoint  # Create a DB checkpoint before risky DDL
npm run db:audit:migrations   # Audit canonical migration ledger drift
npm run db:studio        # Open Drizzle Studio
npm run db:seed          # Seed database

# Vercel
npm run vercel:preflight  # Check Vercel project link + required env key presence
npm run vercel:env-parity # Optional env parity snapshot vs legacy project

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
npm run perf:budgets     # Perf budgets (Lighthouse TTI/CLS + API p95)
npm run go:no-go         # Go/No-Go gating (perf + SUS flag + RLS/a11y evidence)
```

> **Troubleshooting:** If `npm run lint` reports that `next` cannot be found, follow the steps in [`docs/TROUBLESHOOTING_LINT.md`](docs/TROUBLESHOOTING_LINT.md).

## Cron Jobs (Ops Quick Reference)

- Primary scheduler: Vercel Cron for daily core business automation. Use cron-job.org for the sub-daily Python worker plus explicitly managed observability jobs.
- Auth: cron routes require `Authorization: Bearer ${CRON_SECRET}` unless explicitly documented otherwise, such as `/api/cron/health-check`.
- Routes and schedules (UTC):
  - `/api/cron/decision-reminders` — 10:00 (decision reminders, performance-health summary, Monday weekly digest)
  - `/api/cron/refresh-matches` — 03:00 (enqueue match refresh jobs)
  - `/api/cron/refresh-matches-worker` — 03:15 (drain queued refresh jobs)
  - `/api/cron/sla-enforcement` — 08:00 (expire stale matches and flag overdue interview decisions)
  - `/api/cron/python-internal-worker` — every minute via cron-job.org on Hobby (`npm run cron:sync`)
  - `/api/cron/cv-import-temp-cleanup` — 04:20 daily via cron-job.org (removes expired private CV upload objects)
- Env requirements:
  - `CRON_SECRET` (for inbound cron calls)
  - `CRON_API_KEY` (optional, for syncing cron-job.org jobs from the repo)
  - `PYTHON_INTERNAL_SERVICE_SECRET` (preferred secret for internal TypeScript-to-Python calls; falls back to `INTERNAL_API_SECRET` or `CRON_SECRET`)
  - `PYTHON_CV_IMPORT_BASE_URL` (optional base URL when document intelligence moves out of the monolith into a separate Python service)
  - `SUPABASE_SERVICE_ROLE_KEY` (required for queue worker + matching internals)
  - `MATCHING_REFRESH_QUEUE_ENABLED` (default `true`)
  - `MATCHING_REFRESH_WORKER_BATCH_SIZE` (default `100`)
  - `MATCHING_REFRESH_WORKER_CONCURRENCY` (default `4`)
  - `MATCHING_REFRESH_MAX_ATTEMPTS` (default `3`)
  - `PYTHON_INTERNAL_JOBS_ENABLED` (default `true`)
  - `PYTHON_INTERNAL_WORKER_BATCH_SIZE` (default `10`)
  - `PYTHON_INTERNAL_WORKER_CONCURRENCY` (default `2`)
  - `PYTHON_INTERNAL_WORKER_LEASE_SECONDS` (default `180`)
  - `PYTHON_INTERNAL_MAX_ATTEMPTS` (default `3`)
  - `MATCHING_TWO_STAGE_ENABLED` (default `true`)
  - `MATCHING_NEAR_SCAN_LIMIT` (default `300`)
  - `CV_IMPORT_ENGINE_MODE` (default `auto`)
  - `CV_IMPORT_TEMP_TTL_HOURS` (default `24`, controls private temp CV upload retention)
  - `PERF_API_P95_BUDGET_MS` (default `1500`)
- Observability/optional routes (if scheduled via cron-job.org):
  - `/api/cron/fairness-note` — daily at 02:00 Europe/Stockholm
  - `/api/cron/fairness-report` — tracked in cron-job.org but intentionally kept disabled
  - `/api/cron/performance-check` — daily at 06:00 Europe/Stockholm
  - `/api/cron/health-check` — every 3 hours (no auth required by the route)
- Unscheduled compatibility/manual routes:
  - `/api/cron/account-deletion-workflow` — legacy no-op compatibility route
  - `/api/cron/send-deletion-reminders` — legacy no-op compatibility route
  - `/api/cron/process-deletions` — legacy no-op compatibility route
  - `/api/cron/generate-fairness-note` — manual fairness-note trigger with alert fan-out
  - `/api/cron/weekly-digest` — manual fallback; scheduled digest runs through `decision-reminders`
- Tracking & troubleshooting:
  - cron-job.org History for status/body; enable notifications on non-200.
  - Vercel function logs for detailed errors.
  - DB tables: `fairnessNotes`, `fairnessReports` for outputs; other crons rely on logs/status JSON.
  - Success = 200 JSON; 401 = bad/missing bearer; 500 = code/data/env issue (check logs).
- CV import PDF analyze now uses an async extract-first flow:
  1. `POST /api/expertise/cv-import/wizard-extract` uploads PDFs into private temp storage and enqueues `document_intelligence_extract_only`
  2. `GET /api/expertise/cv-import/wizard-extract/status?job_id=...` polls until extraction completes or fails
  3. the client submits extracted text to the existing JSON `POST /api/expertise/cv-import/wizard-suggest`
  4. browser-side PDF extraction remains the automatic fallback if the async extract job cannot be accepted or completed
- Manual test (example):
  ```bash
  curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/refresh-matches
  curl -i -H "Authorization: Bearer $CRON_SECRET" https://proofound.io/api/cron/refresh-matches-worker
  ```
- Sync the managed cron-job.org job set from this repo:
  ```bash
  npm run cron:sync
  ```
- `npm run cron:sync` keeps the intended external jobs enabled/disabled and disables overlapping or retired external jobs such as `account-deletion-workflow`, `send-deletion-reminders`, `process-deletions`, `refresh-matches`, and `sla-enforcement`.
- If managing cron-job.org manually: use Method `GET`, the same URL, and the header `Authorization: Bearer $CRON_SECRET` for protected routes. Use its notifications/logs for external monitoring.

## Database Schema

### Core Tables

- `profiles` - User profiles (extends Supabase auth.users)
- `individual_profiles` - Individual-specific data
- `organizations` - Organization entities
- `organization_members` - Membership with roles (owner/admin/member/viewer)
- `org_invitations` - Pending invitations
- `audit_logs` - Audit trail for important actions
- `feature_flags` - Feature toggle system
- `rate_limits` - Rate limiting tracking

### RLS (Row-Level Security)

All tables have RLS enabled with policies:

- Users can read their own data and public data
- Organization data is scoped to members
- Admins/owners can manage org settings and members
- Audit logs are readable by relevant users/org members

## Authentication Flow

1. **Sign Up** → Email verification → Onboarding
2. **Login** → Check persona → Redirect to appropriate shell
3. **Onboarding**:
   - Choose: Individual or Organization
   - **Individual**: Set handle, name, locale → `/app/i/home`
   - **Organization**: Create org → Invite team → `/app/o/[slug]/home`

## App Shells

### Individual Shell (`/app/i/*`)

- Home: Dashboard with quick actions
- Profile: Edit headline, bio, skills, location, visibility
- Settings: Account, notifications, security, language

### Organization Shell (`/app/o/[slug]/*`)

- Home: Org overview, member count, activity
- Profile: Edit mission, logo, website
- Members: Invite, manage roles, remove members
- Settings: Org branding, audit log viewer

## Testing

### Unit Tests

```bash
npm run test
```

Tests for:

- Auth helpers
- RBAC functions
- Zod schemas
- Utility functions

### E2E Tests

```bash
npm run test:e2e
```

Test scenarios:

- Individual signup → onboarding → profile
- Organization creation → invite → accept
- RLS enforcement (cross-org access denied)
- Accessibility (axe-core checks)

### A11y Testing

E2E tests include `@axe-core/playwright` for WCAG AA compliance checks on key pages.

### Specialized Tests & Checks

- `npm run test:privacy` (and `:extended`, `:coverage`, `:watch`) — Supabase RLS/Privacy suites.
- `npm run test:a11y` — Playwright accessibility-only suite.
- `npm run perf:budgets` — Lighthouse-based performance budget check.
- `npm run go:no-go` — Composite gate (perf + a11y + readiness signals).

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

**Environment Variable Groups:**

- **Supabase**: URL, anon key, service role key, DATABASE_URL
- **Resend**: API key, FROM email
- **App**: NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_APP_ENV=production

**Build Settings:**

- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Post-Deployment:**

- Apply database migrations explicitly via `npm run db:migrate` (do not use `db:push` for production)
- Verify email sending works
- Test auth flows end-to-end

### Database Migrations on Deploy

Proofound does not run database migrations automatically in the Vercel build.

Apply schema changes out of band using canonical SQL migrations (`src/db/migrations/*.sql`) and:

```bash
PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:migrate
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR:

1. Install dependencies
2. Lint
3. Type check
4. Run unit tests
5. Build

Protect your `master` branch:

- Require PR reviews
- Require CI to pass
- No direct pushes

## Security

- **RLS**: All tables have row-level security
- **Rate Limiting**: Auth routes are rate-limited
- **Env Vars**: Never commit secrets; use `.env.local`
- **Service Role**: Only used server-side, never exposed to client
- **HTTPS**: Enforced in production (Vercel default)

## Internationalization

Launch runtime locale: English (en)

- Locale-ready message files remain in `src/i18n/messages/{locale}.json`
- Swedish assets may remain in source, but Swedish runtime parity is deferred from launch
- Server-side rendering uses next-intl with UTC persistence and user-local display formatting

## Accessibility

- WCAG 2.1 AA compliance target
- Focus-visible rings on all interactive elements
- Color contrast tested against brand tokens
- Keyboard navigation support
- Screen reader tested
- Automated axe-core checks in E2E tests

## Brand & Design

Design tokens from Figma Style Guidelines:

- **Colors**: `src/design/brand-tokens.json`
- **Motion**: `src/design/motion-tokens.json`
- Tailwind config extends from tokens
- Dark mode support (media + class strategy)
- Reduced motion respected (`prefers-reduced-motion`)

## What's Next

### Phase 2 Features

- Public organization pages (`/org/[slug]`)
- Verifications module (proofs, endorsements)
- Connections & network graph
- Activity feeds and notifications
- Search & discovery
- 2FA implementation
- Export data (GDPR compliance)

### Design Enhancements

- Animated illustrations with expressive motion
- Micro-interactions (success animations, hover effects)
- Advanced data visualization (org analytics charts)

### Platform Features

- API for third-party integrations
- Admin dashboard with analytics
- Advanced RBAC (custom roles, permissions)
- Webhooks for org events
- SSO (SAML, OAuth providers)

## PRD Flow Seed (Supabase)

Use this seed to preload the PRD personas, orgs, assignments, matches, and Zen Hub data for end-to-end testing.

1. Ensure `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (service role is required to bypass RLS during seed).
2. Run the seed: `npm run seed:prd-supabase`
3. Demo logins created:
   - Individuals: `nenah@proofound-demo.com`, `mateo@proofound-demo.com`, `ola@proofound-demo.com`, `dmitry@proofound-demo.com`, `priya@proofound-demo.com`
   - Org admins: `ops@greengrid-demo.com`, `talent@bridges-demo.org`, `sourcing@cityworks-demo.gov`
   - Password (all): `DemoPass123!`

What this populates:

- Minimal taxonomy slice (L1-L4) for skills used in matches
- Individual profiles with mission/vision/values/causes, matching profiles, skills + proofs, visibility settings
- Zen Hub opt-ins and check-ins
- Organizations (GreenGrid, Bridges for Youth, CityWorks) with field visibility and admin members
- Assignments with verification gates, outcomes, expertise matrix
- Matches, conversations/messages, interviews, and analytics events

## Troubleshooting

### "Database connection error"

- Check `DATABASE_URL` in `.env.local`
- Verify Supabase project is active
- Check if IP is whitelisted (if using IP restrictions)

### "Email not sending"

- Verify Resend API key
- Check domain verification status
- Review DNS records (SPF, DKIM, DMARC)
- Check Resend dashboard logs

### "RLS policy error"

- Ensure policies.sql was run in Supabase
- Check if user is authenticated
- Verify org membership in `organization_members` table

### "Onboarding redirect loop"

- Check `profiles.persona` value
- Verify middleware logic
- Clear cookies and try again

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Getting Support

### For Platform Users

- **Email:** hello@proofound.io (Response within 24 hours, Monday-Friday)
- **In-App Chat:** Available Monday-Friday, 9 AM - 6 PM UTC
- **Help Center:** [proofound.io/help](https://proofound.io/help) (coming soon)
- **User Support Guide:** See [`SUPPORT.md`](SUPPORT.md) for FAQs and troubleshooting

### For Development Issues

- **Open a GitHub Issue:** Report bugs or request features
- **Review Documentation:**
  - [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md) - Deployment checklist
  - [`LAUNCH_RUNBOOK.md`](LAUNCH_RUNBOOK.md) - Operational procedures
  - [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) - API contracts and endpoint families
  - [`EMAIL_SUPPORT_SETUP.md`](EMAIL_SUPPORT_SETUP.md) - Email support configuration
- **Third-Party Docs:** Supabase, Resend, Vercel documentation

### Team Contacts

- **Pavlo Samoshko** (CEO, Product) - pavlo.samoshko@proofound.io
- **Yurii Bakurov** (Technical Lead) - yurii.bakurov@proofound.io

---

Built with ❤️ for authentic human connections.

### Lint in restricted CI

`npm run lint` auto-skips when Next.js/deps cannot be installed (restricted CI).
To force lint, set `FORCE_LINT=true` or run locally after `npm ci`.

### Environment setup (quick)

1. Copy `.env.example` to `.env.local` and fill the values.
2. In Supabase → Authentication → URL Configuration:
   - Set **Site URL** to the same domain as `NEXT_PUBLIC_SITE_URL` (or `SITE_URL` if you use the private fallback).
   - Add redirect URLs: `/auth/callback`, `/reset-password/confirm`, `/verify-email`.
3. Ensure `DATABASE_URL` points to your Postgres (Supabase) connection string (use the `?sslmode=require` variant if provided).
4. (Optional) Set `SUPABASE_SERVICE_ROLE_KEY` for scripts/cron jobs.
5. Run `npm run build` (a readiness check will warn if anything is missing).

If you see `ENV_MISCONFIG` in the UI or logs, check the variables above.

### Auth Template Sync (Supabase SMTP)

For Supabase Auth emails (signup, recovery, magic link, invite, email change), templates are generated
from code and can be synced to Supabase via Management API.

Required env vars:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

Commands:

- Dry run: `npm run email:auth:templates:dry-run`
- Apply update: `npm run email:auth:templates:sync`

The sync command writes a backup snapshot of the current auth config to:

- `artifacts/supabase-auth-config/`
