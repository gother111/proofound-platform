# Documentation Audit

Audit snapshot: `2026-03-05`

## Category Score

### Documentation Accuracy: 2/5

The repository has extensive documentation, but several active docs no longer describe the implemented system or the current verification reality. The main issue is not missing documentation volume. It is stale and conflicting documentation around accessibility, QA status, cron behavior, and release gates.

## Top 5 Documentation Mismatches

1. `docs/ACCESSIBILITY.md` says `@axe-core/playwright` is still "to be configured", while `package.json` ships `test:a11y` and the suite currently fails.
2. `docs/qa/summary.md` records `npm run test` as passing on `2026-03-01`, but the current baseline has 1 failing test.
3. `README.md` still documents deletion reminder and deletion processing cron jobs as live schedules even though account deletion is immediate and `vercel.json` does not schedule those routes.
4. `agent/checklists/verification.md` says CI runs perf budgets and go/no-go gates, but `.github/workflows/ci.yml` does not run them.
5. `project/Documentation.md` still behaves like an append-only running log and fails the repo’s own freshness convention warning.

## Findings

### DA-01: Accessibility doc contradicts the actual test surface and current status

- Status: Fact
- Severity: P1
- Type: Documentation-only
- Evidence:
  - `docs/ACCESSIBILITY.md:18` says `@axe-core/playwright` is "to be configured"
  - `package.json` defines `test:a11y`
  - `docs/ACCESSIBILITY.md:53-77` marks critical flows as keyboard-accessible and verified
  - Current run on `2026-03-05`: `npm run test:a11y` failed with 5 cases
- Why it matters:
  - The doc overstates compliance readiness and hides active failures from anyone relying on it for release or compliance decisions.
- Next action:
  - Rewrite the doc as a current-state audit with separate sections for verified coverage, failing coverage, and unverified manual claims.

### DA-02: QA summary is now historical, but it reads as current truth

- Status: Fact
- Severity: P1
- Type: Documentation-only
- Evidence:
  - `docs/qa/summary.md:10-28` labels the automation surface as current
  - `docs/qa/summary.md:49-58` records `npm run test` and other core commands as pass
  - Current run on `2026-03-05`: `npm run test` failed with 1 failing test
- Why it matters:
  - This creates false confidence for anyone using the doc as a release checklist or CI parity reference.
- Next action:
  - Split historical pass logs into an archive section and keep only the current command matrix in the active summary.

### DA-03: Cron documentation still describes an older deletion model

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `README.md:279-283` documents `/api/cron/process-deletions` and `/api/cron/send-deletion-reminders` as scheduled jobs
  - `src/app/api/user/account/route.ts:24-30` states account deletion is immediate and irreversible
  - `src/app/api/cron/account-deletion-workflow/route.ts:8-13` says scheduled deletion/reminder processing is intentionally disabled
  - `vercel.json:9-26` schedules no reminder or deletion processing routes
  - `docs/CRON_SETUP.md:132-296` still instructs operators to configure those legacy jobs
- Why it matters:
  - Operators and reviewers can configure or expect behavior that no longer exists.
  - This also weakens privacy/compliance communication because the documented retention model no longer matches the implementation.
- Next action:
  - Update all cron docs and privacy-adjacent docs to the immediate deletion model, and mark compatibility routes as retained but inactive.

### DA-04: Verification checklist claims CI gates that the workflow does not enforce

- Status: Fact
- Severity: P1
- Type: Documentation-only
- Evidence:
  - `agent/checklists/verification.md:99-103` says CI runs `perf:budgets` and `go:no-go`
  - `.github/workflows/ci.yml:61-132` installs, lints, typechecks, tests, builds, and runs selected E2E suites, but contains no `perf:budgets` or `go:no-go` steps
- Why it matters:
  - Engineers can believe release gates are protected in CI when they are only available locally or through separate scripts.
- Next action:
  - Either wire those gates into CI or remove the claim from the active verification checklist.

### DA-05: Freshness governance is inconsistently applied to active docs

- Status: Fact
- Severity: P2
- Type: Documentation-only
- Evidence:
  - `npm run docs:freshness` passed with warning: missing freshness metadata near top of `project/Documentation.md`
  - `project/Documentation.md:1-20` begins immediately with dated log entries rather than governance metadata
- Why it matters:
  - The repo has freshness tooling, but one of the most frequently touched docs does not comply with it.
  - That reduces trust in the broader doc governance model.
- Next action:
  - Normalize `project/Documentation.md` to the same metadata contract as other active docs or archive it from the active freshness set.

### DA-06: Deployment and monitoring docs appear broader than the live scheduled system

- Status: Strong inference
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `docs/DEPLOYMENT_CHECKLIST.md`, `docs/CRON_SETUP.md`, and `docs/alert-configuration.md` describe cron-job.org and additional cron routes not present in `vercel.json`
  - `docs/monitoring-alerting.md` and `docs/deployment-guide.md` contain older "Last Updated" stamps and historical runbook language
- Why it matters:
  - The operational doc surface is large enough that active and archived guidance are hard to distinguish.
- Next action:
  - Declare a canonical active ops doc set and archive or demote older deployment/cron guides that no longer reflect the deployed plan.
