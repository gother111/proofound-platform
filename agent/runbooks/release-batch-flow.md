> Doc Class: `runbook`
> Last Verified: `2026-03-11`

# Release Batch Flow

Use this flow to ship smaller production batches while keeping Vercel on the single `proofound-platform` project.

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

## Promote to production

- Merge the release PR into `master` with squash merge.
- Confirm the new production deployment completes.
- Confirm the deployed commit matches `master`:
  - `curl -sS https://proofound.io/api/health`

## Failure handling

- If the workflow fails during cherry-pick, fix the conflict on a normal branch and re-run the release workflow with the corrected SHAs.
- If Vercel skips the build unexpectedly, run:
  - `npm run vercel:should-build -- --changed-files <comma-separated-paths>`
- If production falls behind, use the existing retry workflow:
  - `gh workflow run "Retry Vercel Deploy Until Synced" --ref master`
