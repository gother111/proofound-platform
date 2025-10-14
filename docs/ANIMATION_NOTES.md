# Animation System Documentation

This document describes the animation principles and utilities implemented as part of the theme refresh.

## Animation Principles (from Wireframe Spec)

The animation system follows five core principles:

### 1. Breathing

Elements scale subtly between 1 → 1.05 → 1 in a continuous loop.

- **Purpose**: Create living, organic feel
- **Duration**: 4 seconds
- **Easing**: ease-in-out

### 2. Morphing

SVG blobs and shapes transform smoothly between states.

- **Purpose**: Dynamic, fluid visual interest
- **Use case**: Background elements, decorative shapes

### 3. Flowing

Scroll-triggered smooth transitions as elements enter viewport.

- **Purpose**: Progressive disclosure, attention guidance
- **Implementation**: Combine with Intersection Observer

### 4. Organic Easing

Natural motion curves (easeInOut, easeOut) instead of linear.

- **Purpose**: Mimics real-world physics
- **Default**: `ease-out` for entrances, `ease-in-out` for loops

### 5. Staggered

Sequential appearance with 0.1-0.2s delays between child elements.

- **Purpose**: Rhythmic, choreographed feel
- **Implementation**: CSS custom properties + nth-child selectors

## Available Keyframes

Defined in `src/styles/animations.css`:

### `@keyframes breathe`

```css
0%,
100% {
  transform: scale(1);
}
50% {
  transform: scale(1.05);
}
```

**Usage**: Subtle pulse effect for focal elements

### `@keyframes float`

```css
0%,
100% {
  transform: translateY(0px);
}
50% {
  transform: translateY(-10px);
}
```

**Usage**: Gentle vertical motion for floating elements

### `@keyframes fadeIn`

```css
from {
  opacity: 0;
  transform: translateY(20px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
```

**Usage**: Entrance animation for new elements

## Utility Classes

### `.animate-breathe`

Applies breathing animation (4s loop)

```tsx
<div className="animate-breathe">Content pulses gently</div>
```

### `.animate-float`

Applies floating animation (6s loop)

```tsx
<div className="animate-float">Content floats vertically</div>
```

### `.animate-fade-in`

Applies fade-in entrance (0.6s once)

```tsx
<div className="animate-fade-in">Content fades in from below</div>
```

### `.section-pad`

Responsive section spacing (min-h-screen + vertical padding)

```tsx
<section className="section-pad">Full-height section with breathing room</section>
```

## Stagger System

Apply sequential delays to child elements:

### Basic Usage

```tsx
<div data-stagger>
  <div>Item 1 (delay: 0s)</div>
  <div>Item 2 (delay: 0.1s)</div>
  <div>Item 3 (delay: 0.2s)</div>
</div>
```

### Custom Delay

```tsx
<div data-stagger style={{ '--stagger-delay': '0.15s' }}>
  <div>Slower stagger rhythm</div>
  <div>...</div>
</div>
```

### With Animation

```tsx
<div data-stagger className="[&>*]:animate-fade-in">
  <div>Staggered fade-in</div>
  <div>...</div>
</div>
```

## NetworkBackground Component

The `NetworkBackground` component implements the "Living Network" concept:

### Concept

A dynamic visualization of interconnected nodes representing:

- **Person nodes** (sage green): Individual users
- **Organization nodes** (terracotta): Companies
- **Government nodes** (teal): Governmental structures

### Behavior

- **Self-regulating**: Nodes appear and disappear organically
- **Multidimensional**: 3 depth layers with cross-layer connections
- **Flowing**: Continuous gentle motion
- **Responsive**: Adapts to viewport size

### Technical Details

- Canvas-based rendering for performance
- Reads colors from CSS variables (`--brand-sage`, `--brand-terracotta`, `--brand-teal`)
- 25-30 active nodes at any time
- Nodes drift slowly with edge bouncing
- Connections form/break based on proximity (max 250px)

### Usage

Already integrated in landing page:

```tsx
<NetworkBackground />
```

## Optional: LivingNetwork Component

An enhanced ambient animation component is available but **not imported by default**.

### When to Enable

Only enable if you want additional background animations:

```bash
NEXT_PUBLIC_ENABLE_AMBIENT=1
```

### File Location

`src/components/ambient/LivingNetwork.tsx`

### Integration Example

```tsx
// In your page component
const enableAmbient = process.env.NEXT_PUBLIC_ENABLE_AMBIENT === '1';

export default function Page() {
  return (
    <div>
      {enableAmbient && <LivingNetwork />}
      {/* Rest of content */}
    </div>
  );
}
```

## Performance Considerations

### Canvas Animations

- Use `requestAnimationFrame` for smooth 60fps
- Limit active particles/nodes (25-30 recommended)
- Consider pausing when page not visible (Page Visibility API)

### CSS Animations

- Prefer `transform` and `opacity` for GPU acceleration
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly (only during animation)

### Reducing Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

## Future Enhancements

### Morphing Blobs

Implement SVG path morphing for background shapes:

```tsx
<motion.path
  animate={{ d: [pathA, pathB, pathA] }}
  transition={{ duration: 8, repeat: Infinity }}
/>
```

### Scroll-Triggered Animations

Use Intersection Observer or Framer Motion's `useInView`:

```tsx
const { ref, inView } = useInView({ threshold: 0.2 });

<div ref={ref} className={inView ? 'animate-fade-in' : 'opacity-0'}>
  Content appears on scroll
</div>;
```

### Advanced Stagger Patterns

Radial or grid-based stagger:

```tsx
// Calculate delay based on position
const delay = Math.sqrt(x * x + y * y) * 0.05;
```

## Testing Animations

### Visual Regression

Use Playwright to capture screenshots:

```bash
npx playwright test --update-snapshots
```

### Performance Profiling

Chrome DevTools > Performance tab:

- Record during scroll/interaction
- Look for dropped frames (below 60fps)
- Check for layout thrashing

### Accessibility

- Test with `prefers-reduced-motion: reduce`
- Ensure animations don't interfere with screen readers
- Provide alternative static states

## Resources

- **Spec Reference**: `tokens/wireframe-spec.json` (animations section)
- **Animation CSS**: `src/styles/animations.css`
- **NetworkBackground**: `src/components/landing/NetworkBackground.tsx`
- **Framer Motion Docs**: https://www.framer.com/motion/
