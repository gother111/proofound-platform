# Proofound Landing Page — Current Implementation Reference

## 1. Purpose of this document

- This document is a code-grounded reference for the current Proofound landing page implementation.
- It is intended to support later redesign, copy rewrite, section removal, reordering, or refactoring without relying on aspirational product docs.
- Date generated: 2026-03-17.
- Evidence basis: code inspection plus targeted local runtime verification.
- Runtime evidence used:
  - Existing visual baseline artifact: `e2e/landing-visual.spec.ts-snapshots/landing-home-af705d4-linux-chromium.png`
  - Targeted Playwright verification:
    - `npm run test:e2e:landing -- --grep "renders hero section with main heading|header menu opens and closes via the X button|renders personas split panels on desktop|renders footer"`
    - `npm run test:e2e:landing -- --grep "maintains responsive layout on mobile|cookie banner does not block landing CTAs outside the consent card|all sections are in correct order"`
- Framing documents were read before code inspection, but only for interpretation:
  - `Proofound_MVP_Locked_Source_of_Truth_2026-03-11.md`
  - `PRD_for_a_web_platform_MVP.aligned-rewrite.2026-03-11.md`
  - `PRD_TECHNICAL_REQUIREMENTS.aligned-rewrite.2026-03-11.md`
  - `.artifacts/proofound-implementation-status-snapshot.md`
  - `.artifacts/proofound-route-inventory.md`
  - `.artifacts/proofound-priority-file-map.md`
- Requested but not found in this repo:
  - `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md`
- Authority note:
  - The locked MVP doc is the product authority for comparison.
  - The `.artifacts/*` files are framing and route-surface companions, not the implementation source of truth.

## 2. Executive summary

The primary landing page is the `/` route. It is implemented as a single client-rendered marketing surface composed by `src/app/page.tsx` and `src/components/ProofoundLanding.tsx`. The page presents Proofound as a public proof-portfolio product first, then layers in broader claims about matching, collaboration, privacy, governance, mental well-being, and future-facing trust infrastructure. The page is visually polished and motion-heavy, with a warm Japandi-style palette, large editorial typography, glassmorphism cards, section separators, smooth scrolling, and animated background effects.

Relative to the locked MVP, the homepage is only partially aligned. The hero and some later sections do anchor on public proof portfolios, privacy, and trust signals, but much of the page still carries broader or legacy messaging. Examples include mental health tools, life and career planning, borderless talent mobility, data democratization, open standards claims, and a full stewardship/business-model section. The result is a homepage that points toward the narrow wedge in some places but still implies a broader platform scope than the locked MVP describes.

## 3. Route and file ownership

Primary landing page route: `/`

Alternate marketing-information pages exist at `/about`, `/manifesto`, `/careers`, `/contact`, `/support`, `/cookies`, `/privacy`, and `/terms`, but they are linked informational surfaces, not alternate primary homepages.

| route / pathname       | purpose                                                         | source file                                                   | supporting files                                                                                                                                                                                                                                                                                                                                                                                                                                                 | notes                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                    | Homepage route entry, page metadata, homepage JSON-LD injection | `src/app/page.tsx`                                            | `src/lib/seo/json-ld.ts`, `src/components/seo/JsonLdScripts.tsx`                                                                                                                                                                                                                                                                                                                                                                                                 | Primary route. Exports page-level metadata that overrides root defaults. Contains comment: auth check disabled for landing page debugging/verification.                                                        |
| `/`                    | Global wrappers and page-wide shell                             | `src/app/layout.tsx`                                          | `src/app/globals.css`, `src/components/a11y/SkipToContentLink.tsx`, `src/components/CookieBanner.tsx`, `src/components/OptionalTelemetry.tsx`, `src/components/root/DeferredAppEnhancements.tsx`                                                                                                                                                                                                                                                                 | Provides global skip link, cookie banner, optional telemetry, toasters, i18n provider, and root metadata.                                                                                                      |
| `/`                    | Main homepage composition and landing-specific page behavior    | `src/components/ProofoundLanding.tsx`                         | `src/components/ui/SectionSeparator.tsx`, `src/components/ui/magnetic-button.tsx`, `src/components/ui/button.tsx`                                                                                                                                                                                                                                                                                                                                                | Owns fixed header, progress bar, menu overlay, Lenis smooth scroll, section ordering, CTA routing, and background effects.                                                                                     |
| `/`                    | Header, hero, and first-view visuals                            | `src/components/landing/sections/HeroSection.tsx`             | `public/logo.png`, `public/hero-shape.png`, `public/noise.png`, `src/components/landing/MagneticButton.tsx`                                                                                                                                                                                                                                                                                                                                                      | Hero is the primary first-view block. Header logo and menu live in `ProofoundLanding.tsx`, not inside `HeroSection`.                                                                                           |
| `/`                    | Problem section                                                 | `src/components/landing/sections/ProblemSection.tsx`          | `lucide-react` icons, `src/lib/utils.ts`                                                                                                                                                                                                                                                                                                                                                                                                                         | Nine-card problem grid. First card is featured at larger breakpoints.                                                                                                                                          |
| `/`                    | How it works section                                            | `src/components/landing/sections/HowItWorksSection.tsx`       | `lucide-react` icons, `framer-motion`                                                                                                                                                                                                                                                                                                                                                                                                                            | Ten-card feature narrative with sticky desktop progress rail and scroll-centered active state.                                                                                                                 |
| `/`                    | Trust and principles section                                    | `src/components/landing/sections/PrinciplesSection.tsx`       | `lucide-react` icons, `framer-motion`                                                                                                                                                                                                                                                                                                                                                                                                                            | Six accordion-style principle cards. First item is expanded by default.                                                                                                                                        |
| `/`                    | Persona split section                                           | `src/components/landing/sections/PersonasSection.tsx`         | `src/components/landing/MagneticButton.tsx`, `src/components/landing/visuals/CredentialVisualization.tsx`, `src/components/landing/visuals/OrganizationVisualization.tsx`                                                                                                                                                                                                                                                                                        | Desktop shows both persona cards at once. Mobile uses a segmented toggle and defaults to Individuals.                                                                                                          |
| `/`                    | Why now section                                                 | `src/components/landing/sections/WhyNowSection.tsx`           | `framer-motion`, `src/lib/utils.ts`                                                                                                                                                                                                                                                                                                                                                                                                                              | Five numbered urgency cards.                                                                                                                                                                                   |
| `/`                    | Proof / trust claims section                                    | `src/components/landing/sections/ProofSection.tsx`            | `lucide-react` icons, `framer-motion`                                                                                                                                                                                                                                                                                                                                                                                                                            | Includes one non-functional button: “Explore our protocol”.                                                                                                                                                    |
| `/`                    | Steward ownership section                                       | `src/components/landing/sections/StewardOwnershipSection.tsx` | `lucide-react` icons, `framer-motion`                                                                                                                                                                                                                                                                                                                                                                                                                            | Dedicated business-model/governance section.                                                                                                                                                                   |
| `/`                    | Products and subscriptions section                              | `src/components/landing/sections/ProductsSection.tsx`         | `src/components/ui/button.tsx`, `lucide-react` icons                                                                                                                                                                                                                                                                                                                                                                                                             | Two-plan pricing section. Organization plan is visually highlighted and labeled “POPULAR”.                                                                                                                     |
| `/`                    | Final CTA section                                               | `src/components/landing/sections/FinalCTASection.tsx`         | `src/components/landing/MagneticButton.tsx`, `public/noise.png`                                                                                                                                                                                                                                                                                                                                                                                                  | Large dark CTA block with router-based `/signup` action.                                                                                                                                                       |
| `/`                    | Final quote section                                             | `src/components/landing/sections/FinalQuoteSection.tsx`       | `framer-motion`                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Manifesto-style quote with word-by-word reveal and decorative watermark blur.                                                                                                                                  |
| `/`                    | Footer section                                                  | `src/components/landing/sections/FooterSection.tsx`           | `public/logo.png`, `lucide-react` icons                                                                                                                                                                                                                                                                                                                                                                                                                          | Footer contains platform, company, and legal links plus placeholder social links.                                                                                                                              |
| `/`                    | Landing visuals and interaction dependencies                    | `src/components/landing/MagneticButton.tsx`                   | `src/components/ui/button.tsx`, `src/components/ui/magnetic-button.tsx`                                                                                                                                                                                                                                                                                                                                                                                          | Two different magnetic button implementations exist. The landing page uses `src/components/landing/MagneticButton.tsx` for section CTAs and `src/components/ui/magnetic-button.tsx` for the sticky header CTA. |
| `/`                    | Metadata, sitemap, robots, and OG image resolution              | `src/lib/seo/public-metadata.ts`                              | `src/app/sitemap.ts`, `src/app/robots.txt/route.ts`, `public/hero-visual.jpg`                                                                                                                                                                                                                                                                                                                                                                                    | Homepage metadata is route-specific, but sitemap and robots shape indexing and shareability.                                                                                                                   |
| `/`                    | Consent and telemetry                                           | `src/components/CookieBanner.tsx`                             | `src/lib/cookies/consent.ts`, `src/components/OptionalTelemetry.tsx`, `src/components/PerformanceTracker.tsx`, `src/components/WebVitalsReporter.tsx`, `src/lib/performance/client-tracker.ts`, `src/lib/analytics/web-vitals.ts`, `instrumentation.ts`, `instrumentation-client.ts`                                                                                                                                                                             | Cookie consent gates optional telemetry. Sentry initializes globally regardless of consent. Deferred chat/support widgets do not mount on `/`.                                                                 |
| linked routes from `/` | CTA and footer destination routes                               | `src/app/(auth)/signup/page.tsx`                              | `src/app/(auth)/signup/individual/page.tsx`, `src/app/(auth)/signup/organization/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/auth/login/page.tsx`, `src/app/(marketing)/about/page.tsx`, `src/app/(marketing)/manifesto/page.tsx`, `src/app/(marketing)/careers/page.tsx`, `src/app/(marketing)/contact/page.tsx`, `src/app/(marketing)/support/page.tsx`, `src/app/(marketing)/cookies/page.tsx`, `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` | CTA destinations are implemented. Signup route can redirect to persona-specific routes based on `type` query params, but the landing page pushes directly to explicit persona routes where relevant.           |
| `/`                    | Shared styling tokens and brand palette                         | `src/app/globals.css`                                         | `tailwind.config.ts`, `src/design/brand-tokens.json`                                                                                                                                                                                                                                                                                                                                                                                                             | Defines fonts, colors, landing animation utilities, and semantic design tokens.                                                                                                                                |

## 4. Page structure map

The homepage currently renders 13 visible blocks when counted as top-level user-facing surfaces: header, 11 `<section>` elements inside `<main>`, and one footer. A first-visit cookie banner can also overlay the viewport, but it is a conditional global overlay rather than a section in the main page flow.

|   # | visible section name       | purpose                                                   | main headline / copy summary                                                                                        | CTA(s)                                                                 | component file(s)                                                                                                                                                                   | status             |
| --: | -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
|   1 | Header / navigation chrome | Brand entry, sticky CTA, full-screen menu                 | No headline. Logo, “Get Started”, and menu items “Mission”, “How it Works”, “Principles”, “Pricing”, “Log in”       | Sticky `Get Started` -> `/signup`; menu anchors and `/login`           | `src/components/ProofoundLanding.tsx`                                                                                                                                               | VERIFIED           |
|   2 | Hero                       | Lead promise and first conversion point                   | “Proofound” / “Publish your public proof portfolio on day 1”                                                        | `Join as an Individual`, `Join as an Organization`                     | `src/components/landing/sections/HeroSection.tsx`                                                                                                                                   | VERIFIED           |
|   3 | The Problem                | Establish current-system pain points                      | “The problems we solve” / “Today’s connection and verification systems are broken.”                                 | None                                                                   | `src/components/landing/sections/ProblemSection.tsx`                                                                                                                                | PARTIALLY VERIFIED |
|   4 | How Proofound Works        | Explain feature model and product expansion path          | “How Proofound works” / “Start by publishing your proof portfolio, then expand into matching and growth workflows.” | Desktop progress-rail buttons scroll within the section; no route CTAs | `src/components/landing/sections/HowItWorksSection.tsx`                                                                                                                             | PARTIALLY VERIFIED |
|   5 | What Makes It Trustworthy  | Present platform principles and guardrails                | “What makes it trustworthy” / “Principles that guide every decision we make.”                                       | Accordion interactions only; no route CTA                              | `src/components/landing/sections/PrinciplesSection.tsx`                                                                                                                             | PARTIALLY VERIFIED |
|   6 | Built for You              | Split value by persona                                    | “Built for you” / “Whether you’re an individual or an organization, Proofound empowers you.”                        | `Join as an Individual`, `Join as an Organization`                     | `src/components/landing/sections/PersonasSection.tsx`, `src/components/landing/visuals/CredentialVisualization.tsx`, `src/components/landing/visuals/OrganizationVisualization.tsx` | VERIFIED           |
|   7 | Why Now                    | Urgency and context framing                               | “Why now” / “The paradigm is shifting. The need is immediate.”                                                      | None                                                                   | `src/components/landing/sections/WhyNowSection.tsx`                                                                                                                                 | PARTIALLY VERIFIED |
|   8 | Proof                      | Trust, privacy, and standards claims                      | “Uncompromising Proof.” / “We don’t just claim credibility; we engineer it.”                                        | “Explore our protocol” button with no implemented action               | `src/components/landing/sections/ProofSection.tsx`                                                                                                                                  | PARTIALLY VERIFIED |
|   9 | Steward Ownership          | Explain governance / ownership model                      | “Steward Ownership — The Business Model of the Future”                                                              | None                                                                   | `src/components/landing/sections/StewardOwnershipSection.tsx`                                                                                                                       | PARTIALLY VERIFIED |
|  10 | Products & Subscriptions   | Pricing / plan differentiation                            | “Products & Subscriptions” / “Simple, transparent pricing for everyone.”                                            | `Join as an Individual`, `Join as an Organization`                     | `src/components/landing/sections/ProductsSection.tsx`                                                                                                                               | PARTIALLY VERIFIED |
|  11 | Final CTA                  | High-contrast conversion close                            | “Ready to share proof today?”                                                                                       | `Get Started` -> `/signup`                                             | `src/components/landing/sections/FinalCTASection.tsx`                                                                                                                               | VERIFIED           |
|  12 | Final Quote                | Manifesto-style closing statement                         | “The future of work isn’t about working more. It’s about working with purpose, trust, and dignity.”                 | None                                                                   | `src/components/landing/sections/FinalQuoteSection.tsx`                                                                                                                             | PARTIALLY VERIFIED |
|  13 | Footer                     | Secondary navigation, company/legal links, social/contact | “Credibility engineering for a world that needs trust more than ever.”                                              | Footer links plus social/email links                                   | `src/components/landing/sections/FooterSection.tsx`                                                                                                                                 | VERIFIED           |

## 5. Detailed section-by-section breakdown

### Header / navigation chrome

- Verification status: VERIFIED
- User-facing purpose:
  - Fixed top-level navigation and brand anchor.
  - Provides a sticky CTA after scroll progress passes roughly 10% and before roughly 90%.
  - Opens a full-screen Radix Dialog menu overlay.
- Visible copy summary:
  - No headline in the header itself.
  - Menu labels: `Mission`, `How it Works`, `Principles`, `Pricing`, `Log in`.
  - Sticky CTA label: `Get Started`.
- Supporting text:
  - None.
- Buttons / links and where they go:
  - Logo -> `/`
  - Sticky `Get Started` button -> `router.push('/signup')`
  - `Mission` -> `#the-problem`
  - `How it Works` -> `#how-it-works`
  - `Principles` -> `#principles`
  - `Pricing` -> `#products`
  - `Log in` -> `/login`
- Imagery / visual treatment:
  - Header is fixed and transparent over the page.
  - Logo uses `public/logo.png`.
  - Menu trigger and close button are circular glass-like controls.
  - A thin terracotta progress indicator spans the top edge.
- Dynamic behavior:
  - `Lenis` smooth scrolling initializes for the page unless reduced motion is requested.
  - Sticky CTA visibility is tied to `scrollYProgress` in `ProofoundLanding.tsx`.
  - Full-screen menu overlay uses `@radix-ui/react-dialog`.
- Conditional rendering logic:
  - Sticky CTA hides before 10% scroll and after 90% scroll.
  - Sticky CTA button is hidden on very small screens because its class is `hidden sm:flex`.
- Responsive notes:
  - Header padding increases on `md`.
  - Menu overlay remains full screen across breakpoints.
- Source files involved:
  - `src/components/ProofoundLanding.tsx`
  - `src/components/ui/magnetic-button.tsx`
  - `src/components/ui/button.tsx`
  - `public/logo.png`
- Implementation notes:
  - The menu uses `<a>` for hash links and `next/link` for `/login`.
  - Header sits outside `<main>`.
- Mismatch vs locked MVP / GTM if relevant:
  - Locked MVP does not conflict with the existence of a simple header.
  - GTM comparison is UNVERIFIED because the GTM file requested for comparison is missing.

### Hero

- Verification status: VERIFIED
- User-facing purpose:
  - Lead with the homepage’s current product promise and first conversion choices.
- Exact or near-exact visible copy summary:
  - `Proofound`
  - `Publish your public proof portfolio on day 1`
  - `Get a clean, shareable portfolio link today. Then layer on matching, hiring, and collaboration workflows as you grow.`
- Supporting text:
  - None beyond the paragraph above.
- Buttons / links and where they go:
  - `Join as an Individual` -> `router.push('/signup/individual')`
  - `Join as an Organization` -> `router.push('/signup/organization')`
- Imagery / visual treatment:
  - Warm off-white background with grain overlay and animated mesh gradient.
  - Two large blurred organic blobs.
  - Large serif `h1` and sans `h2`.
  - `public/hero-shape.png` appears on the right on large screens only.
- Dynamic behavior:
  - Hero text animates into place with Framer Motion unless reduced motion is requested.
  - Scroll transforms adjust vertical position and opacity while the section scrolls out.
- Conditional rendering logic:
  - Right-side visual is `hidden lg:block`.
- Responsive notes:
  - CTA buttons stack vertically on mobile and sit in a row on `sm+`.
  - Section uses `min-h-[100dvh]` on small screens and `sm:min-h-[90dvh]`.
- Source files involved:
  - `src/components/landing/sections/HeroSection.tsx`
  - `src/components/landing/MagneticButton.tsx`
  - `public/hero-shape.png`
  - `public/noise.png`
- Implementation notes:
  - This section is the clearest expression of the current “public proof portfolio first” framing.
- Mismatch vs locked MVP / GTM if relevant:
  - Mostly aligned with the locked MVP wedge.
  - The clause about “matching, hiring, and collaboration workflows” broadens beyond the narrowest wedge, but it still keeps the public proof portfolio first.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### The Problem

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Frame the market and workflow pain points the product claims to address.
- Exact or near-exact visible copy summary:
  - `The problems we solve`
  - `Today's connection and verification systems are broken.`
  - Problem cards:
    - `The endless toll of networking and job hunting`
    - `Wasted hours on manual verification rituals`
    - `Opaque, biased, and misaligned matching`
    - `Vanity metrics obscuring real impact`
    - `Outdated CVs missing the full story`
    - `Capital disconnected from true mission`
    - `Anxiety from opaque algorithmic decisions`
    - `Fragmented frameworks for collaboration`
    - `Wasted talent, time, and resources`
- Supporting text:
  - None beyond the subheading.
- Buttons / links and where they go:
  - None.
- Imagery / visual treatment:
  - Nine-card grid.
  - First card is visually featured and spans more space at larger breakpoints.
  - Lucide icons inside terracotta-tinted rounded icon containers.
- Dynamic behavior:
  - Entrance animation on scroll into view.
  - Hover lift/scale on desktop unless reduced motion is requested.
- Conditional rendering logic:
  - None besides reduced-motion behavior.
- Responsive notes:
  - Grid changes from 1 column to 2 columns to 4 columns.
- Source files involved:
  - `src/components/landing/sections/ProblemSection.tsx`
- Implementation notes:
  - This section introduces both candidate-facing and system/governance pain points.
- Mismatch vs locked MVP / GTM if relevant:
  - Includes some broad themes such as disconnected capital and algorithmic anxiety that go beyond the MVP’s narrow operational wedge.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### How Proofound Works

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Explain the homepage’s current feature model and expansion path.
- Exact or near-exact visible copy summary:
  - `How Proofound works`
  - `Start by publishing your proof portfolio, then expand into matching and growth workflows.`
  - Ten feature cards:
    - `Public proof portfolio`
    - `Matching as a second step`
    - `Transferable verification`
    - `Granular privacy controls`
    - `Decluttered UX`
    - `Mental health tools`
    - `Life & career planning`
    - `Data democratization`
    - `Talent mobility`
    - `Education & guidance`
- Supporting text:
  - Each feature card includes a descriptive sentence.
- Buttons / links and where they go:
  - No route CTAs.
  - On desktop, the left-side progress rail uses buttons that scroll to the relevant feature card in the same section.
- Imagery / visual treatment:
  - Two-column layout on desktop.
  - Left column becomes sticky with progress labels.
  - Right column is a stack of rounded glass-like feature cards.
  - Organic background blobs move vertically with scroll.
- Dynamic behavior:
  - Section tracks scroll and updates an `activeStep`.
  - An `IntersectionObserver` sets the active feature card based on viewport position.
  - Desktop cards dim when inactive.
- Conditional rendering logic:
  - Desktop-only sticky progress rail.
- Responsive notes:
  - Mobile collapses to a simple stacked flow with no sticky rail.
- Source files involved:
  - `src/components/landing/sections/HowItWorksSection.tsx`
- Implementation notes:
  - This section is one of the clearest places where the page broadens well beyond the locked MVP.
- Mismatch vs locked MVP / GTM if relevant:
  - `Public proof portfolio`, `matching as a second step`, `transferable verification`, and `granular privacy controls` align reasonably well.
  - `Mental health tools`, `life & career planning`, `data democratization`, `talent mobility`, and `education & guidance` noticeably broaden scope beyond the locked MVP wedge.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### What Makes It Trustworthy

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Present guiding principles and trust claims.
- Exact or near-exact visible copy summary:
  - `What makes it trustworthy`
  - `Principles that guide every decision we make.`
  - Accordion items:
    - `Eleanor Ostrom's commons principles`
    - `Distributed systems mindset`
    - `Anti-bias guardrails`
    - `Steward-ownership ethos`
    - `Remove the excess`
    - `Information quality drives decisions`
- Supporting text:
  - Expanded card descriptions explain each principle.
- Buttons / links and where they go:
  - No route CTAs.
  - Accordion buttons expand/collapse content.
- Imagery / visual treatment:
  - Large rounded accordion cards with numbered labels.
  - Plus icon rotates on expansion.
  - Active card changes border and accent color.
- Dynamic behavior:
  - First item is expanded by default because `expandedIndex` starts at `0`.
  - Framer Motion animates expansion and icon rotation.
- Conditional rendering logic:
  - Only one item can be expanded at a time.
- Responsive notes:
  - Remains a single-column accordion across breakpoints.
- Source files involved:
  - `src/components/landing/sections/PrinciplesSection.tsx`
- Implementation notes:
  - This section combines governance, architecture, anti-bias claims, and information-quality messaging.
- Mismatch vs locked MVP / GTM if relevant:
  - `Anti-bias guardrails` and `Information quality drives decisions` map more directly to the locked MVP.
  - `Eleanor Ostrom's commons principles`, `Distributed systems mindset`, and `Steward-ownership ethos` pull the message toward a broader manifesto/governance frame.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Built for You

- Verification status: VERIFIED
- User-facing purpose:
  - Split homepage value by persona.
- Exact or near-exact visible copy summary:
  - `Built for you`
  - `Whether you're an individual or an organization, Proofound empowers you.`
  - Individual card:
    - `For Individuals`
    - `Publish a clean public proof portfolio link you can share immediately`
    - `Build a verified, portable profile that tells your real story`
    - `Access well-being tools and career planning support`
  - Organization card:
    - `For Organizations`
    - `Publish a clean public organization portfolio link on day 1`
    - `Discover talent based on evidence and alignment, not resumes`
    - `Reduce bias in hiring and partnership decisions`
    - `Use transparent verification and matching as secondary workflow layers`
- Supporting text:
  - No extra paragraph outside the bullets.
- Buttons / links and where they go:
  - `Join as an Individual` -> `/signup/individual`
  - `Join as an Organization` -> `/signup/organization`
- Imagery / visual treatment:
  - Desktop shows two large side-by-side cards.
  - Mobile uses pill-style segmented toggles.
  - Each persona card includes a stylized visualization tile:
    - Individual visual uses initials, progress bars, `Verified`, and `Identity` tags.
    - Organization visual uses a search/match card, `Aligned`, and `Verified Skill` tags.
- Dynamic behavior:
  - Mobile toggle switches persona content.
  - Desktop cards have hover scale effects.
- Conditional rendering logic:
  - Mobile defaults to `individual`.
  - Desktop hides the mobile segmented control and shows both cards simultaneously.
- Responsive notes:
  - This is the most explicitly divergent layout between mobile and desktop.
- Source files involved:
  - `src/components/landing/sections/PersonasSection.tsx`
  - `src/components/landing/MagneticButton.tsx`
  - `src/components/landing/visuals/CredentialVisualization.tsx`
  - `src/components/landing/visuals/OrganizationVisualization.tsx`
- Implementation notes:
  - Two placeholder `image` string fields exist in the persona data object, but they are not used in rendering.
- Mismatch vs locked MVP / GTM if relevant:
  - Public proof portfolio, verified/portable profile, and evidence-based org review align with the locked MVP.
  - “Well-being tools and career planning support” again broaden the individual story.
  - “Partnership decisions” is broader than the locked MVP hiring corridor.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Why Now

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Establish urgency and macro context.
- Exact or near-exact visible copy summary:
  - `Why now`
  - `The paradigm is shifting. The need is immediate.`
  - Reason cards:
    - `The AI paradigm shift`
    - `The crisis of digital trust`
    - `The search for meaning`
    - `The obsolescence of the CV`
    - `The demand for borderless talent`
- Supporting text:
  - Each card has a short explanatory sentence.
- Buttons / links and where they go:
  - None.
- Imagery / visual treatment:
  - Five large numbered cards stacked vertically.
  - Terracotta number badges.
- Dynamic behavior:
  - Entrance motion on scroll.
  - Hover border and color shifts on desktop unless reduced motion is requested.
- Conditional rendering logic:
  - None besides reduced-motion adjustments.
- Responsive notes:
  - The section remains a vertical stack.
- Source files involved:
  - `src/components/landing/sections/WhyNowSection.tsx`
- Implementation notes:
  - This section is explicitly macro- and thesis-driven rather than narrow-feature-driven.
- Mismatch vs locked MVP / GTM if relevant:
  - `The obsolescence of the CV` is closely aligned with the locked MVP narrative.
  - `The search for meaning` and `The demand for borderless talent` are broader than the locked MVP’s operational launch wedge.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Proof

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Make trust, verification, privacy, and standards claims.
- Exact or near-exact visible copy summary:
  - `Uncompromising Proof.`
  - `We don't just claim credibility; we engineer it. Every interaction is verifiable, transparent, and secure by design.`
  - Card 1:
    - `Cryptographic Verification`
    - `Every proof is cryptographically verifiable, source-traceable, and time-stamped. Trust is engineered, not assumed.`
    - Button text: `Explore our protocol`
  - Card 2:
    - `Privacy First`
    - `Granular controls at every layer. You decide what's visible, to whom, and when. Your data is yours, always.`
    - Metric tile: `100%` / `User Controlled`
  - Card 3:
    - `Transparent Audits`
    - `Continuous monitoring and published transparency reports ensure our algorithms remain open and accountable.`
  - Card 4:
    - `Open Standards`
    - `Built on open protocols to ensure longevity and interoperability. No walled gardens.`
- Supporting text:
  - None beyond the card descriptions.
- Buttons / links and where they go:
  - `Explore our protocol` is a `<button>` with no `onClick`, no `href`, and no implemented navigation. It is placeholder / non-functional.
- Imagery / visual treatment:
  - Multi-card grid with one large verification card, one tall dark privacy card, and two smaller supporting cards.
  - Uses fingerprint, shield, lock, and file-search iconography.
- Dynamic behavior:
  - Background pulses and scales unless reduced motion is requested.
  - Cards use hover effects on desktop.
- Conditional rendering logic:
  - None besides reduced-motion handling.
- Responsive notes:
  - Grid compresses to one column on small screens.
- Source files involved:
  - `src/components/landing/sections/ProofSection.tsx`
- Implementation notes:
  - This section uses strong claim language that is only partially grounded by the homepage itself.
- Mismatch vs locked MVP / GTM if relevant:
  - Privacy and trust direction align with the locked MVP.
  - “Cryptographic Verification” and “Open Standards” are stronger and broader claims than what the locked MVP document explicitly foregrounds as the homepage wedge.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Steward Ownership

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Present a business-model/governance claim as part of the homepage story.
- Exact or near-exact visible copy summary:
  - `Steward Ownership — The Business Model of the Future`
  - `Purpose and independence are permanently protected by giving control to active stewards, never to external shareholders.`
  - Principle cards:
    - `Purpose Before Profit`
    - `Self-Governance`
    - `Legacy Preservation`
- Supporting text:
  - Each card adds a short explanation.
- Buttons / links and where they go:
  - None.
- Imagery / visual treatment:
  - Three centered rounded cards with soft hover elevation.
- Dynamic behavior:
  - Cards animate into view and lift on hover unless reduced motion is requested.
- Conditional rendering logic:
  - None.
- Responsive notes:
  - Becomes a three-column grid on desktop.
- Source files involved:
  - `src/components/landing/sections/StewardOwnershipSection.tsx`
- Implementation notes:
  - This is a standalone narrative block rather than a necessary explanation of the public proof portfolio wedge.
- Mismatch vs locked MVP / GTM if relevant:
  - This section is materially broader than the locked MVP landing-page wedge and is one of the clearest legacy/broader-message carryovers.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Products & Subscriptions

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - Present pricing and plan framing for individuals and organizations.
- Exact or near-exact visible copy summary:
  - `Products & Subscriptions`
  - `Simple, transparent pricing for everyone.`
  - Individual plan:
    - `Free / forever`
    - `For professionals who want a day-1 public proof portfolio and portable credibility.`
    - Features:
      - `Public proof portfolio URL`
      - `Verified profile & trust signals`
      - `Matching as a secondary benefit`
      - `Optional private check-ins`
      - `Portable credentials`
  - Organization plan:
    - `Custom / per seat`
    - `For teams that need a public credibility surface first, then hiring workflows.`
    - Features:
      - `Public organization portfolio URL`
      - `Assignment and match review corridor`
      - `Bias-aware screening guardrails`
      - `Lean trust profile workflow`
      - `Dedicated support`
    - Highlight badge: `POPULAR`
- Supporting text:
  - None beyond plan descriptions and feature lists.
- Buttons / links and where they go:
  - `Join as an Individual` -> `/signup/individual`
  - `Join as an Organization` -> `/signup/organization`
- Imagery / visual treatment:
  - Two large pricing cards in a bento-like structure.
  - Organization plan is dark, scaled up, and visually highlighted.
- Dynamic behavior:
  - Highlight badge animates its gradient.
  - Cards animate in on scroll.
- Conditional rendering logic:
  - None.
- Responsive notes:
  - Single-column stack on small screens, two-column layout on desktop.
- Source files involved:
  - `src/components/landing/sections/ProductsSection.tsx`
  - `src/components/ui/button.tsx`
- Implementation notes:
  - This section frames the organization offering as hiring-workflow-adjacent rather than purely proof-portfolio-first.
- Mismatch vs locked MVP / GTM if relevant:
  - `Public proof portfolio URL` and `public organization portfolio URL` align.
  - `Optional private check-ins` and the more expansive org workflow framing go beyond the narrowest locked MVP landing wedge.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Final CTA

- Verification status: VERIFIED
- User-facing purpose:
  - Close the page with one high-contrast general signup action.
- Exact or near-exact visible copy summary:
  - `Ready to share proof today?`
  - `Start with a clean public proof portfolio link, then grow into matching and collaboration workflows at your pace.`
- Supporting text:
  - None beyond the paragraph above.
- Buttons / links and where they go:
  - `Get Started` -> `router.push('/signup')`
- Imagery / visual treatment:
  - Large dark section with noise texture, soft gradients, giant serif headline, and white CTA pill.
- Dynamic behavior:
  - Animated gradient background blobs unless reduced motion is requested.
  - CTA has hover/tap scaling and shimmer effect unless reduced motion is requested.
- Conditional rendering logic:
  - None besides reduced-motion handling.
- Responsive notes:
  - Uses very large fluid headline sizing.
- Source files involved:
  - `src/components/landing/sections/FinalCTASection.tsx`
  - `src/components/landing/MagneticButton.tsx`
  - `public/noise.png`
- Implementation notes:
  - This is a general signup CTA, not persona-specific.
- Mismatch vs locked MVP / GTM if relevant:
  - Mostly aligned with the proof-first landing story, though it still references broader matching and collaboration workflows.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Final Quote

- Verification status: PARTIALLY VERIFIED
- User-facing purpose:
  - End on manifesto-style brand positioning.
- Exact or near-exact visible copy summary:
  - `The future of work isn't about working more. It's about working with purpose, trust, and dignity.`
  - Label below: `Proofound Manifesto`
- Supporting text:
  - None.
- Buttons / links and where they go:
  - None.
- Imagery / visual treatment:
  - Large italic serif blockquote with word-by-word reveal.
  - Decorative blurred watermark shape behind the quote.
- Dynamic behavior:
  - Word-by-word animation unless reduced motion is requested.
  - Decorative background parallax on scroll.
- Conditional rendering logic:
  - Reduced-motion mode swaps the motion watermark for a static blurred shape.
- Responsive notes:
  - Uses very large display typography at larger breakpoints.
- Source files involved:
  - `src/components/landing/sections/FinalQuoteSection.tsx`
- Implementation notes:
  - This section is emotional/manifesto-led rather than product-specific.
- Mismatch vs locked MVP / GTM if relevant:
  - The themes of purpose, trust, and dignity are directionally compatible with the locked MVP, but the section is broad and brand-thesis-oriented rather than wedge-specific.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

### Footer

- Verification status: VERIFIED
- User-facing purpose:
  - Provide secondary navigation, company/legal routes, and contact links.
- Exact or near-exact visible copy summary:
  - `Credibility engineering for a world that needs trust more than ever. We build the infrastructure for verifiable professional reputation.`
  - Link groups:
    - Platform: `How it Works`, `Principles`, `For Individuals`, `For Organizations`
    - Company: `About Us`, `Manifesto`, `Careers`, `Contact`, `Support`
    - Legal: `Privacy Policy`, `Terms of Service`, `Cookie Policy`
  - Status line: `All Systems Operational`
  - Location note: `Designed with ♥ in Stockholm`
- Supporting text:
  - Copyright line:
    - `© {currentYear} Proofound Inc. All rights reserved.`
- Buttons / links and where they go:
  - Logo -> `/`
  - Platform anchors:
    - `How it Works` -> `#how-it-works`
    - `Principles` -> `#principles`
    - `For Individuals` -> `#personas`
    - `For Organizations` -> `#personas`
  - Company routes:
    - `/about`
    - `/manifesto`
    - `/careers`
    - `/contact`
    - `/support`
  - Legal routes:
    - `/privacy`
    - `/terms`
    - `/cookies`
  - Social/email:
    - Twitter -> `#`
    - LinkedIn -> `#`
    - GitHub -> `#`
    - Email -> `mailto:hello@proofound.io`
- Imagery / visual treatment:
  - Dark footer with giant low-opacity `Proofound` watermark.
  - Logo is inverted to white.
- Dynamic behavior:
  - Social icons scale/rotate on hover unless reduced motion is requested.
  - Operational status dot pulses unless reduced motion is requested.
- Conditional rendering logic:
  - None.
- Responsive notes:
  - Grid reorganizes into columns on desktop.
- Source files involved:
  - `src/components/landing/sections/FooterSection.tsx`
  - `public/logo.png`
- Implementation notes:
  - Placeholder social links are implemented as `#`, not as real outbound destinations.
- Mismatch vs locked MVP / GTM if relevant:
  - Footer mostly serves as navigation and trust/support scaffolding.
  - Placeholder social links weaken the trust signal.
  - GTM comparison is UNVERIFIED because the GTM source file is missing.

## 6. Information architecture and message hierarchy

- Leading message:
  - The homepage currently leads with `Publish your public proof portfolio on day 1`.
  - This is the clearest and most MVP-aligned message on the page.
- What it prioritizes next:
  - The page then moves quickly into broad market pain, a feature-heavy “How it works” section, trust principles, persona-specific benefits, macro urgency, proof/trust claims, governance/ownership, pricing, and a final manifesto-style close.
- Candidate-first, org-first, both, or confused:
  - The page is both candidate-facing and organization-facing.
  - It is not strictly confused, but it is expansive. It tries to speak to both personas and to multiple product layers at once.
- Match against the narrow wedge of proof, trust, clarity, privacy, better review signal:
  - Strongest matches:
    - public proof portfolio
    - verified / portable profile
    - privacy controls
    - bias-aware review
    - resume replacement / better signal
  - Weaker matches:
    - mental health tools
    - life and career planning
    - data democratization
    - borderless talent mobility
    - stewardship/business model thesis
- Where the page still appears broad, vague, or legacy:
  - “How Proofound works” includes several broad platform claims that extend beyond the narrow MVP wedge.
  - “Why now” and “Final Quote” are thesis-driven and broad.
  - “Steward Ownership” reads like a broader manifesto/business-model insertion rather than a landing-page necessity for the MVP wedge.
  - “Proof” uses strong trust-technology language that is broader than the hero’s simpler proof-portfolio framing.

## 7. CTA map

| CTA label                                                | section where it appears | destination route / URL     | intent                         | implemented or placeholder | notes                                                                            |
| -------------------------------------------------------- | ------------------------ | --------------------------- | ------------------------------ | -------------------------- | -------------------------------------------------------------------------------- |
| `Get Started`                                            | Header sticky CTA        | `/signup`                   | General signup                 | Implemented                | Appears after scroll progress threshold; uses `router.push('/signup')`.          |
| `Mission`                                                | Full-screen menu         | `#the-problem`              | In-page jump                   | Implemented                | Hash anchor in menu overlay.                                                     |
| `How it Works`                                           | Full-screen menu         | `#how-it-works`             | In-page jump                   | Implemented                | Hash anchor in menu overlay.                                                     |
| `Principles`                                             | Full-screen menu         | `#principles`               | In-page jump                   | Implemented                | Hash anchor in menu overlay.                                                     |
| `Pricing`                                                | Full-screen menu         | `#products`                 | In-page jump                   | Implemented                | Hash anchor in menu overlay.                                                     |
| `Log in`                                                 | Full-screen menu         | `/login`                    | Authentication                 | Implemented                | Uses `next/link`.                                                                |
| `Join as an Individual`                                  | Hero                     | `/signup/individual`        | Individual acquisition         | Implemented                | Uses parent callback to `router.push('/signup/individual')`.                     |
| `Join as an Organization`                                | Hero                     | `/signup/organization`      | Organization acquisition       | Implemented                | Uses parent callback to `router.push('/signup/organization')`.                   |
| Desktop progress labels (`Public proof portfolio`, etc.) | How it Works             | In-page scroll to card      | Section navigation             | Implemented                | Scrolls cards into view inside the same section.                                 |
| `Join as an Individual`                                  | Personas                 | `/signup/individual`        | Individual acquisition         | Implemented                | Present in mobile and desktop variants.                                          |
| `Join as an Organization`                                | Personas                 | `/signup/organization`      | Organization acquisition       | Implemented                | Present in mobile and desktop variants.                                          |
| `Explore our protocol`                                   | Proof                    | None                        | Trust/protocol exploration     | Placeholder                | `<button>` has no `onClick`, `href`, or handler.                                 |
| `Join as an Individual`                                  | Products & Subscriptions | `/signup/individual`        | Individual acquisition         | Implemented                | Individual plan CTA.                                                             |
| `Join as an Organization`                                | Products & Subscriptions | `/signup/organization`      | Organization acquisition       | Implemented                | Organization plan CTA.                                                           |
| `Get Started`                                            | Final CTA                | `/signup`                   | General signup                 | Implemented                | Uses `router.push('/signup')`.                                                   |
| `How it Works`                                           | Footer                   | `#how-it-works`             | In-page jump                   | Implemented                | Platform nav group.                                                              |
| `Principles`                                             | Footer                   | `#principles`               | In-page jump                   | Implemented                | Platform nav group.                                                              |
| `For Individuals`                                        | Footer                   | `#personas`                 | In-page jump                   | Implemented                | Does not deep-link to a persona substate.                                        |
| `For Organizations`                                      | Footer                   | `#personas`                 | In-page jump                   | Implemented                | Does not deep-link to a persona substate.                                        |
| `About Us`                                               | Footer                   | `/about`                    | Company information            | Implemented                | Secondary informational page.                                                    |
| `Manifesto`                                              | Footer                   | `/manifesto`                | Company/brand principles       | Implemented                | Secondary informational page.                                                    |
| `Careers`                                                | Footer                   | `/careers`                  | Hiring / employer brand        | Implemented                | Secondary informational page.                                                    |
| `Contact`                                                | Footer                   | `/contact`                  | Contact path                   | Implemented                | Secondary informational page.                                                    |
| `Support`                                                | Footer                   | `/support`                  | Support path                   | Implemented                | Secondary informational page.                                                    |
| `Privacy Policy`                                         | Footer                   | `/privacy`                  | Legal/privacy                  | Implemented                | Secondary informational page.                                                    |
| `Terms of Service`                                       | Footer                   | `/terms`                    | Legal terms                    | Implemented                | Secondary informational page.                                                    |
| `Cookie Policy`                                          | Footer                   | `/cookies`                  | Cookie/legal                   | Implemented                | Secondary informational page.                                                    |
| Twitter icon                                             | Footer                   | `#`                         | Social proof / outbound social | Placeholder                | No real destination.                                                             |
| LinkedIn icon                                            | Footer                   | `#`                         | Social proof / outbound social | Placeholder                | No real destination.                                                             |
| GitHub icon                                              | Footer                   | `#`                         | Social proof / outbound social | Placeholder                | No real destination.                                                             |
| Email icon                                               | Footer                   | `mailto:hello@proofound.io` | Direct contact                 | Implemented                | Only footer social/contact link with a real destination besides internal routes. |

## 8. Copy inventory

This section captures major homepage copy only. It does not attempt to dump every string in the landing implementation.

- Hero copy:
  - `Proofound`
  - `Publish your public proof portfolio on day 1`
  - `Get a clean, shareable portfolio link today. Then layer on matching, hiring, and collaboration workflows as you grow.`
- Core value proposition copy:
  - `Public proof portfolio`
  - `Matching as a second step`
  - `Transferable verification`
  - `Granular privacy controls`
  - `Verified, portable profile`
  - `Public organization portfolio link`
  - `Evidence and alignment, not resumes`
- Proof / trust / privacy language:
  - `What makes it trustworthy`
  - `Anti-bias guardrails`
  - `Information quality drives decisions`
  - `Uncompromising Proof.`
  - `Every interaction is verifiable, transparent, and secure by design.`
  - `Cryptographic Verification`
  - `Privacy First`
  - `Transparent Audits`
  - `Open Standards`
  - `100% User Controlled`
- Organization-facing claims:
  - `Publish a clean public organization portfolio link on day 1`
  - `Discover talent based on evidence and alignment, not resumes`
  - `Reduce bias in hiring and partnership decisions`
  - `Use transparent verification and matching as secondary workflow layers`
  - `Assignment and match review corridor`
  - `Bias-aware screening guardrails`
  - `Lean trust profile workflow`
- Individual-facing claims:
  - `Publish a clean public proof portfolio link you can share immediately`
  - `Build a verified, portable profile that tells your real story`
  - `Matching as a secondary benefit`
  - `Portable credentials`
- Social proof / trust proof / metrics copy:
  - `Verified`
  - `Identity`
  - `1 Match`
  - `98%`
  - `Aligned`
  - `Verified Skill`
  - `POPULAR`
  - `All Systems Operational`
- Footer-level product/company copy:
  - `Credibility engineering for a world that needs trust more than ever. We build the infrastructure for verifiable professional reputation.`
- Broad/legacy or manifesto-style copy still present:
  - `Mental health tools`
  - `Life & career planning`
  - `Data democratization`
  - `Talent mobility`
  - `Steward Ownership — The Business Model of the Future`
  - `The future of work isn't about working more. It's about working with purpose, trust, and dignity.`

## 9. Visual and UI system notes

- Layout style:
  - Large editorial landing page with full-screen hero, stacked narrative sections, rounded cards, and decorative section separators.
  - Header is fixed. Footer is visually heavy and brand-forward.
- Spacing density:
  - Spacious. Sections commonly use `py-16` to `py-40`.
  - Content blocks often sit inside large rounded containers with generous internal padding.
- Typography pattern:
  - Display typography uses `Crimson Pro`.
  - UI/body typography uses `Inter`.
  - Hero and large section headings use oversized fluid display sizes (`text-h1`, `text-h3`, large `font-display` values).
- Card patterns:
  - Repeated use of glass-like cards: translucent backgrounds, blur, soft borders, rounded corners, and subtle shadows.
  - Sections such as Personas, Products, Principles, Proof, and Problem all use card-based storytelling.
- Iconography:
  - `lucide-react` across the page.
  - Icons are used heavily for feature, trust, and problem storytelling.
- Color use:
  - Warm off-white / parchment background.
  - Forest green and terracotta as core accents.
  - Additional Japandi palette tokens such as sage, clay, stone, and charcoal.
- Visual tone:
  - Calm, premium, editorial, and designed.
  - Not dashboard-like.
  - At the same time, the motion system makes it more stylized and expressive than a purely quiet, utilitarian trust page.
- Motion:
  - Heavy use of `framer-motion`.
  - Smooth scrolling via `Lenis`.
  - Animated mesh gradients, floating/morphing blobs, hover lifts, word reveals, and progress animations.
  - Reduced-motion fallbacks are implemented in both CSS and components.
- Background treatment:
  - Repeated use of grain (`noise.png`), gradients, radial blurs, blurred blobs, and watermark-like background shapes.
- Notable inconsistencies:
  - Two different magnetic button implementations exist.
  - The page mixes MVP-adjacent product messaging with broader manifesto/governance themes.
  - Footer social icons imply social presence but mostly point to placeholders.
  - Some tokens use `proofound-*` naming while others use `japandi-*` and `extended-*`, reflecting a mixed naming scheme.

## 10. SEO / metadata / shareability

- Page title:
  - `Proofound | Publish a Public Proof Portfolio on Day 1`
- Meta description:
  - `Proofound helps individuals and organizations publish a clean public proof portfolio link on day 1, then grow into matching and collaboration workflows.`
- Keywords:
  - `Proofound`
  - `public portfolio`
  - `proof-based portfolio`
  - `verified profile`
  - `professional credibility`
  - `organization portfolio`
  - `evidence based matching`
- Canonical:
  - `alternates: { canonical: '/' }` in `src/app/page.tsx`
  - Root `metadataBase` in `src/app/layout.tsx` converts this into an absolute canonical URL based on `NEXT_PUBLIC_SITE_URL`, `SITE_URL`, or fallback `https://proofound.io`.
- Open Graph:
  - Title: `Proofound | Public Proof Portfolio, Ready to Share`
  - Description: `Create a clean proof-based public portfolio link on day 1. Matching stays available as a secondary benefit as your profile grows.`
  - URL: site root
  - Image: `/hero-visual.jpg`
  - Image alt: `Proofound credibility platform landing page`
- Twitter:
  - Card type: `summary_large_image`
  - Title: `Proofound | Public Proof Portfolio`
  - Description: `Publish a clean public proof portfolio link today, then unlock matching and collaboration.`
  - Image: `/hero-visual.jpg`
- Root metadata that still exists globally:
  - `src/app/layout.tsx` defines default title/description:
    - `Proofound - Focus on what matters`
    - `A credibility and connection platform built for authenticity, not algorithms.`
  - For `/`, the route-specific metadata in `src/app/page.tsx` is the effective metadata.
- Structured data:
  - Implemented through `JsonLdScripts`.
  - Homepage injects:
    - `Organization`
    - `WebSite`
    - `WebPage`
    - `BreadcrumbList`
- Indexing behavior:
  - No homepage-specific `noindex` or restrictive robots metadata was found.
  - `src/app/robots.txt/route.ts` allows `/` and points to `/sitemap.xml`.
  - `src/app/sitemap.ts` includes `/` with weekly change frequency and priority `1`.

## 11. Analytics / instrumentation / event tracking

No landing-section-specific CTA, menu, scroll-depth, or engagement event tracking was found in the homepage component tree.

| file                                                                              | event name / metric                                                                 | trigger                                                          | notes                                                                                                                                                             |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/OptionalTelemetry.tsx`                                            | None directly; gates telemetry mounts                                               | Runs after hydration and listens for consent changes             | Only mounts optional telemetry if `hasAnalyticsConsent()` returns true.                                                                                           |
| `src/components/PerformanceTracker.tsx` + `src/lib/performance/client-tracker.ts` | Sampled performance metrics: `cls`, `fcp`, `inp`, `lcp`, `ttfb`, `page_load`, `tti` | Mounted only after analytics consent through `OptionalTelemetry` | Posts to `/api/performance/track`. Sampling rate is 10% in `client-tracker.ts`. Not landing-specific.                                                             |
| `src/components/WebVitalsReporter.tsx` + `src/lib/analytics/web-vitals.ts`        | Web Vitals metrics: `CLS`, `FCP`, `INP`, `LCP`, `TTFB`                              | Mounted only after analytics consent through `OptionalTelemetry` | Posts to `/api/analytics/web-vitals`. Not landing-specific.                                                                                                       |
| `instrumentation-client.ts`                                                       | Sentry browser tracing / replay instrumentation                                     | Loaded by Next.js on the client before application code          | Global instrumentation. Not consent-gated in the homepage tree. Masks replay text and blocks media.                                                               |
| `src/components/root/DeferredAppEnhancements.tsx`                                 | Crisp chat widget and SUS prompt host                                               | Only mounts on `/app` routes after an idle/defer period          | Not active on `/`. This means no homepage chat widget or SUS prompt is mounted from this path.                                                                    |
| `src/components/CookieBanner.tsx` + `src/lib/cookies/consent.ts`                  | Consent sync events, not landing analytics events                                   | First visit with no stored consent                               | Consent changes sync to `/api/user/consent` and dispatch `proofound:cookie-preferences-changed`. This is consent infrastructure, not homepage behavior analytics. |

Additional instrumentation notes:

- `@vercel/analytics/react` and `@vercel/speed-insights/next` are mounted inside `OptionalTelemetry`, so they are consent-gated on this route.
- No `emitEvent`, `trackEvent`, or landing CTA tracking hooks were found in `src/components/ProofoundLanding.tsx` or the landing section files.

## 12. Assets and dependencies

- Image assets:
  - `public/logo.png`
  - `public/hero-shape.png`
  - `public/hero-visual.jpg`
  - `public/noise.png`
- Visual-only landing assets:
  - Persona visuals are vector/HTML/CSS compositions from:
    - `src/components/landing/visuals/CredentialVisualization.tsx`
    - `src/components/landing/visuals/OrganizationVisualization.tsx`
- Icon packages:
  - `lucide-react`
- Animation libraries:
  - `framer-motion`
  - `lenis`
- UI / interaction libraries:
  - `@radix-ui/react-dialog`
  - `next/image`
  - `next/link`
- Fonts:
  - `Inter`
  - `Crimson Pro`
  - Loaded through the Google Fonts `@import` in `src/app/globals.css`
- Telemetry / monitoring dependencies that can affect the route:
  - `@vercel/analytics/react`
  - `@vercel/speed-insights/next`
  - `web-vitals`
  - `@sentry/nextjs`
- Section-specific dependencies:
  - `src/components/landing/MagneticButton.tsx`
  - `src/components/ui/magnetic-button.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/SectionSeparator.tsx`
- External embeds:
  - None on `/`
  - Crisp chat script exists in the codebase but is not mounted on `/`

## 13. Current gaps, placeholders, and weak points

- The homepage message is broader than the locked MVP wedge in multiple sections.
- `How Proofound works` includes scope-expanding claims such as mental health tools, life and career planning, data democratization, talent mobility, and education/guidance.
- `Steward Ownership` is a full section dedicated to governance/business-model framing rather than the narrow proof-first landing wedge.
- `ProofSection` contains a non-functional CTA button: `Explore our protocol`.
- Footer social links for Twitter, LinkedIn, and GitHub are placeholders (`#`), not implemented outbound destinations.
- The first-visit cookie banner overlays the initial viewport and visibly competes with the hero CTAs.
- Landing copy is hardcoded English and does not use `next-intl` despite the root `NextIntlClientProvider`.
- No landing-specific engagement analytics or CTA/menu tracking were found beyond consent-gated global telemetry and global Sentry instrumentation.
- `src/app/page.tsx` contains a comment that auth checking for the landing page is disabled for debugging/verification.
- The page makes strong trust-technology claims such as `Cryptographic Verification`, `Transparent Audits`, and `Open Standards` without landing-page-level evidence on the page itself.
- Two separate magnetic-button implementations exist in the codebase and are both used in the landing experience.
- The persona section data object includes unused `image` fields marked as placeholders.
- The page uses significant motion and visual flourish. Reduced-motion fallbacks exist, but the default experience is still more motion-heavy than a purely minimal trust page.

## 14. Alignment against locked MVP and GTM

The GTM comparison column below stays constrained to what can be grounded. Because `Proofound_GTM_and_Initial_Marketing_Plan_2026-03-11.md` is missing from this repo, GTM-specific comparison remains source-unavailable / UNVERIFIED.

| topic                                   | current landing page behavior                                                                                                                  | locked MVP / GTM expectation                                                                                                     | alignment status | notes                                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Proof-first positioning                 | Hero and several sections lead with public proof portfolios and proof-backed credibility                                                       | Locked MVP expects proof-first, privacy-first, portfolio-first framing. GTM source unavailable.                                  | PARTIAL          | The hero aligns well, but later sections dilute the proof-first focus with broader themes.                         |
| Privacy / trust positioning             | Privacy controls, anti-bias guardrails, proof, audits, and trust principles are prominent                                                      | Locked MVP expects privacy-safe, explainable review and trust scaffolding. GTM source unavailable.                               | PARTIAL          | Directionally aligned, but some claims are broader/stronger than the core MVP wedge.                               |
| Narrow wedge clarity                    | Hero is clear; middle of page becomes expansive and manifesto-like                                                                             | Locked MVP expects a narrow wedge around proof, trust, clarity, privacy, and better review signal. GTM source unavailable.       | MISALIGNED       | The wedge is visible, but not consistently protected.                                                              |
| Org vs individual balance               | Both personas are explicitly addressed and both have CTAs                                                                                      | Locked MVP includes both individuals and organizations. GTM source unavailable.                                                  | PARTIAL          | Balance exists, but org and individual value props are mixed with broader platform claims.                         |
| Anti-sprawl discipline                  | Multiple sections introduce mental health, life planning, data democratization, borderless talent, stewardship, and manifesto themes           | Locked MVP explicitly rejects scope sprawl. GTM source unavailable.                                                              | MISALIGNED       | This is one of the clearest areas of drift.                                                                        |
| AI language vs proof language           | The page includes one “AI paradigm shift” urgency card, but the main framing is still proof/trust rather than generic AI                       | Locked MVP says the wedge is not generic AI recruiting. GTM source unavailable.                                                  | PARTIAL          | Better than generic AI-recruiting language, but still broader than necessary in “Why now”.                         |
| Hiring workflow framing                 | Hero says matching, hiring, and collaboration workflows layer on later; Products section includes assignment and match review corridor         | Locked MVP allows org review workflows, but public proof should stay primary. GTM source unavailable.                            | PARTIAL          | Current copy often presents adjacent workflows alongside the wedge instead of keeping them more tightly secondary. |
| Platform scope implication              | The page implies a broader future platform with governance, portability, well-being, planning, transparency infrastructure, and open standards | Locked MVP says not a broad operating system, ATS replacement, social feed, or generic recruiting suite. GTM source unavailable. | MISALIGNED       | The homepage implies broader scope than the locked MVP supports today.                                             |
| Better review signal vs profile theater | Resume/CV replacement and evidence-based review claims are explicit                                                                            | Locked MVP strongly supports this framing. GTM source unavailable.                                                               | ALIGNED          | This is one of the best-aligned messages on the page.                                                              |
| Public proof portfolio on day 1         | Explicit in hero, personas, products, metadata, and OG copy                                                                                    | Locked MVP supports a shareable public proof portfolio from day 1. GTM source unavailable.                                       | ALIGNED          | This is the strongest consistent through-line across route metadata and rendered copy.                             |

## 15. Recommended use of this reference

- Use this file as the baseline before redesigning the homepage, so design work starts from the real current structure rather than memory or aspirational docs.
- Use it before copy rewriting, so new copy can intentionally keep, remove, or tighten the currently implemented messages.
- Use it before section removal or reordering, so broad or drifted sections can be removed with full awareness of current dependencies, CTA routing, and trust implications.
- Use it before implementation cleanup, so placeholder links, unused data fields, duplicate interaction patterns, and analytics gaps can be addressed systematically.
