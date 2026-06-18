# Repo Archive Plan

This is planning only. No repo files were moved or deleted in this pass.

## Later Move To Archive

Recommended future destinations are `docs/archive/` for docs that should remain human-readable and `.artifacts/archive/` for generated audit artifacts.

| Current repo path or source title                                                    | Proposed action                                                                            | Reason                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `audit/full-scale-audit-2026-04-16.md`                                               | Move to `.artifacts/archive/` or add superseded banner                                     | Old audit truth replaced by May 29 audit package                        |
| `project/changes/entries/2026-04-09__mvp-launch-audit-execution.md`                  | Keep as change log, optionally add index note only                                         | It is a sharded change log entry; do not move without log policy review |
| March/April `launch-smoke-report.json` copies, if present outside the May 29 package | Move to `.artifacts/archive/` or add superseded banner                                     | Stale smoke evidence                                                    |
| `docs/proofound-hard-audit-2026-03-16-rerun.md`                                      | Move to `docs/archive/` or add superseded banner                                           | Historical audit                                                        |
| `docs/proofound-master-audit-2026-03-22.md`                                          | Move to `docs/archive/` or add superseded banner                                           | Historical audit                                                        |
| `docs/scope-compliance-report-2026-03-24.md`                                         | Move to `docs/archive/` or add superseded banner                                           | Historical scope audit                                                  |
| `docs/landing-page-master-reference.md`                                              | Move to `docs/archive/` or add superseded banner unless still needed for landing-only work | UI-specific source should not be active core truth                      |
| `Proofound_Project_Specification_2026-03-11.md`                                      | Keep as preserved reference or add superseded/reference-only banner                        | Repo instructions say it is preserved reference context only            |

## Later Superseded Banner

Use this banner for historical docs that remain in place:

> SUPERSEDED — historical only. Do not use as current repo, product, route, launch, or source-of-truth evidence.
> Current replacement: .artifacts/project-source-audit-2026-05-29/CURRENT_REPO_TRUTH.md and PROJECT_SOURCE_AUDIT_SUMMARY.md.

## Docs That Should Stay Active

- `AGENTS.md`
- `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
- `.artifacts/project-source-audit-2026-05-29/PROJECT_SOURCE_AUDIT_SUMMARY.md`
- `.artifacts/project-source-audit-2026-05-29/CURRENT_REPO_TRUTH.md`
- `.artifacts/project-source-audit-2026-05-29/PROJECT_SOURCE_REPLACEMENT_MAP.md`
- `.artifacts/project-source-audit-2026-05-29/DOCUMENT_STALENESS_AND_CONFLICTS.md`
- `.artifacts/project-source-audit-2026-05-29/PROJECT_SOURCE_UPLOAD_PACKAGE.md`
- `.artifacts/project-source-audit-2026-05-29/NEXT_ACTIONS_FOR_YURII.md`
- `.artifacts/project-source-audit-2026-05-29/CODEX_AUDIT_INDEX.json`
- `.artifacts/project-source-audit-2026-05-29/launch-smoke-report.json`
- `docs/ai/Proofound_AI_Assistive_Layer_Source_Of_Truth_Addendum_2026-05-03.md`
- `docs/verification-checklist.md`

## Proposed Future Codex Prompt

```text
Create a repo-only cleanup PR for Proofound historical documents.

Rules:
- Do not change product behavior.
- Do not delete repo files.
- Follow AGENTS.md and the logging policy.
- Read .artifacts/project-source-audit-2026-05-29/CURRENT_REPO_TRUTH.md and PROJECT_SOURCE_AUDIT_SUMMARY.md first.
- Move clearly historical generated audits to docs/archive/ or .artifacts/archive/ only when that does not violate the sharded log policy.
- For files that must remain in place, add this banner:

SUPERSEDED — historical only. Do not use as current repo, product, route, launch, or source-of-truth evidence.
Current replacement: .artifacts/project-source-audit-2026-05-29/CURRENT_REPO_TRUTH.md and PROJECT_SOURCE_AUDIT_SUMMARY.md.

- Do not modify agent/scratchpad.md or project/Documentation.md.
- Update any indexes that directly reference moved documents.
- Run npm run lint, npm run typecheck, and npm run docs:freshness if available.
- Final report must list moved files, bannered files, unchanged active files, checks run, and remaining risks.
```
