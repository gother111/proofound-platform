> Doc Class: `active`
> Last Verified: `2026-05-19`

# Supabase MCP Setup Guide

Supabase MCP is an optional operator tool for inspecting a Supabase target from Codex/Cursor-style
agents. It is not a product surface, not an MVP scope source, and not launch evidence by itself.

Use the root [`SETUP_SUPABASE.md`](../SETUP_SUPABASE.md) guide for target setup, and
[`docs/ENV_VARIABLES.md`](ENV_VARIABLES.md) for environment variables.

## Launch-Safe Posture

- Prefer read-only inspection: table lists, advisors, logs, migration status, and narrow diagnostic
  queries.
- Run write or DDL operations only when the target and operation are explicit.
- Do not use MCP to bypass the migration runbooks for production or production-candidate changes.
- Do not paste service-role keys, database URLs, private proof content, user data, organization data,
  signed URLs, or raw query results into public logs, screenshots, tickets, docs, or chat.
- Do not treat an old MCP table snapshot as current launch evidence.

## Configuration

Configure the MCP server with a target-specific project ref outside committed docs:

```json
{
  "mcpServers": {
    "SupabaseMCP": {
      "url": "https://mcp.supabase.com/mcp?project_ref=<project-ref>"
    }
  }
}
```

The project ref is environment-specific. Confirm it from the intended target, not from historical
docs or old screenshots.

## Required Local Environment

Create `.env.local` locally and keep it out of git:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.your-project-ref:[PASSWORD]@aws-1-region.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

Security notes:

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Store it server-side only.
- `DATABASE_URL`, `DIRECT_URL`, and service-role credentials are secrets.
- Use a local/test target for exploratory work whenever possible.
- If a production target is involved, name the target and record the reason before running anything
  that can mutate data or schema.

## What MCP Is Useful For

- Security advisor checks.
- Performance advisor checks.
- Log inspection after a focused failure.
- Read-only table or migration status inspection.
- Target confirmation before a launch evidence run.

## What MCP Should Not Replace

Use the repo-owned commands for launch and migration evidence:

```bash
npm run db:drift-check
npm run db:backup:checkpoint
npm run db:audit:migrations
npm run db:migrate
npm run db:restore:verify -- --checkpoint <checkpoint-dir>
```

Rules:

- Do not use direct schema-push commands for production workflows.
- Do not use dashboard SQL paste or MCP ad-hoc DDL as normal launch evidence.
- Do not verify restore behavior against the live database.
- Do not broaden MVP scope because an old table or route still exists in a target.

## Safe Example Uses

Ask the MCP tool to:

- list public tables on the intended target;
- summarize Supabase security advisor findings;
- summarize Supabase performance advisor findings;
- inspect recent database logs for a specific request id or migration id;
- confirm whether the migration ledger contains the expected migration ids.

When reporting results, redact private identifiers and avoid raw row dumps.

## Troubleshooting

- Missing environment variables: check `.env.local` against [`docs/ENV_VARIABLES.md`](ENV_VARIABLES.md).
- MCP auth failure: re-authenticate the MCP connector and confirm the project ref belongs to the
  intended target.
- Connection pooler timeout: use `DIRECT_URL` for migration/tooling paths where the runbook expects
  a direct connection.
- Conflicting MCP and repo evidence: treat repo files and current target-specific command output as
  authoritative. Old MCP snapshots are historical context only.
