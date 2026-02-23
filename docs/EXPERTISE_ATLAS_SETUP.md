# Expertise Atlas Setup Guide

## Overview

Expertise Atlas is the canonical individual skill system.

- Individual skills are authored in Atlas (`skills` + taxonomy tables).
- Gap analysis is served from `/api/skill-gaps`.
- Assignment requirements are canonical in `assignment_expertise_matrix`, with compatibility JSON fields on `assignments`.

## Setup Instructions

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

This seeds L2, L3, and L4 taxonomy data used by Atlas search and skill selection.

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

### 4. Verify Atlas and gap APIs

```bash
# Taxonomy root
curl -sS http://localhost:3000/api/expertise/taxonomy

# User skills (requires authenticated session cookie)
curl -sS http://localhost:3000/api/expertise/user-skills

# Canonical gap analysis
curl -sS http://localhost:3000/api/skill-gaps
```

## Active API Surface

### Taxonomy and search

- `GET /api/expertise/taxonomy`
  - query: `l1`, `l2`, `l3_id`, `search`

### User skill management

- `GET /api/expertise/user-skills`
- `POST /api/expertise/user-skills`
- `PATCH /api/expertise/user-skills/:id`
- `DELETE /api/expertise/user-skills/:id`
- `POST /api/expertise/user-skills/:id/proofs`
- `DELETE /api/expertise/user-skills/:id/proofs/:proofId`
- `POST /api/expertise/user-skills/:id/verification-request`

### Atlas analytics and helpers

- `GET /api/expertise/stats`
- `POST /api/expertise/auto-suggest`
- `POST /api/expertise/jd-to-l4`
- `POST /api/expertise/linkedin-import`
- `GET /api/expertise/linkedin-status`
- `POST /api/expertise/linkedin-disconnect`
- `GET /api/expertise/verifications/incoming`
- `POST /api/expertise/verification/:requestId/respond`

### Gap analysis

- Canonical: `GET /api/skill-gaps`
- Goals: `GET|POST /api/skill-gaps/goals`
- Compatibility wrapper: `GET /api/expertise/gap-analysis` (deprecated, forwards to canonical service shape)

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

### No gap results

- Confirm user has skills in `skills`.
- Confirm active assignments exist and have matrix rows in `assignment_expertise_matrix`.
- Confirm user has interests or matches, or fallback active assignments are available.

### Taxonomy search is empty

- Confirm `skills_taxonomy` has seeded rows.
- Check fallback search path in `/api/expertise/taxonomy` by running a direct `search` query.

### Legacy clients still call deprecated endpoints

- Keep `/api/expertise/gap-analysis` during transition.
- Monitor deprecation headers and server logs before removing compatibility routes.
