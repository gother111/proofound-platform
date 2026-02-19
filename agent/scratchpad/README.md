# Session Scratchpad Entries

This directory contains per-session logs to avoid repeated merge conflicts on a single shared file.

## Rules

- Create one new file per session in `agent/scratchpad/entries/`.
- Do not edit prior entry files unless you are fixing factual mistakes.
- Do not append new session logs to `agent/scratchpad.md`.
- Use `npm run log:session` to create a new entry template.

## Filename Convention

- `YYYY-MM-DDTHH-MM-SSZ__<branch>__<shortsha>.md`
- Timestamp is UTC.
- Branch and SHA are derived from git.

## Legacy File

- `agent/scratchpad.md` is retained as historical archive/index.
