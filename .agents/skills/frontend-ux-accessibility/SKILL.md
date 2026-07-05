---
name: frontend-ux-accessibility
description: Use when work touches UI, layout, flows, design system, accessibility, responsiveness, copy, onboarding, landing pages, dashboards, or visual polish. Do not trigger for backend-only, migration-only, or invisible refactor work.
---

# Frontend UX Accessibility

Use this skill to protect the product experience.

## Review Focus

- Preserve existing design system patterns, components, spacing, typography, and route conventions.
- Check responsive behavior across mobile and desktop.
- Check accessibility expectations: keyboard reachability, labels, contrast, focus states, and semantic structure.
- For landing-sensitive paths, respect the dedicated landing scope rules in `agent/checklists/verification.md`.

## Evidence

- Capture before/after screenshots or concise visual notes where practical.
- Run focused UI tests first, then broader Playwright/a11y gates when risk justifies them.
- Report UX regressions, layout overlap risk, copy ambiguity, and skipped visual checks.
