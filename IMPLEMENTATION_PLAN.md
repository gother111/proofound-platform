# Proofound — P0 Implementation Plan ("Turn on what you built")

**Date:** 2026-07-05 · **Source:** `PROOFOUND_IMPROVEMENT_AUDIT_2026-07-05.md` (founder-approved) · **Executor model:** Claude Code war-room orchestrator + Codex worker (see `WAR_ROOM.md`)

## Authority

This plan and the audit **supersede** `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md` and the aligned PRD stack _where they conflict_ — specifically on: portfolio publication gating, CV-import availability, assistive-AI flags, landing surface, self-serve motion, and re-engagement email. Founder approved 2026-07-05 (see addendum in `AGENTS.md`). **Non-negotiable invariants remain:** RLS, auth/authorization semantics, privacy/redaction/consent flows, blind-review defaults, secret handling, GDPR surfaces.

## Ground rules (apply to every task)

- Branch: all work on `warroom/p0-activation` (created in P0-0 from current `master` after snapshotting uncommitted changes).
- After each task, run the **standard gates**: `npm run lint && npm run typecheck`. Run `npm run test` (or the targeted suite named in the task) before commit. `npm run build` at P0-0, P0-5, P0-7 and P0-11 (slow — don't run it every task).
- One commit per task: `P0-N: <imperative summary>`.
- Never delete existing behavior — prefer flags/config defaults, additive components, and copy swaps. Smallest reversible change wins.
- If a task's acceptance criteria can't be met without violating an invariant, STOP that task, log the conflict in `WAR_ROOM_LOG.md`, move on.
- Status tracking: flip the checkbox in this file when a task's gates pass.

---

## P0 tasks (dispatch in order)

### [x] P0-0 — Governance + branch setup

**Objective:** Make the repo's agent-governance accept this effort; create the working branch.
**Steps:**

1. `git stash list && git status` — commit any pre-existing working-tree changes to `master` as `chore: pre-warroom snapshot` (do NOT discard them).
2. `git checkout -b warroom/p0-activation`.
3. Verify `AGENTS.md` contains the "2026-07-05 Course-Correction Addendum" section (created alongside this plan). If missing, add it: audit + this plan outrank the 2026-03-11 locked stack where they conflict; invariants list unchanged.
4. `npm ci` if `node_modules` absent; confirm `npm run typecheck` passes as baseline. Record baseline result in `WAR_ROOM_LOG.md`.
   **Acceptance:** branch exists; baseline typecheck result recorded; addendum present.

### [x] P0-1 — Enable the assistive-AI layer

**Objective:** Ship the already-built AI assists (proof improve, assignment clarify).
**Files:** `src/lib/featureFlags.ts` (line ~68: `ASSISTIVE_AI_UI: false`; also `PROOF_ARTIFACT_OCR_BETA` stays off), client default mirror at ~line 95, `.env.example`, `docs/ENV_VARIABLES.md`.
**Steps:**

1. Flip `FEATURE_FLAG_DEFAULTS[ASSISTIVE_AI_UI]` → `true`. Trace every consumer of this flag (server + `CLIENT_FF_DEFAULTS`) so server/client defaults agree.
2. Confirm the AI endpoints (`/api/ai/proof-pack/suggest`, `/api/ai/assignments/clarify`) degrade gracefully when the AI provider key/budget is absent: UI button visible → click → clear non-blocking error or hidden button, no crash. If they hard-crash without a key, add a capability check that hides the entry points when unconfigured.
3. Document required env (provider key, budget caps) in `.env.example` comments if not already there.
   **Acceptance:** with flag default true and no env override: proof-improve button renders in the proof editing surface; assignment-clarify button renders in the assignment builder; both no-key paths degrade gracefully. Targeted tests for featureFlags pass.
   **Verify:** `npm run lint && npm run typecheck && npm run test -- featureFlags` (adapt test filter to repo convention).

### [ ] P0-2 — Turn matching on by default

**Objective:** Matching must not silently depend on a founder-set env var.
**Files:** `src/lib/featureFlags.ts` (~line 48: `MATCHING_ENABLED = process.env.MATCHING_FEATURE_ENABLED === 'true'`), `.env.example`, `docs/ENV_VARIABLES.md`.
**Steps:**

1. Invert the default: matching enabled unless `MATCHING_FEATURE_ENABLED === 'false'` (kill-switch semantics, preserving ops control).
2. Grep all `MATCHING_ENABLED` consumers; confirm no code path assumes "off" as launch state (e.g., nav gating, cron guards `refresh-matches*`).
3. Update `.env.example` + `docs/ENV_VARIABLES.md` to document new semantics. Add `MATCHING_FEATURE_ENABLED=false` note for emergency use.
   **Acceptance:** fresh env with no var set → matching routes/cron active; explicit `false` disables. All existing matching tests pass.
   **Verify:** standard gates + `npm run test -- matching` (targeted).

### [ ] P0-3 — Publish portfolios without verification (badge, not gate)

**Objective:** A candidate can publish a shareable portfolio immediately; verification upgrades a visible trust badge instead of gating existence. **This is the highest-impact task in P0.**
**Files:** `src/lib/profile/completion-flow.ts` (~lines 124-125: `hasRequiredVerification = acceptedVerificationCount > 0`; `hasProofForPublishing = hasStructuredProofPack && hasRequiredVerification`), `src/lib/portfolio/public-contract.ts` (~line 54 `minimumContentMet` gate), `src/app/portfolio/[handle]/page.tsx`, readiness copy surfaces that reference the old rule.
**Steps:**

1. Change publishing minimum to `hasStructuredProofPack` (≥1 structured proof) — drop the verification requirement from _publishability only_. Keep `hasRequiredVerification` computed and exposed.
2. Introduce a trust-tier presentation on the public portfolio: per-proof and page-level badge — `Self-reported` (no accepted verification) vs `Verified ✓` (≥1 accepted verification). Honest, visible, styled with existing design tokens. Do not fabricate any "pending" ambiguity.
3. Keep `match-visible`/`intro-eligible` ladders UNCHANGED (they may still require verification — that's the corridor's integrity, not the portfolio's existence).
4. Sweep UI copy that promises "portfolio unlocks after verification" (home readiness checklist, onboarding hedging copy) and align with the new model.
5. Do NOT change RLS, visibility enums, or the explicit publish/consent action — publishing stays an explicit user action.
   **Acceptance:** new user with 1 structured proof and zero verifications can publish and open their public `/portfolio/[handle]` URL; page shows `Self-reported` badge; after an accepted verification the badge upgrades; `test:launch:portfolio` suite passes (update assertions that encoded the old gate — note each in the commit message).
   **Verify:** standard gates + `npm run test:launch:portfolio` + `npm run test:privacy` (must stay green — privacy semantics untouched).

### [ ] P0-4 — Wire the "Day-1 win" onboarding finale

**Objective:** Individual onboarding ends with a confirmed, copyable public link.
**Files:** `src/components/**/PublicPortfolioReadyStep.tsx` (zero call sites today), individual onboarding flow (`IndividualContextProofSetup.tsx` success path / `src/actions/onboarding.ts` redirect target).
**Steps:**

1. After the proof step succeeds, render `PublicPortfolioReadyStep` as the final step: portfolio preview, publish toggle (explicit consent action), copy-link button, share hint.
2. If the user declines publishing, exit to `/app/i/home` as today — no dark patterns.
3. Reconcile the component's copy with P0-3's badge model (it may reference old gating).
   **Acceptance:** completing individual onboarding surfaces the ready-step with working copy-link (clipboard) for a published portfolio; declining still completes onboarding. E2E individual flow passes.
   **Verify:** standard gates + `npm run test:e2e:individual:strict` (or the closest individual-onboarding e2e that runs headless locally; if e2e can't run in this environment, add/adjust a component test proving the step renders in the success path and note it).

### [ ] P0-5 — Ship the real landing page

**Objective:** Replace the 4,408-line scrollytelling homepage with the orphaned, clearer `landing/sections/*` composition.
**Files:** `src/app/page.tsx` (renders `ProofoundLanding.tsx` → `ScrollytellingSection.tsx`), orphaned components in `src/components/landing/sections/` (`HeroSection`, `ThreeStepCorridorSection`, `ComparisonSection`, `PracticalTrustSection`, `FinalCTASection`, header/footer pieces).
**Steps:**

1. Compose a new homepage from the orphaned sections, order: Hero (headline "Hire and get hired through verified proof, not CV noise" or better; dual persona CTAs **above the fold**) → 3-step how-it-works → Comparison (old way vs Proofound) → trust/privacy section → final dual CTA.
2. Persona CTAs: individual → `/signup/individual` ("Create your proof profile — free"); org → `/signup/organization` ("Start screening on proof"). Replace "Request a pilot" as the primary org CTA; keep a secondary "Talk to us" mailto/link.
3. Purge user-facing jargon on this page: no "corridor", no "attestation" (plain words: "verified proof", "confirmation").
4. Keep the scrollytelling page reachable at `/story` (unlinked) rather than deleting; note in commit.
5. Update `<title>`/meta description in `page.tsx` + `src/lib/seo/public-metadata.ts` to the new positioning; ensure the sections' any-remaining TODO copy is resolved.
6. Check `test:e2e:landing` assertions; update to new sections.
   **Acceptance:** `/` renders new composition, both CTAs above fold resolve, no "corridor"/"attestation" strings in rendered homepage copy, landing e2e/visual suite updated & passing, `npm run build` succeeds.
   **Verify:** standard gates + `npm run test:e2e:landing` + `npm run build`.

### [ ] P0-6 — Reopen the CV import path

**Objective:** CV import becomes the fast entry to a proof profile, not an invite-only beta.
**Files:** `src/lib/ai/start-from-cv.ts` (~line 484 throws `START_FROM_CV_NOT_INVITED` 403), its allow-list source, `src/app/api/ai/start-from-cv/*`, individual onboarding entry point. (The older wizard endpoints under `src/app/api/expertise/cv-import/*` are archived stubs — leave archived; `start-from-cv` is the live path.)
**Steps:**

1. Replace the allow-list throw with open access + existing budget/rate guards (verify what guards exist around it: per-user rate limit, file size/type checks, AI budget caps — they must remain).
2. Add "Import your CV" as an optional first step in individual onboarding, before the manual proof form ("or start from scratch" stays). Extracted items flow into the existing proof-draft structures.
3. Graceful degradation if Python service (`PYTHON_CV_IMPORT_BASE_URL`) or AI provider is unconfigured: entry point hidden or friendly "temporarily unavailable" — never a 500.
   **Acceptance:** non-allow-listed test user can run CV import end-to-end locally (or, if external services unavailable in env, the gate is provably removed: unit test on the access-check function + degradation path verified); onboarding shows the import option.
   **Verify:** standard gates + targeted tests on start-from-cv access logic.

### [ ] P0-7 — Make shared portfolio links look like the person, not the platform

**Objective:** Every shared portfolio link becomes an ad for the candidate (and Proofound).
**Files:** `src/lib/seo/public-metadata.ts` (line 4: `DEFAULT_OG_IMAGE = '/hero-visual.jpg'`), `src/app/portfolio/[handle]/page.tsx` (metadata + ~line 493 `mailto:hello@proofound.io`), new `src/app/portfolio/[handle]/opengraph-image.tsx`.
**Steps:**

1. Add dynamic OG image via `next/og` (`ImageResponse`): display name, headline/role line, proof count + `Verified ✓` tier when applicable, brand tokens (forest/parchment). Respect privacy: only render data already public on the portfolio.
2. OG/page title → "«Name» — Proof Portfolio | Proofound"; description from public headline. Same for org portfolios (`/portfolio/org/[slug]`) if trivial; otherwise log as follow-up.
3. Remove the visitor-facing "Search engines are off for the MVP" copy (keep `noindex` behavior itself unchanged for now).
4. Replace `mailto:hello@proofound.io` intro CTA: if viewer is signed in → existing intro/request flow if one applies; else → link to `/signup/individual`-style contact-request explainer or the owner's chosen public contact if the schema already stores one. Minimum bar: no hardcoded platform mailto pretending to be a person's contact.
   **Acceptance:** two different seeded users produce visibly different OG images (verify by hitting the OG route locally); no build-status copy on the public page; intro CTA no longer `mailto:hello@proofound.io`.
   **Verify:** standard gates + `npm run build` + manual curl of `/portfolio/<seed>/opengraph-image`.

### [ ] P0-8 — Re-engagement: digest on, verification reminders on

**Objective:** Users who don't get a match still have scheduled reasons to return; verification requests stop dying silently.
**Files:** `src/lib/notifications/weekly-digest.ts` (lines ~11, 110-113 hardcoded disabled), cron surface (`vercel.json`, `src/app/api/cron/*` — note `VERCEL_CRON_LIMIT_WORKAROUND.md`: follow the existing consolidated-dispatcher pattern rather than adding new cron entries), `src/lib/verification/canonical-requests.ts` (14-day expiry), `emails/` (reuse `SkillVerificationRequest` or add a minimal reminder template).
**Steps:**

1. Weekly digest: replace hardcoded `enabled: false` with env-guarded enable (`WEEKLY_DIGEST_ENABLED !== 'false'` default on), verify content renders sensibly for a user with zero matches (readiness nudges, proof suggestions — content presumably exists; if the digest body assumes matches, add a no-match variant with next-best-action copy).
2. Verification reminders: within the existing cron dispatcher, send reminder at day 5 and day 10 for `pending` requests (14-day expiry), max 2 reminders, idempotent (track last-reminded timestamp — add column/migration only if a suitable field doesn't exist; if migration needed, follow `src/db/migrations/` convention + RLS review).
3. Respect all consent/notification-preference flags that exist.
   **Acceptance:** digest availability function returns enabled by default; dry-run digest for a zero-match seed user produces valid email; reminder job selects correct pending requests (unit test with time travel), idempotency proven; no new top-level Vercel cron beyond the workaround pattern.
   **Verify:** standard gates + targeted digest/reminder unit tests + `npm run cron:sync` dry equivalent if applicable.

### [ ] P0-9 — Surface the org candidate-review workspace

**Objective:** The fully-built private review loop (org invites own applicants) becomes reachable — the seed of the Screening Room.
**Files:** `src/components/organization/OrgCandidatesWorkspace.tsx` (zero importers today), org shell nav (`src/lib/org/mvp-surface-policy.ts` — `ORG_MVP_NAV_ITEMS` + gated list), org routes under `src/app/app/o/[slug]/`.
**Steps:**

1. Create route `src/app/app/o/[slug]/candidates/page.tsx` mounting `OrgCandidatesWorkspace` with proper org-member auth (copy auth pattern from sibling org pages).
2. Add "Candidates" to `ORG_MVP_NAV_ITEMS` (it's currently the invisible half of an already-live backend: `/api/organizations/[orgId]/candidate-invites`).
3. Smoke the loop: send invite → email renders → claim → submission appears in workspace. Fix small integration gaps found (log bigger ones to P1).
4. Add an empty-state with the invite CTA front and center ("Invite your first applicant — they'll answer with structured proof instead of a CV").
   **Acceptance:** org member can navigate to Candidates, send an invite, and see submissions; non-members get 404/403 consistent with sibling routes; org e2e (or targeted integration tests) pass.
   **Verify:** standard gates + `npm run test:launch:org-corridor` (or closest org suite).

### [ ] P0-10 — Plain-language pass on user-facing vocabulary

**Objective:** No unexplained insider vocabulary in any user-facing surface.
**Files:** app + marketing user-facing strings (573× "corridor", 571× "attestation" across source — most are code-internal; only rendered copy matters), `UI_VOCAB_PLAIN` flag (already defaults true — extend its reach), a small shared `<TermHint>` tooltip component.
**Steps:**

1. Inventory _rendered_ copy containing: corridor, attestation, trust anchor, match-visible, intro-eligible, proof pack. (Grep in components/messages files; i18n catalogs `src/i18n` or messages JSON — sweep `en.json` + `sv.json`.)
2. Swap for plain equivalents where meaning survives (corridor→"hiring flow"/drop; attestation→"confirmation"; trust anchor→"trusted confirmation"; match-visible→"visible to matching"; intro-eligible→"ready for introductions").
3. Where the term must stay (readiness checklist labels), attach `<TermHint>` one-line explanations.
4. Keep internal identifiers/API names untouched — copy only.
   **Acceptance:** rendered app/marketing surfaces contain no unexplained target terms (spot-check the 6 highest-traffic screens: home dashboards ×2, matching ×2, onboarding ×2); i18n catalogs updated symmetrically; snapshot/e2e copy assertions updated.
   **Verify:** standard gates + `npm run test -- i18n` if exists + affected e2e copy assertions.

### [ ] P0-11 — Full verification pass + founder handoff notes

**Objective:** Prove P0 holds together; hand the founder a deploy-ready checklist.
**Steps:**

1. Full gates: `npm run lint && npm run typecheck && npm run test && npm run build`. Then `npm run test:launch:smoke`, `test:launch:portfolio`, `test:launch:org-corridor`, `test:privacy` — all green (or each failure dispositioned in writing).
2. `npm run db:drift-check` if migrations were added (P0-8).
3. Write `WARROOM_P0_HANDOFF.md`: per-task one-liner, env vars the founder must set in Vercel (AI provider key, `WEEKLY_DIGEST_ENABLED`, confirm removal/inversion of `MATCHING_FEATURE_ENABLED`, `PYTHON_CV_IMPORT_BASE_URL`), known follow-ups pushed to P1, and a 10-minute manual QA script (signup → CV import → proof → publish → share link → org invite loop).
4. Do NOT merge to `master` and do NOT deploy — founder reviews the branch.
   **Acceptance:** all suites green or dispositioned; handoff doc exists; branch pushed to origin.

---

## P1 outline (spec after P0 review — do not start unprompted)

1. **Screening Room productization:** org dashboard centered on invite→submissions→blind AI comparison summary (needs `/api/ai` comparison endpoint — new build); assignment "basic mode" 5-minute path as default (`ASSIGNMENT_BASIC_MODE` exists); AI clarify on by default in builder.
2. **Monetization:** pricing page, Stripe self-serve (free tier: 1 active assignment/10 invites; paid ~€79/mo unlimited), replace remaining pilot-CTA surfaces.
3. **Analytics live:** un-archive client ingestion routes (`/api/analytics/*` stubs), wire existing ~100 event constants, minimal activation dashboard vs coded targets (TTV≤7d etc.).
4. **Verifier growth loop:** post-attestation "create your own proof profile" conversion screen + attribution.
5. **IA consolidation:** merge communications/messages duplication; nav or delete orphan routes (`/app/i/interviews`, `/verifications`, `/portfolio`, `/expertise`); single tour implementation (delete two).
6. **Matching v2 groundwork:** wire `embedding-service.ts` into match path as `semantic_fit` (15-20% weight from `purpose_fit`'s dead 0), consult `skill_adjacency` for partial credit, org-side near-matches fallback (port candidate-side softener).
7. **Debt:** zod on all mutation routes (92 uncovered), rate limiting on auth/invite/token endpoints, close ~20-table RLS gap, single migration system decision, drop `gsap`/`lenis`.

## Done-when

P0 done-when: a stranger can sign up, import a CV, publish a self-reported proof portfolio, and share a personalized link in <15 minutes with zero founder involvement; an org can sign up, invite an applicant, and review a structured submission the same day. Both measured by the P0-11 QA script.
