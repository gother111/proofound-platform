> Doc Class: `active`
> Last Verified: `2026-05-19`

# Motion And Animation Notes

This document records the active motion guidance for Proofound. It supports `DESIGN.md` and
`src/design/motion-tokens.json`; it does not create new product scope.

## Motion Thesis

Proofound motion should feel calm, purposeful, and evidence-oriented. Use it to clarify sequence,
focus, state changes, and scrollytelling on the public landing surface. Do not use motion to make
serious review flows feel playful or to fill empty UI.

Active motion should:

- guide attention toward the primary object or next action
- soften transitions without delaying work
- preserve reading flow and review confidence
- respect `prefers-reduced-motion`

Avoid:

- decorative pulsing on proof, trust, or readiness states
- floating nodes, living-network backgrounds, blob morphing, particle fields, or novelty motion as
  launch evidence
- bounce-heavy or gamified interactions
- hiding required state behind animation timing

## Active Sources

- Motion tokens: `src/design/motion-tokens.json`
- Reduced-motion baseline: `src/app/globals.css`
- Landing motion examples: `src/components/landing/sections/HeroSection.tsx` and
  `src/components/landing/sections/ScrollytellingSection.tsx`
- Legacy CSS utilities: `src/styles/animations.css`

`src/styles/animations.css` exists as a legacy utility file. It is not imported by the current app
shell and should not be used to justify new ambient, pulsing, or decorative behavior. Prefer local
component transitions and the motion tokens.

## Current Token Defaults

| Purpose           | Token example                                   | Guidance                         |
| ----------------- | ----------------------------------------------- | -------------------------------- |
| Fast UI feedback  | `durations.fast` = `200`                        | Hover, small control feedback    |
| Standard reveal   | `durations.medium` = `300`                      | Panels, dropdowns, small states  |
| Comfortable entry | `durations.comfortable` = `400`                 | Modals and larger surface reveal |
| Page/scroll work  | `durations.slow` to `verySlow` = `500` to `600` | Landing scrollytelling only      |
| Ease out          | `easing.easeOut`                                | Most entrances and feedback      |
| Ease in/out       | `easing.easeInOut`                              | Coordinated sequences            |

Use transform and opacity where possible. Avoid animating layout properties such as width, height,
top, and left.

## Surface Rules

- Public landing: measured scrollytelling and artifact reveal are acceptable when they remain
  readable and reduced-motion safe.
- Public portfolios and organization trust pages: use minimal reveal or transition only; proof and
  trust states must be immediately understandable.
- Individual and organization app surfaces: prioritize stable controls, clear state, and low-motion
  transitions.
- Admin/internal launch-ops: keep motion almost invisible. State, queue, and audit content should
  not depend on animation.
- Archived or gated surfaces: show the archived/gated state immediately.

## Reduced Motion

`src/app/globals.css` globally reduces animation and transition durations under
`prefers-reduced-motion: reduce`. Components with Framer Motion or custom timing must also branch to
static or near-static behavior where the animation would otherwise affect scroll, position, or
comprehension.

## Testing

For motion-affecting UI changes:

```bash
npm run test:a11y
npm run test:e2e:landing
```

Use Browser for representative desktop and mobile route checks when rendered motion or responsive
composition matters. Confirm that:

- text remains readable and does not overlap
- reduced-motion users get a stable state
- the primary object and next action are visible without waiting for animation
- no private proof, identity, queue, or diagnostic data is exposed during loading or transitions

## Retired Guidance

The old living-network and morphing-blob notes are not active MVP guidance. Do not reintroduce
`NetworkBackground`, `LivingNetwork`, broad ambient canvas motion, or blob/path morphing unless the
locked MVP/design authority is intentionally updated and Browser evidence proves the result is calm,
readable, responsive, and reduced-motion safe.
