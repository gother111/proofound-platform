> Doc Class: `active`
> Last Verified: `2026-05-19`

# Accessibility

Target baseline: WCAG 2.1 AA for the locked MVP corridor.

Current evidence lives in [`ACCESSIBILITY_AUDIT_REPORT.md`](../ACCESSIBILITY_AUDIT_REPORT.md). That
report proves the baseline public/mock-mode accessibility suite passed on 2026-05-19. It does not
close strict authenticated accessibility or manual screen-reader validation by itself.

## Launch Scope

Accessibility launch checks cover active MVP and internal launch-ops surfaces:

- public landing, signup/login, public individual portfolio, public organization trust page, and
  active assignment/share surfaces;
- individual onboarding, Proof Packs, proof upload/import/linking, verification requests, public
  portfolio publishing, privacy settings, export, and delete;
- organization onboarding, trust profile, assignments, review queue, candidate proof review, intro,
  reveal consent, interview, decision, and engagement verification;
- protected admin/internal verification, audit, queue, monitoring, and launch-ops surfaces.

Archived Expertise Atlas, Zen/wellbeing, broad dashboard, public directory, generic marketplace, and
post-MVP surfaces are not launch accessibility evidence unless the route-surface policy changes.

## Canonical Commands

```bash
npm run lint
npm run test:a11y
npm run test:a11y:strict
```

Use `npm run test:a11y` for the baseline public/auth/mock-mode suite. Use
`npm run test:a11y:strict` for strict authenticated accessibility on a production-candidate or
properly seeded strict target.

## Current Evidence

As of 2026-05-19:

- `npm run test:a11y` completed against `playwright.a11y.config.ts` with `11 passed / 4 skipped`.
- Covered files include `tests/a11y/critical-flows.spec.ts` and
  `tests/a11y/keyboard-navigation.spec.ts`.
- The baseline result is `11 passed / 4 skipped`; skipped checks cover deeper modal focus-trap,
  dropdown, table/grid, and modal focus-return behavior that still require stable active MVP fixtures.
- Strict authenticated accessibility remains a production-candidate gate through
  `npm run test:a11y:strict`.
- Manual screen-reader validation remains required for final signoff.

## Manual Checks

For representative desktop and mobile viewports, verify:

- skip link appears first in tab order and moves focus to main content;
- each page has a meaningful page-level heading;
- tab order follows visual and task order;
- focus indicators remain visible and high contrast;
- forms have labels, descriptions, and perceivable error/success messages;
- dialogs trap focus while open and restore focus after close;
- menus, segmented controls, tabs, and upload controls work with keyboard;
- loading, empty, error, disabled, success, archived, and gated states are announced or obvious;
- public pages do not expose private proof, candidate, org, assignment, queue, storage, or diagnostic
  data to assistive technology.

## Screen Reader Spot Checks

Use VoiceOver or NVDA for:

- public landing and auth entry;
- public portfolio unavailable/available states;
- individual first-proof onboarding and Proof Pack editing;
- organization assignment review and reveal-consent surfaces;
- admin/internal queue and audit pages, using only authorized test data.

Check landmark regions, heading order, control names, form instructions, validation messages, modal
title/description announcements, and status updates.

## Design Requirements

- Minimum contrast: 4.5:1 for normal text, 3:1 for large text and UI components.
- Icons used as buttons need accessible names through visible text, `aria-label`, or `sr-only`
  labels.
- Decorative images should use `alt=""`.
- Motion should respect reduced-motion preferences where animation is not essential.
- Product copy should stay plain-language and task-specific; avoid internal jargon in accessible
  labels.

## Regression Policy

When fixing an accessibility defect:

1. Add or update an automated test in `tests/a11y/` or the relevant focused UI/API test.
2. Update `ACCESSIBILITY_AUDIT_REPORT.md` only when the relevant suite has actually been rerun.
3. Update `docs/qa/bugs.md` when the issue is a tracked release defect.
4. Re-run `npm run test:a11y`; also run `npm run test:a11y:strict` when the change affects
   authenticated MVP, org, admin, privacy, reveal, export/delete, or launch-ops surfaces.

## Final Signoff

Do not call accessibility launch-ready unless all of the following are true:

- baseline automated accessibility is green and current;
- strict authenticated accessibility is green on the intended target;
- manual keyboard and screen-reader checks are recorded for representative public, individual, org,
  and admin/internal surfaces;
- remaining issues are triaged with severity, owner, and launch decision.
