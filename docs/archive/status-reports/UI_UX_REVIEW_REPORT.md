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

# UI/UX Review Findings & Recommendations

## 1. Executive Summary

The codebase demonstrates a high level of adherence to the Proofound Japandi design system. The color palette (Forest Green, Parchment, Terracotta) and typography (Crimson Pro, Inter) are consistently applied across both Individual and Organization personas.

However, there are opportunities to improve maintainability and consistency by standardizing on Tailwind utility classes rather than hardcoded arbitrary values that happen to match the design tokens.

## 2. Inconsistencies Found

### A. Color Usage (Hardcoded vs Semantic)

**Observation:** Many components use arbitrary value syntax (e.g., `bg-[#1C4D3A]`) instead of the configured semantic utility classes (e.g., `bg-proofound-forest`).
**Impact:** Makes global theme updates harder and reduces code readability.

**Locations:**

- `src/components/ui/button.tsx`: Uses `bg-[#1C4D3A]`, `text-[#1C4D3A]`, `bg-[#C76B4A]`.
- `src/components/ui/badge.tsx`: Uses `bg-[#1C4D3A]`, `bg-[#C76B4A]`.
- `src/components/ui/input.tsx`: Uses `border-[#E8E6DD]`, `focus-visible:ring-[#1C4D3A]`.
- `src/components/app/LeftNav.tsx`: Uses `bg-[#1C4D3A]`, `text-[#2D3330]`.
- `src/components/profile/EditableProfileView.tsx`: Uses `bg-[#7A9278]`, `bg-[#C67B5C]`.

### B. Typography Class Usage

**Observation:** `font-['Crimson_Pro']` is frequently used instead of the configured `font-display` utility.
**Impact:** Verbose code and potential for typo-induced inconsistencies.

**Locations:**

- `src/app/app/o/[slug]/profile/page.tsx`
- `src/app/app/o/[slug]/settings/page.tsx`
- `src/components/ui/card.tsx`
- `src/components/profile/EditableProfileView.tsx`

### C. Layout & Spacing

**Observation:** Background colors are sometimes applied via inline styles instead of Tailwind classes.
**Impact:** Inconsistent with the utility-first approach of the rest of the app.

**Locations:**

- `src/app/app/i/layout.tsx`: `style={{ backgroundColor: '#F7F6F1' }}`
- `src/app/app/o/[slug]/layout.tsx`: `style={{ backgroundColor: '#F7F6F1' }}`

## 3. Fix Recommendations

### Recommendation 1: Standardize Color Utilities

Replace hardcoded hex values with the semantic names defined in `tailwind.config.ts`.

**Mapping:**

- `#1C4D3A` -> `proofound-forest` (or `primary`)
- `#F7F6F1` -> `proofound-parchment`
- `#C76B4A` -> `proofound-terracotta` (or `secondary`)
- `#2D3330` -> `proofound-charcoal`
- `#E8E6DD` -> `proofound-stone`
- `#7A9278` -> `extended-sage`
- `#5C8B89` -> `extended-teal`

**Example Fix (`src/components/ui/button.tsx`):**

```tsx
// Before
bg-[#1C4D3A] text-white hover:bg-[#2D5D4A]

// After
bg-proofound-forest text-white hover:bg-proofound-forest/90
```

### Recommendation 2: Use Semantic Typography Utilities

Replace `font-['Crimson_Pro']` with `font-display`.

**Example Fix (`src/components/ui/card.tsx`):**

```tsx
// Before
className = "text-2xl font-semibold ... font-['Crimson_Pro']";

// After
className = 'text-2xl font-semibold ... font-display';
```

### Recommendation 3: Remove Inline Styles for Layouts

Replace inline style objects with Tailwind classes.

**Example Fix (`src/app/app/i/layout.tsx`):**

```tsx
// Before
<div className="flex h-screen" style={{ backgroundColor: '#F7F6F1' }}>

// After
<div className="flex h-screen bg-proofound-parchment">
```

## 4. Conclusion

The UI implementation is visually correct and faithful to the design. The recommended changes are refactors to improve code quality and maintainability, ensuring the design system remains the single source of truth.
