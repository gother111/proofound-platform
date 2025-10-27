# Landing Page Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/ProofoundLanding.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Proofound Landing Page is a comprehensive, scroll-based marketing page with 12 major sections. It uses advanced animations (GSAP + Framer Motion), scroll-triggered effects, and a narrative structure that guides users through the product story from problem to solution to call-to-action.

---

## Page Architecture

### Container
- **Position**: `relative`
- **Background**: `#F7F6F1` (Parchment) light mode, `#1a1a1a` dark mode
- **Overflow**: `overflow-hidden` (contains animated elements)
- **Ref**: containerRef (for scroll tracking)

### Major Sections (12 total)
1. **Minimal Header** (Fixed)
2. **Progress Indicator** (Fixed)
3. **Hero Section** - The Promise
4. **Problem Section** - Pains we solve
5. **Our Answer Section** - How Proofound works
6. **Trustworthy Section** - Guiding principles
7. **Module Teasers Section** - Feature previews
8. **Personas Section** - For whom + outcomes
9. **Why Now Section** - Timing & context
10. **Proof Section** - Credibility indicators
11. **Steward Ownership Section** - Governance model
12. **Products & Subscriptions Section** - Pricing/tiers
13. **Final CTA Section** - Big call-to-action
14. **Final Quote Section** - Inspirational close
15. **Footer Section** - Links and legal

### Background Components
- **NetworkBackground**: Animated network pattern component
- **Floating Geometric Shapes**: Animated decorative elements (per section)

---

## Fixed Header

### Container
- **Position**: `fixed top-0 left-0 right-0`
- **Z-index**: `z-50`
- **Padding**: `px-6 md:px-12 py-6` (24px-48px horizontal, 24px vertical)

### Animation
- **Initial**: `opacity: 0, y: -20`
- **Animate**: `opacity: 1, y: 0`
- **Duration**: 0.6s, custom easing

### Inner Layout
- **Max Width**: `max-w-7xl mx-auto` (1280px, centered)
- **Display**: `flex items-center justify-between`

### Logo Section (Left)
- **Display**: `flex items-center gap-2`
- **Hover**: Scale 1.02

#### Logo Box
- **Size**: `w-7 h-7` (28px)
- **Border Radius**: `rounded-md`
- **Background**: `#1C4D3A` (Forest)
- **Display**: `flex items-center justify-center`
- **Text**: "P", white, font-bold, text-sm

#### Brand Name
- **Font**: Crimson Pro, text-xl (20px)
- **Color**: `#1C4D3A` light mode, `#D4C4A8` dark mode

### Menu Button (Right)
- **Size**: `w-10 h-10` (40px)
- **Shape**: `rounded-full`
- **Background**: `#1C4D3A/5` light, `#D4C4A8/10` dark
- **Hover**: Increased opacity
- **Transition**: transition-colors
- **Icon**: Menu or X (Lucide), w-5 h-5
- **ARIA Label**: "Toggle menu"

### Menu Overlay (Conditional)
**Display**: When `menuOpen` is true

- **Position**: `absolute top-full left-0 right-0`
- **Margin Top**: `mt-4` (16px)
- **Margin X**: `mx-6 md:mx-12` (24px-48px)
- **Background**: `white/95` light, `#2a2a2a/95` dark
- **Backdrop Filter**: `backdrop-blur-xl`
- **Border Radius**: `rounded-3xl` (24px)
- **Border**: `border-[#1C4D3A]/10` light, `border-[#D4C4A8]/10` dark
- **Padding**: `p-8` (32px)
- **Shadow**: `shadow-2xl`

#### Animation
- **Initial**: `opacity: 0, y: -20`
- **Animate**: `opacity: 1, y: 0`
- **Exit**: `opacity: 0, y: -20`

#### Nav Links
- **Container**: `space-y-4` (16px between items)
- **Links**: 'The Problem', 'How It Works', 'Principles', 'For Whom', 'Roadmap'

**Individual Link:**
- **Display**: `block`
- **Font Size**: text-lg (18px)
- **Color**: `#2D3330` light, `#D4C4A8` dark
- **Hover**: `#1C4D3A` light, white dark
- **Transition**: transition-colors
- **Animation**: Staggered entrance (50ms delay per item)

---

## Progress Indicator

### Container
- **Position**: `fixed top-0 left-0 right-0`
- **Height**: `h-1` (4px)
- **Z-index**: `z-50`
- **Background**: transparent

### Progress Bar
- **Component**: motion.div
- **Height**: `h-full`
- **Background**: `gradient-to-r from-[#1C4D3A] via-[#5C8B89] to-[#C76B4A]`
- **Transform Origin**: `0%` (left)
- **Scale X**: Controlled by `scrollYProgress` (0 to 1 based on scroll)

---

## Sticky Mini CTA

**Display**: After 60% scroll progress

### Container
- **Position**: `fixed bottom-6 right-6` (24px from edges)
- **Z-index**: `z-40`

### Animation
- **Initial**: `y: 100, opacity: 0` (below viewport, hidden)
- **Animate**: `y: 0, opacity: 1` (visible)
- **Exit**: `y: 100, opacity: 0`

### Button
- **Component**: Button from UI library
- **Border Radius**: `rounded-full`
- **Padding**: `px-6 py-6` (24px)
- **Background**: `#1C4D3A` (Forest)
- **Hover**: `#2D5D4A` (darker)
- **Color**: white
- **Shadow**: `shadow-2xl`
- **Text**: "Join the Waitlist"
- **Icon**: ArrowRight, w-4 h-4, ml-2

---

## Hero Section

### Container
- **Class**: gsap-hero-section (for GSAP targeting)
- **Min Height**: `min-h-[85vh]` (85% of viewport height)
- **Display**: `flex items-center justify-center`
- **Padding**: `px-6 md:px-12 pt-24 pb-16`
- **Position**: relative

### GSAP Scroll Animation
- **Target**: .gsap-hero-content
- **Trigger**: Hero section
- **Effect**: Scale to 0.8, opacity to 0.3, y to -100 as user scrolls
- **Scrub**: 1 (smooth scrubbing)

### Content Container
- **Class**: gsap-hero-content
- **Position**: `relative z-10`
- **Max Width**: `max-w-4xl mx-auto` (896px, centered)
- **Text Align**: `text-center`
- **Space Y**: `space-y-6` (24px)

### Title (h1)
- **Font Size**: text-5xl md:text-7xl lg:text-8xl (48px-96px responsive)
- **Font Family**: Crimson Pro
- **Color**: `#1C4D3A` light, `#D4C4A8` dark
- **Content**: "Proofound"

### Subtitle (h2)
- **Font Size**: text-3xl md:text-4xl lg:text-5xl (30px-48px responsive)
- **Font Family**: Crimson Pro
- **Color**: `#1C4D3A` light, `#D4C4A8` dark
- **Line Height**: `leading-tight`
- **Content**: "A credibility engineering platform for impactful connections"

### Description
- **Font Size**: text-lg md:text-xl (18px-20px)
- **Color**: `#2D3330/70` light, `#D4C4A8/70` dark (70% opacity)
- **Max Width**: `max-w-2xl mx-auto` (672px)
- **Content**: Value proposition text

### CTA Button
- **Component**: Button
- **Size**: lg
- **Border Radius**: `rounded-full`
- **Padding**: `px-8 py-6` (32px horizontal, 24px vertical)
- **Font Size**: text-lg (18px)
- **Background**: `#1C4D3A`, hover `#2D5D4A`
- **Color**: white
- **Text**: "Become a contributor"

### Animation
- **Text Block**: opacity 0→1, y 30→0, duration 0.8s
- **Button**: opacity 0→1, y 20→0, duration 0.8s, delay 0.2s
- **Triggered**: When section in view

---

## Problem Section

### Container
- **ID**: the-problem
- **Class**: gsap-problem-section
- **Display**: `flex items-center`
- **Padding**: `px-6 md:px-12 py-16 md:py-20`
- **Position**: relative

### GSAP Animation
- **Target**: .gsap-problem-card elements
- **Effect**: Staggered fade-in from y:60 to y:0
- **Trigger**: Problem section at 70% viewport
- **Stagger**: 0.2s delay between cards

### Section Header
- **Text Align**: `text-center`
- **Margin Bottom**: `mb-10 md:mb-12` (40px-48px)

#### Title (h2)
- **Font Size**: text-3xl md:text-5xl (30px-48px)
- **Font Family**: Crimson Pro
- **Color**: `#1C4D3A` light, `#D4C4A8` dark
- **Margin Bottom**: `mb-3` (12px)
- **Content**: "The problems we solve"

#### Description
- **Font Size**: text-lg (18px)
- **Color**: `#2D3330/70` light, `#D4C4A8/70` dark

### Problem Cards Grid
- **Grid**: `grid md:grid-cols-2 lg:grid-cols-3`
- **Gap**: `gap-6` (24px)

### Individual Problem Card
- **Class**: gsap-problem-card
- **Display**: `flex gap-4`
- **Padding**: `p-6` (24px)
- **Background**: `white/60` light, `#2a2a2a/60` dark
- **Backdrop Filter**: `backdrop-blur-sm`
- **Border Radius**: `rounded-2xl` (16px)
- **Border**: `border-[#1C4D3A]/10` light, `border-[#D4C4A8]/10` dark

#### Icon Container
- **Flex Shrink**: `0` (doesn't shrink)
- **Size**: `w-10 h-10` (40px)
- **Shape**: `rounded-full`
- **Background**: `#C76B4A/10` light, `#D4784F/10` dark
- **Display**: `flex items-center justify-center`

**Icon:**
- **Size**: `w-5 h-5` (20px)
- **Color**: `#C76B4A` light, `#D4784F` dark
- **Component**: Various Lucide icons (Heart, Clock, Eye, etc.)

#### Text
- **Color**: `#2D3330` light, `#D4C4A8` dark
- **Content**: Problem description

**Problem Items** (9 total):
1. Mental health toll (Heart icon)
2. Wasted time (ClockIcon)
3. Bias & opacity (Eye)
4. Vanity metrics (TrendingUp)
5. Outdated CVs (FileTextIcon)
6. Misaligned capital (DollarSignIcon)
7. AI anxiety (BotIcon)
8. No collaboration framework (PuzzleIcon)
9. Waste of resources (RecycleIcon)

---

## Section Pattern (Reused Across Multiple Sections)

Most sections follow this general pattern:

### Container Structure
- **Padding**: `px-6 md:px-12 py-16 md:py-20` (typical)
- **Max Width**: `max-w-6xl mx-auto` or `max-w-7xl mx-auto`
- **Position**: relative

### Section Header (Common)
- **Text Align**: `text-center`
- **Margin Bottom**: `mb-10` to `mb-16`

**Title (h2):**
- **Font**: Crimson Pro, text-3xl md:text-5xl
- **Color**: `#1C4D3A` / `#D4C4A8` (light/dark)

**Description:**
- **Font**: Inter, text-lg
- **Color**: `#2D3330/70` / `#D4C4A8/70`

### Content Grid (Common Pattern)
- **Grid**: Various (2-col, 3-col, 4-col depending on section)
- **Gap**: `gap-4` to `gap-8`
- **Responsive**: Collapses to single column on mobile

### Card Pattern (Common)
- **Padding**: `p-6` to `p-8`
- **Background**: `white/60` or `white/90` with dark variants
- **Backdrop Filter**: `backdrop-blur-sm` or `backdrop-blur-lg`
- **Border Radius**: `rounded-xl` to `rounded-3xl`
- **Border**: Subtle borders with theme colors at 10% opacity
- **Shadow**: Optional, usually `shadow-lg` or `shadow-xl`

---

## Trustworthy Section (Principles)

### GSAP Animation
- **Target**: .gsap-principle-card
- **Effect**: 3D rotation + fade (rotateY: -30 to 0, scale 0.9 to 1)
- **Stagger**: 0.15s

### Principle Cards (6 total)
Each card follows the standard card pattern with:
- **Icon**: w-8 h-8 in colored circle background
- **Title**: font-semibold, text-lg
- **Description**: text-sm, muted color

**Principles:**
1. Human-centric AI (Brain icon, Sage color)
2. Proof over polish (Shield icon, Forest color)
3. Transparency (Eye icon, Teal color)
4. Steward-owned (Key icon, Ochre color)
5. Impact-first (Target icon, Terracotta color)
6. Open by default (BookOpen icon, Sage color)

---

## Module Teasers Section

### Grid
- **Grid**: `grid md:grid-cols-2 gap-8`

### Module Cards (4 total)
Each uses Motion animations instead of GSAP:
- **Hover Effect**: Scale 1.02, shadow increase
- **Transition**: Spring animation

**Modules:**
1. **Expertise Atlas** (Map icon)
2. **Matching Space** (Compass icon)
3. **Verification System** (Shield icon)
4. **Impact Tracking** (Target icon)

---

## Personas Section

### Grid
- **Grid**: `grid md:grid-cols-2 gap-8`

### Persona Cards (2)
**Individual Card:**
- **Icon**: Lightbulb (Ochre)
- **Title**: "For Individuals"
- **Outcomes**: List with checkmarks
- **CTA**: "Sign up as Individual"

**Organization Card:**
- **Icon**: Award (Sage)
- **Title**: "For Organizations"
- **Outcomes**: List with checkmarks
- **CTA**: "Sign up as Organization"

### Card Hover
- **Effect**: Subtle lift, shadow increase
- **Border**: Active persona type gets accent border

---

## Products & Subscriptions Section

### Grid
- **Grid**: `grid md:grid-cols-3 gap-6`

### Pricing Cards (3 tiers)
**Structure:**
- **Badge**: Popular/Enterprise badge (conditional)
- **Title**: Tier name
- **Price**: Size varies (larger for popular)
- **Features**: Checkmark list
- **CTA Button**: Variant varies by tier

**Tiers:**
1. **Free** - Basic features
2. **Pro** - Most popular, highlighted
3. **Enterprise** - Custom pricing

---

## Final CTA Section

### Container
- **Class**: gsap-final-cta
- **Min Height**: `min-h-[60vh]`
- **Display**: `flex items-center justify-center`
- **Background**: Gradient overlay

### GSAP Animation
- **Effect**: Scale 0.9 to 1, opacity 0 to 1
- **Trigger**: At 80% viewport

### Content
- **Max Width**: `max-w-3xl`
- **Text Align**: `text-center`
- **Large Title**: Very large Crimson Pro heading
- **CTA Button**: Extra large, prominent

---

## Final Quote Section

### Animation
- **Type**: Parallax-style fade and scale
- **Quote**: Large, centered, poetic text
- **Fade Out**: As user scrolls past

---

## Footer Section

### Background
- **Color**: `#1C4D3A` (Forest)
- **Text**: White and muted variants

### Grid
- **Grid**: `grid md:grid-cols-4 gap-8`
- **Padding**: `px-6 md:px-12 py-12`

### Columns
1. **Brand** - Logo + description
2. **Product** - Links
3. **Company** - Links
4. **Legal** - Links

### Copyright Bar
- **Padding**: `py-6`
- **Border Top**: `border-t border-white/10`
- **Text**: Centered, text-sm

---

## Typography Scale

### Display Text
- **Hero Title**: Crimson Pro, 48px-96px (responsive)
- **Section Titles**: Crimson Pro, 30px-48px
- **Card Titles**: Inter, 18px-24px
- **Body Text**: Inter, 14px-18px
- **Captions**: Inter, 12px-14px

### Font Weights
- **Regular**: 400 (body)
- **Medium**: 500 (labels, small headings)
- **Semibold**: 600 (card titles)
- **Bold**: 700 (hero, major headings)

---

## Color Palette

### Primary Colors
- **Forest**: `#1C4D3A` (primary brand, CTAs)
- **Terracotta**: `#C76B4A` (accents)
- **Sage**: `#7A9278` (secondary accents)
- **Teal**: `#5C8B89` (gradients)
- **Ochre**: `#D4A574` (icons, highlights)

### Backgrounds
- **Page Light**: `#F7F6F1` (Parchment)
- **Page Dark**: `#1a1a1a`
- **Card Light**: `white/60` to `white/90`
- **Card Dark**: `#2a2a2a/60` to `#2a2a2a/90`

### Text
- **Primary Light**: `#2D3330`
- **Primary Dark**: `#D4C4A8`
- **Muted**: 70% opacity of primary

---

## Responsive Breakpoints

### Mobile (<768px)
- **Padding**: px-6 (24px)
- **Font Sizes**: Smaller variants
- **Grids**: Single column (grid-cols-1)
- **Hero**: text-5xl (48px)

### Tablet (768px - 1023px)
- **Padding**: px-12 (48px)
- **Grids**: 2 columns (md:grid-cols-2)
- **Font Sizes**: Medium variants

### Desktop (≥1024px)
- **Max Widths**: Enforced (max-w-6xl, max-w-7xl)
- **Grids**: Full columns (lg:grid-cols-3, lg:grid-cols-4)
- **Font Sizes**: Largest variants
- **Hero**: text-8xl (96px)

---

## Animations Summary

### GSAP Scroll Animations
1. **Hero**: Scale + fade on scroll
2. **Problem Cards**: Staggered fade-up
3. **Principle Cards**: 3D rotation + fade
4. **Final CTA**: Scale + fade

### Framer Motion Animations
1. **Section Entrance**: Fade + slide up
2. **Card Hover**: Scale + shadow
3. **Sticky CTA**: Slide up from bottom
4. **Menu**: Fade + slide
5. **Progress Bar**: Horizontal scale with scroll

### Reduced Motion
- **Preference Check**: `useReducedMotion()` hook
- **Behavior**: Disables GSAP animations when enabled

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **Sections**: Wrapped in `<section>` with IDs
- **Navigation**: `<nav>` element in menu
- **Links**: Proper `<a>` tags with href

### ARIA
- **Menu Button**: aria-label="Toggle menu"
- **Links**: Should have descriptive text
- **Icons**: Decorative (can have aria-hidden)

### Keyboard Navigation
- **Menu**: Keyboard accessible
- **Links**: All focusable
- **Buttons**: Tab-navigable
- **Skip Links**: Should be added (TODO)

### Motion
- **Reduced Motion**: Respects user preference
- **Performance**: Uses will-change for optimized animations

---

## Performance Considerations

### Lazy Loading
- **Sections**: Below fold could be lazy loaded
- **Images**: Use Next/Image for optimization

### Animation Performance
- **Transform**: Uses GPU-accelerated properties
- **Will-change**: Applied to animated elements
- **Scroll Jank**: GSAP ScrollTrigger optimized

### Code Splitting
- **GSAP**: Conditionally loaded on client
- **Framer Motion**: Tree-shaken imports

---

## Notes for Implementation

1. **Long Page**: Over 1600 lines, consider splitting into separate components

2. **Multiple Animation Libraries**: GSAP + Framer Motion used together

3. **Scroll-Driven**: Heavy use of scroll triggers and parallax

4. **Dark Mode**: Full theme support with dark: prefixes

5. **Network Background**: Separate component for animated background

6. **Sticky Elements**: Header, progress bar, mini CTA all fixed/sticky

7. **Callback Props**: onGetStarted, onIndividualSignup, onOrganizationSignup for flexible navigation

8. **Router Integration**: Uses Next.js router for navigation

9. **State Management**: Simple useState for menu and scroll tracking

10. **Viewport Detection**: Uses Intersection Observer via useInView

11. **Scroll Progress**: Custom calculation for sticky CTA trigger

12. **GSAP Cleanup**: Proper cleanup of ScrollTriggers on unmount

13. **Responsive Images**: Should use Next/Image (not shown in code)

14. **Content Management**: All content hardcoded, consider CMS integration

15. **Analytics**: Should track scroll depth, CTA clicks

---

**Implementation Priority**: HIGH - Primary marketing page

**Related Components**:
- NetworkBackground (separate component)
- Button from UI library
- All Lucide icons
- Framer Motion components
- GSAP + ScrollTrigger
- Next.js router

**Key Features**:
- 12+ narrative sections
- Scroll-triggered animations
- Fixed header + progress bar
- Sticky mini CTA
- Full dark mode support
- Responsive design
- Reduced motion support
- Professional marketing layout

