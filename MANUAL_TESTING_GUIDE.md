> Doc Class: `reference-spec`
> Last Verified: `2026-02-26`

# Manual Testing Guide

This guide defines current manual testing flows aligned with active routes and test contracts.

## Prerequisites

- `npm run dev` running.
- Valid `.env.local` configured (Supabase + provider integrations if testing provider flows).
- Separate browser profiles or incognito windows for multi-user tests.

## 1) Public and Auth Flows

### Routes

- `/`
- `/signup`
- `/login`
- `/reset-password`
- `/verify-email`

### Checks

- Individual signup path works.
- Organization signup path works.
- Login success and failure states render correctly.
- Password reset shows success and error states appropriately.
- Verification route handles valid/invalid/missing token paths.

## 2) Individual App Flow

### Core Routes

- `/app/i/home`
- `/app/i/profile`
- `/app/i/expertise`
- `/app/i/matching`
- `/app/i/messages`
- `/app/i/interviews`
- `/app/i/settings/*`

### Checks

- Profile edits persist across refresh.
- Matching setup persists and match actions are stable.
- Messaging and interview flows load without route-level failures.
- Verification/integrations settings render proper status.

## 3) Organization App Flow

### Core Routes

- `/app/o/<slug>/home`
- `/app/o/<slug>/profile`
- `/app/o/<slug>/members`
- `/app/o/<slug>/invitations`
- `/app/o/<slug>/assignments`
- `/app/o/<slug>/matching`
- `/app/o/<slug>/settings`

### Checks

- Org onboarding and profile updates persist.
- Assignment create/publish lifecycle is functional.
- Role-based access control is enforced for members/settings.

## 4) Admin Flow

### Core Routes

- `/admin`
- `/admin/users`
- `/admin/organizations`
- `/admin/verification`
- `/admin/fairness`

### Checks

- Core admin pages load without blocking route errors.
- Non-admin users are denied access (`/403` or redirect).

## 5) Accessibility Manual Pass

- Keyboard-first navigation for public routes.
- Focus visibility on all critical controls.
- Screen reader spot-check on auth + app shell pages.
- Contrast check for critical text and controls.

## 6) Performance Manual Pass

- Home and app shell routes load without major blocking regressions.
- No sustained 4xx/5xx for happy-path flows.
- Console remains clean on critical paths.

## 7) Database Verification Spot Checks

For key manual flows, validate persistence in Supabase using targeted SQL on:

- profiles / individual_profiles
- organizations / organization_members
- matching_profiles / skills
- assignments / matches
- verification tables

## Canonical Automation Companions

- `docs/testing-strategy.md`
- `docs/qa/e2e-matrix.md`
- `agent/checklists/verification.md`
