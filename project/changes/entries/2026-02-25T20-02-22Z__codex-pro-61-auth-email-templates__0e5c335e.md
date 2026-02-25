# Project Change Entry

- Date/time (UTC): 2026-02-25T20:02:22Z
- Branch: codex-pro-61-auth-email-templates
- Base commit: 0e5c335e

What changed:

- Added centralized auth email template system in `src/lib/email/auth-templates/` for confirmation, recovery, magic link, invite, email change, and reauthentication emails.
- Refactored auth fallback sending in `src/actions/auth.ts` to use shared branded templates instead of inline hardcoded HTML/text.
- Added Supabase template sync script `scripts/sync-supabase-auth-templates.ts` with dry-run default, `--apply` mode, config backup snapshot path, and capability detection by current auth config keys.
- Added npm scripts: `email:auth:templates:dry-run` and `email:auth:templates:sync`.
- Added env docs for `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` in `.env.example` and README auth-template sync section.
- Added regression tests in `tests/lib/auth-email-templates.test.ts` and `tests/scripts/sync-supabase-auth-templates.test.ts`; extended fallback assertions in `tests/actions/auth.test.ts`.

Why:

- Ensure auth emails sent by Supabase Auth over Resend SMTP have branded templates managed from code.
- Keep fallback email resilience path aligned with primary template copy and styling.
- Provide repeatable, versioned template deployment path to Supabase Auth.

How to verify:

- `npm run lint` passes.
- `npm run typecheck` passes.
- `npm run test -- tests/actions/auth.test.ts tests/lib/auth-email-templates.test.ts tests/scripts/sync-supabase-auth-templates.test.ts` passes.
- `npm run test` passes.
- `npm run build` passes.
- `npm run email:auth:templates:dry-run` reaches Supabase Management API call path and reports missing/invalid token errors clearly when credentials are invalid.

Open risks / TODO:

- Supabase Management API token in current environment is invalid for template sync (`401 Unauthorized: JWT could not be decoded`), so live template push is currently blocked until a valid `SUPABASE_ACCESS_TOKEN` is provided.
- Manual live validation of signup/recovery sends in Supabase Auth logs and Resend logs is blocked pending successful template sync.
