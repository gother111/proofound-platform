> Doc Class: `governance`
> Last Verified: `2026-05-27`

# Repository Agent Instructions

## 2026-07-05 Course-Correction Addendum (founder-approved)

For the P0 activation effort and onward, `PROOFOUND_IMPROVEMENT_AUDIT_2026-07-05.md` and `IMPLEMENTATION_PLAN.md` **outrank the 2026-03-11 locked stack below where they conflict** — specifically on: portfolio publication gating (badge instead of verification gate), CV-import availability, assistive-AI feature flags, landing surface, self-serve org motion, and re-engagement email. Everything in "Core Rule" still applies unchanged; privacy, auth, authorization, visibility, RLS, redaction, consent, audit, retention, and secret-handling semantics remain non-negotiable. War-room execution protocol: `WAR_ROOM.md`.

## MVP Implementation Authority

- For active MVP implementation, use this authority order:
  1. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  2. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
  3. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  4. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
  5. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
  6. Fresh repo-grounded audits and evidence
- `PRD_for_a_web_platform_MVP.master-latest.md`, `PRD_TECHNICAL_REQUIREMENTS.md`, `LAUNCH_RUNBOOK.md`, `README.md`, `project/Prompt.md`, `project/Architecture.md`, and audit docs are reference-only context. They must not broaden scope or override the stack above.
- `Proofound_Project_Specification_2026-03-11.md` is preserved reference context only. It must not broaden or outrank the locked MVP, aligned PRD, technical requirements, launch runbook, GTM plan, or fresh evidence.

## Core Rule

- Treat the repository as the source of truth.
- Read files before making assumptions.
- Work proof-first, privacy-first, and evidence-driven.
- Keep launch scope disciplined. Prefer the smallest reversible change that protects the MVP corridor.
- Preserve privacy, auth, authorization, visibility, RLS, redaction, consent, audit, retention, and secret-handling semantics unless an explicit approved task changes them.
- Challenge product assumptions when scope expands beyond the locked MVP corridor, launch readiness, privacy/security, investor-readiness, or the stated task.

## Repo Orientation Before Work

- Inspect the task-relevant source files first, then use the authority stack and verification docs below only as needed.
- Before non-trivial implementation, identify the package manager, scripts, framework, architecture boundaries, canonical docs, current behavior, and high-risk paths touched.
- For small typo, formatting, or single-line documentation edits, avoid ceremony and proceed with the safe local change.
- For large, risky, ambiguous, user-facing, API, privacy/security, database, deployment, or architecture work, provide:
  - Findings: relevant paths, key symbols, current behavior, risk areas.
  - Plan: brief staged bullets.
  - Assumptions: only material assumptions.

## Read Order

1. `AGENTS.md`
2. `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
3. `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
4. `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
5. `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
6. `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
7. Fresh repo-grounded audits and evidence
8. `Proofound_Project_Specification_2026-03-11.md`
9. `project/Implement.md`
10. `project/Prompt.md`
11. `project/Architecture.md`
12. `project/Plans.md`
13. `project/Documentation.md`
14. `agent/runbooks/setup.md`
15. `agent/checklists/preflight.md`
16. `agent/checklists/verification.md`

For UI, landing, public-page, or visual-system work, also read `DESIGN.md` after the MVP authority stack and before editing.

For internal structure, maintainability, or future-agent orientation work, use these reference-only guides after the relevant source files and authority stack:

- `.artifacts/CURRENT_CODEBASE_TRUTH.md`
- `docs/PROOFOUND_UBIQUITOUS_LANGUAGE.md`

## Skill Routing

- Use only the minimum relevant repo skills from `.agents/skills/`; prefer 4-5 active skills per task at most.
- If more than 5 skills seem relevant, narrow the scope or explain why the task is unusually broad before proceeding.
- Start with `repo-orientation-and-plan` for unfamiliar tasks, broad implementation, multi-file changes, architecture work, or new risk surfaces.
- Add `privacy-security-rls-review` when touching auth, sessions, permissions, RLS, policies, storage, uploads, privacy, public visibility, redaction, secrets, user data, or safety-sensitive logs.
- Add `test-evidence-and-verification` when implementing, reviewing, stabilizing tests, preparing launch/investor evidence, or proving behavior changed as intended.
- Add `product-scope-alignment` when product behavior, UX, launch scope, roadmap tradeoffs, investor readiness, or ambiguous feature requests are involved.
- Add `frontend-ux-accessibility` for UI, layout, flows, design system, copy, onboarding, landing pages, dashboards, responsiveness, or visual polish.
- Add `ai-feature-safety` for AI calls, ranking, recommendations, scoring, classification, extraction, generated text, privacy preflights, AI logs, or model-provider behavior.
- Add `database-migrations-and-rollback` for schema, migrations, RLS policies, triggers, indexes, seed data, backups, restore flows, data retention, or database scripts.
- Skills should evolve only after a repeated Codex mistake, a durable architecture/product/testing change, a new canonical verification pattern, or a production/launch incident. Do not update skills after every task; state the durable lesson and future mistake prevented.

## Subagent Review Routing

- Use project subagents from `.codex/agents/` for larger or riskier tasks, especially work touching privacy/security/auth/RLS/user data, launch-critical UX, API contracts, production config, CI/deployment config, database schema/migrations, AI ranking/scoring/recommendation/extraction, broad architecture, or multi-file changes with unclear blast radius.
- Reviewer subagents should primarily return findings, risks, evidence gaps, and recommended changes. The parent agent owns final integration.
- For small low-risk tasks, subagents may be skipped; state briefly why if the task would otherwise appear to need review.

## High-Risk Paths And Approval Requirements

- Treat these as high-risk when present:
  - `src/lib/auth*`, `src/lib/authz/**`, `src/app/auth/**`, `src/app/api/**/route.ts` auth-sensitive handlers, and `src/middleware.ts`
  - `src/lib/privacy/**`, `src/components/privacy/**`, visibility controls, redaction, consent, audit, export, and retention code
  - `src/db/**`, `supabase/**`, migrations, RLS policies, triggers, seed data, restore and backup scripts
  - `src/lib/uploads/**`, `src/app/api/upload/**`, storage buckets, public sharing, and file promotion logic
  - `src/lib/ai/**`, `src/app/api/ai/**`, matching/ranking/scoring/recommendation/extraction code, and AI logs
  - `src/lib/matching/**`, `src/lib/core/matching/**`, fairness/analytics, shortlist, review, and decision logic
  - middleware, CSP, headers, rate limits, cron auth, monitoring, and production scripts
  - `.github/workflows/**`, Vercel config/scripts, deployment config, env templates/docs, payments/billing, and production OCR/document AI enablement
- Ask for explicit user approval before critical dependency changes, production changes, protected docs expansion, high-risk migrations, deployment config changes, external comments/status changes, or any command that can mutate remote services.
- Database migration changes require permission and a written motivation. Prefer additive/reversible migrations over editing existing migrations.
- Do not run `npm run db:push` against production. Never run migrations against remote/staging/production targets unless the user explicitly names and approves that target.
- Do not expose, copy, print, or commit secrets. If a task requires secret inspection, verify presence or absence without revealing values.

## Proofound Scope Discipline

- Keep Proofound a proof-first, privacy-first hiring corridor centered on Proof Packs, explicit visibility, blind-by-default review, progressive reveal, and launchable individual/organization flows.
- Avoid expansion into public people directories, ATS/HRIS replacement, broad BI/org-suite features, social/feed behavior, hidden AI ranking/scoring of people, unnecessary native provider integrations as launch blockers, Redis/broker/infrastructure expansion without measured need, or production OCR/document AI enablement without explicit approval and safety evidence.
- If a requested change appears to broaden the launch corridor, call out the scope drift and suggest the smallest launch-safe option.

## Logging Policy (Conflict Prevention)

- Legacy shared files are history/index surfaces:
  - `agent/scratchpad.md`
  - `project/Documentation.md`
- Do not append per-task entries to those two files during normal feature work.
- Create sharded log entries instead:
  - Session logs: `agent/scratchpad/entries/`
  - Change logs: `project/changes/entries/`
- Use commands:
  - `npm run log:session`
  - `npm run log:change`

## PR Scope Rules

- Feature PRs must not modify legacy shared log files with product code changes.
- CI enforces this with `scripts/check-shared-log-files.mjs`.
- Docs/governance-only PRs may update legacy shared log files when needed.

## Verification

- Run relevant checks from `agent/checklists/verification.md`.
- For launch, privacy, security, database, auth, UX-critical, investor-readiness, AI-safety, or production-adjacent work, use launch-grade verification: focused tests for the changed surface plus broader gates when risk justifies them.
- For UI work, collect before/after evidence where practical, including screenshots or concise visual notes, responsive checks, and accessibility checks.
- For privacy/security work, name the privacy invariant being protected and run focused regression tests for likely failure modes.
- For AI work, verify privacy preflights, log safety, user control, no hidden ranking/scoring, and no unsafe automation.
- For small changes, choose focused tests first and explain any broader tests skipped.
- At minimum for governance/tooling changes run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run docs:freshness`

## Final Response Requirements

- Include changed files.
- State behavior changed, or explicitly say no runtime behavior changed.
- List verification run with pass/fail outcomes.
- Provide evidence collected, including screenshots or before/after notes for UI where practical.
- List tests not run and why.
- State risks and residual uncertainty.
- Provide a rollback plan.
- Explain why the change matters for the repo.
- Ask for review before any commit, push, hook activation, production change, or protected-file expansion.
