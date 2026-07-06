# Browser UI/UX Launch Readiness Pass - 2026-05-18

## Scope

Browser-first visual review for launch-relevant Proofound surfaces, using the Codex in-app Browser against the local mock server at `http://localhost:33100`.

Authority stack read before edits:

- `AGENTS.md`
- `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
- `PRD_Proof_First_Hiring_Corridor_MVP.aligned-rewrite.2026-03-11.md`
- `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
- `LAUNCH_RUNBOOK.aligned-rewrite.2026-03-11.md`
- `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
- `DESIGN.md`
- `agent/checklists/verification.md`

## Browser Coverage

Artifacts are in `.artifacts/ux-browser-goal-2026-05-18/`.

Checked with Browser at mobile and desktop sizes including `390x844`, `375x667`, and `1280x800`:

- Public and auth surfaces: landing, login, signup, individual signup, organization signup, reset password, email verification, work-email verification, public individual portfolio demo, public organization trust demo, candidate invite invalid state, accept invite route, invalid verification route, feedback invalid state, forbidden, not-found route.
- Individual app surfaces: home, profile, portfolio, matching, verifications, messages, communications, settings, privacy.
- Organization app surfaces in org mock mode: home, profile, assignments, assignment builder, matching, messages, communications, shortlist, portfolio.

Browser sweep data:

- `.artifacts/ux-browser-goal-2026-05-18/browser-sweep-results.json`
- `.artifacts/ux-browser-goal-2026-05-18/browser-org-sweep-results-orgmode.json`
- `.artifacts/ux-browser-goal-2026-05-18/browser-mobile-privacy-loaded-cookie-compact.json`

Screenshots include the privacy banner before/after check and route snapshots such as:

- `.artifacts/ux-browser-goal-2026-05-18/browser-mobile-privacy-cookie-compact.png`
- `.artifacts/ux-browser-goal-2026-05-18/browser-mobile-privacy-loaded-cookie-compact.png`
- `.artifacts/ux-browser-goal-2026-05-18/browser-mobile-privacy-cookie-dismissed.png`
- `.artifacts/ux-browser-goal-2026-05-18/mobile390-landing.png`
- `.artifacts/ux-browser-goal-2026-05-18/mobile390-org-assignment-builder.png`
- `.artifacts/ux-browser-goal-2026-05-18/desktop1280-org-assignment-builder.png`

## Issue Found And Fixed

### Mobile app cookie banner competing with privacy actions

On `/app/i/settings/privacy` at `390x844`, the cookie banner sat above the mobile bottom navigation but was still tall enough to compete with the first privacy actions. This made the screen feel more blocked than helpful and pulled attention away from the privacy settings workflow.

Fixed in `src/components/CookieBanner.tsx`:

- Kept the app-route banner above the mobile bottom navigation.
- Compacted the mobile app-route banner padding and button height.
- Limited the explanatory copy to two lines on small app screens.
- Hid secondary cookie-policy links on small app screens while preserving primary consent actions.

Browser recheck confirmed the privacy actions and compact consent banner fit together without overlap at `390x844`.

## Findings

- The fresh org-mode Browser sweep reported no document-level horizontal overflow, clipping, or undersized visible targets across the tested organization routes and viewport sizes.
- The fixed privacy screen no longer has the cookie banner visually blocking the main privacy action stack.
- Some attempted fresh org screenshots failed with Browser `Page.captureScreenshot` timeouts, but Browser layout evaluation and existing route screenshots were saved in the artifact directory. This is recorded as a tooling limitation, not as visual evidence parity.

## Verification

Passed:

- `npm run test -- tests/ui/cookie-banner.test.tsx`
- `npm run lint`
- `npm run typecheck`
- `npm run docs:freshness`

Notes:

- The focused Vitest run printed a Vite websocket `EPERM` warning under the sandbox, then completed successfully with all cookie-banner tests passing.
- `docs:freshness` completed in warning mode with pre-existing orphan-document warnings.

## Remaining Launch Risks

- Real valid invite-token, verification-token, and production-like portfolio data states still need production-like fixtures or connected test data for full visual confidence.
- Browser screenshot capture timed out for a few fresh org-mode captures during this pass, so the clean org-mode route sweep is backed by Browser DOM/layout measurements plus existing saved route screenshots rather than a complete fresh screenshot set.

## Continuation - Mobile App Shell Clearance

After the initial pass, the org assignment builder was reviewed more deeply in Browser at `390x844`.

Finding:

- On `/app/o/test-org/assignments/new`, the fixed mobile bottom navigation overlaid the scrollable app content area. The first form step could paint controls into the same visual band as the bottom nav, making the screen feel crowded and less trustworthy.

Fix:

- Updated the individual and organization app layouts so mobile `main` reserves real layout space above the fixed bottom navigation with margin, while keeping a smaller internal bottom padding for comfortable scrolling.
- Updated the mobile smartphone E2E assertion to verify the user-visible contract: the scrollable `main` area ends above the mobile nav, and the combined reserved space remains at least nav-sized.

Browser recheck:

- At `390x844`, the org assignment builder `main` ended at y=768 and the mobile nav began at y=771, with no visible controls hidden by the nav.
- At `1280x800`, desktop retained zero bottom margin/padding and the mobile nav remained hidden.

Additional verification:

- `npm run test:e2e:mobile:org -- -g "organization shell main area reserves space for bottom nav"` passed.
