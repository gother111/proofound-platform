# Testing and Release Readiness Audit

Audit snapshot: `2026-03-05`

## Category Scores

### Test Confidence: 2/5

The repo has broad coverage and several strong suites, but the current signal is mixed enough that a green release claim would be misleading.

### Release Readiness: 2/5

A release is possible after targeted stabilization, but the current baseline still contains a failing unit contract, a failing accessibility suite, stale gate documentation, and inconsistent local environment behavior.

## Command Matrix

| Command                         | Result on 2026-03-05 | What it means                                                            |
| ------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| `npm run docs:freshness`        | Pass with warning    | freshness tooling works, but `project/Documentation.md` is out of policy |
| `npm run db:drift-check`        | Pass                 | migration ledger discipline is intact                                    |
| `npm run lint`                  | Pass with 2 warnings | codebase clears lint, but landing image debt remains                     |
| `npm run typecheck`             | Pass                 | TS contracts compile                                                     |
| `npm run test`                  | Fail                 | one confirmed unit-level correctness issue remains                       |
| `npm run build`                 | Pass                 | production build can be produced                                         |
| `npm run start` under Node 20   | Pass                 | prod server is bootable when environment matches repo requirements       |
| `npm run test:privacy`          | Pass                 | base privacy/RLS checks are healthy                                      |
| `npm run test:privacy:extended` | Pass                 | extended privacy/RLS checks are healthy                                  |
| `npm run test:e2e:landing`      | Pass                 | landing contract is stable                                               |
| `npm run test:a11y`             | Fail                 | a11y gate is currently red and not yet a reliable release signal         |

## Findings

### TR-01: The current baseline is not fully green

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - `npm run test` failed with 1 failing test
  - `npm run test:a11y` failed with 5 cases
- Why it matters:
  - The repo currently has both a correctness regression and a red accessibility gate.
  - This alone should prevent an unqualified "release-ready" conclusion.
- Next action:
  - Fix the failing CV import fallback contract and stabilize the accessibility runner before claiming release readiness.

### TR-02: CI coverage is narrower than the active verification checklist claims

- Status: Fact
- Severity: P1
- Type: Documentation-only
- Evidence:
  - `.github/workflows/ci.yml:61-132` runs lint, typecheck, drift check, unit tests, build, auth real, and landing E2E
  - `agent/checklists/verification.md:83-104` says CI also runs strict MVP gates, perf budgets, and go/no-go checks
- Why it matters:
  - Release policy is only as strong as the gates that actually run automatically.
  - The current mismatch makes CI look stricter than it is.
- Next action:
  - Either align CI to the checklist or reduce the checklist to what the workflow enforces today.

### TR-03: Accessibility automation is currently entangled with startup mode and timing

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `package.json` runs `test:a11y` through `scripts/playwright-node20.mjs`
  - cold dev investigation showed first HTML responses around `16s`
  - warm prod browser pass succeeded for the public/auth routes that timed out in the a11y suite
- Why it matters:
  - The suite still needs to be treated as blocking if it stays red, but its current failure mode is not giving a clean product signal.
- Next action:
  - Re-run the a11y suite against a deterministic prod server or add explicit warmup/setup before assertions.

### TR-04: Node 20 is a real release requirement, but local command enforcement is inconsistent

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `package.json` requires `node >=20.20.0 <21`
  - `scripts/playwright-node20.mjs:1-62` and `scripts/next-dev-node20.mjs:1-61` wrap specific flows under Node 20
  - `build` and `start` do not use a wrapper, even though the audit reproduced materially different behavior before switching to Node 20
- Why it matters:
  - Release confidence depends on environment repeatability.
  - Partial enforcement means local validation can still diverge from the intended runtime.
- Next action:
  - Make the required Node version explicit and consistently enforced across all primary developer and release commands.

### TR-05: Privacy and landing coverage are comparatively strong and should anchor the next release hardening pass

- Status: Fact
- Severity: P3
- Type: Cross-cutting
- Evidence:
  - `npm run test:privacy` passed
  - `npm run test:privacy:extended` passed
  - `npm run test:e2e:landing` passed
  - warm Node 20 prod checks returned `200` for `/login` and `healthy` for `/api/health`
- Why it matters:
  - Not all surfaces are equally weak. The repo has reliable pockets of verification that can be used as a baseline while stabilizing weaker areas.
- Next action:
  - Preserve privacy and landing suites as required gates while fixing the failing unit and a11y signals.

## Release Recommendation

Current recommendation: not ready for an unqualified release.

The repo is not broken end to end. It builds, boots, serves, and passes meaningful privacy and landing checks. But the current baseline still has:

- 1 failing unit contract
- 1 failing a11y suite
- stale gate documentation
- inconsistent local environment enforcement

That is a stabilization problem, not a rewrite problem.
