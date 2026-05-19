> Doc Class: `active`
> Last Verified: `2026-05-19`

# Security Scan Results

This file is the current security-scan evidence index for launch-readiness work. It
does not certify the application as secure by itself; use it with
`docs/CURRENT_TRUTH.md`, `docs/production-readiness-checklist.md`, the current
sweep artifact, and fresh command output for the intended target.

Historical zero-vulnerability and "overall A" claims from the 2025 scan were
retired because they no longer match current dependency evidence.

## Current Dependency Evidence

| Check                | Current result                | Evidence                                                                                                                                   |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run audit:prod` | `PASS` with moderate findings | 2026-05-19 approved network rerun exited `0` at the high/critical threshold and reported 9 moderate transitive advisories.                 |
| `npm run audit:all`  | `UNVERIFIED`                  | 2026-05-19 sandbox run failed with DNS `ENOTFOUND`; the escalated external audit was rejected because it sends dependency metadata to npm. |

Current known moderate advisory families:

- `protobufjs` through `@xenova/transformers` / `onnxruntime-web`
- `ws` through `react-email` / Socket.IO

Do not run `npm audit fix --force` as an automatic launch-sweep fix. The current
audit output indicates that force-fixing would introduce breaking dependency
changes and needs a separately scoped upgrade plan.

## Active Security Evidence Sources

Use these current sources instead of historical all-green summaries:

- `docs/CURRENT_TRUTH.md` for the latest local verification and dependency-audit
  summary.
- `docs/verification-checklist.md` for fresh MVP corridor privacy, reveal,
  public-projection, export/delete, and route-surface evidence.
- `docs/production-readiness-checklist.md` and
  `docs/mvp-launch-master-checklist.md` for production-candidate backup,
  restore, internal monitoring, and final signoff requirements.
- `docs/SECURITY_PRIVACY_AUDIT.md`, `docs/SECURITY_PRIVACY_CHECKLIST.md`, and
  `docs/DATA_SECURITY_PRIVACY_ARCHITECTURE.md` for security/privacy review
  context.
- `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md` for the current
  end-to-end MVP surface sweep findings, fixes, and remaining risks.

## Launch Interpretation

Security launch readiness still requires fresh target-specific evidence:

- production-candidate smoke, perf, internal launch-status, and go/no-go gates
- current backup checkpoint and isolated restore report evidence
- privacy/no-leak behavior across public portfolio, organization trust, matching,
  reveal, verification, export/delete, and admin/internal paths
- explicit treatment of any remaining `UNVERIFIED` security or dependency checks

The current `audit:prod` result does not block at the high/critical threshold, but
the moderate transitive advisories remain a tracked risk until upgraded,
accepted, or otherwise mitigated.
