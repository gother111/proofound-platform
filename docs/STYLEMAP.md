# Style Map

This document defines the active global color system for Proofound. The app is now light-first and uses one Japandi palette across landing, auth, onboarding, public profile sharing, and operational surfaces.

## Global palette

| Role            | Token                    | Value     | Typical use                                   |
| --------------- | ------------------------ | --------- | --------------------------------------------- |
| Background      | `--proofound-parchment`  | `#F3F0E8` | Page field, app shell                         |
| Surface         | `--card`                 | `#E6E4E0` | Cards, modals, grouped surfaces               |
| Surface strong  | `--proofound-stone`      | `#D5CABA` | Borders, dividers, stronger planes            |
| Primary action  | `--proofound-forest`     | `#606C5A` | Primary buttons, focus, active affordances    |
| Accent support  | `--proofound-terracotta` | `#C09E85` | Secondary highlight, warm supporting emphasis |
| Gold accent     | `--accent`               | `#DCB482` | Selective editorial highlight only            |
| Text            | `--proofound-charcoal`   | `#5E5E5E` | Primary copy and icons                        |
| Muted text      | `--muted-foreground`     | `#8F837A` | Secondary copy, labels, hints                 |
| Soft sage       | `--sage`                 | `#B9B99D` | Calm background accents                       |
| Mist sage       | `--teal`                 | `#B0B9A8` | Informational support accents                 |
| Neutral support | `--neutral-dark-500`     | `#858480` | Quiet UI support text                         |

## Token mapping

The theme is bridged through both semantic tokens and legacy Proofound utilities so older surfaces inherit the new palette without needing immediate class rewrites.

| Semantic token | Global value |
| -------------- | ------------ |
| `--background` | `#F3F0E8`    |
| `--foreground` | `#5E5E5E`    |
| `--card`       | `#E6E4E0`    |
| `--popover`    | `#E6E4E0`    |
| `--primary`    | `#606C5A`    |
| `--secondary`  | `#C09E85`    |
| `--muted`      | `#E6E4E0`    |
| `--accent`     | `#DCB482`    |
| `--border`     | `#D5CABA`    |
| `--ring`       | `#606C5A`    |

Legacy Tailwind utilities such as `bg-proofound-forest`, `text-proofound-charcoal`, `border-proofound-stone`, and `bg-proofound-parchment` remain valid, but they now resolve to the Japandi palette above.

## Usage guidance

- Prefer semantic utilities first: `bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-muted-foreground`.
- Keep `proofound-*` utility names only when migrating a broad surface all at once would add risk.
- Use deep sage for primary CTAs and active states.
- Use clay sparingly as a warm support accent.
- Use gold rarely and intentionally. It should read as crafted emphasis, not the main brand color.
- Default to cardless layout where possible. Let spacing, planes, and dividers do the work before adding more accents.

## Dark mode

Dark mode is intentionally disabled in the current design system. The active theme contract is light-only. Existing dormant `dark:` utility branches may still exist in source, but they are not part of the supported UI theme surface and must not be used as the basis for new work.

## Implementation notes

- Global CSS tokens live in `src/app/globals.css`.
- Tailwind aliases for semantic and legacy Proofound colors live in `tailwind.config.ts`.
- Shared palette scales used by Tailwind semantic colors live in `src/design/brand-tokens.json`.
- Landing-specific variables should inherit from the global Japandi tokens rather than introducing a second competing palette.
