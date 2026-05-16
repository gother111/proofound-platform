# AI Features Verification - 2026-05-16

Final verdict: **NOT PERFECT**

Reason: all repo-local AI, mock-provider, privacy, lint/typecheck, exact production-build, Playwright-rendered, and Codex in-app Browser UI checks that were feasible in this environment passed after fixes, and no relevant AI bug remains known from those checks. The system is not claimable as PERFECT because live Gemini provider smoke was **UNVERIFIED** due missing server-only provider credentials and spend-cap env.

## Source Of Truth Read

- `AGENTS.md`
- `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
- `docs/ai/*`
- `docs/API_REFERENCE.md`
- `agent/checklists/verification.md`
- `package.json`

## External Model Verification

- Official Gemini API docs checked on 2026-05-16: <https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite>
- The docs list model code `gemini-3.1-flash-lite`, stable version `gemini-3.1-flash-lite`, structured outputs support, and latest update May 2026.
- This supports replacing the stale `gemini-3.1-flash-lite-preview` identifier in Proofound docs/default smoke expectations.

## AI Feature Inventory

| Feature / flow                                       | Routes / files                                                                                                                                         | Tests / evidence                                                                                                                                                                              | Expected MVP behavior                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider config and Gemini client                    | `src/lib/ai/provider/config.ts`, `src/lib/ai/provider/gemini-client.ts`                                                                                | `tests/lib/ai-provider-gemini-client.test.ts`, `tests/lib/gemini-config.test.ts`, `tests/lib/gemini-pricing.test.ts`                                                                          | Stable model defaults to `gemini-3.1-flash-lite`; server-only keys; disabled-by-default fail-safe; fallback only when explicitly verified.                                  |
| Provider smoke / launch readiness                    | `src/lib/ai/provider-smoke-artifact.ts`, `src/lib/ai/usage-ledger.ts`, `scripts/ai-provider-smoke.ts`, `src/app/api/monitoring/launch-status/route.ts` | `tests/lib/ai-provider-smoke-artifact.test.ts`, `src/app/api/monitoring/__tests__/launch-status-route.test.ts`                                                                                | Launch status must only treat model-matching provider smoke as current evidence.                                                                                            |
| Usage ledger, budget, rate limits, suggestion events | `src/lib/ai/usage-ledger.ts`, `src/app/api/ai/suggestions/events/route.ts`                                                                             | `tests/lib/ai-provider-usage-controls.test.ts`, `tests/lib/ai-usage-ledger-rate-limits.test.ts`, `tests/api/ai-suggestion-events-route.test.ts`                                               | Spend/rate controls fail closed; suggestion events store metadata without raw suggestion text.                                                                              |
| Request safety / raw payload blockers                | `src/lib/ai/request-safety.ts`, route schemas                                                                                                          | `tests/lib/ai-request-safety.test.ts`, route tests                                                                                                                                            | Reject full files, raw prompts, signed URLs, hidden identity, and unsafe payload fields before assistant work.                                                              |
| Privacy preflight                                    | `src/lib/ai/privacy-preflight.ts`, `src/app/api/ai/privacy-preflight/check/route.ts`, `src/app/api/portfolio/visibility/route.ts`                      | `tests/lib/privacy-preflight.test.ts`, `tests/api/privacy-preflight-route.test.ts`, `tests/privacy/ai-redaction.test.ts`, rendered API check                                                  | Deterministic privacy flags work without model review; no full files/original filenames/signed URLs sent.                                                                   |
| Start from CV                                        | `src/lib/ai/start-from-cv.ts`, `src/app/api/ai/start-from-cv/*`, `src/components/profile/StartFromCvDialog.tsx`, onboarding/profile context surfaces   | `tests/lib/start-from-cv.test.ts`, `tests/api/start-from-cv-route.test.ts`, `tests/ui/start-from-cv-dialog.test.tsx`, `tests/routes/onboarding-page.test.ts`, rendered approved-surface check | Optional private draft scaffolding only, candidate-invite first-proof surface only, no scoring/ranking/matching/hiring lift, consent required, local/manual fallback clear. |
| Proof Pack assistant                                 | `src/lib/ai/proof-pack-assistant.ts`, `src/app/api/ai/proof-pack/suggest/route.ts`, `src/app/app/i/expertise/components/edit-skill/ProofsSection.tsx`  | `tests/lib/proof-pack-assistant.test.ts`, `tests/api/proof-pack-assistant-route.test.ts`, `tests/ui/proof-pack-assistant.test.tsx`                                                            | User-clicked draft suggestions only; user must review/apply; fallback/manual state clear.                                                                                   |
| Assignment clarity assistant                         | `src/lib/ai/assignment-clarity.ts`, `src/app/api/ai/assignments/clarify/route.ts`, `src/components/assignments/AssignmentClarityAssistant.tsx`         | `tests/api/assignment-clarity-route.test.ts`, `tests/ui/assignment-clarity-assistant.test.tsx`, rendered API check                                                                            | Clarifies assignment wording, never expands into scoring/ranking/hiring decisions; mock fallback works locally.                                                             |
| JD-to-L4 assignment skill mapping                    | `src/app/api/expertise/jd-to-l4/route.ts`, `src/lib/ai/jd-parser.ts`, `src/components/organization/JDMapper.tsx`                                       | `tests/lib/ai-launch-guardrails.test.ts`, `npm run test:launch:ai`                                                                                                                            | Active assignment helper remains local-only; raw job-description text is not sent through legacy external provider code.                                                    |
| Verification composer                                | `src/lib/ai/verification-composer.ts`, `src/app/api/ai/verifications/compose/route.ts`, `src/app/app/i/verifications/*`                                | `tests/api/verification-composer-route.test.ts`, `tests/ui/verifications-client.test.tsx`, rendered API/page check                                                                            | Drafts scoped verification request language from selected public-safe fields; no send until explicit review.                                                                |
| OCR / CV extraction support                          | `src/lib/expertise/document-extraction-provider.ts`, `src/lib/expertise/gcp-cv-ocr-*`, `services/gcp-cv-ocr/*`, proof-artifact text extraction routes  | `tests/lib/start-from-cv.test.ts`, route/build inventory                                                                                                                                      | OCR remains server-side/config-gated; browser OCR disabled for launch; unavailable GCP creds block Start from CV when GCP OCR is enabled.                                   |

## Issues Found And Fixes

1. **Stale provider-smoke evidence could satisfy launch readiness for the wrong model.**
   - Evidence: `.artifacts/ai-provider-smoke.json` was successful but recorded `gemini-3.1-flash-lite-preview`; current code/docs target `gemini-3.1-flash-lite`.
   - Fix: `resolveLastSuccessfulAiProviderSmokeAt` now accepts expected default/fallback models and refuses mismatched artifacts; launch operational summary passes the configured model expectations.
   - Regression: added model-match and fallback-match tests in `tests/lib/ai-provider-smoke-artifact.test.ts`.

2. **Provider-smoke evidence did not prove runtime prerequisites.**
   - Evidence: the first refreshed smoke artifact failed closed for the stable model, but did not encode whether `DATABASE_URL`, server-only provider keys, hard caps, or production-like runtime were present.
   - Fix: provider-smoke artifacts are now schema v2 and include value-free prerequisite booleans. Launch readiness refuses successful smoke artifacts without database/provider prerequisites, and refuses production-like readiness unless the artifact was generated in a production-like runtime with a monthly hard cap configured.
   - Regression: added prerequisite and legacy schema rejection tests in `tests/lib/ai-provider-smoke-artifact.test.ts`.

3. **Provider-smoke script loaded app modules before local env files.**
   - Evidence: an earlier `npm run ai:provider:smoke` emitted a `DATABASE_URL is missing` warning while the smoke preflight, after dotenv load, showed `DATABASE_URL` was configured.
   - Fix: `scripts/ai-provider-smoke.ts` now loads `.env.local` / `.env` before dynamically importing provider/config modules, so smoke diagnostics reflect the same local environment the smoke run uses.

4. **Environment docs still referenced the preview model / model-agnostic timestamp readiness.**
   - Fix: updated `docs/ENV_VARIABLES.md` and the AI technical requirements env snippet to use `gemini-3.1-flash-lite` and document that launch readiness requires model-matching smoke artifact evidence.

5. **AI-adjacent verification UI tests emitted React async `act(...)` warnings.**
   - Fix: `tests/ui/verifications-client.test.tsx` now waits for the assistive-AI feature-flag hook to settle in synchronous rendering tests.

6. **Codex in-app Browser verification initially was not connected.**
   - Evidence: the first Browser attempt could not acquire the requested in-app Browser backend, so the initial rendered pass used Playwright fallback evidence.
   - Follow-up: after reconnecting through the bundled Browser plugin, the in-app Browser successfully rendered the Start from CV onboarding dialog and the individual verifications page against a mock-safe local dev server.
   - Remaining scope: Browser UI rendering is now verified; browser-origin API POST checks remain covered by the earlier Playwright browser-context evidence rather than the bundled Browser read-only page scope.

7. **Local dev generated-state instability observed during repeated rendered reruns.**
   - Evidence: Next dev emitted missing `.next-dev-*` and `.next/routes-manifest.json` / page-module `ENOENT` errors during repeated local rendered reruns. The saved evidence below comes from the successful rendered pass; later reruns reproduced the dev-server generated-state issue.
   - Scope call: this is not an AI product-flow defect, but it did limit repeated Browser-style reruns in this environment.
   - Mitigation used: stopped broken servers, kept generated `.next*` state out of the checkpoint, and hardened the repo dev wrapper so each port-specific Next dev output directory gets a CommonJS package marker under the repo's `"type": "module"` package.

8. **Build validation could reference deleted port-specific dev type roots.**
   - Evidence: exact `npm run build` failed after cleanup removed `.next-dev-33100`, while `tsconfig.json` still contained several explicit `.next-dev-<port>/types/**/*.ts` includes.
   - Fix: kept the existing wildcard `.next-dev*/types/**/*.ts` include and removed stale port-specific includes from `tsconfig.json`.

9. **Active JD-to-L4 mapping could bypass the current Gemini provider guardrails.**
   - Evidence: `/api/expertise/jd-to-l4` is still an active launch API, but `src/lib/ai/jd-parser.ts` could call a legacy Anthropic/Claude path when `ANTHROPIC_API_KEY` was present, sending raw job-description text outside the current Gemini usage ledger, spend caps, model smoke, and request-safety guardrail family.
   - Fix: made JD parsing local-only, removed direct legacy Anthropic calls from the remaining `src/lib/ai` helpers, and removed the unused `@anthropic-ai/sdk` dependency.
   - Regression: `tests/lib/ai-launch-guardrails.test.ts` now fails if active AI source reintroduces legacy direct Anthropic provider calls, and proves JD-to-L4 parsing stays local even when legacy provider env is present.

## Checks Run

| Check                           | Status                   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test:launch:ai`        | PASS                     | 17 files / 136 tests after provider-smoke v2 prerequisite hardening and the JD-to-L4 local-only provider guardrail. Vitest printed local websocket `EPERM` noise but test suite passed.                                                                                                                                                                                                                                    |
| `npm run test:privacy`          | PASS                     | 2 files / 22 tests. Reran via `npm run test:launch:privacy` with network access to the configured Supabase test project.                                                                                                                                                                                                                                                                                                   |
| `npm run test:privacy:extended` | PASS                     | 2 files / 31 tests. Reran via `npm run test:launch:privacy` with network access to the configured Supabase test project.                                                                                                                                                                                                                                                                                                   |
| `npm run lint`                  | PASS                     | Reran after report/test/doc changes.                                                                                                                                                                                                                                                                                                                                                                                       |
| `npm run typecheck`             | PASS                     | Reran after removing brittle dev-port-specific generated type includes from `tsconfig.json`.                                                                                                                                                                                                                                                                                                                               |
| `npm run docs:freshness`        | PASS WITH WARNINGS       | Exit code `0`; warning mode reported pre-existing orphan registry warnings under `.artifacts/project-source-refresh-2026-05-14` and `supabase/migrations/README.md`.                                                                                                                                                                                                                                                       |
| `npm run build`                 | PASS                     | Exact rerun passed after removing brittle port-specific dev type includes. Build warnings were limited to existing next-intl cache-invalidation, large-string serialization, and edge-runtime static-generation warnings.                                                                                                                                                                                                  |
| Focused AI UI tests             | PASS                     | 8 files / 44 tests: proof-pack assistant, assignment clarity, portfolio privacy, Start from CV dialog, verifications client, profile/onboarding CV surfaces.                                                                                                                                                                                                                                                               |
| `npm run ai:provider:smoke`     | FAIL-CLOSED / UNVERIFIED | Reran locally after fixing env load order. It exited `1` before live provider proof because server-only Gemini key and monthly hard-cap env are missing here. Default model resolved to `gemini-3.1-flash-lite`, was rejected with `missing_api_key`, fallback was unset, disabled mode stayed safe, and `.artifacts/ai-provider-smoke.json` schema v2 now records `success: false` plus value-free prerequisite booleans. |
| Codex in-app Browser UI smoke   | PASS                     | Browser rendered the mock-safe Start from CV onboarding dialog and individual verifications page. Saved `start-from-cv-browser-check.json`, `start-from-cv-browser-surface.png`, `verifications-ai-browser-check.json`, `verifications-ai-browser-page.png`, and `browser-console-ai-check.json`.                                                                                                                          |

## Rendered Flow Evidence

Evidence folder: `audit/ai-rendered-evidence-2026-05-16/`

- `start-from-cv-check.json` and `start-from-cv-approved-surface.png`
  - `http://127.0.0.1:33152/onboarding?next=/candidate-invite/local-ai-rendered-check`
  - Page rendered nonblank, no Next.js/framework error overlay, no relevant console errors.
  - Start from CV appeared only on the approved candidate-invite scaffolding path.
  - Create button disabled until file + consent, then enabled.
  - Dialog copy says private editable drafts only and prohibits publishing, verification, scoring, ranking, matching, shortlisting, and hiring use.
  - Local sample produced a clear fallback/result state with privacy redaction shown.

- `api-verifications-check.json` and `verifications-ai-page.png`
  - `http://127.0.0.1:33152/app/i/verifications`
  - Page rendered nonblank, no Next.js/framework error overlay, no relevant console errors.
  - Browser-origin API checks with CSRF passed:
    - `GET /api/ai/start-from-cv/status` -> `200`, available in mock-approved mode.
    - `POST /api/ai/privacy-preflight/check` -> `200`, high-risk email flag and safe no-file notes.
    - `POST /api/ai/assignments/clarify` -> `200`, mock fallback suggestion.
    - `POST /api/ai/verifications/compose` -> `200`, scoped mock fallback request draft.

- `start-from-cv-browser-check.json` and `start-from-cv-browser-surface.png`
  - `http://127.0.0.1:33172/onboarding?next=/candidate-invite/local-ai-browser-check`
  - Verified in the Codex in-app Browser, not standalone Playwright.
  - Page rendered nonblank with Start from CV available only after the approved first-proof onboarding step.
  - Dialog copy states private editable drafts only, no publishing or organization visibility until user choice, and no scoring, ranking, shortlisting, matching, or hiring decisions.
  - `Create private drafts` remained disabled before file selection and consent.

- `verifications-ai-browser-check.json`, `verifications-ai-browser-page.png`, and `browser-console-ai-check.json`
  - `http://127.0.0.1:33172/app/i/verifications`
  - Verified in the Codex in-app Browser.
  - Page rendered nonblank, no Next.js/framework error overlay, and Browser console warning/error log was empty.
  - Visible copy preserved scoped proof-verification language: proof, claim, verifier, and bounded outcome.

## Remaining UNVERIFIED Items

- **Live Gemini provider behavior**: blocked by missing server-only provider credentials and hard-cap env. The current tracked smoke artifact now fails closed for `gemini-3.1-flash-lite`; stale preview-model success is no longer present in the artifact and would still be rejected by model-matching plus prerequisite-aware launch readiness.
- **Production-only provider/account state**: not touched. No production, billing, auth-template, permission, provider-account, or destructive database changes were run.

## Final Verdict

**NOT PERFECT** until live provider smoke can be verified with the real server-only environment. Within the feasible local scope, the AI features now have no known relevant failing checks, broken rendered flows, Browser UI blocker, privacy leak, legacy direct external-provider bypass, model-staleness bug, build-time type error, or AI-specific test warning remaining.
