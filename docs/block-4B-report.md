# Block 4B Report

## objective

Reduce cold-start latency risk on `/api/monitoring/launch-status` without weakening truthfulness or freshness semantics.

## commands run

- repo context and reproduction:
  - `git status --short`
  - `tail -n 30 docs/codex-progress.md`
  - `npm run dev -- -p 33101`
  - `curl -sS -o /tmp/launch-status-33101.json -w 'code=%{http_code} connect=%{time_connect} starttransfer=%{time_starttransfer} total=%{time_total}\n' --max-time 25 http://127.0.0.1:33101/api/monitoring/launch-status`
  - `npm run dev -- -p 33102`
  - `curl -sS -o /dev/null -w 'code=%{http_code} starttransfer=%{time_starttransfer} total=%{time_total}\n' --max-time 30 http://127.0.0.1:33102/`
  - `curl -sS -o /dev/null -w 'code=%{http_code} starttransfer=%{time_starttransfer} total=%{time_total}\n' --max-time 30 http://127.0.0.1:33102/login`
  - `curl -sS -o /dev/null -w 'code=%{http_code} starttransfer=%{time_starttransfer} total=%{time_total}\n' --max-time 30 http://127.0.0.1:33102/api/health`
  - `curl -sS -o /tmp/launch-status-33102-warm.json -w 'code=%{http_code} starttransfer=%{time_starttransfer} total=%{time_total}\n' --max-time 15 http://127.0.0.1:33102/api/monitoring/launch-status`
- targeted verification after code change:
  - `export PATH="$HOME/.nvm/versions/node/v20.20.0/bin:$PATH"`
  - `npm run test -- tests/lib/launch-synthetic-monitors.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts`
- fresh evidence and cold-start rerun:
  - `npm run test:launch:smoke`
  - `npm run dev -- -p 33103`
  - `node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33103'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','monitor:launch'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"`
  - `curl -sS -o /tmp/launch-status-33103-cold.json -w 'code=%{http_code} starttransfer=%{time_starttransfer} total=%{time_total}\n' --max-time 25 http://127.0.0.1:33103/api/monitoring/launch-status`
  - `python3 - <<'PY' ... PY` to inspect `ok`, `readinessState`, `source`, `summary`, and `evidence` from `/tmp/launch-status-33103-cold.json`
  - `node -e "require('dotenv').config({path:'.env.local'}); process.env.BASE_URL='http://127.0.0.1:33103'; process.env.SUS_STUDY_COMPLETE='true'; process.env.GO_NO_GO_RUN_SYNTHETICS='0'; const {spawnSync}=require('node:child_process'); const result=spawnSync('npm',['run','go:no-go'],{stdio:'inherit',env:process.env}); process.exit(result.status ?? 1);"`
- acceptance and blocker isolation:
  - `npm run typecheck`
  - `find .next/types -maxdepth 6 \( -path '.next/types/app/api/monitoring/*' -o -path '.next/types/app/api/health/*' -o -path '.next/types/app/login/*' -o -path '.next/types/app/app/o/*' -o -path '.next/types/app/layout.ts' -o -path '.next/types/app/page.ts' \) -print`
  - `npm run build`
  - `npm run typecheck`

## files changed

- `docs/codex-progress.md`
- `docs/block-4B-report.md`
- `src/app/api/monitoring/launch-status/route.ts`
- `src/app/api/monitoring/__tests__/launch-status-route.test.ts`
- `src/lib/launch/synthetic-monitors.ts`
- `tests/lib/launch-synthetic-monitors.test.ts`

## tests run

- `npm run test -- tests/lib/launch-synthetic-monitors.test.ts src/app/api/monitoring/__tests__/launch-status-route.test.ts`
  - PASS
- `npm run test:launch:smoke`
  - PASS
- dotenv-backed `npm run monitor:launch` against `http://127.0.0.1:33103`
  - PASS
  - persisted fresh `9/9` passing monitor rows
- first cold `curl --max-time 25 http://127.0.0.1:33103/api/monitoring/launch-status`
  - PASS
  - `200` in about `2.73s`
  - body reported `ok:true`, `readinessState:"ready"`, `source:"persisted"`, `expectedMonitors:9`, `reportedMonitors:9`, `p1Failures:0`, `p2Failures:0`
- dotenv-backed `npm run go:no-go` with `GO_NO_GO_RUN_SYNTHETICS=0`
  - PASS
- `npm run typecheck`
  - PARTIAL
  - first failure was transient `.next/types` artifact drift
  - after `npm run build`, the remaining failure narrowed to unrelated worktree code in `src/lib/matching/review-contract.ts`
- `npm run build`
  - PARTIAL
  - build reached the app typecheck phase, then failed on the unrelated `intro_accepted_masked` typing error in `src/lib/matching/review-contract.ts`

## result

PARTIAL

The Block 4B launch-status objective passed: the route is now persisted-first, conservative on stale or missing evidence, and materially faster on a fresh first hit. The block is marked partial because final repo-wide `typecheck` / `build` are still blocked by unrelated existing org-corridor work in `src/lib/matching/review-contract.ts`.

## remaining blockers

- Unrelated existing type error in `src/lib/matching/review-contract.ts`:
  - `intro_accepted_masked` is present in the reason dictionary object but not in the corresponding record key type
- Current workspace remains a large dirty tree with unrelated in-flight changes outside Block 4B scope

## exact next recommended action

Resolve the unrelated `intro_accepted_masked` typing mismatch in `src/lib/matching/review-contract.ts`, rerun `npm run build` and `npm run typecheck`, and keep the persisted-first `launch-status` behavior unchanged.
