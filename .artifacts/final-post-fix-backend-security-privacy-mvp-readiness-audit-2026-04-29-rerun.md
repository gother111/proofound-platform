> Doc Class: `reference-spec`
> Last Verified: `2026-05-19`
>
> Historical/superseded evidence note: this April 29 rerun is retained as dated
> evidence only. It is not current launch authority. Current production-candidate
> signoff requires backup checkpoint, isolated restore report, authenticated
> perf/status evidence, smoke evidence, and `go:no-go` for the intended target.

# Final Post-Fix Backend / Security / Privacy / MVP Readiness Audit Rerun

Generated: 2026-04-29T11:58:00Z
Workspace: `/Users/yuriibakurov/proofound`
Scope: continuation of `.artifacts/final-post-fix-backend-security-privacy-mvp-readiness-audit-2026-04-29.md`

## Verdict

**Production launch verdict: CONDITIONAL NO-GO.**

The repo-owned backend, security/privacy, and locked-MVP corridor checks are now close to launch-ready. The original high-risk functional blockers were cleared in local/test evidence: unit tests are green, privacy/RLS tests are green, build is green, strict org corridor smoke is green, and the full local launch-smoke artifact is fresh and passing.

The remaining NO-GO items are external/prod-readiness proof, not currently reproduced application failures:

1. **Production dependency audit remains unverified** because `npm audit --omit=dev` needs network access to npm's advisory endpoint and discloses dependency inventory to npm. The sandbox run failed at DNS before reaching the registry.
2. **Strict deploy readiness remains unverified in this local shell** because `scripts/check-deploy-readiness.mjs` reports missing production env vars here. This may be correct for the local terminal and still needs Vercel/production-env proof.
3. **Live production/staging go/no-go remains unverified** in this rerun. The fresh launch smoke was local against `http://localhost:3000`, not `https://proofound.io`.

## Readiness Scores

| Aspect                      | Previous audit |           Rerun score | Status                                                                                                              |
| --------------------------- | -------------: | --------------------: | ------------------------------------------------------------------------------------------------------------------- |
| Backend correctness         |       68 / 100 |          **95 / 100** | Repo-owned checks pass; production env proof still open.                                                            |
| Security / privacy          |       62 / 100 |          **90 / 100** | RLS/privacy, CSRF/security headers, upload privacy, token redemption evidence pass; dependency audit still blocked. |
| MVP corridor readiness      |       82 / 100 |          **96 / 100** | Fresh launch-smoke artifact passes all local locked-MVP corridors.                                                  |
| Production launch readiness |          NO-GO | **Conditional NO-GO** | Needs npm advisory audit plus real deploy/live evidence.                                                            |

## Fixes Completed In This Continuation

| Area                        | Result                                                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Capability token redemption | Fixed the Postgres unknown-parameter failure in atomic invite redemption by explicitly typing the profile-lock actor id as `uuid`. This cleared the prior invite acceptance blocker. |
| Auth unit tests             | Updated the auth test env mock to include the newer env helpers used by runtime code.                                                                                                |
| Assignment builder tests    | Updated the assignment-builder fetch harness to handle org-scoped query strings without breaking route matching.                                                                     |
| Launch smoke artifact       | Regenerated `.artifacts/launch-smoke-report.json`; all six checks now pass.                                                                                                          |

## Verification Evidence

| Check                                                                                                                                                                  | Result  | Notes                                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run test -- tests/actions/auth.test.ts tests/ui/assignment-builder-mode-entry.test.tsx tests/lib/capability-tokens.test.ts tests/actions/org-invitations.test.ts` | PASS    | 4 files, 36 tests.                                                                                                                                              |
| `npm run test:e2e:org:strict`                                                                                                                                          | PASS    | 7 browser tests passed earlier in this fix pass after the token redemption fix.                                                                                 |
| `npm run test`                                                                                                                                                         | PASS    | 336 files, 1,468 tests.                                                                                                                                         |
| `npm run lint`                                                                                                                                                         | PASS    | No findings.                                                                                                                                                    |
| `npm run typecheck`                                                                                                                                                    | PASS    | No TypeScript errors.                                                                                                                                           |
| `npm run build`                                                                                                                                                        | PASS    | Production build completed. Prebuild emitted local deploy-readiness warnings for missing env vars in this shell.                                                |
| `npm run test:privacy`                                                                                                                                                 | PASS    | 20 RLS/privacy tests passed against the configured test Supabase project after network approval.                                                                |
| `npm run test:privacy:extended`                                                                                                                                        | PASS    | 27 extended RLS/privacy tests passed against the configured test Supabase project after network approval.                                                       |
| `npm run test:launch:smoke`                                                                                                                                            | PASS    | `.artifacts/launch-smoke-report.json` generated at `2026-04-29T11:50:49.940Z`; all 6 checks passed.                                                             |
| `npm run docs:freshness`                                                                                                                                               | PASS    | Docs freshness passed with no findings.                                                                                                                         |
| `git diff --check`                                                                                                                                                     | PASS    | No whitespace errors.                                                                                                                                           |
| `npm ls --omit=dev --depth=0`                                                                                                                                          | PASS    | Installed production dependency tree resolves; one extraneous local package was reported: `@emnapi/runtime`.                                                    |
| `npm audit --omit=dev`                                                                                                                                                 | BLOCKED | Failed before advisory lookup: `getaddrinfo ENOTFOUND registry.npmjs.org`. External audit needs explicit approval because it sends dependency inventory to npm. |

## Fresh Launch Smoke Details

Artifact: `.artifacts/launch-smoke-report.json`

| Corridor                 | Status |
| ------------------------ | ------ |
| Individual corridor      | PASS   |
| Organization corridor    | PASS   |
| Trust / privacy corridor | PASS   |

| Smoke check                                           | Status |
| ----------------------------------------------------- | ------ |
| `public_individual_portfolio_visible`                 | PASS   |
| `proof_creation_case`                                 | PASS   |
| `public_org_trust_fixture_live`                       | PASS   |
| `full_org_corridor_review_to_engagement_verification` | PASS   |
| `hidden_portfolio_protected`                          | PASS   |
| `privacy_no_leak_case`                                | PASS   |

## Security / Privacy Rerun Notes

- XSS sink scan found only the reviewed JSON-LD script renderer in `src/components/seo/JsonLdScripts.tsx`; it serializes JSON and escapes `<` before `dangerouslySetInnerHTML`.
- Auth redirect scan found `src/app/auth/callback/route.ts` constrains `next` redirects to same-origin or relative paths.
- Secret-name scan did not show a runtime public secret exposure pattern. Test coverage explicitly rejects `NEXT_PUBLIC_CRON_SECRET` as an internal cron secret source.
- Upload/path traversal coverage passed through the full unit suite and focused upload privacy suites; tests include unsafe filenames such as `../unsafe name.pdf`.
- Dynamic SQL scan found existing `sql.raw` usage in constrained contexts, including a demographic column allowlist and JSON-literal helper. No new SQL string concatenation was introduced in this continuation.
- Child-process usage is concentrated in scripts/test harnesses and launch tooling; no new request-facing command execution path was introduced.

## Remaining Blockers To Reach True 100%

1. Run an approved external production dependency audit:
   - `npm ci`
   - `npm audit --omit=dev`
   - address any remaining advisories if the registry reports them
2. Prove deploy readiness against the real launch environment:
   - run `scripts/check-deploy-readiness.mjs` where production/staging env vars are present, or provide Vercel env proof
3. Refresh live launch evidence:
   - `BASE_URL=https://proofound.io npm run test:launch:smoke`
   - live `/api/health`
   - live `/api/monitoring/launch-status`
   - `npm run db:backup:checkpoint`
   - `npm run db:restore:verify -- --checkpoint <checkpoint-dir> --out .artifacts/launch-restore-report.json`
   - `BASE_URL=https://proofound.io SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`

## Bottom Line

The app-owned backend/security/privacy/MVP corridor is now **near-ready** from local and test evidence. I would not call it 100% launch-ready until the external dependency audit and production/live checks are complete, but the earlier P0 application blockers from the audit are no longer present in the rerun evidence.
