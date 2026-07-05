---
name: database-migrations-and-rollback
description: Use when work touches schema, migrations, RLS policies, triggers, indexes, seed data, backups, restore flows, data retention, or database scripts. Do not trigger for application-only changes that read existing database contracts without changing them.
---

# Database Migrations And Rollback

Use this skill to keep database work reversible and explicit.

## Before Changing Database Files

- Ask for permission and provide a written motivation before creating or editing migrations.
- Prefer additive, reversible migrations.
- Prefer new migrations over editing existing migrations.
- Identify RLS, trigger, index, retention, seed, backup, and restore implications.
- Never run migrations against remote, staging, or production targets unless the user explicitly names and approves that target.
- Do not run `npm run db:push` against production.

## Verification

- Use local or isolated dev/test environments.
- Run migration drift/audit checks when relevant.
- Run focused privacy/RLS tests for policy changes.
- Include rollback notes, checkpoint guidance, and residual data risk.
