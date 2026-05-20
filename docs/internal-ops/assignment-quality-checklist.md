> Doc Class: `active`
> Last Verified: `2026-05-19`

# Assignment Quality Checklist

## Use this checklist when

- an assignment is about to be published
- pilot ops has to decide whether an assignment is clear enough to stay in the corridor
- a queue item points to assignment vagueness, weak outcomes, or unrealistic constraints

## Owner and escalation

- Owner: `Product / ops lead`
- Escalate to `Support / verification lead` if the issue is really missing proof, trust, or privacy handling rather than assignment clarity
- Escalate to `Engineering on-call` only for product defects that block assignment create, edit, or publish
- Pilot SLA target: complete before publish or within `1 business day` of a queue handoff

## Required checks

- Does the assignment say what real value the engagement should create?
- Does it name concrete outcomes, not just generic responsibilities?
- Does it say what proof would count?
- Does it state real constraints: scope, logistics, engagement type, timing, or must-haves?
- Does the language avoid vague job-description fluff that weakens privacy-safe review quality?

## Publish decision

- `Ready to publish`: all required checks are clear enough for privacy-safe proof review.
- `Needs revision`: missing value, outcomes, proof expectations, or practical constraints.
- `Hold`: assignment quality is too weak to support trustworthy corridor review.

## Operator steps

1. Read the assignment as if you had to decide submission fit without back-channel context.
2. Confirm the business value, real outcomes, proof expectation, and practical constraints are all present.
3. If the assignment is weak, write the minimum revision request needed to restore clarity.
4. If the assignment is corridor-safe, record that it passed the checklist and move on.
5. If the assignment blocks the corridor, open or update the related `pilot_ops` item with a concrete revision ask.

## Audit requirement

- When a queue item is involved, the operator note must say which checklist point failed or passed.
- Do not resolve a pilot ops assignment-quality item with a generic note like “looks better now.”
