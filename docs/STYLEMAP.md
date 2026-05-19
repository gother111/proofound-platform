> Doc Class: `active`
> Last Verified: `2026-05-19`

# Style Map

This document summarizes the active Proofound visual token contract. It supports
[`DESIGN.md`](../DESIGN.md), which remains the practical design source of truth for UI work and does
not widen the locked MVP product scope.

## Active Sources

- Global runtime tokens: `src/app/globals.css`
- Tailwind aliases and semantic colors: `tailwind.config.ts`
- Brand token source: `src/design/brand-tokens.json`
- Motion token source: `src/design/motion-tokens.json`
- Design contract: `DESIGN.md`

## Palette

Proofound is light-first and uses a warm, restrained Japandi palette across landing, auth,
onboarding, public portfolio, organization, admin/internal, and app surfaces.

| Role           | Token                    | Current value                 | Typical use                               |
| -------------- | ------------------------ | ----------------------------- | ----------------------------------------- |
| Background     | `--proofound-parchment`  | `#F3F0E8`                     | Page field, app shell                     |
| Surface        | `--card`                 | `hsl(40 11% 89%)` / `#E6E4E0` | Cards, modals, grouped surfaces           |
| Surface strong | `--proofound-stone`      | `#D5CABA`                     | Borders, dividers, stronger planes        |
| Primary action | `--proofound-forest`     | `#56624F`                     | Primary buttons, focus, active affordance |
| Proof accent   | `--proofound-terracotta` | `#8B4A36`                     | Sparse proof/action emphasis              |
| Gold accent    | `--accent`               | `hsl(33 56% 69%)` / `#DCB482` | Selective editorial highlight             |
| Text           | `--proofound-charcoal`   | `#5E5E5E`                     | Primary copy and icons                    |
| Muted text     | `--muted-foreground`     | `hsl(28 8% 38%)`              | Secondary copy, labels, hints             |
| Soft sage      | `--sage`                 | `#B9B99D`                     | Calm support backgrounds                  |
| Mist sage      | `--teal`                 | `#B0B9A8`                     | Informational support accents             |

Use green as the directional trust color, not as a coating across every component. Use terracotta
and gold sparingly. Avoid purple AI gradients, neon accents, dark luxury themes, broad dashboard
color systems, and generic SaaS blue unless the component has a concrete functional reason.

## Token Mapping

| Semantic token | Global value |
| -------------- | ------------ |
| `--background` | `44 31% 93%` |
| `--foreground` | `0 0% 37%`   |
| `--card`       | `40 11% 89%` |
| `--popover`    | `40 11% 89%` |
| `--primary`    | `98 11% 35%` |
| `--secondary`  | `25 32% 64%` |
| `--muted`      | `40 11% 89%` |
| `--accent`     | `33 56% 69%` |
| `--border`     | `36 24% 78%` |
| `--ring`       | `98 11% 35%` |

Prefer semantic utilities first: `bg-background`, `text-foreground`, `bg-card`, `border-border`,
`bg-primary`, `text-muted-foreground`. Legacy `proofound-*` utilities remain available for existing
surfaces and broad migrations, but new UI should not introduce a second palette.

## Surface Behavior

- Public portfolio and organization trust pages should feel selected, credible, and inspectable.
- App surfaces should make the primary object and next action obvious: Proof Pack, assignment,
  candidate review, reveal request, interview, decision, or engagement verification.
- Admin/internal surfaces should be quiet operational tools, not public dashboards.
- Privacy, proof, trust, readiness, archived, gated, loading, empty, error, disabled, and success
  states must be visible where relevant.
- Avoid vanity metrics, profile theater, broad marketplace/platform language, public directory
  vibes, and decorative card mosaics.

## Shape And Motion

- Runtime radius tokens live in `src/app/globals.css`; current default radius is `0.75rem`.
- Use card framing only for real repeated items, modals, or tool panels. Do not nest decorative
  cards inside cards.
- Motion guidance lives in `docs/ANIMATION_NOTES.md` and `src/design/motion-tokens.json`.
- Honor `prefers-reduced-motion`; motion must support comprehension, not decoration.

## Dark Mode

Dark mode is not an active supported theme. The active UI contract is light-only. Existing dormant
`dark:` utility branches may exist, but do not use them as the basis for new MVP work.
