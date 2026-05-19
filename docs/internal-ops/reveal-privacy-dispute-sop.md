> Doc Class: `active`
> Last Verified: `2026-05-19`

# Reveal / Privacy Dispute SOP

## Use this SOP when

- a reveal request times out or is disputed
- a candidate disputes a reveal state or says consent was not respected
- identity-bearing data appears too early in review
- a privacy complaint affects a live intro, interview, or decision path

## Owner and escalation

- Owner: `Product / ops lead`
- Escalate immediately to `Engineering on-call` for active privacy leaks, broken reveal controls, or wrong-stage data exposure
- Loop in `Support / verification lead` for user communications and trust-state context
- Pilot SLA target: acknowledge same business day; immediate escalation for active leaks or consent failures

## Required evidence

- linked conversation, match, or decision id
- current reveal stage and the requested reveal action
- candidate consent record or the lack of one
- any user complaint, screenshots, or timestamps showing exposure

## Operator steps

1. Freeze the narrower privacy state first. Do not broaden reveal while the dispute is open.
2. Confirm the current reveal stage and whether candidate approval exists for any identity-bearing access.
3. Review the conversation or reveal history and identify the exact point where the dispute started.
4. Decide one of the following:
   - restore the prior non-identity-bearing stage
   - keep the reveal pending while consent or evidence is re-checked
   - resolve because the reveal path behaved correctly and the complaint has been answered
5. Write an operator note that states the reveal stage, the consent finding, and the user-visible outcome.
6. Send the matching acknowledgement or follow-up from [workflow-comms-templates.md](./workflow-comms-templates.md).

## Hold conditions

- Keep the item open if consent is unclear, missing, or mismatched to the reveal stage.
- Keep the narrower privacy stage if identity-bearing data was shown early or may have been cached in another surface.
- Escalate instead of resolving if the issue affects more than one match, conversation, or user.

## Audit requirement

- Every close or reopen action must record the consent finding and the resulting reveal state.
- If a privacy incident happened, verify an audit entry exists before marking the queue item resolved.
