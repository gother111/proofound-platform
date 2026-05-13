# Proofound MVP AI Pilot Readiness - Current Evidence

Generated: 2026-05-11
Workspace: `/Users/yuriibakurov/proofound`

## Short Verdict

Proofound is much closer to a narrow founder-led MVP pilot with companies/NGOs after this pass. The core individual, organization, privacy, AI-disabled fallback, visual, accessibility, and production-build evidence is green locally.

It is not yet proven "production ready after push" because no production push/deploy was performed in this pass. The repository also says `master` is PR-only and landing-sensitive changes should be isolated, which conflicts with a direct push-to-master workflow.

## Fresh Evidence From This Pass

- `npm run test` passed: 366 files / 1774 tests.
- `npm run test:launch:ai` passed: 17 files / 116 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run docs:freshness` passed in warning mode, with existing warning: orphan file missing from registry: `supabase/migrations/README.md`.
- `npm run build` passed.
- `npm run test:e2e:landing` passed: 11/11.
- `npm run test:e2e:landing:visual` passed: 1/1.
- `npm run test:a11y` passed: 15/15.
- `npm run test:e2e:individual:strict` passed: 5/5.
- `npm run test:e2e:org:strict` passed: 7/7.
- `npm run test:e2e:privacy:strict` passed: 5/5.
- `npm run test:e2e:providers:strict` passed: 5/5.
- `npm run test:launch:smoke` passed after running outside the sandbox so seed and nested browser checks could bind local IPC/ports.
- `npm run monitor:launch` passed and persisted fresh evidence for all 10 launch monitors.
- `npm run perf:budgets` passed against `next start` on `http://localhost:40123`.
- `npm run vercel:preflight` passed and confirmed production, preview, and development env key presence for the linked Vercel project.

## Issues Fixed During This Pass

1. Safe-shell readiness copy no longer tells users a missing step is complete.
   - The readiness card now shows action-oriented "Next" copy such as "Complete your safe shell".

2. Proof Packs no longer asks locked users to add more proof before completing the safe shell.
   - The blocker list and primary CTA now prioritize "Complete safe shell" when the profile is locked by safe-shell requirements.

3. Visibility / Portfolio no longer links locked users back to the same page.
   - The locked state now opens the profile edit dialog directly.

4. Date-drift in `tests/api/feedback-submit-route.test.ts` was fixed.
   - The token redemption ordering test used an already-expired May 8, 2026 fixture. It now uses a far-future expiry so the test actually covers redemption before write.

5. Homepage final CTA contrast remains fixed.
   - Landing E2E, visual, and a11y checks pass after the contrast change.

## Current Blockers / Caveats

1. Do not directly push this mixed diff to `master` without resolving repo policy.
   - `agent/checklists/verification.md` says `master` is PR-only.
   - It also says landing-sensitive changes must be isolated in a dedicated landing PR.
   - Current working tree includes both landing and app/profile/test hardening changes.

2. Local `npm run launch:status` still blocks if the local runtime lacks KV rate-limit env vars.
   - After fresh smoke and monitor persistence, launch-status only blocked on `missing_rate_limit_dependency`.
   - `npm run vercel:preflight` passed, so the linked Vercel project reports required env key presence.
   - This means the blocker is not proven to be production-missing, but the local launch-status command is not green without KV env in the local runtime.

3. Production has not been rechecked after deployment.
   - No commit, push, PR merge, or production deploy was completed in this pass.
   - Live production readiness still needs post-deploy health, launch-status, and deployment-SHA verification.

4. OCR / Start from CV remains beta/controlled.
   - Launch AI tests passed.
   - Launch status reports Start from CV beta and GCP OCR disabled in this local runtime.
   - That is acceptable for MVP if OCR/CV import is marketed as beta-only and available only to logged-in users when enabled intentionally.

## Recommended Packaging Path

1. Split landing contrast into a dedicated landing branch/PR.
2. Split profile readiness, feedback-test drift, launch evidence, and safe-shell UX fixes into a separate MVP hardening branch/PR.
3. Ensure production/preview KV rate-limit env is present using Vercel evidence before merge.
4. Merge through the PR-only flow.
5. After production deploy, run:
   - `curl -sS https://proofound.io/api/health`
   - deployment SHA verification through Vercel metadata or workflow summary
   - production launch-status / launch smoke as allowed by production ops policy
