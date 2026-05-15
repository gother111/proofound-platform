# Archive (Historical Docs)

Purpose: preserve historical context without cluttering active documentation.

Nothing in `docs/archive/` is required for day-to-day setup or operations.

## 2026-02-12 Archive Migration

The following historical snapshots were moved from active paths and replaced with redirect stubs.

### Root historical snapshots

- `docs/archive/status-reports/root-historical/CODEBASE_AUDIT_REPORT.md`
- `docs/archive/status-reports/root-historical/DB_INTEGRATION_SUMMARY.md`
- `docs/archive/status-reports/root-historical/DEPLOYMENT_NOTES.md`
- `docs/archive/status-reports/root-historical/GDPR_ANALYTICS_FIX_COMPLETE.md`
- `docs/archive/status-reports/root-historical/IMPLEMENTATION_STATUS_CURRENT.md`
- `docs/archive/status-reports/root-historical/METRICS_INSTRUMENTATION_COMPLETE.md`
- `docs/archive/status-reports/root-historical/PRIVACY_DASHBOARD_IMPLEMENTATION_SUMMARY.md`
- `docs/archive/status-reports/root-historical/PRIVACY_DASHBOARD_TODO.md`
- `docs/archive/status-reports/root-historical/SECURITY_REVIEW_REPORT.md`
- `docs/archive/status-reports/root-historical/SUPABASE_FIGMA_ALIGNMENT_SUMMARY.md`
- `docs/archive/status-reports/root-historical/SUPABASE_MCP_COMPLETE.md`
- `docs/archive/status-reports/root-historical/UI_UX_AUDIT_REPORT.md`

### docs/ historical snapshots

- `docs/archive/status-reports/docs-historical/LINKEDIN_VERIFICATION_IMPLEMENTATION_SUMMARY.md`
- `docs/archive/status-reports/docs-historical/RESTORATION_COMPLETE.md`
- `docs/archive/status-reports/docs-historical/SPRINT_0_1_IMPLEMENTATION_SUMMARY.md`
- `docs/archive/status-reports/docs-historical/final-production-readiness-summary.md`
- `docs/archive/status-reports/docs-historical/platform-completion-implementation-summary.md`
- `docs/archive/status-reports/docs-historical/security-audit-report.md`
- `docs/archive/status-reports/docs-historical/weeks-6-8-summary.md`

### API reference history

- `docs/archive/legacy-platform/api-reference-history/API_DOCUMENTATION_FINAL_2025-11-08.md`
- `docs/archive/legacy-platform/api-reference-history/API_DOCUMENTATION_NEW_ENDPOINTS_2025-11-07.md`
- `docs/archive/legacy-platform/api-reference-history/api-documentation_2025-11-04.md`

## Canonical Active Docs

- Governance: `Prompt.md`, `Plans.md`, `Architecture.md`, `Implement.md`, `setup.md`, `preflight.md`, `verification.md`, `metrics.md`, `Documentation.md`
- Project governance mirrors: `project/Prompt.md`, `project/Architecture.md`, `project/Plans.md`, `project/Implement.md`, `project/Documentation.md`
- Agent runbooks/checklists: `agent/runbooks/setup.md`, `agent/checklists/preflight.md`, `agent/checklists/verification.md`
- Platform overview: `README.md`
- API reference: `docs/API_REFERENCE.md`
- Environment setup: `docs/ENV_VARIABLES.md`
- Deployment and operations: `docs/deployment-guide.md`, `docs/DEPLOYMENT_CHECKLIST.md`, `docs/monitoring-alerting.md`

## Restore Procedure

If a historical doc must become active again:

1. Move it out of `docs/archive/`.
2. Reconcile its contents with current code and workflows.
3. Update `docs/DOCS_REGISTRY.md` classification.
4. Update `project/Documentation.md` with rationale and verification steps.
