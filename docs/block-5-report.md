# Block 5 Report

- objective:
  Finish the shift to canonical claim-scoped verification semantics for active MVP launch behavior by removing legacy status fallbacks and compatibility fields from launch web/mobile, moving active launch clients off expertise-prefixed verification transport, and re-checking public trust surfaces for unsupported trust lift.

- commands run:
  `sed -n '1,260p' src/app/api/verification/status/route.ts`
  `sed -n '1,240p' src/app/api/mobile/v1/verification/status/route.ts`
  `sed -n '1,320p' src/components/settings/VerificationStatus.tsx`
  `sed -n '1,280p' src/components/settings/LinkedInVerification.tsx`
  `sed -n '1,320p' src/lib/verification/policy.ts`
  `sed -n '1,260p' src/app/app/i/verifications/page.tsx`
  `sed -n '1,360p' src/app/app/i/verifications/VerificationsClient.tsx`
  `sed -n '1,220p' src/app/app/i/verifications/components/RespondDialog.tsx`
  `sed -n '1,240p' src/app/app/i/verifications/components/BundleCancelDialog.tsx`
  `sed -n '1,260p' src/app/api/expertise/verifications/incoming/route.ts`
  `sed -n '1,280p' 'src/app/api/expertise/verification/[requestId]/respond/route.ts'`
  `sed -n '1,320p' 'src/app/api/expertise/verifications/sent/[requestType]/[requestId]/route.ts'`
  `sed -n '1,320p' 'src/app/api/expertise/verifications/custom/[requestId]/route.ts'`
  `sed -n '1,260p' src/lib/verification/canonical-requests.ts`
  `sed -n '220,340p' src/lib/proof-trust/snapshots.ts`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/ui/verification-status-options.test.tsx`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/ui/verifications-client.test.tsx tests/ui/verifications-page.test.tsx tests/ui/custom-verification-request-dialog.test.tsx tests/ui/edit-skill-window-proofs.test.tsx`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/lib/verification-policy.test.ts tests/portfolio-trust-signals.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run typecheck`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run test -- tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/ui/verifications-client.test.tsx tests/ui/verifications-page.test.tsx tests/ui/custom-verification-request-dialog.test.tsx tests/ui/edit-skill-window-proofs.test.tsx tests/lib/verification-policy.test.ts tests/portfolio-trust-signals.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run lint`
  `rg -n "/api/expertise/verifications|/api/expertise/verification" src/app/app/i src/components/settings`
  `rg -n "request_type|custom_request_id" src/app/app/i/verifications src/app/app/i/expertise/components/EditSkillWindow.tsx`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run log:change`
  `source ~/.nvm/nvm.sh && nvm use 20.20.0 >/dev/null && npm run log:session`

- files changed:
  `src/lib/verification/status-contract.ts`
  `src/app/api/verification/status/route.ts`
  `src/app/api/mobile/v1/verification/status/route.ts`
  `src/components/settings/VerificationStatus.tsx`
  `src/lib/verification/request-feed.ts`
  `src/app/app/i/verifications/page.tsx`
  `src/app/app/i/verifications/VerificationsClient.tsx`
  `src/app/app/i/verifications/components/RespondDialog.tsx`
  `src/app/app/i/verifications/components/BundleCancelDialog.tsx`
  `src/app/app/i/verifications/components/CustomVerificationRequestDialog.tsx`
  `src/app/app/i/expertise/components/EditSkillWindow.tsx`
  `src/app/api/verification/requests/route.ts`
  `src/app/api/verification/requests/skill/[requestId]/route.ts`
  `src/app/api/verification/requests/impact-story/[requestId]/route.ts`
  `src/app/api/verification/requests/skill/[requestId]/respond/route.ts`
  `src/app/api/verification/requests/bundles/[requestId]/route.ts`
  `src/app/api/verification/requests/custom/route.ts`
  `src/app/api/verification/requests/custom/artifacts/route.ts`
  `src/app/api/verification/requests/email-hint/route.ts`
  `src/lib/proof-trust/snapshots.ts`
  `tests/api/verification-status-route.test.ts`
  `tests/api/mobile-verification-status-route.test.ts`
  `tests/ui/verification-status-options.test.tsx`
  `tests/ui/verifications-client.test.tsx`
  `tests/ui/verifications-page.test.tsx`
  `tests/ui/custom-verification-request-dialog.test.tsx`
  `tests/ui/edit-skill-window-proofs.test.tsx`
  `tests/lib/verification-policy.test.ts`
  `docs/codex-progress.md`
  `project/changes/entries/2026-03-13T21-56-38Z__master__4767ea77.md`
  `agent/scratchpad/entries/2026-03-13T21-56-38Z__master__4767ea77.md`

- tests run:
  PASS `npm run test -- tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/ui/verification-status-options.test.tsx`
  PASS `npm run test -- tests/ui/verifications-client.test.tsx tests/ui/verifications-page.test.tsx tests/ui/custom-verification-request-dialog.test.tsx tests/ui/edit-skill-window-proofs.test.tsx`
  PASS `npm run test -- tests/lib/verification-policy.test.ts tests/portfolio-trust-signals.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts`
  PASS `npm run typecheck`
  PASS `npm run test -- tests/api/verification-status-route.test.ts tests/api/mobile-verification-status-route.test.ts tests/ui/verification-status-options.test.tsx tests/ui/verifications-client.test.tsx tests/ui/verifications-page.test.tsx tests/ui/custom-verification-request-dialog.test.tsx tests/ui/edit-skill-window-proofs.test.tsx tests/lib/verification-policy.test.ts tests/portfolio-trust-signals.test.ts tests/lib/public-trust-export-data.test.ts tests/lib/public-portfolio-projection.test.ts tests/api/public-portfolio-export-route.test.ts tests/api/portfolio-export-route.test.ts` with 56/56 tests passing
  PASS `npm run lint` with 2 pre-existing `@next/next/no-img-element` warnings in landing files and no new Block 5 lint failures
  PASS `rg -n "/api/expertise/verifications|/api/expertise/verification" src/app/app/i src/components/settings` returned no active launch-client matches
  PASS `rg -n "request_type|custom_request_id" src/app/app/i/verifications src/app/app/i/expertise/components/EditSkillWindow.tsx` returned no active launch-client matches

- result:
  PASS

- remaining blockers:
  None for the Block 5 acceptance criteria.
  Compatibility token responders under `/api/verify/[token]` and `/api/verify/custom/[token]` were intentionally left working as legacy link surfaces; they were not refactored in this block because active launch web/mobile behavior no longer depends on them.

- exact next recommended action:
  Audit and narrow the remaining legacy public token responders so canonical `verification_records` are the primary path there too, then remove dead compatibility branches once link-migration evidence shows they are no longer needed.
