> Doc Class: `historical`
> Historical Snapshot Reviewed: `2026-02-26`
> Canonical Current Testing Docs:
>
> - `docs/testing-strategy.md`
> - `docs/qa/e2e-matrix.md`
> - `docs/qa/summary.md`
> - `agent/checklists/verification.md`
> - `agent/runbooks/setup.md`
>
> Note: This archived file preserves historical context. For current routes, commands, and gate criteria, use the canonical docs above.

---

# UI/UX Implementation Audit Report

## Executive Summary

The UI/UX implementation for Individual and Organization pages generally adheres to the Proofound design system (Japandi style), but there are notable inconsistencies in implementation details. The codebase mixes Tailwind utility classes, custom CSS variables, and hardcoded hex values.

## 1. Design System Adherence

### Typography ✅

- **Headings**: Consistently using `Crimson Pro` via `font-display` or `font-['Crimson_Pro']`.
- **Body**: Consistently using `Inter` (default sans).
- **Scale**: Font sizes match the design tokens.

### Colors ⚠️

- **Brand Colors**: The correct hex values are being used, but implementation is inconsistent.
- **Issue**: Significant mixing of implementation methods:
  - Tailwind utility classes: `text-primary-500`
  - Custom extended classes: `text-proofound-forest`
  - Hardcoded Hex: `text-[#1C4D3A]` (Very common)
  - CSS Variables: `var(--proofound-forest)`

### Component Consistency ⚠️

- **Buttons**: Generally consistent variants (default, outline, ghost).
  - **Issue**: Some buttons use hardcoded colors instead of semantic variants (`bg-[#7A9278]`).
- **Cards**: Consistently using the `Card` component.
- **Layout**: Main layouts are consistent between Individual and Org views.

## 2. Specific Inconsistencies by File

### Layout Components

- **`src/components/app/LeftNav.tsx`**
  - Uses hardcoded hex colors (`#FDFCFA`, `#1C4D3A`) instead of semantic tokens.
  - Border colors are hardcoded rgba values.
  - **Fix**: Replace with `bg-background`, `border-border`, `text-primary`.

- **`src/components/app/TopBar.tsx`**
  - Hardcoded background and border colors.
  - "Proofound" brand text uses system sans font instead of `Crimson Pro`.
  - **Fix**: Use `font-display` for brand name. Use semantic color tokens.

- **`src/app/app/i/layout.tsx` & `src/app/app/o/[slug]/layout.tsx`**
  - Hardcoded inline style: `style={{ backgroundColor: '#F7F6F1' }}`.
  - **Fix**: Use Tailwind class `bg-proofound-parchment` or `bg-background`.

### Individual Pages

- **`src/components/profile/EditableProfileView.tsx`**
  - Heavy use of hardcoded hex values for "Extended Japandi Palette" (Sage, Terracotta, etc.).
  - Example: `bg-[#7A9278]`, `text-[#C67B5C]`.
  - **Fix**: Define these as extended colors in Tailwind config and use classes like `bg-sage-500` or `text-terracotta-500`.

- **`src/app/app/i/matching/page.tsx`**
  - "Matching" header lacks explicit font-family (uses default sans). Should be `font-display`.
  - Hardcoded text colors (`#6B6760`, `#2D3330`) which should be `text-muted-foreground` and `text-foreground`.

### Organization Pages

- **`src/app/app/o/[slug]/profile/page.tsx`**
  - Good usage of `font-['Crimson_Pro']` and custom tailwind classes (`text-proofound-forest`).
  - Inconsistent with other files that use hardcoded hex.

- **`src/app/app/o/[slug]/members/page.tsx`**
  - Uses `text-primary-500` and `text-neutral-dark-600`.
  - This is actually the **most correct** implementation according to the Tailwind config structure, but it differs from the "Individual" pages which use hardcoded hexes.

## 3. Recommendations

1. **Standardize Color Usage**:
   - Refactor all hardcoded hex values (`#1C4D3A`) to semantic Tailwind classes (`text-primary` or `text-proofound-forest`).
   - Remove inline `style={{ backgroundColor: ... }}` props in layouts.

2. **Fix Typography**:
   - Ensure all page titles use `font-display` (Crimson Pro).
   - Fix the "Proofound" logo text in TopBar to use `font-display`.

3. **Refactor Extended Palette**:
   - The extended palette (Sage, Ochre, etc.) is defined in Tailwind config but often ignored in favor of hex codes in components.
   - **Action**: Replace `bg-[#7A9278]` with `bg-extended-sage` (or update config to make it accessible as `bg-sage`).

4. **Dark Mode Consistency**:
   - Hardcoded hex values break dark mode support.
   - Converting to semantic classes (`bg-background`, `text-foreground`) will automatically fix dark mode issues.

## 4. Implementation Plan for Fixes

We will apply these fixes in the following order:

1. **Layouts**: Fix `layout.tsx` files (Individual & Org).
2. **Navigation**: Fix `LeftNav` and `TopBar`.
3. **Profile**: Refactor `EditableProfileView` to use Tailwind classes.
4. **Matching**: Update headers and text colors.
