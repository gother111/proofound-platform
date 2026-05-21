> Doc Class: `active`
> Last Verified: `2026-05-19`

# Accessibility Testing Guide

Target baseline: WCAG 2.1 AA for active MVP and internal launch-ops surfaces.

Use this guide with [`docs/ACCESSIBILITY.md`](ACCESSIBILITY.md),
[`ACCESSIBILITY_AUDIT_REPORT.md`](../ACCESSIBILITY_AUDIT_REPORT.md), and
[`agent/checklists/verification.md`](../agent/checklists/verification.md).

## Canonical Commands

```bash
npm run test:a11y
npm run test:a11y:strict
```

- `npm run test:a11y` runs the baseline public/auth/mock-mode suite.
- `npm run test:a11y:strict` runs Strict authenticated accessibility with real Supabase-backed
  fixtures and remains a production-candidate gate.

## Automated Coverage

- `tests/a11y/critical-flows.spec.ts`
- `tests/a11y/keyboard-navigation.spec.ts`
- `tests/a11y/authenticated.strict.spec.ts`

As of 2026-05-19, `ACCESSIBILITY_AUDIT_REPORT.md` records `npm run test:a11y` with `11 passed /
4 skipped` baseline checks. The skipped checks cover deeper modal focus-trap, dropdown, table/grid,
and modal focus-return behavior that still require stable active MVP fixtures. This is not proof of
full Strict authenticated or manual screen-reader coverage.

## Public and Logged-Out Manual Flows

Check:

1. `/`
2. `/signup`
3. `/login`
4. `/reset-password`
5. `/verify-email`
6. public individual portfolio states
7. public organization trust page states
8. active assignment/share states, including gated or archived behavior

Verify:

- skip link and page-level heading;
- visible focus on every control;
- meaningful link/button names;
- form labels, instructions, errors, and success messages;
- no public exposure of private proof, queue, storage, candidate, org, or diagnostic data.

## Individual App Manual Flows

Check:

1. onboarding / first proof flow;
2. profile shell and private context;
3. Proof Packs;
4. proof upload/import/linking;
5. proof quality and anchor context;
6. verification requests;
7. public portfolio publishing;
8. matching and assignment-review surfaces when active;
9. intros, reveals, interviews, decisions/feedback;
10. privacy settings, export, and delete.

Verify keyboard order, focus restoration, upload status announcements, gated/empty/error states, and
plain-language labels for privacy, trust, proof, and readiness states.

## Organization App Manual Flows

Check:

1. org onboarding and trust profile;
2. assignments list/create/edit/review/publish;
3. review queue, shortlist/matching, and proof-submission cards;
4. reason-code explanations;
5. intro request;
6. reveal request and proof-review participant consent;
7. interview scheduling/reschedule;
8. decision recording and engagement verification.

Verify keyboard operability, headings, table/list semantics, disabled states, status announcements,
and no-leak behavior for private proof submissions and identity details.

## Admin/Internal Manual Flows

Check protected internal routes only with authorized test data:

- `/admin`
- `/admin/verification`
- `/admin/audit`
- internal ops queues and launch-status/monitoring surfaces when accessible

Verify role-appropriate content, no public/logged-out queue visibility, focus order, empty/loading
states, and clear labels for queue/action state.

## Screen Reader Spot Checks

Use VoiceOver or NVDA for representative public, individual, organization, and admin/internal
surfaces. Check:

- landmarks: `header`, `nav`, `main`, `footer`;
- page heading order;
- button and link names;
- modal title and description announcements;
- upload, save, reveal, decision, and error/status announcements;
- form instructions and validation messages.

## Regression Policy

When an accessibility bug is fixed:

1. Add or update focused automated coverage.
2. Re-run `npm run test:a11y`.
3. Re-run `npm run test:a11y:strict` if the fix touches authenticated, org, admin/internal, privacy,
   reveal, export/delete, or launch-ops surfaces.
4. Record manual verification if the issue required keyboard or screen-reader inspection.

## Non-Launch Surfaces

Archived Expertise Atlas, Zen/wellbeing, broad dashboards, generic marketplace/platform pages, and
post-MVP flows are not launch accessibility evidence. If they appear in an active accessibility run,
either remove them from the active run or reclassify the route/test according to the route-surface
policy.
