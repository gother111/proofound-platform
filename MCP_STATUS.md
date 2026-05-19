> Doc Class: `active`
> Last Verified: `2026-05-19`

# Supabase MCP Status

This file is a technical setup and discovery note only. It is not an MVP source of truth, product
scope document, or launch signoff artifact.

Use [`docs/SUPABASE_MCP_SETUP.md`](docs/SUPABASE_MCP_SETUP.md) for setup instructions and
[`SETUP_SUPABASE.md`](SETUP_SUPABASE.md) for target-agnostic Supabase environment setup.

## Current Status

### MCP Configuration

- Status: optional operator tool.
- Target: confirm from the active connector or local MCP config before each run.
- Project refs are environment-specific and must not be treated as stable launch truth.

### Safe Use

Use Supabase MCP for:

- read-only schema inspection;
- security and performance advisor checks;
- log inspection for a specific failure or request id;
- migration ledger inspection;
- target confirmation before a launch evidence run.

Do not use Supabase MCP to:

- define MVP product scope;
- substitute for the migration runbooks;
- run ad-hoc DDL against production or production-candidate targets without an explicit target and
  operation;
- expose service-role keys, database URLs, private proof content, user/org data, signed URLs, or raw
  row dumps;
- treat an old table snapshot as current launch evidence.

## Discovery Snapshot Policy

If MCP discovery is useful, save a dated artifact that includes:

- target class, such as local, staging, production-candidate, or production;
- target URL or deployment id when relevant;
- whether the run was read-only;
- query/advisor/log scope;
- redaction notes;
- remaining risks or follow-up owner.

Schema presence does not mean a route, table, or workflow belongs in the locked MVP corridor.

## Current Issues Worth Tracking

- Security advisor findings must be refreshed against the intended target before launch signoff.
- Performance advisor findings must be paired with query/runtime evidence before index removal.
- Auth, RLS, storage, privacy, export/delete, reveal, and admin/internal queue behavior must be
  verified through the current repo tests and target-specific smoke checks, not old MCP snapshots.

## Local Setup Reminders

- Keep `.env.local` untracked.
- Keep service-role credentials server-only.
- Restart the local dev server after environment changes.
- Use `DIRECT_URL` only where the migration/tooling runbook expects a direct connection.
