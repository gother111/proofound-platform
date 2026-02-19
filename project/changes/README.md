# Project Change Entries

This directory contains per-task governance change notes in sharded files.

## Rules

- Create one new file per task in `project/changes/entries/`.
- Do not add routine per-task entries to `project/Documentation.md`.
- Use `npm run log:change` to create a new entry template.

## Filename Convention

- `YYYY-MM-DDTHH-MM-SSZ__<branch>__<shortsha>.md`
- Timestamp is UTC.
- Branch and SHA are derived from git.

## Legacy File

- `project/Documentation.md` is retained as historical governance history and index.
