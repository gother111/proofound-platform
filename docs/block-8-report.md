# Block 8 Report

## objective

Finish the migration of the live verification request corridor onto canonical verification transport so active MVP verification UI and API paths no longer depend on `skill_verification_requests` or `impact_story_verification_requests` for live request creation, listing, or sent-item management.

## commands run

- `date -u +"%Y-%m-%dT%H:%M:%SZ"`
- `sed -n '1,260p' docs/codex-progress.md`
- `sed -n '1,260p' docs/block-0-report.md`
- `rg -n "request-feed|verification-request|verification status|skill_verification_requests|impact_story_verification_requests" src tests docs`
- `sed -n '1,260p' src/lib/verification/request-feed.ts`
- `sed -n '1,260p' src/app/app/i/verifications/page.tsx`
- `sed -n '1,260p' src/lib/verification/status-contract.ts`
- `sed -n '1,260p' src/app/api/verification/status/route.ts`
- `sed -n '1,260p' tests/ui/verifications-page.test.tsx`
- `sed -n '1,260p' tests/api/verification-status-route.test.ts`
- `sed -n '1,260p' tests/lib/verification-policy.test.ts`
- `npx vitest run tests/ui/verifications-page.test.tsx`
- `npx vitest run tests/actions/create-impact-story.test.ts tests/actions/profile.test.ts`
- `npx vitest run tests/api/expertise-verification-respond-route.test.ts`
- `npx vitest run tests/api/verify-impact-token-route.test.ts`
- `npx vitest run tests/api/expertise-verifications-sent-delete-route.test.ts`
- `npx vitest run tests/api/expertise-skill-verification-request-route.test.ts`
- `npx vitest run tests/api/verification-status-route.test.ts tests/lib/verification-policy.test.ts tests/ui/verifications-client.test.tsx`
- `npm run test -- tests/ui/verifications-page.test.tsx tests/api/verification-status-route.test.ts tests/lib/verification-policy.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/verify-impact-token-route.test.ts tests/api/expertise-verifications-sent-delete-route.test.ts tests/actions/create-impact-story.test.ts tests/actions/profile.test.ts`
- `npx vitest run tests/actions/profile.test.ts`
- `npx vitest run tests/actions/create-impact-story.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/verify-impact-token-route.test.ts tests/actions/profile.test.ts`
- `npx vitest run tests/ui/verifications-page.test.tsx tests/api/verification-status-route.test.ts tests/lib/verification-policy.test.ts tests/ui/verifications-client.test.tsx tests/api/expertise-verifications-sent-delete-route.test.ts`
- `npm run db:migrate`
- runtime seeding via `npx tsx` for canonical skill request creation against the local DB
- `NEXT_PUBLIC_USE_MOCK_SUPABASE=true npm run dev`
- live browser check on `http://localhost:3002/app/i/verifications`
- live HTTP check on `http://localhost:3002/api/verify/<token>` GET and POST for a fresh canonical skill token
- `npx vitest run tests/ui/verifications-page.test.tsx`
- `npx vitest run tests/api/verify-impact-token-route.test.ts`
- `npm run typecheck`
- `npm run lint`

## files changed

- `src/lib/verification/canonical-impact-requests.ts`
- `src/lib/verification/canonical-requests.ts`
- `src/db/migrations/20260314100000_backfill_canonical_verification_request_transport.sql`
- `src/lib/verification/request-feed.ts`
- `src/app/api/expertise/user-skills/[id]/verification-request/route.ts`
- `src/app/api/expertise/verifications/custom/request/route.ts`
- `src/actions/profile.ts`
- `src/app/api/expertise/verification/[requestId]/respond/route.ts`
- `src/app/api/verify/[token]/route.ts`
- `src/app/api/expertise/verifications/sent/[requestType]/[requestId]/route.ts`
- `src/lib/supabase/mock-server-client.ts`
- `src/lib/supabase/admin.ts`
- `tests/ui/verifications-page.test.tsx`
- `tests/actions/create-impact-story.test.ts`
- `tests/actions/profile.test.ts`
- `tests/api/expertise-skill-verification-request-route.test.ts`
- `tests/api/expertise-verifications-sent-delete-route.test.ts`
- `docs/codex-progress.md`
- `docs/block-8-report.md`

## tests run

- `npx vitest run tests/ui/verifications-page.test.tsx` -> PASS
- `npx vitest run tests/actions/create-impact-story.test.ts tests/actions/profile.test.ts` -> PASS
- `npx vitest run tests/api/expertise-verification-respond-route.test.ts` -> PASS
- `npx vitest run tests/api/verify-impact-token-route.test.ts` -> PASS
- `npx vitest run tests/api/expertise-verifications-sent-delete-route.test.ts` -> PASS
- `npx vitest run tests/api/expertise-skill-verification-request-route.test.ts` -> PASS
- `npx vitest run tests/api/verification-status-route.test.ts tests/lib/verification-policy.test.ts tests/ui/verifications-client.test.tsx` -> PASS
- Combined Block 8 suite rerun -> PARTIAL on the first attempt because of stale canonical impact mocks plus suite-level timeout contention
- `npx vitest run tests/actions/profile.test.ts` -> PASS after fixing the canonical impact mock
- `npx vitest run tests/actions/create-impact-story.test.ts tests/api/expertise-skill-verification-request-route.test.ts tests/api/expertise-verification-respond-route.test.ts tests/api/verify-impact-token-route.test.ts tests/actions/profile.test.ts` -> PASS
- `npx vitest run tests/ui/verifications-page.test.tsx tests/api/verification-status-route.test.ts tests/lib/verification-policy.test.ts tests/ui/verifications-client.test.tsx tests/api/expertise-verifications-sent-delete-route.test.ts` -> PASS
- `npm run db:migrate` -> PASS, applied `20260314100000_backfill_canonical_verification_request_transport`
- Live runtime browser check on `/app/i/verifications` -> PASS after patching the local mock Supabase harness to support canonical feed enrichment lookups
- Live runtime GET+POST on `/api/verify/<token>` for a fresh canonical skill request -> PASS with `POST 200` and `status: "accepted"` after patching the local mock admin client chain
- `npx vitest run tests/api/verify-impact-token-route.test.ts` -> PASS after the mock admin client patch
- `npm run typecheck` -> PASS
- `npm run lint` -> PASS with 2 pre-existing landing `<img>` warnings

## result

PASS

## remaining blockers

- Historical legacy-token fallback was preserved in code, but no local historical legacy token was available to rerun end to end, so that compatibility path remains `UNVERIFIED`.
- The first broad combined vitest rerun hit suite-level timeout contention. The active Block 8 surfaces were rerun successfully in grouped and single-file passes afterward.
- `npm run lint` still reports the 2 pre-existing `@next/next/no-img-element` warnings in landing components unrelated to the verification corridor.

## exact next recommended action

Run a focused follow-up on the remaining legacy compatibility surfaces: verify one historical legacy token end to end if local data can be seeded safely, then consider removing or archiving the deprecated non-MVP `/api/verification/skill/*` paths once their compatibility obligations are fully evidenced.
