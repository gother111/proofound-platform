> Doc Class: `active`
> Last Verified: `2026-05-19`

# Retained Expertise Taxonomy Setup Guide

> Launch status: retained taxonomy/service context only.
>
> `/app/i/expertise` and the broad Expertise Atlas UI are archived outside the locked MVP corridor. Do not use this document as evidence that the old Expertise Atlas page, broad CV import wizard, gap dashboard, LinkedIn import, or legacy skill verification transport is active for launch.

## Overview

The retained launch surface keeps the underlying taxonomy and narrow user-skill/proof APIs available where proof workflows still depend on them. The user-facing MVP corridor is Proof Packs, proof portfolio, verification requests, matching, reveal/consent, interviews, decisions, and organization assignments.

- Individual proof skills may still be stored in `skills` and taxonomy tables.
- Assignment requirements are canonical in `assignment_expertise_matrix`, with compatibility JSON fields on `assignments`.
- Broad skill-gap, dashboard, LinkedIn import, and CV wizard surfaces are archived unless the route-surface policy is explicitly changed.

## Setup Instructions

This is not a production migration shortcut. For launch targets, follow the current deployment, migration, backup, and isolated-restore runbooks before applying database changes.

### 1. Apply schema migrations

Use migration files and the SQL runner. Do not use `db:push` for production workflows.

```bash
npm run db:migrate
npm run db:drift-check
```

### 2. Seed taxonomy data

```bash
npm run db:seed-taxonomy
```

This seeds L2, L3, and L4 taxonomy data used by retained taxonomy search and proof-skill selection.

### 3. Verify core table health

```sql
-- L1 domains (expected: 6)
SELECT COUNT(*) FROM skills_categories;

-- L2 categories
SELECT COUNT(*) FROM skills_subcategories;

-- L3 subcategories
SELECT COUNT(*) FROM skills_l3;

-- L4 taxonomy skills
SELECT COUNT(*) FROM skills_taxonomy;
```

### 4. Verify retained taxonomy and user-skill APIs

```bash
# Taxonomy root
curl -sS http://localhost:3000/api/expertise/taxonomy

# User skills (requires authenticated session cookie)
curl -sS http://localhost:3000/api/expertise/user-skills

# Archived gap/dashboard routes should return launch-safe archived responses.
```

## Active API Surface

### Taxonomy and search

- `GET /api/expertise/taxonomy`
  - query: `l1`, `l2`, `l3_id`, `search`

### Retained user skill and proof management

- `GET /api/expertise/user-skills`
- `POST /api/expertise/user-skills`
- `PATCH /api/expertise/user-skills/:id`
- `DELETE /api/expertise/user-skills/:id`
- `POST /api/expertise/user-skills/:id/proofs`
- `DELETE /api/expertise/user-skills/:id/proofs/:proofId`

### Retained assignment helper

- `POST /api/expertise/jd-to-l4`

### Archived legacy APIs

- `GET /api/skill-gaps`
- `GET|POST /api/skill-gaps/goals`
- `GET /api/expertise/gap-analysis`
- `GET /api/expertise/stats`
- `POST /api/expertise/auto-suggest`
- `POST /api/expertise/user-skills/:id/verification-request`
- `POST /api/expertise/linkedin-import`
- `GET /api/expertise/linkedin-status`
- `POST /api/expertise/linkedin-disconnect`
- `GET /api/expertise/verifications/incoming`
- `POST /api/expertise/verification/:requestId/respond`
- `/api/expertise/cv-import/*`

Do not use archived Expertise Atlas UI files, archived CV wizard routes, or old LinkedIn-import routes as launch evidence. They are retained only as history unless route-surface policy changes.

### Matching profile integration

- Canonical: `GET|PUT /api/core/matching/matching-profile`
- Compatibility: `GET|PUT /api/matching-profile`
- `skills` in matching-profile payloads are deprecated and ignored by default.
  - Re-enable legacy writes only with `MATCHING_PROFILE_ENABLE_SKILL_WRITES=true`.
- PRD I-15 focus fields are first-class on `matching_profiles`:
  - `desired_roles`
  - `desired_industries`
  - `org_types`
- PRD A7 strict gating is enforced at:
  - `POST /api/core/matching/profile`
  - `POST /api/core/matching/near-matches`
  - if unmet, both return `412` with `error: "PROFILE_NOT_MATCHABLE"`, criterion diagnostics, and top actions.
- Focus areas are soft ranking boosts only:
  - role `+0.04`
  - industry `+0.025`
  - org type `+0.015`
  - capped at `+0.08`

## Assignment Expertise Model

- Canonical write/read table: `assignment_expertise_matrix`
  - key columns: `assignment_id`, `skill_code`, `required_level`, `stakeholder_role`, `linked_outcome_id`
- Compatibility fields on `assignments`:
  - `must_have_skills`
  - `nice_to_have_skills`
- Assignment APIs keep JSON compatibility fields derived from matrix rows for legacy consumers.

## Troubleshooting

### No proof/assignment skill context

- Confirm user has skills in `skills`.
- Confirm active assignments exist and have matrix rows in `assignment_expertise_matrix`.

### Taxonomy search is empty

- Confirm `skills_taxonomy` has seeded rows.
- Check fallback search path in `/api/expertise/taxonomy` by running a direct `search` query.

### Legacy clients still call archived endpoints

- Confirm the route is classified in `src/lib/launch/surface-policy.ts`.
- Confirm archived handlers return `410` before auth, ranking, or private data access.
- Use `npm run test:launch:routes` to verify route inventory and archived-handler behavior.
