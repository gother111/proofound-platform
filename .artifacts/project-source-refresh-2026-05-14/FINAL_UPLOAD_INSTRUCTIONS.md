# Final Upload Instructions

Generated: 2026-05-14T11:40:35.829Z

Upload folder: `/Users/yuriibakurov/proofound/.artifacts/project-source-refresh-2026-05-14/`

## Read First

1. `PROJECT_SOURCE_REPLACEMENT_MAP.md`
2. `CURRENT_REPO_SUMMARY.md`
3. `SOURCE_AUTHORITY_STACK.md`
4. `CURRENT_TEST_AND_LAUNCH_EVIDENCE.md`
5. `MVP_SCOPE_ALIGNMENT_CURRENT.md`

## Then Upload For Evidence

- `ROUTE_INVENTORY_CURRENT.md` and `route-inventory-current.json`
- `DOCS_INVENTORY_CURRENT.md` and `docs-inventory-current.json`
- `DEPENDENCY_AND_SECURITY_STATE.md` and `npm-audit-production.json`
- `LANDING_AND_PUBLIC_STORY_CURRENT.md`
- `CURRENT_TECHNICAL_REFERENCES/`
- `launch-validation-current/`
- `command-logs/` if ChatGPT needs raw proof

## Large / Optional Files

- `docs-inventory-current.json` and `DOCS_INVENTORY_CURRENT.md` may be large because they include repo docs and archives.
- `command-logs/` is useful for auditability but can be uploaded after the summary files if upload limits are tight.
- `api-reference-generation-workspace-*` is support evidence for regenerated API reference; it is optional if upload size is tight.

## Known Limitations

- The worktree was dirty before this package; this bundle reflects the current local checkout, not a pristine release branch.
- Aggregate `launch:validate` reports GO because launch smoke is not applicable without `BASE_URL`; the explicit local launch smoke command failed the full org corridor scenario.
- Initial sandbox attempts for privacy/audit/server-bound checks failed; `.rerun.log` files are the current elevated results.
