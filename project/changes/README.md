# Project Change Entries

> Doc Class: `active`
> Last Verified: `2026-05-19`

This directory contains per-task governance change notes in sharded files.

## Rules

- Create one new file per task in `project/changes/entries/`.
- Do not add routine per-task entries to `project/Documentation.md`.
- Use `npm run log:change` to create a new entry template.
- The log script creates a real file; extra arguments such as `--help` are not a dry run.
- Keep entries scoped to what changed, why, how it was verified, and remaining risks.
- Do not include secrets, env values, private proof content, hidden identity details, raw AI prompts/responses, signed URLs, or private user data.
- For UI changes, include Browser/visual evidence only when it was actually gathered, with route, viewport, role/mode, and finding.
- For launch or MVP claims, cite current checks/artifacts rather than old session notes.

## Filename Convention

- `YYYY-MM-DDTHH-MM-SSZ__<branch>__<shortsha>.md`
- Timestamp is UTC.
- Branch and SHA are derived from git.

## Legacy File

- `project/Documentation.md` is retained as historical governance history and index.
- Routine per-task changes should not be appended there; use sharded entries instead.
