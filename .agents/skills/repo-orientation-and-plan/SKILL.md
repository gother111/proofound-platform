---
name: repo-orientation-and-plan
description: Use when starting an unfamiliar repo task, broad implementation, architecture work, or multi-file change. Do not trigger for trivial typo fixes, obvious one-line docs edits, or narrowly scoped commands where the relevant file and verification are already clear.
---

# Repo Orientation And Plan

Use this skill to keep Codex grounded in the real repository before changing behavior.

## Inspect First

- Identify package manager, runtime, framework, language, test runner, and CI gates.
- Read the closest `AGENTS.md`, task-relevant source files, and the smallest relevant canonical docs.
- Identify current behavior before proposing behavior changes.
- Identify high-risk paths: auth, privacy, RLS, uploads, AI, matching/scoring, database, middleware, CI, deployment, env, and production scripts.

## Output

- For large or risky tasks, provide findings, plan, and material assumptions before editing.
- For small safe edits, proceed without ceremony and report the focused verification.
- Keep scope narrow. If the task starts expanding, state the drift and ask whether to split the work.
