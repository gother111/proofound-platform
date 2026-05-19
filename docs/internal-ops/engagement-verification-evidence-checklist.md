> Doc Class: `active`
> Last Verified: `2026-05-19`

# Engagement Verification Evidence Checklist

## Use this checklist when

- a hire or engagement record needs MVP trust confirmation
- a `pilot_ops` queue item asks whether post-decision evidence is strong enough
- support must decide whether to keep engagement verification pending or verified

## Owner and escalation

- Owner: `Support / verification lead`
- Escalate to `Product / ops lead` if the evidence dispute affects a live customer relationship or corridor outcome
- Escalate to `Engineering on-call` only if the engagement record or uploaded evidence is not loading correctly
- Pilot SLA target: first review within `1 business day`

## Minimum acceptable MVP evidence

Any one of the following is acceptable:

- mutual attestation from both sides on the same engagement fact
- uploaded offer letter, signed agreement, SOW, invoice, or equivalent evidence
- matching org confirmation plus candidate confirmation

Anything weaker stays pending.

## Checklist

- Does the evidence tie to the same candidate, organization, and engagement fact?
- Does the evidence confirm the engagement existed, not just that interviews happened?
- If the evidence is a document, is it safe to keep under the current privacy controls?
- If the evidence is attestation, do both sides agree on the same fact?
- Is there enough support to mark the trust state `verified` without optimistic interpretation?

## Operator steps

1. Open the engagement verification record and confirm the linked decision, candidate, and organization.
2. Match the available evidence against the minimum acceptable MVP list above.
3. If the evidence is sufficient, document which acceptable path was met.
4. If the evidence is not sufficient, keep the state pending and request the smallest missing item.
5. Record the decision in the queue note before resolving or leaving the item in progress.

## Audit requirement

- The note must name the acceptable evidence path used, or the exact missing evidence that kept the record pending.
- Never mark an engagement verified with a note that only says “confirmed.”
