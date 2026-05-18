# Clawpatch Pilot Summary

Date: 2026-05-16
Repository: `/Users/yuriibakurov/proofound`
Goal: controlled, repo-safe Clawpatch first pass with read-only mapping/reporting and no implicit fixes or commits.

## Outcome

- Clawpatch CLI installed and available as version `0.1.0`.
- Root Clawpatch state was created at `.artifacts/clawpatch-2026-05-16/`.
- Root mapping completed with `9` package/config/script features.
- A second Clawpatch state was created at `.artifacts/clawpatch-2026-05-16-src/` with `--root /Users/yuriibakurov/proofound/src`.
- The `src/` mapping completed with `197` Next route features.
- Reports were generated:
  - `.artifacts/clawpatch-2026-05-16/root-report.md`
  - `.artifacts/clawpatch-2026-05-16-src/src-report.md`
  - `.artifacts/clawpatch-2026-05-16-src/src-report-after-local-fixes.md`
- No `clawpatch fix` command was run.
- No commit, push, PR, schema, auth, billing, or production change was made.

## Important Limitation

Clawpatch `0.1.0` only maps root-level `app/` and `pages/` routes. Proofound uses `src/app/`, so the root Clawpatch run only found package/config/script features. The `src/`-rooted second state was required to map the actual Next route surface.

## Review Attempt

Non-exporting dry-run review planning succeeded:

```sh
clawpatch --state-dir .artifacts/clawpatch-2026-05-16 \
  review --limit 9 --jobs 1 --dry-run --json --no-input
```

Result:

- `dryRun`: `true`
- `wouldReview`: `9`
- `jobs`: `1`

```sh
clawpatch --root /Users/yuriibakurov/proofound/src \
  --state-dir /Users/yuriibakurov/proofound/.artifacts/clawpatch-2026-05-16-src \
  review --limit 10 --jobs 1 --dry-run --json --no-input
```

Result:

- `dryRun`: `true`
- `wouldReview`: `10`
- `jobs`: `1`

The root Clawpatch review command was attempted:

```sh
clawpatch --state-dir .artifacts/clawpatch-2026-05-16 review --limit 9 --jobs 3 --no-input
```

It failed before producing findings because the Clawpatch Codex provider could not access the local Codex session/plugin state from the sandbox. A later escalated retry was blocked by the app safety reviewer because that provider path would send private repository context through Clawpatch's Codex provider. At that initial pilot point, the generated reports contained zero findings because provider review did not complete, not because the codebase was fully reviewed by Clawpatch.

## Local Verification Run Instead

Because the provider review path was blocked, local repo checks were used as the safe fallback:

- `npm run lint`: passed.
- `npm run docs:freshness`: completed in warning mode with existing orphan-doc warnings.
- `npm run typecheck`: passed.
- `npm run test`: passed after rerunning with permission for the local Vite/Vitest websocket port.
  - Result: `370` test files passed, `1841` tests passed.

## Continuation: Findings Resolution

After the initial pilot summary, an approved provider-backed review of the `src/` Clawpatch state completed for a narrow batch of route features and persisted `18` findings. During the resumed goal work on 2026-05-16, provider-backed revalidation and broader review were attempted again after user approval, but the app safety/tenant policy blocked that path because it would export private repository context. No bypass was attempted.

The persisted findings were then handled manually against the repository source:

- Current Clawpatch `src/` state: `197` features, `18` findings, `0` open findings, `0` active locks.
- All `18` findings are triaged as `fixed`.
- No `clawpatch fix` command was run.
- No commit, push, PR, schema, auth, billing, or production change was made.
- The latest evidence report is `.artifacts/clawpatch-2026-05-16-src/src-report-after-local-fixes.md`.

Manual fixes covered API input handling, account/export lifecycle safety, candidate-invite data minimization and expired-preview behavior, assignment publish state guards, health-check metric/threshold contracts, `/llms` routing, protected messages route state handling, and admin organization verification transaction/input safety.

Focused verification after the resumed fixes:

- `npm run test -- tests/api/engagement-verifications-route.test.ts tests/api/user-account-lifecycle-routes.test.ts tests/api/user-export-route.test.ts tests/routes/portfolio-shortcuts.test.tsx tests/api/assignments-publish-route.test.ts tests/api/cron-health-check-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/app/llms-routes.test.ts tests/lib/capability-tokens.test.ts tests/api/candidate-invites-token-route.test.ts tests/ui/candidate-invite-client.test.tsx tests/api/admin-organizations-verify-route.test.ts tests/routes/organization-messages-page.test.tsx`: passed, `13` files and `77` tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.

## Continuation: Broader Review Request

After the user explicitly approved broader provider-backed review, Clawpatch was run again with `--limit 197 --jobs 1` against the `src/` state. The app-level reviewer rejected the provider-backed action because tenant policy forbids sending private Proofound source context through that provider path, even with user approval. The blocked provider path was not retried or bypassed.

The safer local continuation reviewed repeat bug classes from the persisted findings and fixed additional confirmed issues:

- Malformed JSON request bodies now return `400` instead of falling into generic server-error paths for conversation creation, conversation settings updates, conversation message sends, and organization candidate-invite creation.
- Dynamic organization slugs are encoded as single URL path segments in invitation redirects, onboarding legacy-org redirects, and the shared home-path resolver.

Focused verification after this broader local pass:

- `npm run test -- tests/api/conversations-route.test.ts tests/api/conversation-detail-routes.test.ts tests/api/org-candidate-invites-route.test.ts`: passed, `3` files and `18` tests.
- `npm run test -- tests/lib/auth-request-cache.test.ts tests/routes/onboarding-page.test.ts tests/api/conversations-route.test.ts tests/api/conversation-detail-routes.test.ts tests/api/org-candidate-invites-route.test.ts`: passed, `5` files and `30` tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test -- tests/api/engagement-verifications-route.test.ts tests/api/user-account-lifecycle-routes.test.ts tests/api/user-export-route.test.ts tests/routes/portfolio-shortcuts.test.tsx tests/api/assignments-publish-route.test.ts tests/api/cron-health-check-route.test.ts tests/api/public-portfolio-export-route.test.ts tests/app/llms-routes.test.ts tests/lib/capability-tokens.test.ts tests/api/candidate-invites-token-route.test.ts tests/ui/candidate-invite-client.test.tsx tests/api/admin-organizations-verify-route.test.ts tests/routes/organization-messages-page.test.tsx tests/api/conversations-route.test.ts tests/api/conversation-detail-routes.test.ts tests/api/org-candidate-invites-route.test.ts tests/lib/auth-request-cache.test.ts tests/routes/onboarding-page.test.ts`: passed, `18` files and `107` tests.

## Continuation: Inline JSON Parsing Sweep

A later local continuation reviewed the remaining `Schema.parse(await request.json())` and `safeParse(await request.json())` route handlers. This was a scoped follow-up to the malformed-JSON finding class, not a provider-backed semantic review.

The direct inline parse pattern was eliminated from `src/app/api` for the reviewed route handlers. Malformed JSON now returns `400` before workflow, provider, queue, audit, or persistence work in:

- Interview completion and no-show routes.
- Proof artifact OCR extract/apply routes.
- Start from CV session create, accept, and discard routes.
- Verification bundle cancellation.
- Internal ops queue item mutation.
- Organization match review mutation.
- Feedback submission.

Focused verification after this sweep:

- `npm run test -- tests/api/interviews-complete-route.test.ts tests/api/interviews-no-show-route.test.ts tests/api/proof-artifact-text-extraction-routes.test.ts tests/api/start-from-cv-route.test.ts`: passed, `4` files and `27` tests.
- `npm run test -- tests/api/expertise-verifications-custom-route.test.ts tests/api/admin-internal-ops-queue-route.test.ts tests/api/org-match-review-route.test.ts tests/api/feedback-submit-route.test.ts`: passed, `4` files and `33` tests.
- `npm run test -- tests/api/interviews-complete-route.test.ts tests/api/interviews-no-show-route.test.ts tests/api/proof-artifact-text-extraction-routes.test.ts tests/api/start-from-cv-route.test.ts tests/api/expertise-verifications-custom-route.test.ts tests/api/admin-internal-ops-queue-route.test.ts tests/api/org-match-review-route.test.ts tests/api/feedback-submit-route.test.ts tests/api/conversations-route.test.ts tests/api/conversation-detail-routes.test.ts tests/api/org-candidate-invites-route.test.ts tests/lib/auth-request-cache.test.ts tests/routes/onboarding-page.test.ts`: passed, `13` files and `90` tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.

## Usable Findings

1. Clawpatch can safely keep audit state under `.artifacts/` instead of a root `.clawpatch/` directory for Proofound pilots.
2. For Proofound, Clawpatch should be run with a separate `src/` root until Clawpatch supports `src/app` route discovery directly.
3. Clawpatch automatic fixing is not appropriate while this worktree is dirty, because `git status` shows many unrelated pre-existing changes.
4. The Clawpatch provider review needs explicit approval because it may export private repository context through the provider path.
5. The local repo quality gates used for the resumed fixing pass passed after manual resolution of the persisted Clawpatch findings.

## Completion Audit

- Controlled read-only Clawpatch setup: complete. State was kept under `.artifacts/`.
- Feature mapping: complete for root package/config/script features and for `src/app` routes via the `src/` root workaround.
- Read-only report generation: complete. The latest `src/` report exists and shows `18` fixed findings with `0` open findings.
- Provider-backed code review: partially complete for the narrow reviewed batch that produced the persisted findings. Broader provider-backed review and provider revalidation are blocked by app safety/tenant policy, even after explicit user approval, because that path would export private repository context.
- Implicit fixes/commits avoided: complete. No `clawpatch fix`, commit, push, PR, production, schema, auth, or billing mutation was made.
- Verification of created artifacts: complete. Clawpatch status reports no active locks, reports exist, and local lint/typecheck/test checks passed.
- Usable findings/next steps: complete in this artifact, with the explicit remaining provider-policy boundary documented.

## Next Safe Steps

Because provider-backed Clawpatch review/revalidation is currently blocked by policy, do not treat this artifact as proof that all `197` mapped route features received semantic provider review. It proves that all persisted Clawpatch findings from the reviewed batch are locally resolved and triaged to fixed.

Safe next steps:

1. Continue any additional review locally or with a policy-approved Clawpatch provider path.
2. Inspect and fix future findings manually in scoped patches.
3. Run focused tests plus `npm run lint` and `npm run typecheck`.
4. Avoid `clawpatch fix` until the worktree is clean or a dedicated branch/worktree is prepared.
