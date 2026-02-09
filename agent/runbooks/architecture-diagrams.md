# Architecture Diagrams Runbook

This runbook describes how to maintain and regenerate the system design diagrams and infographics.

## Sources of Truth

- Mermaid diagrams (authoritative):
  - `docs/architecture/overview.md` (system context + containers)
  - `docs/architecture/data-model.md` (core ERD)
  - `docs/architecture/key-flows.md` (sequence diagrams)

- PNG infographics (supplementary, for quick scanning):
  - `docs/architecture/assets/system-overview.png`
  - `docs/architecture/assets/key-flows.png`
  - `docs/architecture/assets/data-model.png`
  - `docs/architecture/assets/architecture-diagram.png`
  - `docs/architecture/assets/stack.png`

Policy:

- Prefer updating Mermaid diagrams first.
- Regenerate PNGs only when the Mermaid source or system shape changes.
- Never commit secrets and never paste `.env.local` values into any markdown.

## Regenerating PNG Infographics (Nano Banana Pro)

Prereqs:

- `uv` installed (the repo already uses Node for the app, but image generation uses `uv`).
- `GEMINI_API_KEY` available via environment.
  - This repo commonly stores it in `.env.local` (gitignored). Use `source .env.local` without printing values.
- Skill install path:
  - Commands below assume the skill lives at `~/.agents/skills/nano-banana-pro/`.
  - If your environment uses `~/.claude/skills/nano-banana-pro/`, adjust the path.

### 1) System Overview Infographic (2K)

Prompt:
Create a clean, professional vector infographic titled "Proofound System Overview". Use a parchment background, forest green primary, terracotta accents. Show labeled boxes and arrows for: User Browser, Vercel Edge, Next.js App Router (Server Components + API Routes), Next Middleware (CSP, CSRF, Rate Limiting), Drizzle (direct Postgres queries), Supabase Auth, Supabase Postgres, Supabase Storage, Resend (emails), Sentry (errors), Vercel KV (rate limit), Vercel Cron (calls /api/cron/\*), OAuth Providers (Zoom, Google, LinkedIn), Veriff Webhook. Make it readable, minimal, and structured like a system architecture diagram.

Command:

```bash
set -a
source .env.local
set +a
uv run ~/.agents/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Create a clean, professional vector infographic titled 'Proofound System Overview'. Use a parchment background, forest green primary, terracotta accents. Show labeled boxes and arrows for: User Browser, Vercel Edge, Next.js App Router (Server Components + API Routes), Next Middleware (CSP, CSRF, Rate Limiting), Drizzle (direct Postgres queries), Supabase Auth, Supabase Postgres, Supabase Storage, Resend (emails), Sentry (errors), Vercel KV (rate limit), Vercel Cron (calls /api/cron/*), OAuth Providers (Zoom, Google, LinkedIn), Veriff Webhook. Make it readable, minimal, and structured like a system architecture diagram." \
  --filename "docs/architecture/assets/system-overview.png" \
  --resolution 2K
```

### 2) Key Flows Infographic (2K)

Prompt:
Create a clean vector infographic titled "Proofound Key Flows". Parchment background, forest green primary, terracotta accents. Depict 8 numbered mini flow diagrams with icons and arrows: 1) Login and session, 2) Request security (CSP/CSRF), 3) Persona routing (Individual vs Org), 4) Create assignment, 5) Run matching, 6) Messaging and identity reveal, 7) OAuth connect and callback, 8) Cron account deletion workflow. Keep text short and legible.

Command:

```bash
set -a
source .env.local
set +a
uv run ~/.agents/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Create a clean vector infographic titled 'Proofound Key Flows'. Parchment background, forest green primary, terracotta accents. Depict 8 numbered mini flow diagrams with icons and arrows: 1) Login and session, 2) Request security (CSP/CSRF), 3) Persona routing (Individual vs Org), 4) Create assignment, 5) Run matching, 6) Messaging and identity reveal, 7) OAuth connect and callback, 8) Cron account deletion workflow. Keep text short and legible." \
  --filename "docs/architecture/assets/key-flows.png" \
  --resolution 2K
```

### 3) Data Model Infographic (2K)

Prompt:
Create a clean, professional vector infographic titled "Proofound Core Data Model". Use a parchment background, forest green primary, terracotta accents. Show a simplified ERD style diagram with boxes and relationship lines for: profiles, individual_profiles, organizations, organization_members, assignments, matching_profiles, matches, match_interest, conversations, messages, notifications, notification_preferences, profile_field_visibility, organization_field_visibility. Add a small legend for privacy boundaries: RLS/DB policies vs application authorization checks, and note that individual_profiles has JSONB field_visibility and redact_mode. Keep labels short and readable.

Command:

```bash
set -a
source .env.local
set +a
uv run ~/.agents/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Create a clean, professional vector infographic titled 'Proofound Core Data Model'. Use a parchment background, forest green primary, terracotta accents. Show a simplified ERD style diagram with boxes and relationship lines for: profiles, individual_profiles, organizations, organization_members, assignments, matching_profiles, matches, match_interest, conversations, messages, notifications, notification_preferences, profile_field_visibility, organization_field_visibility. Add a small legend for privacy boundaries: RLS/DB policies vs application authorization checks, and note that individual_profiles has JSONB field_visibility and redact_mode. Keep labels short and readable." \
  --filename "docs/architecture/assets/data-model.png" \
  --resolution 2K
```

### 4) Architecture Diagram (2K)

Prompt:
Create a clean, professional vector infographic titled "Proofound Architecture (Containers)". Use a parchment background, forest green primary, terracotta accents. Draw a containers-level architecture diagram with labeled boxes and arrows for: Browser (React UI), Vercel Edge, Next Middleware (CSP/CSRF/rate limit/request ID), Next.js App Router (Server Components + API routes), Drizzle (direct Postgres), Supabase SSR client (anon key), Supabase browser client (anon key), Supabase admin client (service role), Supabase Auth, Supabase Postgres, Supabase Storage, Resend, Sentry, Vercel KV (optional), Vercel Cron (calls /api/cron/\*), OAuth providers (Zoom/Google/LinkedIn). Make it readable, minimal, and structured like a system architecture diagram.

Command:

```bash
set -a
source .env.local
set +a
uv run ~/.agents/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Create a clean, professional vector infographic titled 'Proofound Architecture (Containers)'. Use a parchment background, forest green primary, terracotta accents. Draw a containers-level architecture diagram with labeled boxes and arrows for: Browser (React UI), Vercel Edge, Next Middleware (CSP/CSRF/rate limit/request ID), Next.js App Router (Server Components + API routes), Drizzle (direct Postgres), Supabase SSR client (anon key), Supabase browser client (anon key), Supabase admin client (service role), Supabase Auth, Supabase Postgres, Supabase Storage, Resend, Sentry, Vercel KV (optional), Vercel Cron (calls /api/cron/*), OAuth providers (Zoom/Google/LinkedIn). Make it readable, minimal, and structured like a system architecture diagram." \
  --filename "docs/architecture/assets/architecture-diagram.png" \
  --resolution 2K
```

### 5) Stack Infographic (2K)

Prompt:
Create a clean, professional vector infographic titled "Proofound Stack (Frontend, Backend, Data)". Use a parchment background, forest green primary, terracotta accents. Show 4 horizontal layers with clear labels and icons: 1) Frontend: Browser (React UI), Next.js Client Components, Supabase browser client (anon key). 2) Edge: Vercel Edge, Next Middleware (CSP, CSRF, Rate limiting, request ID). 3) Backend: Next.js App Router (Server Components, Server Actions, API routes), Drizzle (direct Postgres), Supabase SSR client (anon key), Supabase admin client (service role), background cron route handlers. 4) Data and External: Supabase Auth, Supabase Postgres, Supabase Storage, Vercel KV (rate limit), Resend (emails), Sentry (errors), OAuth providers (Zoom, Google, LinkedIn), Veriff webhook. Draw arrows for primary request and data paths, and add a small legend: "RLS applies on Supabase client calls; direct Postgres via Drizzle requires app-level authorization checks." Keep it readable and minimal.

Command:

```bash
set -a
source .env.local
set +a
uv run ~/.agents/skills/nano-banana-pro/scripts/generate_image.py \
  --prompt "Create a clean, professional vector infographic titled 'Proofound Stack (Frontend, Backend, Data)'. Use a parchment background, forest green primary, terracotta accents. Show 4 horizontal layers with clear labels and icons: 1) Frontend: Browser (React UI), Next.js Client Components, Supabase browser client (anon key). 2) Edge: Vercel Edge, Next Middleware (CSP, CSRF, Rate limiting, request ID). 3) Backend: Next.js App Router (Server Components, Server Actions, API routes), Drizzle (direct Postgres), Supabase SSR client (anon key), Supabase admin client (service role), background cron route handlers. 4) Data and External: Supabase Auth, Supabase Postgres, Supabase Storage, Vercel KV (rate limit), Resend (emails), Sentry (errors), OAuth providers (Zoom, Google, LinkedIn), Veriff webhook. Draw arrows for primary request and data paths, and add a small legend: 'RLS applies on Supabase client calls; direct Postgres via Drizzle requires app-level authorization checks.' Keep it readable and minimal." \
  --filename "docs/architecture/assets/stack.png" \
  --resolution 2K
```

## Verifying Diagram Consistency

- Ensure Mermaid blocks render in GitHub by checking syntax:
  - `flowchart` diagrams use quoted labels when they contain punctuation.
  - `sequenceDiagram` uses `participant` aliases for readability.
  - `erDiagram` entity names are uppercase and avoid hyphens.

- Ensure docs embed the images using relative paths:
  - `./assets/system-overview.png`
  - `./assets/key-flows.png`
  - `./assets/data-model.png`
  - `./assets/architecture-diagram.png`
  - `./assets/stack.png`
