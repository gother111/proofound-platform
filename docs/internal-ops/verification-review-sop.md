> Doc Class: `active`
> Last Verified: `2026-05-19`

# Verification Review SOP

## Use this SOP when

- a verification response is `partly` or `no`
- a verification request is stale, contradicted, disputed, or needs a manual decision
- trust cannot be safely upgraded without human review

This SOP is claim-scoped. Do not use it as a general profile moderation workflow.

## Owner and escalation

- Owner: `Support / verification lead`
- Escalate to `Product / ops lead` if the trust outcome affects reveal, shortlist handling, or a reveal/privacy dispute
- Escalate to `Engineering on-call` if queue state, verification state, or audit writes are failing
- Pilot SLA target: first triage within `1 business day`; same-day escalation for active corridor blockers

## Required evidence

- the linked verification request or verification bundle id
- the claim text and the Proof Pack or proof item it supports
- verifier response payload or contradiction details
- current trust state and any freshness issue already recorded

## Operator steps

1. Open the queue item in `/admin/verification` and confirm the linked entity id matches the request under review.
2. Read the claim exactly as written. Do not broaden the claim to save the request.
3. Review the verifier response, existing trust state, and any contradiction or freshness note.
4. Decide one of the following:
   - keep pending because evidence is incomplete
   - downgrade or dispute because the claim is contradicted or insufficient
   - resolve because the manual review outcome is clear and already reflected in product state
5. Write an operator note that states what was reviewed, what evidence was missing or sufficient, and what state should remain true after the queue item closes.
6. Move the queue item with the narrowest valid action:
   - `open -> in_progress` while review is active
   - `open|in_progress -> resolved` when the state outcome is complete
   - `open|in_progress -> cancelled` only if the request is invalid or duplicate
   - `resolved|cancelled -> open` only if new evidence materially changes the review

## Hold conditions

- Keep the item open or in progress if the verifier response does not clearly support the claim.
- Keep the stronger trust label paused if freshness, contradiction, or identity concerns remain unresolved.
- Escalate instead of resolving if the dispute now affects reveal permissions or a live intro, interview, or decision path.

## Audit requirement

- Every resolve, cancel, or reopen action must include an operator note.
- The note must state: claim reviewed, evidence checked, decision, and follow-up if any.
- Confirm the action appears in `/admin/audit` before closing the task.
