# Project Change Entry

- Date/time (UTC): 2026-02-21T14:36:24Z
- Branch: codex-mobile-landing-tuning
- Base commit: 956f50f7
  What changed:
- Applied global mobile layout optimizations across all landing page sections (`HeroSection`, `ProblemSection`, `HowItWorksSection`, `PrinciplesSection`, `PersonasSection`, `ProductsSection`, `FinalCTASection`).
- Scaled down typography (`h1`, `h2`, `h3`) for mobile breakpoints to prevent awkward text wrapping.
- Reduced general container vertical padding from `py-20` to `py-16` to preserve screen real estate.
- Reduced internal padding in cards and accordions to maximize width for text on small viewports.
- Updated `min-h-[100vh]` arrays to `min-h-[100dvh]` to account for mobile browser UI (chrome) expansion/contraction.

Why:

- The design was previously optimized heavily for desktop, resulting in a cramped or bloated experience with missing structural breathing room when scaled down to mobile viewports. Layout jumping issues from browser chrome behavior were also impacting user experience on iOS Safari/Chrome.

How to verify:

- Inspect changes visually by running the dev server and simulating a mobile device in dev tools.
- Ensure typography scales cohesively with screen width.
- Check the Hero section to ensure there's no layout jump when triggering the URL bar to appear/disappear.
- `npx eslint src/components/landing/sections/*.tsx`

Open risks / TODO:

- Consider visual baseline or E2E UI contract tests testing the mobile display specifically as current baseline acts strictly on desktop (Linux Chromium).
