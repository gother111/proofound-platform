> Doc Class: `active`
> Last Verified: `2026-03-25`

# Workflow Comms Templates

These are plain-language pilot templates for manual ops handling.

Owner:

- `Support / verification lead`

Escalation:

- `Product / ops lead` for reveal, privacy, or assignment disputes
- `Engineering on-call` for active leaks or broken system behavior

## Verification hold

Subject: `Proofound verification review is still in progress`

Body:

Hi {{name}},

We reviewed the verification response connected to your claim and we still need a little more clarity before we can close it. Your trust state is staying conservative for now, and we are not removing anything automatically.

What we are checking:

- the exact claim that was submitted
- the verifier response we received
- whether the current trust label is still fully supported

We will follow up once the review is complete or if we need one specific missing item from you.

Thanks,
Proofound support

## Risky upload hold

Subject: `Your uploaded evidence is being held for privacy review`

Body:

Hi {{name}},

We received your upload, but it is temporarily held because it may contain identity-bearing filename or metadata details that we do not want to expose too early in the review flow.

What happens next:

- we review the file in its privacy-safe state
- we keep it withheld unless it is safe to use
- if needed, we will ask for a cleaner replacement instead of guessing

We will update you once that review is complete.

Thanks,
Proofound support

## Reveal / privacy dispute acknowledgement

Subject: `We are reviewing your privacy or reveal concern`

Body:

Hi {{name}},

We received your note about reveal or privacy handling and we are reviewing it now. While that review is open, we are keeping the narrower privacy state in place.

We are checking:

- the current reveal stage
- whether candidate consent was present for any identity-bearing reveal
- whether any information appeared earlier than it should have

If we confirm a problem, we will correct the state before closing the review.

Thanks,
Proofound support

## Assignment revision request

Subject: `Assignment needs one more revision before corridor review`

Body:

Hi {{name}},

We reviewed the assignment and it is not yet clear enough for strong proof-first review. Before we keep moving candidates through the corridor, we need the assignment to answer these points more directly:

- what real value the hire should create
- what outcomes matter most
- what proof would count
- what practical constraints are real

Please update the assignment with the missing detail and we will re-check it quickly.

Thanks,
Proofound ops

## Engagement verification reminder

Subject: `Quick follow-up on engagement verification`

Body:

Hi {{name}},

We are still holding the engagement verification record in a pending state because we do not yet have enough evidence to mark it verified in Proofound.

The fastest ways to close this are:

- confirmation from both sides on the same engagement fact
- a signed agreement, SOW, invoice, offer letter, or equivalent evidence
- matching organization confirmation plus candidate confirmation

Reply with the smallest item you can provide and we will take it from there.

Thanks,
Proofound support
