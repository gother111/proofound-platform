# WAR ROOM LOG — P0 activation sprint

Baseline (2026-07-05): branch `warroom/p0-activation` from master d265c79b (pre-warroom snapshot). `npm run typecheck` PASS clean.

## Task log

P0-0 | PASS | (this commit) | branch created; addendum verified in AGENTS.md; baseline typecheck clean

## Backlog

P0-1 | PASS | 7ef9fce1 | flag default true, client mirror derives, no-key fallback tested (16+16 tests)
P0-2 | PASS | pending-sha | matching default-on kill-switch, 503 guards on routes+cron, 145 matching tests green
P0-3 | PASS | pending-sha | publish gate = structured proof only; badges live; portfolio 65/65, full suite 1904/1904, build OK

- test:privacy blocked in this env (missing NEXT_PUBLIC_SUPABASE_URL/ANON_KEY/SERVICE_ROLE in .env.test) — fails identically at baseline; needs creds for P0-11 disposition
  P0-4 | PASS | pending-sha | ready-step wired as onboarding finale, copy-link + decline path tested; e2e env-blocked, component-test fallback per spec
  P0-5 | PASS | pending-sha | new sections homepage live, /story preserved (added to middleware allowlist — Codex missed), landing e2e 10/10 locally, build OK
  P0-6 | PASS | pending-sha | invite gate removed, size/page/daily-limit guards intact, import step in onboarding, 51 targeted + 1909 full tests green
  P0-7 | PASS | pending-sha | dynamic OG image route live (clean 404 no-500 verified via local curl; no published seed user locally for visual diff — founder QA item), mailto CTA + build-status copy removed, 1911 tests + build green
- P0-7 residual: visually confirm two users OG images differ once seeded users exist (unit-tested only); org OG image follow-up logged by Codex
  P0-8 | PASS | pending-sha | digest default-on env-guarded, day-5+10 reminders via decision-reminders dispatcher, idempotent via last_follow_up_at+metadata, no migration, blind-safe reminder template, 1917 tests green
  P0-9 | PASS | pending-sha | candidates route + nav live, surface-policy allowlisted, org-corridor 40/40, live smoke: 307->login matches siblings
  P0-10 | PASS | pending-sha | 161-file copy sweep, TermHint component added, i18n catalogs clean of target terms, 222 focused tests green
- Pre-existing (verified via stash): e2e/matching-messages-empty-visual.spec.ts 2 failures ("No matches yet"/"No conversations yet" not rendered in mock mode) + profile-trust-profile-visual 1 failure — disposition at P0-11
