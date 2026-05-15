> Doc Class: `governance`
> Sync Pair: `Plans.md`
> Last Verified: `2026-05-14`

# MVP Milestones (Proposal)

Context: This repo already contains substantial implementation. Use this file as stable milestone framing plus validation checklists only. Active MVP implementation authority starts with `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`, then `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`, `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`, `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`, `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`, then fresh repo-grounded audits and evidence; this file must not widen that scope. Historical status snapshots are archived; use `docs/archive/status-reports/root-historical/IMPLEMENTATION_STATUS_CURRENT.md` for point-in-time history and `PRODUCTION_CHECKLIST.md` for current launch readiness checks. (source: Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md, PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md, PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md, LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md, Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md, PRODUCTION_CHECKLIST.md)

## Milestone 1: Foundations (Local Dev + CI Parity Baseline)

Validation checklist:

- `npm run dev` starts and homepage loads.
- `/api/health` returns success locally.
- CI-critical scripts exist and can be run locally as needed: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. (source: package.json)

## Milestone 2: Individual Corridor, Portfolio, and Privacy Controls

Validation checklist:

- Individual profile creation/edit flows work end-to-end.
- Public portfolio publication and link sharing work end-to-end.
- Field-level visibility/redaction controls persist and are enforced in reads/writes.
- No cross-user or cross-org data leakage under RLS.

## Milestone 3: Proof Packs, Matching, and Qualified Intro Readiness

Validation checklist:

- Proof Pack creation, evidence attachment, and proof visibility controls work end-to-end.
- Matching preferences can be edited and persisted.
- Matching endpoints return ranked results deterministically for the same inputs.
- Interest/shortlist/pipeline flows work for both personas.
- Privacy constraints are preserved (no premature identity leakage).

## Milestone 4: Organization Corridor (Trust Profile, Assignment, Review, Interview)

Validation checklist:

- Organization profile creation/edit flows work end-to-end.
- Organization member roles behave correctly (`org_owner`, `org_manager`, `org_reviewer`).
- Assignment creation and workflow transitions work and are protected by RLS.
- Blind-by-default review and reveal stages behave correctly before intros and interviews.
- Interview coordination degrades gracefully when third-party providers are not configured.

## Milestone 5: Launch Readiness (Monitoring, Performance, Ops)

Validation checklist:

- CI passes on the target branch (lint/typecheck/unit/build + perf budgets + go/no-go). (source: .github/workflows/ci.yml)
- Cron schedules are defined in `vercel.json`; cron endpoints validate Bearer `CRON_SECRET` from the `authorization` header. (source: vercel.json, src/app/api/cron/sla-enforcement/route.ts, src/app/api/cron/decision-reminders/route.ts, docs/ENV_VARIABLES.md)
- Observability: setup docs exist for Sentry, structured logging, and monitoring/alerting; confirm production env vars and integrations are configured before launch. (source: docs/sentry-setup.md, docs/structured-logging.md, docs/monitoring-alerting.md)
