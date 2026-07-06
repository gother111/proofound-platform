# M3 × Japandi UI Refresh Plan

> Doc class: `working-plan` · Created 2026-07-06 · Orchestrator: Claude (war-room protocol) · Implementer: Codex CLI
> Goal: adopt Material Design 3's engineering rigor (semantic color roles, surface-container ladder, 15-role type scale, shape scale, state layers, elevation, motion tokens, focus indicators) **mapped onto the existing Japandi brand**. This is NOT a switch to stock Material styling. DESIGN.md remains the aesthetic authority; M3 supplies the system.
> Non-negotiable: no changes to privacy/RLS/auth/consent semantics. No new dependencies except `next/font` (built into Next). No copy changes except where a spec says so (then en.json + sv.json together).

## Design decisions (authoritative)

### D1. Color roles (light scheme only — dark mode stays disabled)

Defined as raw-hex CSS custom properties in `globals.css` `:root`, registered in `tailwind.config.ts` as semantic color names. Values derive from `src/design/brand-tokens.json` ramps; a few deep tones are new.

| Role (CSS var / tw class)        | Hex                                            | Notes                                                                                        |
| -------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--m3-primary` `primary`         | `#56624F`                                      | brand forest (primary-600)                                                                   |
| `--m3-on-primary`                | `#FFFFFF`                                      |                                                                                              |
| `--m3-primary-container`         | `#E7EBE2`                                      | primary-100                                                                                  |
| `--m3-on-primary-container`      | `#2D332B`                                      | primary-900                                                                                  |
| `--m3-secondary`                 | `#756B63`                                      | secondary-800 warm gray                                                                      |
| `--m3-on-secondary`              | `#FFFFFF`                                      |                                                                                              |
| `--m3-secondary-container`       | `#DCD5CA`                                      | secondary-300 — nav active pill etc.                                                         |
| `--m3-on-secondary-container`    | `#33302B`                                      | new deep warm                                                                                |
| `--m3-tertiary`                  | `#8B4A36`                                      | brand terracotta                                                                             |
| `--m3-on-tertiary`               | `#FFFFFF`                                      | ~7:1                                                                                         |
| `--m3-tertiary-container`        | `#EFDCCE`                                      | accent-100                                                                                   |
| `--m3-on-tertiary-container`     | `#5E2F1F`                                      | new deep terracotta                                                                          |
| `--m3-error`                     | `#9A3B26`                                      | NEW true error role — redder than tertiary, ≥5.5:1 w/ white                                  |
| `--m3-on-error`                  | `#FFFFFF`                                      |                                                                                              |
| `--m3-error-container`           | `#F7DBD3`                                      |                                                                                              |
| `--m3-on-error-container`        | `#5A2214`                                      |                                                                                              |
| `--m3-surface-dim`               | `#E9E4D8`                                      |                                                                                              |
| `--m3-surface`                   | `#F3F0E8`                                      | parchment — unchanged                                                                        |
| `--m3-surface-bright`            | `#FBFAF8`                                      |                                                                                              |
| `--m3-surface-container-lowest`  | `#FDFCFA`                                      |                                                                                              |
| `--m3-surface-container-low`     | `#F8F5EE`                                      | absorbs ad-hoc #F6F2EA/#FBF8F1                                                               |
| `--m3-surface-container`         | `#F1EDE2`                                      | absorbs #F1ECE3                                                                              |
| `--m3-surface-container-high`    | `#EAE5D9`                                      |                                                                                              |
| `--m3-surface-container-highest` | `#E3DED2`                                      |                                                                                              |
| `--m3-on-surface`                | `#393735`                                      | neutralDark-900. Body text darkens from #5E5E5E — intentional crispness/contrast win (~10:1) |
| `--m3-on-surface-variant`        | `#5E5E5E`                                      | charcoal demoted to secondary text (4.6:1 AA)                                                |
| `--m3-outline`                   | `#857B6E`                                      | ≥3:1 on parchment — real component boundaries                                                |
| `--m3-outline-variant`           | `#D5CABA`                                      | stone — decorative dividers (current border)                                                 |
| `--m3-inverse-surface`           | `#32302C`                                      | replaces rogue #2D3330 (admin dark chrome)                                                   |
| `--m3-inverse-on-surface`        | `#F5F2EA`                                      |                                                                                              |
| `--m3-inverse-primary`           | `#B9C5AE`                                      |                                                                                              |
| `--m3-scrim`                     | `#000000`                                      | used at /40 for all overlays                                                                 |
| Status: `success`                | `#56624F` + container `#E0EAD7` / on `#2A3A24` | forest-based                                                                                 |
| Status: `warning`                | container `#F4E3C8` / on `#5C4200`             | ochre-based                                                                                  |
| Status: `info`                   | container `#E3E8DE` / on `#3A443C`             | sage/teal-based                                                                              |

**Legacy var re-pointing (same `globals.css` pass):** `--background`→surface, `--foreground`→on-surface (#393735), `--card`→surface-container-low, `--popover`→surface-container-low, `--muted`→surface-container, `--muted-foreground`→on-surface-variant, `--border`/`--input`→outline-variant, `--destructive`→error `#9A3B26` (+ foreground white), `--ring`→primary. Keep HSL-triplet format for these legacy vars (existing `hsl(var(--x))` consumers); new `--m3-*` vars are raw hex.

**Tailwind `proofound-*` re-point:** `proofound.forest`→`var(--m3-primary)`, `.terracotta`→`var(--m3-tertiary)`, `.parchment`→`var(--m3-surface)`, `.charcoal`→`var(--m3-on-surface-variant)`, `.stone`→`var(--m3-outline-variant)` — 2,154 existing usages inherit the system with zero file churn.

### D2. State layers (interaction feedback)

Utility in globals.css `@layer utilities`, per material-web pattern:

```css
.state-layer {
  position: relative;
  isolation: isolate;
}
.state-layer::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 150ms var(--m3-easing-standard);
  pointer-events: none;
}
.state-layer:hover::before {
  opacity: 0.08;
}
.state-layer:focus-visible::before {
  opacity: 0.12;
}
.state-layer:active::before {
  opacity: 0.12;
}
@media (prefers-reduced-motion: reduce) {
  .state-layer::before {
    transition: none;
  }
}
```

Disabled convention: content `on-surface` @ 38% (`disabled:opacity-38` equivalent), container `on-surface` @ 12%. State layers replace the `hover:-translate-y-1` lift as primary feedback (a subtle elevation change may remain on cards only).

### D3. Focus indicator — ONE recipe

`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface` (ring = primary). Never `focus:` for rings. Never colorless `focus:ring-2`. Never hardcoded ring colors/offsets.

### D4. Shape scale

CSS vars + tailwind `borderRadius`: `shape-xs` 4px · `shape-sm` 8px · `shape-md` 12px (inputs, menus, popovers) · `shape-lg` 16px (small cards, sheets) · `shape-xl` 24px (cards, dialogs — preserves current identity) · `shape-full` 9999px (pill CTAs, badges, switch). Remove the conflicting `brandTokens.borderRadius` spread from tailwind config; keep `lg/md/sm/xl/2xl/3xl` aliases working (map to nearest shape value) so existing classes don't break.

### D5. Type scale (15 roles)

Tailwind plugin utilities (complete classes incl. family/size/leading/tracking/weight):

- `text-display-lg` clamp(3rem,5vw+1rem,4.5rem)/1.1 · `text-display-md` clamp(2.5rem,4vw+1rem,3.5rem)/1.15 · `text-display-sm` 2.25rem/1.2 — Crimson Pro 500, tracking -0.02em
- `text-headline-lg` 2rem/2.5rem · `text-headline-md` 1.75rem/2.25rem · `text-headline-sm` 1.5rem/2rem — Crimson Pro 500
- `text-title-lg` 1.375rem/1.75rem · `text-title-md` 1rem/1.5rem (+0.15px) · `text-title-sm` 0.875rem/1.25rem (+0.1px) — Inter 600
- `text-body-lg` 1rem/1.5rem · `text-body-md` 0.875rem/1.25rem · `text-body-sm` 0.75rem/1rem — Inter 400
- `text-label-lg` 0.875rem/1.25rem · `text-label-md` 0.75rem/1rem (+0.5px) · `text-label-sm` 0.6875rem/1rem (+0.5px, Inter 600) — Inter 500

**11px floor**: nothing user-facing below `text-label-sm`. All `text-[9px]`/`text-[10px]` map up to it.

### D6. Elevation

`boxShadow` tokens (Japandi soft character, shadow color from deep warm neutral):
`elevation-0` none · `elevation-1` `0 1px 2px rgba(45,48,42,0.05), 0 4px 24px rgba(45,48,42,0.06)` (absorbs the 34×-repeated de facto token) · `elevation-2` `0 2px 4px rgba(45,48,42,0.06), 0 8px 32px rgba(45,48,42,0.08)` (menus, raised) · `elevation-3` `0 4px 8px rgba(45,48,42,0.07), 0 16px 48px rgba(45,48,42,0.10)` (dialogs). Surface hierarchy comes from the container ladder, shadows only where depth means something.

### D7. Motion

CSS vars + tailwind `transitionDuration`/`transitionTimingFunction`:
easing `standard` cubic-bezier(0.2,0,0,1) · `emphasized-decelerate` (0.05,0.7,0.1,1) — entrances · `emphasized-accelerate` (0.3,0,0.8,0.15) — exits.
Durations: short 50/100/150/200 · medium 250/300/350/400 · long 450/500/550/600 (ms).
`src/lib/motion.ts` rewritten to export these + framer-motion presets (`transitionEnter` = 350ms emphasized-decelerate, `transitionExit` = 200ms emphasized-accelerate, `viewportReveal` = 500ms). Root gets `<MotionConfig reducedMotion="user">` so all 34 framer components honor OS setting.

### D8. Fonts

`next/font/google` (Inter → `--font-sans`, Crimson_Pro → `--font-display`) in root layout; delete the render-blocking `@import` from globals.css; tailwind `fontFamily` reads the vars.

### D9. Scope guards

- `src/archive/` untouched. `/story` ScrollytellingSection: skip restyling (dedicated future pass) — only remove if listed as dead code.
- Email templates & OG/satori routes: keep literal colors this round (no CSS vars there); note follow-up to import from a palette constants module.
- Dark-mode: do not build a dark scheme; it stays disabled. Don't add new `dark:` variants; removing dead ones is fine where touched.

---

## Batches

### [ ] B1 — Token foundation

**Files:** `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx` (+ new `src/components/root/MotionProvider.tsx`), `src/lib/motion.ts`.

1. globals.css: add all D1 `--m3-*` vars (raw hex) + shape vars (D4) + motion vars (D7) + `.state-layer` and `.focus-ring` utilities (D2/D3); re-point legacy shadcn HSL vars per D1; delete the Google Fonts `@import`.
2. tailwind.config.ts: register semantic colors (surface ladder, on-_, outline_, containers, error/success/warning/info container pairs, inverse-_, scrim); re-point `proofound._`per D1; shape scale per D4 (remove conflicting brandTokens.borderRadius spread, keep working aliases); elevation shadows per D6; type-scale plugin per D5; motion durations/easings per D7; fontFamily from`--font-sans`/`--font-display`.
3. Root layout: `next/font/google` Inter + Crimson_Pro with css variables, applied on `<html>`/`<body>`; add client `MotionProvider` (`'use client'`, framer-motion `MotionConfig reducedMotion="user"`) wrapping `{children}`.
4. Rewrite `src/lib/motion.ts` per D7 (keep/adjust exports so it compiles standalone; it currently has zero importers).
5. Do NOT restyle components in this batch (except what re-pointed vars change globally).

**Acceptance:** typecheck ✓ · lint ✓ · `npm run build` ✓ · body text renders #393735 on #F3F0E8 · destructive/`--destructive` = #9A3B26 · no `@import url` left in globals.css · `text-title-md`, `bg-surface-container`, `shadow-elevation-1`, `rounded-shape-xl`, `.state-layer` utilities all resolve in a test grep of built CSS or a scratch page.

### [ ] B2 — Primitive refit (src/components/ui/\*)

Focus recipe D3 everywhere (fix: accordion trigger, dialog close dead classes `ring-primary-300`/`bg-secondary-100`/`ring-offset-white`, select trigger blue-ring, toast close, sheet close). State layers D2 on: dropdown/select/command items (keep text color on focus — kill `focus:text-muted-foreground`), tabs triggers, table rows, calendar days, ghost/link buttons. Buttons: variants → M3 hierarchy (filled=primary, tonal=secondary-container, outline, ghost/text; `rounded-full` pills for default+lg sizes, `shape-md` for sm/icon; drop translate-y hack; scoped transitions with motion tokens). Badge: tonal container pairs incl. fixed success/info/warning contrast, remove emerald `verified-premium` off-palette colors → success container + elevation-0; hover/focus styles only when interactive. Alert: add success/warning/info variants on container pairs; default → `surface-container` bg. Card: radius `shape-xl` token instead of `rounded-[24px]`; elevation tokens; interactive variant gets `asChild`-able focusable pattern with D3 ring. Inputs: `bg-surface-container-lowest` not `bg-white`; one field radius `shape-md` (input, textarea, select); compose Label primitive. Scrim: all overlays (dialog, alert-dialog, sheet, drawer) → `bg-scrim/40` + drawer gets the missing open/close animation; sheet durations → motion tokens. Toasts: consolidate on sonner (single mount, theme-aware, styled inverse-surface M3 snackbar); migrate the 12 `use-toast` call sites; delete `toast.tsx`/`toaster.tsx`/`use-toast.ts`. Touch targets: checkbox/radio/term-hint get ≥24px hit areas (padded pseudo-target), checkbox indeterminate state. Switch: token colors both modes, computed sizing. Skeleton: single shimmer animation (fix pulse/shimmer conflict). glass-card: radius inherit fix + shadows from elevation tokens (drop #1C4D3A rgba). Delete dead v2 files: `EmptyStatePanel.tsx`, `MetricStrip.tsx`, `PageHeaderV2.tsx`, `SectionCard.tsx`, `SplitPaneWorkspace.tsx` (zero usages; keep `AppSurface.tsx`).

**Acceptance:** typecheck/lint/build ✓ · `npm run test` ✓ · grep proves: no `focus:ring-primary-300`, no `bg-black/80` in ui/, no `theme="light"` in sonner.tsx, no `text-[9px]|text-[10px]` in ui/, zero imports of `use-toast` outside deleted files · badge success/info/warning text ≥4.5:1 (state computed pairs in code comments honestly).

### [ ] B3 — Shell & navigation

LeftNav/TopBar/mobile bottom bar: active = `secondary-container` pill + `on-secondary-container` text (M3 nav grammar, one treatment desktop+mobile); state layers on all nav items; D3 focus everywhere (kill `ring-rose-500`, `ring-proofound-forest` literals). Remove the `NEXT_PUBLIC_UI_REFACTOR_V2` fork in LeftNav/TopBar/i-layout/o-layout — keep the flat-parchment branch as the single path, expressed in surface-ladder tokens. Replace hand-rolled TopBarProfileMenu with Radix DropdownMenu; hand-rolled LeftNav tooltip with ui/tooltip. Org layout parity: mount CommandPalette + SpotlightProvider same as individual layout. Mobile: bottom bar includes org Candidates (or overflow "More" sheet) — no unreachable workspaces; page title visible on mobile (from routeMeta). `routeMeta.ts` becomes sole title source (delete `getPageTitle`); prefer exact-match table over `pathname.includes`. Shell geometry: `--app-topbar-h`, `--app-bottom-nav-h` vars replace `mb-[4.75rem]`/`pb-[calc(5.5rem+…)]`/`top-14` magic. Sidebar collapse: persist in localStorage; animate with medium2/standard easing. Admin chrome: `#2D3330` → `inverse-surface` tokens; fix `text-proofound-forest fill-current text-green-400` contradiction; role badges → container pairs.

**Acceptance:** typecheck/lint/build ✓ · grep: no `NEXT_PUBLIC_UI_REFACTOR_V2` in src/components/app or layouts, no `#2D3330` in admin components, no `getPageTitle` in TopBar · org + individual layouts mount identical enhancement providers · axe/e2e nav tests still pass (`npm run test` targeted).

### [ ] B4 — Authenticated app surfaces

`i/home` dashboard: ad-hoc hex status ladder (#dff0d9, #fff1d6, #eef3e8…) → status container tokens + surface ladder. `o/[slug]/home`: hand-rolled white panels → Card variants (surface-container-low + elevation-1); kill bespoke shadow. `ProfileView.tsx` + `EmptyProfileStateView.tsx`: full rogue-palette migration (#7A9278→primary family, #F5F3EE→surface-container-low, etc.). `MatchingOrganizationView.tsx`: type floor — all 9/10px → `text-label-sm`+; chip tints → status containers. `MatchResultCard.tsx` + `o/[slug]/interviews/page.tsx`: inline style hexes → tokens. Verifications dialogs (`RespondDialog`, `CustomVerificationRequestDialog`): hex + inline styles → tokens. `o/[slug]/assignments`: remove duplicated h1/h2 header stack (one PageHeader). Add `loading.tsx` (skeleton via ui/skeleton) for i/home, i/profile, i/verifications, i/communications, o/[slug]/assignments, o/[slug]/matching + one shared `error.tsx` under `src/app/app/`. No behavior/data changes.

**Acceptance:** typecheck/lint/build ✓ · targeted suites `npm run test:launch:smoke` + `test:privacy` ✓ · grep: no `#7A9278|#7a9278` in profile components, no `text-[9px]|text-[10px]` in matching components, no `style={{ backgroundColor: '#1C4D3A' }}`.

### [ ] B5 — Public, auth & onboarding surfaces

Delete `PublicProfileTokens.ts` (migrate its consumers to semantic roles; #1C4D3A→primary-ish deep accents via tokens, #C76B4A→tertiary, #F7F6F1→surface-bright, #2D3330→on-surface). `PublicProfileShell`: off-brand gradient → primary/tertiary token gradient; glass white/40 nesting → surface-container ladder + outline-variant borders. Portfolio page: ONE primary CTA ("Request introduction" path), second CTA demoted to text button, remove the duplicate ContactPill (i18n keys: update en.json+sv.json together if labels change). New `StatusChip` primitive (tone: positive/neutral/warning/pending) on Badge container pairs; consume in portfolio chips, TrustTierBadge, org trust page readiness rows (turn 5 prose pills into structured status rows); delete dead `PublicProofPackList.tsx`. Auth (`SignIn`, `SignupForm`, `social-sign-in-buttons`): legacy hexes → tokens; kill the focus px-shift hack (stable border + D3 ring); inline per-field errors via Input's error/helperText (top alert only for form-level); only genuinely-invalid fields marked `aria-invalid`. Onboarding: `PersonaChoice` cards fully clickable (stretched-link + D3 focus + selected state on outlined card); `font-['Crimson_Pro']` → `font-display` sweep (onboarding + settings); StepRail emerald → success tokens; native selects/radios → ui primitives where drop-in. Verify flows (`verify/[token]`, `verify-work-email`, custom): stock green/red/amber → success/error/warning container roles.

**Acceptance:** typecheck/lint/build ✓ · `npm run test:launch:portfolio` + `test:privacy` ✓ · grep: no `#1C4D3A|#C76B4A` under public-profile/ or auth/, no `PublicProfileTokens`, no `font-['Crimson` under onboarding/ or settings/ · en.json/sv.json parity if copy touched.

### [ ] B6 — Landing & marketing

First delete dead code (zero-importer files: landing `Header.tsx`, `StickyCTA.tsx`, `ProgressBar.tsx`, `SectionReveal.tsx`, `NetworkBackground.tsx`, `hero-variants/*`, 8 unused section files — verify zero importers before each delete; do NOT touch ScrollytellingSection/`/story`). Then: type scale mapping (hero h1 → `text-display-lg`, section h2 → `text-headline-lg`, eyebrows → `text-label-md`, kill sub-11px micro-labels); ProofoundLanding header/CTA raw hexes → tokens (fourth-green #65755d → primary); footer hexes → surface-container tokens; fold `--landing-*` vars into the semantic system (ThreeStepCorridor consumes tokens; delete the namespace from globals.css when no consumers remain); `--landing-muted` contrast fix → on-surface-variant. Motion: shared preset from `src/lib/motion.ts` replaces per-section `[0.22,1,0.36,1]`/0.8–1.4s (entrances ≤500ms emphasized-decelerate); FinalCTA infinite gradient loops gated `whileInView`; consider static radial-gradient instead of blur-[130px] orbs where visually equivalent. Focus: D3 ring on header nav, footer links, all CTAs incl. mailto links. Hero mockup ad-hoc indigo/green → tertiary-container/success-container roles. Landing e2e must stay green.

**Acceptance:** typecheck/lint/build ✓ · `npm run test:e2e:landing` ✓ · grep: no `#65755d`, no `--landing-` consumers in live sections, no `duration: 1.` in live landing sections, no text-[9px|10px] in landing/sections.

### [ ] B7 — Residual sweep + verification

Rogue-hex codemod for remaining live-code hits (mapping: #7A9278→primary/sage roles, #1C4D3A→primary-deep usage context, #C67B5C/#C76B4A→tertiary, #2D3330→on-surface or inverse-surface, #6B6760→on-surface-variant, #D4A574→warning/ochre container) — context-checked, not blind sed; skip src/archive, emails, OG routes, ScrollytellingSection. Full gates: lint, typecheck, test, build. Visual QA (dev server): `/`, `/login`, portfolio page, `/app/i/home`, `/app/i/profile`, org home, matching review — desktop 1280 + mobile 375, record findings. Founder report.

---

## Verification & rollback conventions

- After each batch: run gates; save cumulative patch `git diff HEAD > .artifacts/m3-refresh/batch-N.patch` (rollback points without committing — the working tree carries pre-existing staged founder changes we must not entangle).
- **No git commits by agents this initiative.** Founder commits after review.
- Every batch: Codex prints FILES CHANGED (`git diff --stat` tail), PER-CRITERION PASS/FAIL, GATES output tails, NOTES ≤5 lines.
