# WAR ROOM P0 — Founder Handoff

**Branch:** `warroom/p0-activation` (pushed to origin — review, do not merge blind)
**Date:** 2026-07-06 · **Status:** 12/12 tasks passed (P0-0 → P0-11)
**Final gates:** lint ✅ · typecheck ✅ · vitest 1922/1922 ✅ · build ✅ · launch:smoke 6/6 ✅ · launch:portfolio 66/66 ✅ · launch:org-corridor 40/40 ✅ · privacy ⚠️ env-blocked (see Dispositions)

## Per-task summary

| Task  | What changed                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0-0  | Branch + governance addendum verified; baseline typecheck clean                                                                                                                   |
| P0-1  | Assistive-AI UI flag default-on; graceful no-key fallback (deterministic manual guidance)                                                                                         |
| P0-2  | Matching default-on; `MATCHING_FEATURE_ENABLED=false` is now an emergency kill switch; 503 guards on matching routes/cron                                                         |
| P0-3  | **Portfolios publish on ≥1 structured proof alone**; verification is now a `Verified ✓` / `Self-reported` trust badge, not a gate; match-visible/intro-eligible ladders unchanged |
| P0-4  | Individual onboarding ends with PublicPortfolioReadyStep: publish toggle (explicit consent), copy-link, decline exits to home                                                     |
| P0-5  | New sections-based homepage (dual CTAs above fold, no jargon); scrollytelling preserved unlinked at `/story`                                                                      |
| P0-6  | CV-import allow-list removed (size/page/daily-limit guards intact); "Import your CV" entry in onboarding; still env-gated overall (see env vars)                                  |
| P0-7  | Dynamic per-user OG images (`/portfolio/[handle]/opengraph-image`), personalized share titles, platform mailto CTA removed                                                        |
| P0-8  | Weekly digest default-on (env-guarded) with zero-match content; verification reminders day 5 + 10 via existing cron dispatcher, idempotent, no migration                          |
| P0-9  | Org "Candidates" nav + `/app/o/[slug]/candidates` route mounting the invite→review workspace; auth matches sibling routes                                                         |
| P0-10 | Plain-language sweep (161 files): corridor/attestation/trust-anchor etc. replaced or explained via new `<TermHint>`; en+sv symmetric                                              |
| P0-11 | This doc + full gate pass                                                                                                                                                         |

## Env vars to set in Vercel

| Var                                                                                                                                                                         | Action                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `AI_ASSISTANTS_ENABLED=true` + server-only Gemini key + budget caps                                                                                                         | Required to make P0-1 assists call the model; without it, UI shows deterministic manual fallback (safe)             |
| `MATCHING_FEATURE_ENABLED`                                                                                                                                                  | **Remove it** (default is now ON). Set `false` only as emergency kill switch                                        |
| `WEEKLY_DIGEST_ENABLED`                                                                                                                                                     | Nothing to set (default ON). Set `false` to disable                                                                 |
| `START_FROM_CV_BETA_ENABLED=true` + `START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_ENABLED=true` + `PYTHON_CV_IMPORT_BASE_URL` + provider key per `START_FROM_CV_AI_PROVIDER` | Required to activate CV import end-to-end; allow-list vars (`START_FROM_CV_ALLOWED_USER_IDS/ORG_IDS`) are now inert |

## Dispositions / known items

1. **`npm run test:privacy`** cannot run in the dev environment — `.env.test` lacks Supabase credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Verified it fails identically on the pre-P0 baseline (config-level, zero tests execute), and no privacy/RLS code was modified (launch:smoke privacy_no_leak_case passes). **Run it in CI/with creds before merge.**
2. **Visual e2e (pre-existing, not P0 regressions — verified by stashing):** `matching-messages-empty-visual.spec.ts` (2 failures: "No matches yet"/"No conversations yet" don't render in mock-supabase mode) and `profile-trust-profile-visual.spec.ts` (1 failure). Landing e2e is green 10/10.
3. **OG images**: per-user distinctness is unit-tested; visually confirm two real users' images post-deploy (no seeded users existed locally). Org portfolio OG image is a P1 follow-up.
4. Individual-onboarding strict e2e is sandbox/port-limited locally; the flow is covered by component tests + launch smoke.

## 10-minute manual QA script

1. Open `/` — both persona CTAs visible above the fold; no "corridor"/"attestation" anywhere.
2. Sign up as individual → onboarding: see "Import your CV" option (if env configured) or clean manual path.
3. Create 1 structured proof → finale shows portfolio-ready step → toggle publish → copy link.
4. Open the copied `/portfolio/<handle>` link logged-out: page shows `Self-reported` badge; share the URL in Slack/LinkedIn preview — OG image shows the person's name, not the platform hero.
5. Check the page has no "search engines are off" copy and the contact CTA is not `mailto:hello@proofound.io`.
6. Accept a verification for one proof (second account) → badge upgrades to `Verified ✓`.
7. Sign up as org → nav shows **Candidates** → invite an applicant → applicant claims via email link → submission appears in the workspace.
8. In proof editor: "Improve this proof" button visible; without AI key it returns manual guidance, no crash. Same for "Clarify assignment" in the builder.
9. Confirm `/story` still renders (unlinked).
10. Matching pages load with no env vars set (default-on).

**Do not merge to master / do not deploy from this doc alone — review the branch diff first.**
