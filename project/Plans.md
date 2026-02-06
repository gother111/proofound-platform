# MVP Milestones (Proposal)

Context: This repo already contains substantial implementation. Use this file as a stable milestone framing plus validation checklists; for current progress and launch readiness context, start with `IMPLEMENTATION_STATUS_CURRENT.md` and `PRODUCTION_CHECKLIST.md`. (source: IMPLEMENTATION_STATUS_CURRENT.md, PRODUCTION_CHECKLIST.md)

## Milestone 1: Foundations (Local Dev + CI Parity Baseline)

Validation checklist:

- `npm run dev` starts and homepage loads.
- `/api/health` returns success locally.
- CI-critical scripts exist and can be run locally as needed: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. (source: package.json)

## Milestone 2: Profiles + Privacy Controls

Validation checklist:

- Individual profile creation/edit flows work end-to-end.
- Organization profile creation/edit flows work end-to-end.
- Field-level visibility/redaction controls persist and are enforced in reads/writes.
- No cross-user or cross-org data leakage under RLS.

## Milestone 3: Matching + Interest + Pipeline

Validation checklist:

- Matching preferences can be edited and persisted.
- Matching endpoints return ranked results deterministically for the same inputs.
- Interest/shortlist/pipeline flows work for both personas.
- Privacy constraints are preserved (no premature identity leakage).

## Milestone 4: Organization Workflow (Assignments, Interviews, Contracts)

Validation checklist:

- Organization member roles behave correctly (owner/admin/member/viewer).
- Assignment creation and workflow transitions work and are protected by RLS.
- Interview/contract flows degrade gracefully when third-party providers are not configured.

## Milestone 5: Launch Readiness (Monitoring, Performance, Ops)

Validation checklist:

- CI passes on the target branch (lint/typecheck/unit/build + perf budgets + go/no-go). (source: .github/workflows/ci.yml)
- Cron jobs are configured in production and protected by `CRON_SECRET`. (source: vercel.json, docs/ENV_VARIABLES.md)
- Observability is configured (Sentry/logging/alerts) for production. (source: docs/sentry-setup.md, docs/structured-logging.md, docs/monitoring-alerting.md)
