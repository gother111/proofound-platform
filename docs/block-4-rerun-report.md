# Block 4 Rerun Report

## objective

Rerun the authenticated organization corridor end to end against the cleaned launch surface, fix any remaining launch-aligned gaps found in live behavior, and confirm that blind review, consented reveal, explicit hire, and distinct engagement verification still hold in runtime.

## commands run

- authority and repo evidence:
  - `sed -n '1,240p' docs/codex-progress.md`
  - `sed -n '1,240p' docs/block-8-report.md`
  - targeted reads of the locked MVP corridor, review, reveal, interview, and decision paths
- targeted verification during fixes:
  - `npm run test -- tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts`
  - `npm run test -- tests/api/match-interest-route.test.ts`
  - `npm run test -- tests/api/interviews-edit-route.test.ts tests/api/interviews-cancel-route.test.ts tests/api/interviews-schedule-route.test.ts tests/ui/organization-interviews-page-actions.test.tsx tests/api/decisions-route.test.ts`
  - `npm run test -- tests/lib/workflow-decision-record.test.ts tests/api/decisions-route.test.ts`
  - `npm run test -- tests/api/interviews-complete-route.test.ts tests/lib/workflow-decision-record.test.ts tests/api/decisions-route.test.ts`
  - `npm run test -- tests/actions/org-invitations.test.ts`
- live runtime reruns:
  - `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1`
  - `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 -g "O-08..O-12 ranked matches, shortlist, messaging, and interview prep are strict"`
  - `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict`
  - `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:privacy:strict`
- final acceptance:
  - `npm run typecheck`
  - `npm run lint`

## files changed

- `docs/codex-progress.md`
- `docs/block-4-rerun-report.md`
- `src/actions/org.ts`
- `src/app/accept-invite/page.tsx`
- `src/app/app/o/[slug]/home/page.tsx`
- `src/app/actions/interviews.ts`
- `src/app/app/o/[slug]/interviews/page.tsx`
- `src/app/api/core/matching/interest/route.ts`
- `src/app/api/org/[id]/matches/[matchId]/review/route.ts`
- `src/app/api/interviews/edit/route.ts`
- `src/app/api/interviews/complete/route.ts`
- `src/app/api/decisions/route.ts`
- `src/db/schema.ts`
- `src/lib/contracts/canonical-domain.ts`
- `src/lib/email.ts`
- `src/lib/interviews/messaging.ts`
- `src/lib/matching/review-contract.ts`
- `src/lib/workflow/service.ts`
- `e2e/helpers/strict-fixtures.ts`
- `e2e/strict/org-corridor.strict.spec.ts`
- `e2e/strict/organization.strict.spec.ts`
- `tests/actions/org-invitations.test.ts`
- `tests/api/conversation-reveal-route.test.ts`
- `tests/api/decisions-route.test.ts`
- `tests/api/interviews-complete-route.test.ts`
- `tests/api/interviews-edit-route.test.ts`
- `tests/api/match-interest-route.test.ts`
- `tests/api/org-match-review-route.test.ts`
- `tests/lib/matching-review-contract.test.ts`
- `tests/lib/workflow-decision-record.test.ts`
- `tests/ui/organization-interviews-page-actions.test.tsx`

## tests run

- `npm run test -- tests/api/org-match-review-route.test.ts tests/api/conversation-reveal-route.test.ts`
  - PASS
- `npm run test -- tests/api/match-interest-route.test.ts`
  - PASS
- `npm run test -- tests/api/interviews-edit-route.test.ts tests/api/interviews-cancel-route.test.ts tests/api/interviews-schedule-route.test.ts tests/ui/organization-interviews-page-actions.test.tsx tests/api/decisions-route.test.ts`
  - PASS
- `npm run test -- tests/lib/workflow-decision-record.test.ts tests/api/decisions-route.test.ts`
  - PASS
- `npm run test -- tests/api/interviews-complete-route.test.ts tests/lib/workflow-decision-record.test.ts tests/api/decisions-route.test.ts`
  - PASS
- `npm run test -- tests/actions/org-invitations.test.ts`
  - PASS
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node20.mjs test e2e/strict/org-corridor.strict.spec.ts --project=chromium --reporter=line --workers=1`
  - PASS
  - live runtime evidence confirmed: org home, trust profile, collaborator invite, invite acceptance, assignment draft/edit/publish, blind shortlist review, masked intro, reveal request and candidate approval, interview schedule plus single reschedule, explicit `hire`, and separate organization engagement confirmation moving the verification to `pending_candidate_confirmation`
- `PLAYWRIGHT_SERVER_MODE=prod NEXT_PUBLIC_USE_MOCK_SUPABASE=false node ./scripts/playwright-node20.mjs test e2e/strict/organization.strict.spec.ts --project=chromium --reporter=line --workers=1 -g "O-08..O-12 ranked matches, shortlist, messaging, and interview prep are strict"`
  - PASS
- `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:org:strict`
  - PASS
- `PLAYWRIGHT_SERVER_MODE=prod npm run test:e2e:privacy:strict`
  - PASS
- `npm run typecheck`
  - PASS
- `npm run lint`
  - PASS with 2 pre-existing warnings only:
    - `src/components/ProofoundLanding.tsx`
    - `src/components/landing/sections/FooterSection.tsx`

## result

PASS

The authenticated org corridor was rerun end to end with fresh runtime evidence and the remaining launch-aligned gaps were fixed narrowly:

- collaborator invites are reachable again from the active org home launch surface without reopening broad team management
- intro approval remains masked, reveal moves through `reveal_pending`, and identity only unlocks after candidate reveal approval
- interview reschedules stay auditable and limited to one reuse of the same interview record
- explicit `hire` remains distinct from post-hire engagement verification
- the final organization engagement confirmation is verified live as a separate step after `hire`
- the older org strict suite was updated to stop assuming mutual interest auto-shortlists a candidate, which would have contradicted the explicit shortlist corridor now enforced by the locked MVP

## remaining blockers

- None for Block 4 acceptance
- Non-blocking observation: runtime still logs `identity_revealed_email.missing_email` when the strict fixtures do not carry deliverable email addresses, and interview completion still logs a best-effort `feedback_tokens` schema-cache warning without blocking the corridor

## exact next recommended action

Proceed to the next verification-focused block: finish migrating the remaining live verification request corridor fully off the legacy request transport, then rerun the authenticated org review/reveal/explanation corridor once more against that canonical path.
