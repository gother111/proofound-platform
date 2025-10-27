# Zen Hub Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/ZenHub.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Zen Hub is an evidence-based mental wellbeing feature offering secular, research-backed practices for stress, sleep, focus, and mood. The page features animated backgrounds, filtering options, pinned practices, practice detail modals, privacy-first design, and risk level detection. All practices are categorized by evidence type (meta-reviewed, RCT-backed, NICE-recommended).

---

## Page Container

- **Min Height**: `min-h-screen`
- **Background**: `#F7F6F1` (Parchment)
- **Position**: `relative`

---

## Animated Background Layer

### Container
- **Position**: `fixed inset-0`
- **Opacity**: `opacity-20`
- **Pointer Events**: `pointer-events-none` (decorative only)
- **Z-index**: Below content

### SVG Background
- **Size**: `w-full h-full`

#### Gradient Definition
- **ID**: "zen-gradient"
- **Type**: radialGradient

**Gradient Stops:**
1. **0%**: `#7A9278` (Sage), opacity 0.1
2. **100%**: `#5C8B89` (Teal), opacity 0.05

**Gradient Rect:**
- **Size**: 100% width and height
- **Fill**: url(#zen-gradient)

#### Animated Circle (Framer Motion)

**Properties:**
- Position: cx="30%", cy="40%"
- Radius: r="200"
- Fill: `#7A9278` (Sage)
- Initial Opacity: 0.05

**Animation:**
- Scale: [1, 1.1, 1]
- Opacity: [0.05, 0.08, 0.05]
- Duration: 8s
- Repeat: Infinity
- Easing: easeInOut

---

## Content Container

- **Position**: `relative z-10` (above background)
- **Max Width**: `max-w-7xl mx-auto` (1280px, centered)
- **Padding**: `px-6 py-12` (24px horizontal, 48px vertical)
- **Space Y**: `space-y-8` (32px between sections)

---

## Header Section

### Container
- **Display**: `flex items-start justify-between`

---

### Left Side (Title Area)

**Title (h1):**
- Font Size: text-4xl (36px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330` (Charcoal)
- Content: "Zen Hub"

**Subtitle (p):**
- Font Size: text-lg (18px)
- Color: `#6B6760`
- Content: "Evidence-based practices for mental wellbeing"

---

### Right Side (Action Buttons)

**Container:**
- Display: `flex items-center gap-3`

**Privacy Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2`
- Icon: Shield, w-4 h-4
- Text: "Privacy"
- Action: Opens privacy panel

**Dark Mode Toggle:**
- Variant: ghost
- Size: sm
- Icon: Conditional
  - Dark mode active: Sun, w-4 h-4
  - Light mode: Moon, w-4 h-4
- Action: Toggles dark mode state

---

## Risk Level Banner (Conditional)

**Display**: If `riskLevel !== 'normal'`

### Card
- **Component**: Card
- **Padding**: `p-4` (16px)
- **Border**: `border-2`
- **Border Color**: Conditional
  - High: `#B5695C` (Rust)
  - Elevated: `#D4A574` (Ochre)
- **Background**: Conditional
  - High: `#B5695C10` (Rust 10%)
  - Elevated: `#D4A57410` (Ochre 10%)

### Layout
- **Display**: `flex items-start gap-3`

**Icon:**
- Component: AlertTriangle
- Size: `w-5 h-5` (20px)
- Flex Shrink: `flex-shrink-0`
- Color: Conditional (matches border)

**Content (Flex-1):**

**Title (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-1` (4px)
- Color: `#2D3330`
- Content: Conditional
  - High: "Immediate Support Available"
  - Elevated: "Elevated Stress Detected"

**Description (p):**
- Font Size: text-sm (14px)
- Margin Bottom: `mb-3` (12px)
- Color: `#6B6760`
- Content: Risk-specific message

**Action Buttons:**
- Display: `flex gap-2`

**Button 1:**
- Size: sm
- Variant: outline
- Content: "Crisis Helpline"

**Button 2:**
- Size: sm
- Variant: outline
- Content: "Find Therapist"

---

## Controls Card

### Card
- **Component**: Card
- **Padding**: `p-6` (24px)

### Grid
- **Display**: `grid`
- **Columns**: `grid-cols-1 md:grid-cols-2` (1 on mobile, 2 on desktop)
- **Gap**: `gap-6` (24px)

---

### Control Item (2 items)

**Container:**
- Display: `flex items-center justify-between`

**Left Side (Text):**

**Label:**
- Component: Label
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Control name

**Description (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: Control description

**Right Side:**

**Switch:**
- Component: Switch from UI library
- ID: Matches label htmlFor

**Controls:**
1. **Skeptic Mode**
   - Label: "Skeptic Mode"
   - Description: "Show only secular, evidence-based practices"
   - ID: "skeptic-mode"

2. **Low Energy Mode**
   - Label: "Low Energy Mode"
   - Description: "Show only quick, easy practices (≤5 min)"
   - ID: "low-spoons"

---

## Goal Filters

### Container
- **Display**: `flex flex-wrap gap-2`

### Filter Button (4 buttons: Stress, Sleep, Focus, Mood)

**Element**: `<button>` (not Button component, custom styling)

- **Padding**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Border Radius**: `rounded-full`
- **Font Size**: text-sm (14px)
- **Transition**: `transition-all`
- **Background**: Conditional
  - **Selected**: `#7A9278` (Sage)
  - **Unselected**: `#E8E6DD` (Stone)
- **Color**: Conditional
  - **Selected**: `#FFFFFF` (White)
  - **Unselected**: `#2D3330` (Charcoal)
- **Content**: Goal name ("Stress", "Sleep", "Focus", "Mood")
- **Action**: Toggles goal filter

---

## Pinned Practices Section (Conditional)

**Display**: If `pinnedPracticesList.length > 0`

### Container
- **Space Y**: `space-y-4` (16px)

**Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Display: `flex items-center gap-2`
- Color: `#2D3330`
- Icon: Pin, w-5 h-5
- Content: "Your Pinned Practices"

---

### Pinned Practices Grid
- **Grid**: `grid-cols-1 md:grid-cols-2` (1 on mobile, 2 on tablet+)
- **Gap**: `gap-4` (16px)

### Individual Practice Card (Pinned)

**Card:**
- Component: Card
- Padding: `p-6` (24px)
- Cursor: `cursor-pointer`
- Hover: `hover:shadow-lg transition-shadow`
- Action: Opens practice detail modal

#### Header Row
- **Display**: `flex items-start justify-between`
- **Margin Bottom**: `mb-3` (12px)

**Icon Container:**
- Size: `w-10 h-10` (40px)
- Border Radius: `rounded-lg`
- Display: `flex items-center justify-center`
- Background: Practice color with 20% opacity (e.g., `#7A927820`)
- Color: Practice color
- Content: Practice icon (Wind, Brain, Heart, Sparkles, etc.)

**Pin Button:**
- Variant: ghost
- Size: sm
- Icon: Pin, w-4 h-4
- Icon Fill: Conditional (filled if pinned)
- Color: `#7A9278` (Sage) if pinned, `#6B6760` if not
- Action: Toggles pin state (stops propagation)

#### Practice Title (h3)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-1` (4px)
- **Color**: `#2D3330`
- **Content**: Practice title

#### Practice Description (p)
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-3` (12px)
- **Color**: `#6B6760`
- **Content**: "{benefit} • {duration}" (e.g., "Calm & focus • 2m")

#### Evidence Badge
- **Component**: Badge, variant outline
- **Border Color**: Evidence type color
- **Text Color**: Evidence type color
- **Content**: Evidence label
  - "Meta-reviewed" (Sage #7A9278)
  - "RCT-backed" (Teal #5C8B89)
  - "NICE-recommended" (Forest #1C4D3A)
  - "Initial evidence" (Terracotta #C76B4A)

---

## All Practices Section

### Container
- **Space Y**: `space-y-4` (16px)

**Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: "All Practices"

---

### Practices Grid
- **Grid**: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (1 mobile, 2 tablet, 3 desktop)
- **Gap**: `gap-4` (16px)

### Individual Practice Card

**Card:**
- Component: Card
- Padding: `p-6` (24px)
- Cursor: `cursor-pointer`
- Hover: `hover:shadow-lg transition-shadow`
- Action: Opens practice detail modal

**Structure:** Same as Pinned Practice Card (see above)

---

## Practice Detail Modal (AnimatePresence)

**Display**: If `selectedPractice` exists

### Overlay
- **Initial**: opacity: 0
- **Animate**: opacity: 1
- **Exit**: opacity: 0
- **Class**: `fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4`
- **Action**: Closes modal on click

---

### Modal Container

**Motion Div:**
- **Initial**: scale: 0.95, opacity: 0
- **Animate**: scale: 1, opacity: 1
- **Exit**: scale: 0.95, opacity: 0
- **Class**: `bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8`
- **Action**: Stops propagation (doesn't close on click inside)

---

### Modal Header
- **Display**: `flex items-start justify-between`
- **Margin Bottom**: `mb-6` (24px)

#### Left Side
- **Display**: `flex items-center gap-4`

**Icon Container:**
- Size: `w-16 h-16` (64px)
- Border Radius: `rounded-xl` (12px)
- Display: `flex items-center justify-center`
- Background: Practice color with 20% opacity
- Color: Practice color
- Content: Practice icon

**Practice Info:**

**Title (h2):**
- Font Size: text-2xl (24px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Practice title

**Meta (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "{duration} • {benefit}"

#### Right Side

**Close Button:**
- Variant: ghost
- Size: sm
- Icon: X, w-5 h-5
- Action: Closes modal

---

### Modal Content
- **Space Y**: `space-y-6` (24px between sections)

---

#### Section 1: What to Expect

**Title (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330`
- Content: "What to Expect"

**Description (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: Practice description

---

#### Section 2: Steps

**Title (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-3` (12px)
- Color: `#2D3330`
- Content: "Steps"

**Steps List (ol):**
- Space Y: `space-y-2` (8px between steps)

**Individual Step (li):**
- Display: `flex gap-3`

**Step Number:**
- Flex Shrink: `flex-shrink-0`
- Size: `w-6 h-6` (24px)
- Border Radius: `rounded-full`
- Display: `flex items-center justify-center`
- Font Size: text-xs (12px)
- Font Weight: font-semibold (600)
- Background: Practice color with 20% opacity
- Color: Practice color
- Content: Step number (1, 2, 3, etc.)

**Step Text:**
- Font Size: text-sm (14px)
- Color: `#2D3330`
- Content: Step instruction

---

#### Section 3: Evidence Base

**Title (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-3` (12px)
- Display: `flex items-center gap-2`
- Color: `#2D3330`
- Icon: BarChart3, w-4 h-4
- Content: "Evidence Base"

**Evidence List (ul):**
- Space Y: `space-y-2` (8px between items)

**Individual Evidence Point (li):**
- Display: `flex gap-2`
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Bullet: "•"
- Content: Evidence point text

---

#### Begin Practice Button
- **Width**: `w-full`
- **Background**: Practice color (dynamic)
- **Content**: "Begin Practice"
- **Action**: Starts practice session

---

## Privacy Panel Modal (AnimatePresence)

**Display**: If `showPrivacyPanel` is true

### Overlay
- **Class**: `fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4`
- **Animation**: Same as Practice Detail Modal
- **Action**: Closes panel on click

---

### Panel Container

**Motion Div:**
- **Class**: `bg-white rounded-2xl max-w-lg w-full p-8`
- **Animation**: scale and opacity transition
- **Action**: Stops propagation

---

### Panel Header
- **Display**: `flex items-start justify-between`
- **Margin Bottom**: `mb-6` (24px)

#### Left Side
- **Display**: `flex items-center gap-3`

**Icon Container:**
- Size: `w-12 h-12` (48px)
- Border Radius: `rounded-xl` (12px)
- Background: `#7A9278/10` (Sage 10%)
- Display: `flex items-center justify-center`
- Icon: Shield, w-6 h-6, color #7A9278

**Title (h2):**
- Font Size: text-2xl (24px)
- Font Family: font-display
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: "Privacy First"

#### Right Side

**Close Button:**
- Variant: ghost
- Size: sm
- Icon: X, w-5 h-5
- Action: Closes panel

---

### Panel Content
- **Space Y**: `space-y-4` (16px between sections)

**Introduction (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "Zen Hub is designed with your privacy as the top priority:"

**Privacy Points List (ul):**
- Space Y: `space-y-3` (12px between items)

**Individual Point (li):**
- Display: `flex gap-3`
- Font Size: text-sm (14px)

**Icon:**
- Component: Shield
- Size: `w-4 h-4` (16px)
- Flex Shrink: `flex-shrink-0`
- Color: `#7A9278` (Sage)

**Text:**
- Color: `#2D3330`
- Content: Privacy point

**Privacy Points:**
1. "No wellbeing data is stored on servers"
2. "All preferences stay on your device"
3. "No tracking of practice sessions"
4. "No sharing of mental health information"
5. "Optional local export for your records"

**Footer:**
- Padding Top: `pt-4`
- Margin Top: `mt-4`
- Border Top: `border-t`, color `#E8E6DD`

**Footer Text (p):**
- Font Size: text-xs (12px)
- Color: `#6B6760`
- Content: "Your mental wellbeing journey is yours alone. We believe privacy is essential for authentic healing."

---

## Typography Scale

### Headings
- **H1 (Page Title)**: Crimson Pro, text-4xl (36px), font-semibold (600), #2D3330
- **H2 (Section/Modal Titles)**: Crimson Pro, text-xl (20px) or text-2xl (24px), font-semibold (600), #2D3330
- **H3 (Card/Subsection Titles)**: Inter, font-semibold (600), #2D3330
- **H4**: (Not used)

### Body Text
- **Subtitle**: Inter, text-lg (18px), #6B6760
- **Description**: Inter, text-sm (14px), #6B6760
- **Labels**: Inter, font-semibold (600), #2D3330
- **Control Description**: Inter, text-sm (14px), #6B6760
- **Step Text**: Inter, text-sm (14px), #2D3330
- **Evidence Points**: Inter, text-sm (14px), #6B6760
- **Footer Text**: Inter, text-xs (12px), #6B6760

### Font Weights
- **Regular**: 400 (body text, descriptions)
- **Semibold**: 600 (titles, labels, step numbers)

---

## Color Palette

### Page
- **Background**: `#F7F6F1` (Parchment)

### Animated Background
- **Gradient Stop 1**: `#7A9278` (Sage), 10% opacity
- **Gradient Stop 2**: `#5C8B89` (Teal), 5% opacity
- **Animated Circle**: Sage, 5-8% opacity

### Risk Banner
- **High Risk**:
  - Border: `#B5695C` (Rust)
  - Background: Rust 10%
  - Icon: Rust
- **Elevated**:
  - Border: `#D4A574` (Ochre)
  - Background: Ochre 10%
  - Icon: Ochre

### Cards
- **Main Cards**: white (default)
- **Practice Cards**: white with shadow on hover

### Goal Filters
- **Selected**: `#7A9278` (Sage) background, white text
- **Unselected**: `#E8E6DD` (Stone) background, Charcoal text

### Practice Cards
- **Icon Background**: Practice color with 20% opacity
- **Icon Color**: Practice color
- **Practice Colors**:
  - Box Breathing: `#7A9278` (Sage)
  - Body Scan: `#5C8B89` (Teal)
  - Breathing Space: `#7A9278` (Sage)
  - PMR: `#C76B4A` (Terracotta)
  - Gratitude: `#D4A574` (Ochre)

### Evidence Badges
- **Meta-reviewed**: `#7A9278` (Sage)
- **RCT-backed**: `#5C8B89` (Teal)
- **NICE-recommended**: `#1C4D3A` (Forest)
- **Initial evidence**: `#C76B4A` (Terracotta)

### Modals
- **Overlay**: black with 50% opacity
- **Container**: white
- **Step Numbers**: Practice color background (20%), practice color text

### Privacy Panel
- **Shield Icon Container**: Sage 10% background
- **Shield Icon**: Sage
- **Border**: Stone (#E8E6DD)

### Text
- **Primary**: `#2D3330` (Charcoal)
- **Secondary**: `#6B6760` (Gray)

### Buttons
- **Begin Practice**: Practice color background
- **Privacy/Close**: Ghost or outline variant

### Pin Icon
- **Pinned**: `#7A9278` (Sage), filled
- **Unpinned**: `#6B6760` (Gray), outline

---

## Spacing System

### Page Level
- **Max Width**: 1280px (max-w-7xl)
- **Padding**: 24px horizontal, 48px vertical
- **Content Spacing**: 32px (space-y-8)

### Header
- **Title Margin**: 8px bottom (mb-2)
- **Buttons Gap**: 12px (gap-3)

### Risk Banner
- **Card Padding**: 16px (p-4)
- **Icon to Content Gap**: 12px (gap-3)
- **Title Margin**: 4px bottom (mb-1)
- **Description Margin**: 12px bottom (mb-3)
- **Buttons Gap**: 8px (gap-2)

### Controls Card
- **Padding**: 24px (p-6)
- **Grid Gap**: 24px (gap-6)

### Goal Filters
- **Container Gap**: 8px (gap-2)
- **Button Padding**: 16px horizontal, 8px vertical

### Pinned Practices
- **Section Spacing**: 16px (space-y-4)
- **Grid Gap**: 16px (gap-4)

### Practice Cards
- **Padding**: 24px (p-6)
- **Header Margin**: 12px bottom (mb-3)
- **Icon Size**: 40px (pinned), 40px (all)
- **Title Margin**: 4px bottom (mb-1)
- **Description Margin**: 12px bottom (mb-3)

### Practice Modal
- **Max Width**: 768px (max-w-2xl)
- **Max Height**: 80vh
- **Padding**: 32px (p-8)
- **Header Margin**: 24px bottom (mb-6)
- **Icon to Text Gap**: 16px (gap-4)
- **Icon Size**: 64px (w-16 h-16)
- **Content Spacing**: 24px (space-y-6)
- **Subsection Title Margin**: 8-12px bottom
- **Steps Spacing**: 8px (space-y-2)
- **Step Number Size**: 24px
- **Step Gap**: 12px (gap-3)
- **Evidence Spacing**: 8px (space-y-2)

### Privacy Panel
- **Max Width**: 512px (max-w-lg)
- **Padding**: 32px (p-8)
- **Header Margin**: 24px bottom (mb-6)
- **Icon to Title Gap**: 12px (gap-3)
- **Icon Container**: 48px (w-12 h-12)
- **Content Spacing**: 16px (space-y-4)
- **Privacy Points Spacing**: 12px (space-y-3)
- **Footer Padding**: 16px top (pt-4)
- **Footer Margin**: 16px top (mt-4)

---

## Responsive Behavior

### Desktop (≥1024px)
- **All Practices Grid**: 3 columns (lg:grid-cols-3)
- **All Sections**: Full layout

### Tablet (768px-1023px)
- **Pinned Grid**: 2 columns (md:grid-cols-2)
- **All Practices Grid**: 2 columns (md:grid-cols-2)
- **Controls Grid**: 2 columns (md:grid-cols-2)

### Mobile (<768px)
- **All Grids**: 1 column (grid-cols-1)
- **Goal Filters**: Wrap (flex-wrap)
- **Modals**: Full width with padding

---

## Interactive States

### Goal Filter Buttons
- **Default**: Stone background, Charcoal text
- **Selected**: Sage background, white text
- **Hover**: Not specified (should add slight opacity change)
- **Transition**: `transition-all`

### Practice Cards
- **Default**: White with subtle shadow
- **Hover**: `hover:shadow-lg` (increased shadow)
- **Transition**: `transition-shadow`
- **Cursor**: `cursor-pointer`

### Pin Button
- **Default**: Ghost variant
- **Pinned**: Fill icon, Sage color
- **Unpinned**: Outline icon, Gray color
- **Click**: Stops event propagation

### Modal Overlays
- **Initial**: opacity: 0
- **Animate**: opacity: 1
- **Exit**: opacity: 0
- **Click**: Closes modal

### Modal Containers
- **Initial**: scale: 0.95, opacity: 0
- **Animate**: scale: 1, opacity: 1
- **Exit**: scale: 0.95, opacity: 0

### Switches
- **Default**: UI library states
- **Toggle**: Changes filter state

### Begin Practice Button
- **Background**: Dynamic (practice color)
- **Hover**: Standard button hover

---

## Animations

### Background
- **Gradient**: Static
- **Circle**: Animated breathing effect
  - Scale: 1 → 1.1 → 1
  - Opacity: 0.05 → 0.08 → 0.05
  - Duration: 8s
  - Repeat: Infinite
  - Easing: easeInOut

### Modals (Framer Motion AnimatePresence)
- **Overlay Fade**: 0 → 1 → 0
- **Container Scale**: 0.95 → 1 → 0.95
- **Container Opacity**: 0 → 1 → 0
- **Smooth Transitions**: All animations

### Card Shadows
- **Transition**: transition-shadow

---

## Filtering Logic

### Skeptic Mode
- **On**: Shows only secular practices
- **Off**: Shows all practices
- **Implementation**: Filter by style field

### Low Energy Mode
- **On**: Shows only practices ≤5 minutes
- **Off**: Shows all durations
- **Implementation**: Filter by time field

### Goal Filters
- **Selected**: Shows only practices matching goal
- **None Selected**: Shows all practices
- **Implementation**: Filter by goal field (Stress, Sleep, Focus, Mood)

---

## Practice Data Structure

### Practice Object
- **id**: string
- **title**: string (e.g., "Box Breathing")
- **duration**: string (e.g., "2m")
- **benefit**: string (e.g., "Calm & focus")
- **evidenceType**: 'meta-reviewed' | 'rct-backed' | 'nice-recommended' | 'initial'
- **category**: string (e.g., 'breathing', 'mindfulness', 'relaxation', 'reflection')
- **icon**: React element (Wind, Brain, Heart, Sparkles)
- **description**: string (what to expect)
- **steps**: string[] (step-by-step instructions)
- **evidencePoints**: string[] (research backing)
- **goal**: string ('Stress', 'Sleep', 'Focus', 'Mood')
- **style**: string ('Secular')
- **time**: number (duration in minutes)
- **color**: string (hex color for theming)

### Evidence Badge Data
- **meta-reviewed**: Sage (#7A9278)
- **rct-backed**: Teal (#5C8B89)
- **nice-recommended**: Forest (#1C4D3A)
- **initial**: Terracotta (#C76B4A)

---

## State Management

### Component State
- **riskLevel**: 'normal' | 'elevated' | 'high'
- **selectedPractice**: Practice object or null
- **pinnedPractices**: string[] (practice IDs)
- **skepticMode**: boolean (default true)
- **lowSpoonsMode**: boolean (default false)
- **showPrivacyPanel**: boolean (default false)
- **darkMode**: boolean (default false)
- **selectedGoal**: string | null

### Computed Values
- **filteredPractices**: Array filtered by lowSpoonsMode and selectedGoal
- **pinnedPracticesList**: Array filtered by pinnedPractices IDs

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **Lists**: Ordered list for steps, unordered for evidence
- **Buttons**: Proper button elements
- **Labels**: Associated with switches

### Keyboard Navigation
- **All Buttons**: Focusable and activatable
- **Switches**: Toggle via keyboard
- **Modals**: Escape key should close (TODO)
- **Filter Buttons**: Tab-navigable

### Screen Readers
- **Icons**: Decorative (with meaningful adjacent text)
- **Badges**: Evidence type announced
- **Switches**: State announced
- **Modal**: Should trap focus (TODO)

### ARIA
- **Switches**: Proper Switch component
- **Modals**: Should have role="dialog" (TODO)

---

## Privacy Features

1. **No Server Storage**: All data stays client-side
2. **Local Preferences**: Stored in browser only
3. **No Tracking**: Practice sessions not logged
4. **No Sharing**: Mental health data never shared
5. **Optional Export**: User controls data
6. **Transparent**: Privacy panel explains all

---

## Notes for Implementation

1. **Evidence-Based**: All practices have research backing

2. **Practice Categories**: 6 categories (breathing, mindfulness, relaxation, reflection, etc.)

3. **Evidence Types**: 4 levels (meta-reviewed, RCT-backed, NICE-recommended, initial)

4. **5 Sample Practices**: Box Breathing, MBSR Body Scan, 3-Minute Breathing Space, Progressive Muscle Relaxation, Gratitude Reflection

5. **Risk Detection**: Monitors for elevated/high stress (implementation TBD)

6. **Pinning**: Users can pin favorite practices for quick access

7. **Filtering**: Multiple filters (skeptic mode, low energy, goal-based)

8. **Modal Navigation**: Practice details in overlay modal

9. **Privacy First**: No data sent to servers

10. **Dark Mode**: Toggle available (implementation TBD)

11. **Animated Background**: Subtle breathing animation for calming effect

12. **Framer Motion**: Used for modal animations

13. **Crisis Support**: Links to helplines for high-risk users

14. **Secular Focus**: All practices are non-religious

15. **Accessibility**: Keyboard navigation and screen reader support

---

**Implementation Priority**: MEDIUM-HIGH - Wellbeing differentiator

**Related Components**:
- Card, Button, Badge, Tabs, Switch, Label from UI library
- Framer Motion for animations
- All Lucide icons
- AnimatePresence for modals

**Key Features**:
- Evidence-based practices library
- Animated calming background
- Multiple filtering options
- Pinned practices
- Practice detail modals
- Privacy panel
- Risk level detection
- Crisis support resources
- Dark mode toggle
- Goal-based organization
- Step-by-step instructions
- Research citations

