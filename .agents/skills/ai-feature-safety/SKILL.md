---
name: ai-feature-safety
description: Use when work touches AI-assisted features, model calls, ranking, recommendations, scoring, classification, extraction, generated text, privacy preflights, AI logs, or provider configuration. Do not trigger for unrelated UI or CRUD work with no AI path.
---

# AI Feature Safety

Use this skill to keep AI features explicit, privacy-safe, and controlled.

## Invariants

- No hidden ranking or scoring of people.
- No AI path may bypass privacy preflights, consent, visibility controls, or user control.
- No sensitive prompt, response, document, PII, or secret data should be logged.
- AI output must not auto-publish, auto-verify, auto-rank, shortlist, recommend, or change hiring state unless the approved product contract explicitly allows it.

## Verification

- Run focused AI safety tests for redaction, request safety, provider controls, usage ledgers, and log safety.
- For provider or production-adjacent changes, require explicit approval and evidence of safe-mode behavior.
- Report any unsafe automation, consent gap, log exposure risk, or unclear user control.
