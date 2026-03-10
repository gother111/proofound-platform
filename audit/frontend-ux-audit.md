# Frontend, UX, and Accessibility Audit

Audit snapshot: `2026-03-05`

## Category Scores

### UX Quality: 3/5

Public and auth flows are usable, labeled, and visually intentional, but the experience is carrying avoidable friction from overlays, bundle weight, and inconsistent accessibility polish.

### Frontend Consistency: 2/5

The visual system is distinctive, but implementation consistency is weaker than the brand direction. The landing page in particular mixes polished motion work with unresolved semantics and performance debt.

## Runtime Flow Checks Performed

- Warm prod browser pass against:
  - `/`
  - `/login`
  - `/signup`
  - `/onboarding`
- Observed results:
  - `/`, `/login`, and `/signup` loaded successfully
  - `/onboarding` redirected to `/login` when unauthenticated
  - login form labels and skip link were present
  - browser console showed only `Permissions-Policy` warnings, not route crashes

## What Is Working and Should Be Preserved

- The app has a skip link in the root shell: `src/app/layout.tsx:70-84`
- The login surface exposes labeled fields and clear CTA hierarchy in warm runtime validation
- The public site is visually differentiated from generic SaaS templates and uses reduced-motion handling in the landing hero
- Auth pages render legal links and primary/secondary sign-in paths clearly

## Top 5 UX Issues

1. Global cookie banner appears on auth screens and competes with the login task after a delay.
2. Landing footer animation duplicates accessible names for links.
3. Landing image strategy still uses raw `<img>` on key assets.
4. Large first-load bundles on core routes threaten responsiveness.
5. Accessibility signal is noisy because the current automated suite is unstable in its current startup mode.

## Findings

### FU-01: Cookie consent is injected globally, including auth entrypoints

- Status: Fact
- Severity: P1
- Type: UX-only
- Evidence:
  - `src/app/layout.tsx:80-84` mounts `CookieBanner` for the entire app
  - `src/components/CookieBanner.tsx:27-38` shows the banner after a 1-second delay unless consent already exists
  - warm login snapshot showed the cookie banner appearing over the sign-in page
- Why it matters:
  - Authentication pages should minimize distraction and focus competition.
  - A delayed overlay on top of the login form is particularly risky for keyboard and screen-reader flows.
- Next action:
  - Exclude auth routes from the banner or defer it until after critical auth interaction is complete.

### FU-02: Footer hover animation duplicates link labels in the accessibility tree

- Status: Fact
- Severity: P1
- Type: UX-only
- Evidence:
  - `src/components/landing/sections/FooterSection.tsx:96-106` renders two text copies of each link label
  - warm Playwright snapshot exposed names like `How it Works How it Works`
- Why it matters:
  - The footer looks polished visually, but the semantics are noisy and inconsistent with the rest of the site’s accessibility posture.
- Next action:
  - Preserve the motion effect while hiding the decorative duplicate from assistive tech.

### FU-03: Landing image implementation still carries known optimization debt

- Status: Fact
- Severity: P2
- Type: UX-only
- Evidence:
  - `src/components/ProofoundLanding.tsx:228-237`
  - `src/components/landing/sections/FooterSection.tsx:53-62`
  - `npm run lint` warns on both locations via `@next/next/no-img-element`
- Why it matters:
  - This is user-visible on the most important traffic entrypoint.
  - The raw image strategy increases bandwidth risk and keeps lint noisy on a flagship surface.
- Next action:
  - Migrate these assets to the repo’s supported image path and clear the warnings.

### FU-04: Route and bundle weight is too high for several primary experiences

- Status: Fact
- Severity: P1
- Type: Cross-cutting
- Evidence:
  - build output on `2026-03-05`:
    - `/` first load `315 kB`
    - `/app/i/profile` `430 kB`
    - `/app/i/zen` `479 kB`
  - shared first-load JS was `219 kB`
- Why it matters:
  - Heavy bundles directly affect responsiveness, especially on lower-end devices and international connections.
  - This also increases the blast radius of frontend changes because more code ships together.
- Next action:
  - Split the heaviest routes and set route-level bundle targets for public, profile, and zen surfaces.

### FU-05: Accessibility automation is not currently a reliable release signal

- Status: Fact
- Severity: P2
- Type: Cross-cutting
- Evidence:
  - `npm run test:a11y` failed with 5 navigation timeout cases
  - warm prod browser pass succeeded for the same public/auth routes
  - `docs/ACCESSIBILITY.md:53-115` currently claims keyboard/focus behavior is verified
- Why it matters:
  - Teams cannot tell whether a red run means a real user regression or harness instability.
  - That reduces confidence in the accessibility program itself.
- Next action:
  - Re-baseline the accessibility gate around a deterministic server mode and then re-audit focus behavior.

### FU-06: The public/auth flows are stronger than the failing automated signal suggests

- Status: Fact
- Severity: P3
- Type: UX-only
- Evidence:
  - warm prod Playwright runs loaded `/`, `/login`, and `/signup` successfully
  - `/onboarding` redirected unauthenticated users to `/login`
  - login snapshot showed labels, checkbox, password reveal button, and legal copy
- Why it matters:
  - This is important to preserve in the audit so the team does not overcorrect against a tooling problem by rewriting working surfaces.
- Next action:
  - Treat the warm prod pass as the current user-facing baseline and focus fixes on reliability, overlays, semantics, and bundle size.
