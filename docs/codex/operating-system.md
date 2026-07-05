> Doc Class: `active`
> Last Verified: `2026-05-27`

# Codex Operating System

This repository uses a local Codex operating system made of root instructions, repo skills, project subagents, evidence templates, and future advisory hooks. It is designed to keep Proofound work proof-first, privacy-first, launch-scope disciplined, and easy to review.

## Pieces

- `AGENTS.md`: the root doctrine and routing layer. It preserves the locked MVP authority stack and points Codex to the right local skills, subagents, approval rules, and verification expectations.
- `.agents/skills/*/SKILL.md`: narrow task skills. Codex should select only the minimum relevant skills, usually no more than 4-5 per task.
- `.codex/agents/*.toml`: read-only reviewer agents for architecture, security/privacy, test evidence, product scope, and maintainability.
- `docs/codex/evidence-template.md`: durable evidence format for launch, privacy, security, UX-critical, investor-readiness, and production-adjacent work.
- Phase 2 hooks: advisory-only ideas listed below. They are not active and must not be enforced without explicit approval.

## Running The Workflow In Codex Mac

1. Start with the task and the closest relevant source files.
2. Let `AGENTS.md` choose the source-of-truth docs and risk rules.
3. Use only the repo skills that match the task.
4. For broad or high-risk work, ask for or run subagent reviews before final integration.
5. Verify with focused tests first, then broader gates when the risk justifies them.
6. Finish with changed files, behavior changed, verification, evidence, skipped tests, risks, rollback, and why it matters.

Use the internal Codex in-app Browser for browser-related local checks unless a higher-priority instruction or explicit user request says otherwise.

## Requesting Subagent Reviews

The user can ask directly:

- "Run the security/privacy reviewer on this change."
- "Have architecture and test evidence reviewers check the diff."
- "Use subagents before editing this high-risk area."

Codex should also route automatically for larger or riskier work touching privacy/security/auth/RLS/user data, launch-critical UX, API contracts, production config, CI/deployment config, database schema/migrations, AI ranking/scoring/recommendation/extraction, broad architecture, or multi-file changes with unclear blast radius.

Reviewer agents may propose changes, but the parent Codex agent owns final integration and final evidence.

## Evolving Skills Safely

Update skills only when a lesson is durable:

- A repeated Codex mistake was observed.
- A substantial architecture, product, or testing pattern changed.
- A new repeated verification pattern became canonical.
- A production or launch incident taught a reusable lesson.

Do not update skills after every task. When a skill changes, state the durable reason and the future mistake it prevents.

## Avoiding Skill And Context Rot

- Prefer a small set of sharp skills over a large library.
- Select the minimum relevant skills for each task.
- If more than 5 skills seem relevant, narrow the task or explain why it is unusually broad.
- Keep skill files short and procedural.
- Keep canonical product doctrine in the existing authority docs, not duplicated in every skill.

## Risk Classification

Low-risk tasks are local, reversible, and do not affect behavior, privacy, auth, database state, deployment, public output, or external services. Examples: small docs edits, typo fixes, narrow test name updates.

Medium-risk tasks affect internal behavior, tests, non-critical UI, or multiple files but avoid protected surfaces and production-adjacent paths. These need a short plan and focused verification.

High-risk tasks touch privacy, security, auth, RLS, user data, uploads, AI safety, matching/scoring, API contracts, migrations, CI, deployment, env handling, production scripts, launch-critical UX, or investor-readiness evidence. These need explicit risk notes, focused tests, broader verification when justified, and relevant subagent review.

## What Requires User Approval

- Production changes or production-like commands.
- Deployment config changes.
- Critical dependency additions or upgrades.
- Protected documentation expansion that changes product doctrine.
- Database migrations or RLS/policy changes, with written motivation.
- External comments, Linear status changes, GitHub PR comments, or externally visible messages.
- Secret inspection beyond presence/absence checks.
- Active hooks or blocking enforcement.

## Phase 2 Hook Proposal

Hooks are not active. If approved later, start advisory-only and report warnings without blocking work.

- Secret/prompt scanner: warn when diffs appear to include secrets, prompt dumps, sensitive PII, or unsafe logs.
- Production command warning: warn before deploys, production Vercel commands, production OCR/document AI smokes, remote env pulls, or external-state commands.
- `db:push` warning: warn when `npm run db:push` is invoked and require explicit target confirmation.
- Protected file warning: warn when protected governance, auth, privacy, RLS, migrations, deployment, or env files are edited.
- Post-task evidence reminder: remind Codex to include changed files, behavior, verification, evidence, skipped tests, risks, rollback, and why it matters.

Do not make hooks blocking until advisory warnings have proved useful and the user explicitly approves stronger enforcement.
