> Doc Class: `active`
> Last Verified: `2026-05-19`

# Redaction / Risky Upload SOP

## Use this SOP when

- an upload enters `manual_review`
- filename sanitization, metadata flags, or identity-bearing content creates a privacy risk
- an operator needs to decide whether evidence can enter the Proof Pack corridor safely

This SOP covers only privacy-safe evidence handling for MVP.

## Owner and escalation

- Owner: `Support / verification lead`
- Escalate to `Product / ops lead` if the evidence is central to a live assignment-review decision
- Escalate immediately to `Engineering on-call` for any active privacy leak, wrong reveal state, or ingest malfunction
- Pilot SLA target: first triage within `1 business day`; immediate escalation for active leaks

## Required evidence

- uploaded file id
- sanitized filename and stored review reasons
- upload kind and source surface
- any sensitivity hint already attached to the upload
- the proof or engagement context that the file was meant to support

## Operator steps

1. Open the queue item and confirm it is the `redaction / risky upload` queue backed by `correction_revocation`.
2. Review the stored review reasons first. Start with metadata and filename risk before looking at the content itself.
3. Decide whether the file can be:
   - kept withheld pending safer evidence
   - manually cleared because the risk has been removed or judged non-identity-bearing
   - rejected because the artifact cannot enter MVP review safely
4. If the evidence can remain in corridor use, keep only the sanitized, privacy-safe representation. Do not restore identity-bearing names or metadata for convenience.
5. Write an operator note that names the risk, the safe outcome, and whether replacement evidence is needed.
6. Update the queue item status.

## Hold conditions

- Hold the upload if metadata, filename, screenshot, or document content still exposes identity-bearing data too early in the reveal flow.
- Hold the upload if you cannot tell whether the artifact belongs to the intended Proof Pack or engagement record.
- Escalate instead of clearing if the file may already have leaked through a public or review surface.

## Audit requirement

- Resolve, cancel, and reopen actions must include the risk reviewed and the safe handling outcome.
- If the outcome changes what evidence can be shown in the corridor, confirm the queue action is visible in `/admin/audit`.
