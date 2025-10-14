# Style Migration Map

This document outlines the design token system and migration from legacy classes to the new token-based utilities.

## Design Tokens At a Glance

### Color Palette

| Category                      | CSS Variable         | Hex Value           | Tailwind Utility                               | Usage                                  |
| ----------------------------- | -------------------- | ------------------- | ---------------------------------------------- | -------------------------------------- |
| **Base Colors**               |
| Background                    | `--bg-base`          | #F5F3EE             | `bg-bg-base`                                   | Main page background                   |
| Foreground                    | `--fg-base`          | #2C2A27             | `text-fg-base`                                 | Primary text color                     |
| **Brand Colors (Node Types)** |
| Person                        | `--brand-sage`       | #7A9278             | `bg-brand-sage`, `text-brand-sage`             | Individual user nodes, primary accents |
| Organization                  | `--brand-terracotta` | #C67B5C             | `bg-brand-terracotta`, `text-brand-terracotta` | Organization nodes, secondary accents  |
| Government                    | `--brand-teal`       | #5C8B89             | `bg-brand-teal`, `text-brand-teal`             | Government nodes                       |
| Accent                        | `--brand-ochre`      | #D4A574             | `bg-brand-ochre`, `text-brand-ochre`           | Additional accent color                |
| **Semantic Colors**           |
| Card                          | `--card`             | #FDFCFA             | `bg-card`                                      | Card backgrounds                       |
| Muted                         | `--muted`            | #E8E4DC             | `bg-muted`, `text-muted`                       | Muted backgrounds and text             |
| Accent                        | `--accent`           | #B8A592             | `bg-accent`, `text-accent`                     | Accent elements                        |
| Border                        | `--border-subtle`    | rgba(75,70,62,0.12) | `border-border-subtle`                         | Subtle borders                         |

### Spacing & Layout

| Token           | CSS Variable  | Value          | Tailwind Utility | Usage                 |
| --------------- | ------------- | -------------- | ---------------- | --------------------- |
| Large Radius    | `--radius-lg` | 1.25rem        | `rounded-lg`     | Card corners, buttons |
| Section Padding | N/A           | py-20 lg:py-32 | `section-pad`    | Full-height sections  |

### Typography

| Element   | CSS Variable       | Tailwind Scale | Usage          |
| --------- | ------------------ | -------------- | -------------- |
| Heading 1 | `--font-size-h1`   | `text-2xl`     | Hero titles    |
| Heading 2 | `--font-size-h2`   | `text-xl`      | Section titles |
| Heading 3 | `--font-size-h3`   | `text-lg`      | Card titles    |
| Body      | `--font-size-body` | `text-base`    | Paragraph text |

## Migration Examples

### Old → New Class Mappings

| Old Class                                      | New Class                     | Context                     |
| ---------------------------------------------- | ----------------------------- | --------------------------- |
| `bg-gradient-to-b from-secondary-100 to-white` | `bg-bg-base`                  | Page background             |
| `text-primary-500`                             | `text-brand-sage`             | Primary text/headings       |
| `text-neutral-dark-600`                        | `text-fg-base opacity-80`     | Body text (medium emphasis) |
| `text-neutral-dark-500`                        | `text-fg-base opacity-60`     | Body text (low emphasis)    |
| `bg-primary-50`                                | `bg-brand-sage bg-opacity-10` | Light brand background      |
| `border-primary-300`                           | `border-brand-sage`           | Brand-colored borders       |
| `bg-primary-100`                               | `bg-brand-sage bg-opacity-20` | Medium brand background     |
| `bg-neutral-dark-700`                          | `bg-fg-base`                  | Footer background           |
| `text-neutral-light-200`                       | `text-white opacity-80`       | Footer text                 |
| `py-20 md:py-32`                               | `section-pad`                 | Section spacing utility     |

### Component-Specific Migrations

#### Hero Section

```diff
- <section className="container mx-auto px-4 py-20 md:py-32">
+ <section className="container mx-auto px-4 section-pad">

- <h1 className="text-5xl font-display text-primary-500">
+ <h1 className="text-5xl font-display text-brand-sage">

- <p className="text-xl text-neutral-dark-600">
+ <p className="text-xl text-fg-base opacity-80">
```

#### Card Components

```diff
- <Card className="border-2 hover:border-primary-300">
+ <Card className="border-2 hover:border-brand-sage">

- <div className="bg-primary-50 rounded-full">
+ <div className="bg-brand-sage bg-opacity-10 rounded-full">

- <User className="text-primary-500" />
+ <User className="text-brand-sage" />
```

#### Principles Section

```diff
- <section className="bg-primary-50 py-16">
+ <section className="bg-muted py-16">

- <h2 className="text-3xl text-primary-500">
+ <h2 className="text-3xl text-brand-sage">
```

#### CTA Section

```diff
- <section className="bg-primary-500 text-white">
+ <section className="bg-brand-sage text-white">

- <p className="text-primary-50">
+ <p className="opacity-90">
```

#### Footer

```diff
- <footer className="bg-neutral-dark-700 text-neutral-light-200">
+ <footer className="bg-fg-base text-white">

- <Link className="hover:text-white">
+ <Link className="opacity-80 hover:opacity-100">
```

## How to Add New Tokens

When you need to add new design tokens:

### 1. Add CSS Variable

Edit `src/styles/tokens.css`:

```css
:root {
  /* Your new token */
  --new-token-name: #HEXVALUE;
}
```

### 2. (Tailwind v3 only) Extend Tailwind Config

Edit `tailwind.config.ts`:

```typescript
extend: {
  colors: {
    'new-token': 'var(--new-token-name)',
  }
}
```

### 3. (Tailwind v3 only) Add to Safelist

If the utility is used dynamically:

```typescript
safelist: ['bg-new-token', 'text-new-token'];
```

### 4. Use in Components

```tsx
<div className="bg-new-token">Content here</div>
```

## Token Naming Conventions

- **Base colors**: `--bg-*`, `--fg-*` for background and foreground
- **Brand colors**: `--brand-*` for theme-specific colors (sage, terracotta, teal, ochre)
- **Semantic colors**: `--card`, `--muted`, `--accent` for UI elements
- **Measurements**: `--radius-*`, `--spacing-*` for sizing
- **Typography**: `--font-size-*`, `--font-weight-*` for text

## shadcn/ui Bridge

The new tokens are bridged to shadcn/ui's semantic system:

```css
:root {
  --background: var(--bg-base);
  --foreground: var(--fg-base);
  --card: var(--card);
  --muted: var(--muted);
  --accent: var(--accent);
  --border: var(--border-subtle);
  --radius: var(--radius-lg);
}
```

This ensures shadcn components automatically pick up the new theme.

## Dark Mode (Future)

Dark mode tokens are scaffolded in `tokens.css` but commented out:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-base: #121212;
    --fg-base: #ececec;
    /* ... */
  }
}
```

To enable dark mode:

1. Uncomment the dark mode block
2. Refine color values for optimal contrast
3. Test all components in dark mode
4. Update documentation

## Resources

- **Token Spec**: `tokens/wireframe-spec.json`
- **Token CSS**: `src/styles/tokens.css`
- **Animation Utilities**: `src/styles/animations.css`
- **Tailwind Config**: `tailwind.config.ts`
