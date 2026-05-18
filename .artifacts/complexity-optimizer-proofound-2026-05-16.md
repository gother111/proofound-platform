> Doc Class: `audit`
> Generated: `2026-05-16`
> Tool: `$complexity-optimizer`

# Proofound Complexity Optimizer Report

## Summary

- Scope analyzed: `/Users/yuriibakurov/proofound`, with focused scans for `src`, `api`, `scripts`, and `python_cv`.
- Stack detected: Next.js 15 / React 18 / TypeScript, Drizzle/Postgres, Supabase, Playwright/Vitest, and Python CV import services.
- Test/build commands detected: `npm run complexity:scan`, `npm run test:python`, `npm run lint`, `npm run typecheck`, `npm run docs:freshness`.
- Highest-impact implemented hotspot: `api/python/cv_import.py::_unique_top_skill_ids`.
- Patch status: implemented two low-risk optimizations; remaining findings are proposed only.
- Files modified: yes.

## Commands Run

- `git status --short`
- `npm run complexity:scan -- --max-findings 80`
- `npm run complexity:scan -- --root src --max-findings 80`
- `npm run complexity:scan -- --root scripts --max-findings 40`
- `npm run complexity:scan -- --root python_cv --max-findings 40`
- `npm run complexity:scan -- --root api --max-findings 40`
- `npm run complexity:scan -- --root api --max-findings 12`
- `PYTHONPATH=. ./.venv311/bin/python -m pytest tests/python/test_cv_import_reports.py -q`
- `PYTHONPATH=. ./.venv311/bin/python -m pytest tests/python/test_cv_import_reports.py tests/python/test_skill_candidate_extract.py -q`
- `npm run test:python`
- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`
- `git diff --check`

## Baseline Notes

- The worktree was already dirty before this pass, including launch artifacts, E2E files, launch contract files, and the previously added `complexity:scan` runner.
- I did not modify unrelated dirty files.
- The scanner is heuristic and lexical. It correctly found useful leads, but it also reported false positives in TypeScript query-builder and validation code, and it still reports a set membership line after the Python optimization because it cannot infer container type.

## Findings

### 1. Implemented: top skill ID report deduplication

- Location: `api/python/cv_import.py:254`
- Current pattern: nested document -> candidate -> suggestion traversal used `skill_id not in ordered_ids` and sliced to 10 only after scanning all suggestions.
- Estimated current complexity: `O(S * U)` membership checks for `S` suggestions and `U` unique IDs, with no early stop after the report already has enough IDs.
- Recommended change: keep ordered output, but track a `seen_ids` set and return as soon as 10 unique skill IDs are collected.
- Estimated complexity after: `O(S)` worst case with `O(1)` membership, and `O(S10)` in the common reporting case where the first 10 unique IDs appear before the end of the suggestion stream.
- Why behavior should remain equivalent: output still preserves first-seen order, ignores non-string IDs, drops duplicates, and caps at 10 IDs.
- Risk level: low.
- Tests or measurements needed: focused report helper test plus Python suite.

### 2. Proposed: Python CV fuzzy matching duplicate work

- Location: `python_cv/skill_matcher.py:87-156`
- Current pattern: each candidate expands token variants, checks exact and alias maps, then runs up to three fuzzy searches with `process.extract(..., limit=80)`.
- Estimated current complexity: roughly `O(C * (V * L + F * M))`, where `C` is candidates, `V` variants, `L` lookup fanout, `F` fuzzy variants, and `M` fuzzy choices considered by RapidFuzz.
- Recommended change: profile before editing; if duplicate normalized candidates are common, cache fuzzy/exact results by normalized variant inside one request and reuse the ranked suggestions.
- Estimated complexity after: best case `O(U * fuzzy_cost + C * merge_cost)` where `U` is unique normalized candidate text.
- Why behavior should remain equivalent: a cache keyed by normalized candidate text can preserve the same matcher output for duplicate inputs, but ordering and scoring must be proven.
- Risk level: medium.
- Tests or measurements needed: `tests/python/test_skill_matcher.py`, `tests/python/test_skill_matcher_fuzz_1000.py`, `tests/python/test_bulk_cv_robustness.py`, and a before/after timing measurement.

### 3. Implemented: fallback skill candidate line normalization

- Location: `python_cv/skill_candidate_extract.py:251-259`
- Current pattern: fallback extraction checked `any(keyword in normalize_token(line) ...)`, which normalized the same line once per keyword and rebuilt the scan keyword union inside the line loop.
- Estimated current complexity: `O(L * K * N)` normalization work for `L` fallback lines, `K` scan keywords, and line-normalization cost `N`.
- Recommended change: create a module-level `FALLBACK_SCAN_KEYWORDS` set and normalize each fallback line once before keyword scanning.
- Estimated complexity after: `O(L * (N + K))`, preserving the same substring keyword checks.
- Why behavior should remain equivalent: the same tool/language keyword set is used, line length filtering is unchanged, and candidate splitting/deduplication still runs through the existing `add_candidate` path.
- Risk level: low.
- Tests or measurements needed: focused fallback extraction test plus Python suite.

### 4. Proposed: skill database index construction

- Location: `python_cv/skill_db.py:119-131`
- Current pattern: names, aliases, and search terms are expanded into token variants and appended into lookup maps during skill DB load.
- Estimated current complexity: `O(N * T * V)` for skills, terms, and generated variants.
- Recommended change: only consider deduplicating expanded variants per skill if DB load becomes measurable; the function is cached after load.
- Estimated complexity after: `O(N * unique(TV))` for index construction.
- Why behavior should remain equivalent: deduping repeated variants before inserting into maps can preserve final lookup maps if duplicate ordering is not observable.
- Risk level: low to medium.
- Tests or measurements needed: `npm run test:python` plus load-time measurement for the real skills DB.

### 5. Proposed: language extraction fallback scans

- Location: `python_cv/entity_extract.py:296-315`
- Current pattern: fallback language extraction scans each line against every language name, then scans matches again while deduplicating codes.
- Estimated current complexity: `O(L * K)` for CV lines and language map size.
- Recommended change: leave as-is unless language extraction appears in profiling; the map is small and the entity list is capped.
- Estimated complexity after: a compiled alternation or trie-like matcher could reduce repeated checks, but would add complexity.
- Why behavior should remain equivalent: any change must preserve substring matching, CEFR parsing, first-seen ordering, and duplicate language code suppression.
- Risk level: low benefit, medium correctness risk.
- Tests or measurements needed: `tests/python/test_entity_extract.py` plus a CV-language fixture with duplicate languages.

### 6. Proposed: TypeScript server action scanner findings

- Location: `src/actions/profile.ts`, `src/actions/onboarding.ts`, `src/actions/org.ts`
- Current pattern: the scanner flagged many query-builder expressions, array reductions, and nested callback shapes.
- Estimated current complexity: mixed; several findings are not true query-in-loop or nested-loop issues after local inspection.
- Recommended change: do not batch or memoize blindly. Use route-level profiling or concrete slow-flow evidence before editing these sensitive server actions.
- Estimated complexity after: unknown without a measured hot path.
- Why behavior should remain equivalent: these areas touch profile, onboarding, organization, and privacy-sensitive behavior; preserving auth, user scoping, ordering, and schema-drift fallbacks matters more than removing scanner warnings.
- Risk level: medium to high for broad edits.
- Tests or measurements needed: targeted action tests, `npm run test`, and strict corridor tests if any behavior changes.

### 7. Proposed: demo and audit scripts

- Location: `scripts/add-demo-assignments.mjs`, `scripts/audit-demo-completeness.mjs`, `scripts/audit-migration-ledger.mjs`
- Current pattern: scanner found nested loops in one-off/demo/audit scripts.
- Estimated current complexity: varies by script input size.
- Recommended change: deprioritize for MVP runtime performance unless a script is actively too slow or blocks CI.
- Estimated complexity after: likely improvable with maps/sets, but low product impact.
- Risk level: low product risk, low priority.
- Tests or measurements needed: script-specific dry runs before changing behavior.

## Changes Made

- Files changed:
  - `api/python/cv_import.py`
  - `python_cv/skill_candidate_extract.py`
  - `tests/python/test_cv_import_reports.py`
  - `tests/python/test_skill_candidate_extract.py`
- Main algorithmic changes:
  - Replaced repeated list membership in report top-skill deduplication with a `seen_ids` set and early return at 10 unique IDs.
  - Replaced repeated fallback-line normalization and repeated keyword-union construction with one normalized line plus a module-level keyword set.
- Complexity before:
  - Top skill report helper: `O(S * U)`, with full stream scan even after 10 unique IDs.
  - Fallback skill scan: `O(L * K * N)` normalization work.
- Complexity after:
  - Top skill report helper: `O(S)` worst case with bounded output, and early completion once the first 10 unique IDs are found.
  - Fallback skill scan: `O(L * (N + K))`.

## Verification

- Focused test:
  - `PYTHONPATH=. ./.venv311/bin/python -m pytest tests/python/test_cv_import_reports.py -q`
  - Result: passed, `1 passed`.
- Combined focused tests:
  - `PYTHONPATH=. ./.venv311/bin/python -m pytest tests/python/test_cv_import_reports.py tests/python/test_skill_candidate_extract.py -q`
  - Result: passed, `2 passed`.
- Python suite:
  - `npm run test:python`
  - Result: passed, `30 passed`.
- Lint:
  - `npm run lint`
  - Result: passed.
- Typecheck:
  - `npm run typecheck`
  - Result: passed.
- Docs freshness:
  - `npm run docs:freshness`
  - Result: exited `0`; warning mode reported 32 existing orphan-file warnings.
- Whitespace:
  - `git diff --check`
  - Result: passed.

## Residual Risk

- No full `npm run test` or build was run because the implemented code paths are Python-only and the goal requested focused verification first plus lint/typecheck/docs freshness.
- The report file itself is a new `.artifacts` entry and may be reported by future docs freshness checks unless the project chooses to register or ignore this artifact class.
- The scanner still reports the optimized helper because it cannot distinguish set membership from list membership.
- Broader TypeScript server-action findings should wait for profiling or a concrete slow user flow before code changes.
