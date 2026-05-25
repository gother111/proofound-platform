# Session Scratchpad Entries

> Doc Class: `active`
> Last Verified: `2026-05-19`

This directory contains per-session logs to avoid repeated merge conflicts on a single shared file.

## Rules

- Create one new file per session in `agent/scratchpad/entries/`.
- Do not edit prior entry files unless you are fixing factual mistakes.
- Do not append new session logs to `agent/scratchpad.md`.
- Use `npm run log:session` to create a new entry template.
- The log script creates a real file; extra arguments such as `--help` are not a dry run.
- Do not include secrets, env values, private proof content, hidden identity details, raw AI prompts/responses, signed URLs, or private user data.
- For Browser/manual UI evidence, record route, viewport, role/mode, and finding.
- For launch or MVP claims, distinguish current evidence from historical notes.

## Filename Convention

- `YYYY-MM-DDTHH-MM-SSZ__<branch>__<shortsha>.md`
- Timestamp is UTC.
- Branch and SHA are derived from git.

## Legacy File

- `agent/scratchpad.md` is retained as historical archive/index.
- Routine work should not append to `agent/scratchpad.md`; use sharded entries instead.
