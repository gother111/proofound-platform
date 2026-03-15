# Block 3 Rerun Report

## objective

Reconcile the stale audit claim that `npm run typecheck` fails on missing `.next/types` files by rerunning the verification path under the repo-pinned Node `20.20.0` runtime and updating only the reusable verification guidance if the failure no longer reproduces.

## commands run

- `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"`
- `node -v`
- `rg -n "\\.next/types|build first regenerates|typecheck.*build|stale \\.next|route types" agent/checklists/verification.md docs/verification-checklist.md docs/codex-progress.md docs/proofound-hard-audit-2026-03-14-rerun.md project/changes/entries Documentation.md metrics.md -S`
- clean isolated-copy rerun:
  ```bash
  export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"
  TMP_DIR=$(mktemp -d /tmp/proofound-typecheck-clean-XXXXXX)
  rsync -a --delete \
    --exclude='.git' \
    --exclude='.next' \
    --exclude='.next.*' \
    --exclude='playwright-report' \
    --exclude='test-results' \
    /Users/yuriibakurov/proofound/ "$TMP_DIR/"
  rm -rf "$TMP_DIR/node_modules"
  ln -s /Users/yuriibakurov/proofound/node_modules "$TMP_DIR/node_modules"
  cd "$TMP_DIR"
  node -v
  npm run typecheck
  ```
- current workspace rerun:
  - `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH && node -v && npm run typecheck && npm run lint && npm run docs:freshness`
- post-edit acceptance rerun:
  - `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH && npm run docs:freshness`
  - `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH && npm run typecheck`
  - `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH && npm run lint`

## files changed

- `agent/checklists/verification.md`
- `docs/codex-progress.md`
- `docs/block-3-rerun-report.md`

## tests run

- clean isolated-copy `npm run typecheck` under Node `v20.20.0`
  - PASS
- current workspace `npm run typecheck` under Node `v20.20.0`
  - PASS
- current workspace `npm run lint` under Node `v20.20.0`
  - PASS with 2 pre-existing warnings:
    - `src/components/ProofoundLanding.tsx` raw `<img>`
    - `src/components/landing/sections/FooterSection.tsx` raw `<img>`
- current workspace `npm run docs:freshness` under Node `v20.20.0`
  - PASS in warning mode with the existing 16 orphan-doc warnings
- post-edit acceptance rerun under Node `v20.20.0`
  - PASS for `npm run docs:freshness` in warning mode with the existing 16 orphan-doc warnings
  - PASS for `npm run typecheck`
  - PASS for `npm run lint` with the same 2 pre-existing landing `<img>` warnings

## result

PASS

The older audit/reporting claim did not reproduce. Fresh evidence now shows `npm run typecheck` passes from a clean-enough local state without `.next`, so the prior `.next/types` failure is stale evidence rather than an active repo defect.

## remaining blockers

- `docs/proofound-hard-audit-2026-03-14-rerun.md` still contains the historical `.next/types` failure finding. It remains preserved evidence and was not rewritten in this rerun block.
- `npm run lint` still reports the 2 pre-existing landing `<img>` warnings unrelated to this rerun.
- `npm run docs:freshness` still reports the known 16 orphan-doc warnings in warning mode.

## exact next recommended action

Keep future verification under the repo-pinned Node `20.20.0` runtime, treat the `.next/types` typecheck blocker as resolved stale evidence, and continue with the current forward block instead of spending additional time on typecheck hardening unless a fresh rerun turns red again.
