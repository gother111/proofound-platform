> Doc Class: `runbook`
> Last Verified: `2026-05-19`

# Release Batch Flow

Use this flow to ship smaller production batches while keeping Vercel on the single `proofound-platform` project.

This runbook describes release mechanics only. It does not replace the current
production-candidate gates in `docs/release-checklist.md`,
`docs/production-readiness-checklist.md`, `docs/backlog/phase-exit-checklist.md`,
or `.artifacts/mvp-surface-sweep-2026-05-19/SURFACE_SWEEP.md`.

## Goal

- Keep feature work off `master`.
- Build and review a release candidate branch in preview.
- Merge only the selected release batch into `master` for production deployment.

## Rules

- Production deploys come only from `master`.
- PRs into `master` must come from `release/*` branches.
- Use squash merge when landing the release branch into `master`.
- Docs-only or governance-only changes may skip the Vercel build through `vercel.json -> ignoreCommand`.

## Prepare a release branch

- Identify the exact feature-branch commits that should ship.
- Run the manual GitHub workflow:
  - `gh workflow run "Prepare Release Candidate" -f release_name=<name> -f commit_shas=<sha1,sha2>`
- The workflow creates:
  - `release/<YYYYMMDD>-<name>`
- The workflow cherry-picks the selected SHAs onto `origin/master` and pushes the branch.

## Review the release candidate

- Open a PR from `release/*` to `master`.
- Wait for the normal preview deployment on the release branch.
- Verify the selected changes only. Do not add unrelated fixes directly to the release branch unless they are part of the batch.
- Before treating the release candidate as launch-ready, run the current target-specific release checklist, including launch smoke, protected launch/perf status, production-candidate backup checkpoint, isolated restore report, and final authenticated `go:no-go`.

## Promote to production

- Merge the release PR into `master` with squash merge.
- Confirm the GitHub Actions prebuilt production workflow completes:
  - `gh run list --workflow "Retry Vercel Deploy Until Synced" --limit 1`
- Confirm the deployed commit matches `master`:
  - `curl -sS https://proofound.io/api/health`
- Confirm the current launch evidence still exists for the promoted target:
  - production-candidate backup checkpoint
  - isolated restore report at `.artifacts/launch-restore-report.json`
  - authenticated `/api/monitoring/launch-status`
  - authenticated `/api/monitoring/perf-status`
  - final `BASE_URL=<production-candidate-url> SUS_STUDY_COMPLETE=true CRON_SECRET=<secret> npm run go:no-go`
- Note:
  - If Vercel Git auto-deploys are still enabled for production, Vercel can still create cloud-build deployments until that setting is intentionally disabled.

## Failure handling

- If the workflow fails during cherry-pick, fix the conflict on a normal branch and re-run the release workflow with the corrected SHAs.
- If Vercel skips the build unexpectedly, run:
  - `npm run vercel:should-build -- --changed-files <comma-separated-paths>`
- If production falls behind, use the existing retry workflow:
  - `gh workflow run "Retry Vercel Deploy Until Synced" --ref master`
