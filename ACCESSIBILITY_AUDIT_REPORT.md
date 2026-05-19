# Accessibility Audit Report

> Doc Class: `active`
> Last Verified: `2026-05-19`

Date: 2026-05-19
Scope: baseline automated Playwright + axe checks for public launch surfaces and keyboard/focus smoke checks.

## Automated Baseline Result

Command:

```bash
npm run test:a11y
```

Result:

- Overall: `PASS`
- Total tests: `15`
- Passed: `15`
- Failed: `0`
- Runtime: Node `v25.4.0` local runtime; repo command uses `scripts/playwright-node24.mjs`.
- Config: `playwright.a11y.config.ts`
- Test files:
  - `tests/a11y/critical-flows.spec.ts`
  - `tests/a11y/keyboard-navigation.spec.ts`

The first sandbox run could not start the local Playwright web server because binding `0.0.0.0:33101` returned `EPERM`. The same command passed when rerun outside the sandbox with the approved test command.

## Coverage

- Axe WCAG 2.1 A/AA scan for:
  - `/`
  - `/login`
  - `/signup`
- Keyboard/focus smoke checks for:
  - skip link behavior
  - top navigation focusability
  - login form tab order and labels
  - visible focus indicator
  - page-load focus escape
  - accessible names for homepage buttons
  - alt text for homepage images

## Known Gaps / Follow-Ups

- Manual screen-reader validation with VoiceOver/NVDA is still pending.
- `tests/a11y/keyboard-navigation.spec.ts` still contains placeholder TODO tests for deeper modal focus trapping, dropdown keyboard interaction, and table navigation. Those placeholders are not proof of full interaction coverage.
- Strict authenticated accessibility remains a production-candidate gate through `npm run test:a11y:strict`; it was not rerun in this report because it requires strict Supabase-backed fixtures.

## Go/No-Go Note

This file exists as active evidence for `npm run go:no-go`. It proves the baseline mock-mode accessibility suite passed on 2026-05-19, but it does not close strict authenticated accessibility or manual screen-reader validation by itself.
