---
name: test-evidence-and-verification
description: Use when implementing, reviewing, stabilizing tests, proving behavior, preparing launch or investor evidence, or deciding which checks are enough. Do not trigger for read-only questions that do not need evidence or verification planning.
---

# Test Evidence And Verification

Use this skill to connect each change to proof.

## Map Change To Checks

- Identify which behavior changed and which tests or commands prove it.
- Start with focused tests for the touched surface.
- Add broader gates when the task affects launch readiness, privacy, auth, database, UX-critical flows, AI safety, deployment, or investor-readiness evidence.
- Capture before/after notes or screenshots for UI where practical.

## Evidence Report

- Record commands run and pass/fail results.
- Record exact evidence collected.
- List skipped tests with reasons.
- Include residual risks and a rollback plan.
- Use `docs/codex/evidence-template.md` when a durable evidence artifact is useful.
