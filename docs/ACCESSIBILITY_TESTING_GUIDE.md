> Doc Class: `active`
> Last Verified: `2026-02-26`

# Accessibility Testing Guide

Target baseline: WCAG 2.1 AA.

## Canonical Commands

- Baseline public and auth a11y sweep:
  - `npm run test:a11y`
- Strict authenticated a11y contract:
  - `npm run test:a11y:strict`
- Full verification context:
  - `agent/checklists/verification.md`

## Automated Coverage

- `tests/a11y/critical-flows.spec.ts`
- `tests/a11y/keyboard-navigation.spec.ts`
- `tests/a11y/authenticated.strict.spec.ts`

## Manual Accessibility Flows

### Public/Auth

1. `/`
2. `/signup`
3. `/login`
4. `/reset-password`
5. `/verify-email`

Checks:

- Skip link appears first in tab order.
- Heading hierarchy is valid.
- Visible focus ring on interactive controls.
- Form fields are labeled and announced.
- Error and success messages are perceivable.

### App Shell Flows

1. `/app/i/home`
2. `/app/i/profile`
3. `/app/i/matching`
4. `/app/o/<slug>/home`
5. `/admin`

Checks:

- Keyboard-only navigation works with no traps.
- Dialog focus is trapped and restored after close.
- Menus and dropdowns are operable with keyboard.
- Toasts/alerts are announced and do not block navigation.

## Screen Reader Spot Checks

Use VoiceOver or NVDA for:

- Landmark regions (`header`, `nav`, `main`, `footer`).
- Button/link names.
- Form instructions and validation messages.
- Modal title + description announcements.

## Contrast and Focus

- Text contrast meets WCAG AA thresholds:
  - 4.5:1 normal text
  - 3:1 large text and UI components
- Focus indicators must remain visible and high-contrast across themes.

## Regression Policy

When a11y defects are fixed:

1. Add or update an automated test in `tests/a11y/`.
2. Add/update bug entry in `docs/qa/bugs.md`.
3. Re-run `npm run test:a11y` and, if relevant, `npm run test:a11y:strict`.
