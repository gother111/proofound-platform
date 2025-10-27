# Individual Dashboard Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `DashboardPage.tsx` (persona='individual')  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Individual Dashboard is the primary landing page for individual users. It provides an overview of goals, tasks, projects, matches, and opportunities in a card-based layout with customizable widgets.

---

## Page Container

- **Display**: `flex flex-col`
- **Height**: `100%` (full viewport)
- **Overflow**: `overflow-y-auto`
- **Background**: `#F7F6F1` (Parchment)
- **Padding**: `0` (handled by sections)
- **Max Width**: None (full width)

---

## Header (Top Bar)

### Dimensions
- **Height**: `56px` (14 spacing units / h-14)
- **Position**: `sticky top-0`
- **Z-index**: `50`
- **Flex Shrink**: `0` (flex-shrink-0)

### Colors
- **Background**: `#FDFCFA` (Off-white)
- **Border Bottom**: `1px solid rgba(232, 230, 221, 0.6)`

### Layout
- **Display**: `flex`
- **Align Items**: `center`
- **Justify Content**: `space-between`
- **Padding**: `16px` (px-4 / 4 spacing units)

### Header Elements Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│ [Back?] [Logo] [Divider] [Title]          [Search] [Toggle] [Btn] [Avatar] │
│  40px    28px    6px     auto              256px    auto    auto   28px    │
│         gap-4            gap-4                      gap-3                   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Left Section (flex items-center gap-4)
1. **Back Button** (conditional)
   - Size: `h-8` (32px)
   - Variant: `ghost`
   - Icon: `ArrowLeft` w-4 h-4

2. **Logo Container** (flex items-center gap-2)
   - Logo Box: `w-7 h-7` (28px), rounded-lg
   - Background: `gradient-to-br from-[#1C4D3A] to-[#5C8B89]`
   - Text: `P` in white, text-xs, font-semibold

3. **Brand Name**
   - Font: Inter, font-semibold, text-sm
   - Color: `#2D3330`

4. **Separator** (vertical)
   - Height: `h-6` (24px)
   - Orientation: vertical

5. **Page Title** ("Dashboard")
   - Font: Inter, text-base
   - Color: `#2D3330`

#### Right Section (flex items-center gap-3)
1. **Search Bar** (hidden on mobile, md:flex)
   - Width: `w-64` (256px)
   - Height: Auto (items-center)
   - Padding: `px-3 py-1.5`
   - Border: `1px solid rgba(232, 230, 221, 0.6)`
   - Border Radius: `rounded-full`
   - Background: `white`
   - Icon: `Search` w-3.5 h-3.5, color #6B6760
   - Input: text-sm, transparent background

2. **Empty/Filled Toggle** (demo only)
   - Background: `#E8E6DD`
   - Padding: `px-2.5 py-1`
   - Border Radius: `rounded-full`
   - Text: text-xs, color #2D3330
   - Switch component in between

3. **Customize Button**
   - Variant: `outline`
   - Size: `sm`
   - Height: `h-8` (32px)
   - Text: text-xs
   - Border: `rgba(232, 230, 221, 0.6)`

4. **Avatar**
   - Size: `w-7 h-7` (28px)
   - Background: `#1C4D3A`
   - Text: `AC` (initials), color #F7F6F1, text-xs

---

## Navigation Sidebar

### Dimensions
- **Width Collapsed**: `w-14` (56px / 14 spacing units)
- **Width Expanded**: `w-52` (208px / 52 spacing units)
- **Height**: `100%` (flex-1)
- **Transition**: `transition-all duration-300`
- **Flex Shrink**: `0`

### Colors
- **Background**: `#FDFCFA` (Off-white)
- **Border Right**: `1px solid rgba(232, 230, 221, 0.6)`

### Layout
- **Display**: `flex flex-col`
- **Height**: `h-full`

### Navigation Items

#### Container
- **Padding**: `py-3` (top/bottom), `px-2` (left/right)
- **Space Between Items**: `space-y-0.5` (2px)

#### Individual Nav Item
- **Display**: `flex items-center`
- **Gap**: `gap-2.5` (10px)
- **Width**: `w-full`
- **Padding**: `px-2.5 py-2` (10px horizontal, 8px vertical)
- **Border Radius**: `rounded-lg`
- **Transition**: `transition-colors`
- **Height**: ~40px (auto with py-2)

#### Nav Item States
**Default:**
- Background: `transparent`
- Color: `#2D3330`
- Hover: `bg-[#E8E6DD]/50`

**Active:**
- Background: `#1C4D3A` (Forest)
- Color: `#F7F6F1` (Parchment/White)
- Font Weight: `medium`

#### Icon
- Size: `w-4 h-4` (16px)
- Flex Shrink: `0`

#### Label (expanded state only)
- Font: Inter, text-sm
- Display: Conditional (hidden when collapsed)

#### Tooltip (collapsed state)
- Position: `absolute left-full ml-2`
- Padding: `px-2 py-1`
- Border Radius: `rounded`
- Background: `gray-900`
- Color: `white`
- Font Size: text-xs
- Opacity: `opacity-0` (shows on hover)
- Z-index: `z-10`
- Whitespace: `whitespace-nowrap`

### Collapse/Expand Button

- **Position**: Bottom of sidebar
- **Padding**: `p-2`
- **Border Top**: `1px solid rgba(232, 230, 221, 0.6)`
- **Button**: `ghost` variant, `sm` size, `w-full justify-center h-8`
- **Icon**: `ChevronRight` (collapsed) or `ChevronLeft` (expanded), w-3.5 h-3.5

---

## Main Content Area

### Container
- **Display**: `flex-1`
- **Overflow**: `overflow-y-auto`

### Inner Container
- **Max Width**: `max-w-[1400px]`
- **Margin**: `mx-auto` (centered)
- **Padding**: `px-4 py-4` (16px all around)

### Persona Switcher (demo only)
- **Margin Bottom**: `mb-4`
- **Display**: `flex items-center gap-2`
- **Padding**: `p-0.5`
- **Border Radius**: `rounded-full`
- **Width**: `w-fit`
- **Background**: `#E8E6DD`

#### Toggle Buttons
- **Padding**: `px-3 py-1`
- **Border Radius**: `rounded-full`
- **Font Size**: text-xs
- **Transition**: `transition-all`

**Active State:**
- Background: `white`
- Color: `#2D3330`
- Font Weight: `medium`
- Shadow: `shadow-sm`

**Inactive State:**
- Background: `transparent`
- Color: `#2D3330`

---

## "While You Were Away" Card

### Conditional Display
- Shows when: `isFilled && showUpdateCard && notifications.length > 0`

### Dimensions
- **Margin Bottom**: `mb-4`
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(124, 146, 120, 0.4)` (Sage with transparency)

### Colors
- **Background**: `rgba(122, 146, 120, 0.08)` (Sage 8% opacity)
- **Border**: `rgba(124, 146, 120, 0.4)` (Sage 40% opacity)

### Layout
- **Header**:
  - Display: `flex items-start justify-between`
  - Margin Bottom: `mb-3`
  - Title: text-sm, color #2D3330
  - Close Button: `p-0.5`, hover:bg-white/50, rounded
  - Close Icon: w-3.5 h-3.5, color #2D3330

- **Notification Items**:
  - Space Between: `space-y-2`
  - Each item padding: `p-2` (8px)
  - Border Radius: `rounded-lg`
  - Background: `white`

---

## Dashboard Grid

### Grid Configuration
- **Display**: `grid`
- **Columns**: 
  - Default: `grid-cols-1`
  - Large screens: `lg:grid-cols-3`
- **Gap**: `gap-4` (16px)

### Grid Layout (Desktop - 3 columns)

```
┌─────────────┬─────────────┬─────────────┐
│   Goals     │   Tasks     │  Projects   │
│  (Column 1) │ (Column 2)  │ (Column 3)  │
├─────────────┴─────────────┴─────────────┤
│         Matching (Spans 2 columns)      │ Team/Impact│
│                                         │ (Column 3) │
├─────────────────────────────────────────┴────────────┤
│      Explore Opportunities (Spans 3 columns)         │
└───────────────────────────────────────────────────────┘
```

---

## Card Components

### Standard Card
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl` (12px)
- **Background**: `white`
- **Shadow**: Not explicitly set (defaults to none)

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-3` (12px)

### Card Title (h5)
- **Font**: Inter
- **Size**: text-sm (14px)
- **Color**: `#2D3330`

### Card Actions
- **Button**: `ghost` variant, `sm` size
- **Height**: `h-6` (24px)
- **Padding**: `px-2`
- **Icon**: `Plus`, w-3 h-3

---

## Goals Section Card

### Dimensions
- **Grid Column**: 1 column (1/3 width on desktop)
- **Padding**: `p-4`

### Goal Items
- **Space Between**: `space-y-3` (12px)
- **Separator**: After each item except last
  - Margin Top: `mt-3`
  - Background: `rgba(232, 230, 221, 0.6)`

### Individual Goal Item
- **Display**: `flex items-start gap-2`

#### Goal Content
- **Flex**: `flex-1`
- **Space Y**: `space-y-1.5` (6px between elements)

#### Goal Title
- **Font**: Inter, text-xs
- **Color**: `#2D3330`
- **Line Height**: `leading-tight`

#### Goal Metadata
- **Display**: `flex items-center gap-1.5`
- **Font Size**: text-xs
- **Color**: `#6B6760`
- **Icon**: `Clock`, w-3 h-3

#### Progress Bar
- **Height**: `h-1` (4px)
- **Component**: `<Progress />` from UI library

#### Status Icon (when done)
- **Icon**: `CheckCircle2`, w-3.5 h-3.5
- **Color**: `#1C4D3A` (Forest)
- **Position**: Flex shrink 0, margin-top 0.5

### Empty State
- **Padding**: `py-6` (vertical centering)
- **Text Align**: `text-center`
- **Icon**: `Target`, w-10 h-10, color #E8E6DD
- **Icon Margin**: `mx-auto mb-2`
- **Description**: text-xs, color #6B6760, mb-3
- **Button**: h-7, text-xs, bg #1C4D3A, color #F7F6F1

---

## Tasks Section Card

### Similar Structure to Goals
- **Grid Column**: 1 column (1/3 width on desktop)
- **Padding**: `p-4`

### Task Items
- **Space Between**: `space-y-2` (8px)
- **Display**: `flex items-center gap-2`
- **Padding**: `p-2` (8px)
- **Border Radius**: `rounded-lg`

### Task Item Backgrounds (based on status)
- **Attention**: `rgba(199, 107, 74, 0.08)` (Terracotta 8%)
- **Progress/Done**: `#F7F6F1` (Parchment)

### Task Icons
- **Size**: `w-4 h-4`
- **Flex Shrink**: `0`
- **Colors**:
  - Done: `#1C4D3A` (CheckCircle2)
  - Attention: `#C76B4A` (AlertCircle)
  - Progress: `#6B6760` (Clock)

### Task Text
- **Font**: text-xs
- **Flex**: `flex-1`
- **Color**: `#2D3330`

### "View all" Button
- **Font**: text-xs
- **Width**: `w-full`
- **Text Align**: `text-left`
- **Padding**: `py-1`
- **Display**: `flex items-center gap-1`
- **Color**: `#C76B4A` (Terracotta)
- **Icon**: `ArrowRight`, w-3 h-3

---

## Projects Section Card

### Grid Column
- 1 column (1/3 width on desktop)

### Project Items
- **Space Between**: `space-y-3` (12px)

### Individual Project
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Background**: `white`

### Project Title
- **Font**: text-xs
- **Color**: `#2D3330`
- **Margin Bottom**: `mb-1`

### Project Badge
- **Variant**: `secondary`
- **Font**: text-xs
- **Margin Bottom**: `mb-2`

### Project Progress
- **Height**: `h-1` (4px)

---

## Matching Section Card

### Grid Column
- **Spans**: `lg:col-span-2` (2/3 width on desktop)

### Dimensions
- **Padding**: `p-4`

### Match Cards Container
- **Display**: `flex gap-2`
- **Overflow X**: `overflow-x-auto`
- **Padding Bottom**: `pb-1` (for scrollbar)

### Individual Match Card
- **Flex Shrink**: `0` (flex-shrink-0)
- **Width**: `w-48` (192px fixed width)
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Background**: `white`

### Match Avatar
- **Size**: `w-8 h-8` (32px)
- **Background**: `#E8E6DD`
- **Text Color**: `#2D3330`
- **Font Size**: text-xs (0.7rem for initials)

### Match Name
- **Font**: text-xs
- **Flex**: `flex-1`
- **Overflow**: `truncate`
- **Color**: `#2D3330`

### Match Fit Text
- **Font**: text-xs
- **Color**: `#6B6760`
- **Margin**: `mb-2`

### Match View Button
- **Size**: `sm`
- **Width**: `w-full`
- **Height**: `h-6` (24px)
- **Font**: text-xs
- **Background**: `#1C4D3A`
- **Color**: `#F7F6F1`

---

## Impact Snapshot Section (Individual Only)

### Grid Column
- 1 column (1/3 width on desktop)

### Layout
- **Space Between Items**: `space-y-2` (8px)

### Large Metric Box
- **Text Align**: `text-center`
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Background**: `#F7F6F1`

### Large Metric Value
- **Font Size**: text-2xl (24px)
- **Color**: `#1C4D3A`
- **Margin Bottom**: `mb-0.5`

### Large Metric Label
- **Font Size**: text-xs
- **Color**: `#6B6760`

### Small Metrics Grid
- **Grid**: `grid-cols-2`
- **Gap**: `gap-2` (8px)

### Small Metric Box
- **Text Align**: `text-center`
- **Padding**: `p-2` (8px)
- **Border Radius**: `rounded-lg`
- **Background**: `#F7F6F1`

### Small Metric Value
- **Font Size**: text-lg (18px)
- **Color**: `#1C4D3A` or `#C76B4A` (based on type)

---

## Explore Section

### Grid Column
- **Spans**: `lg:col-span-3` (full width)

### Tab Selector
- **Display**: `flex items-center gap-1`
- **Margin Bottom**: `mb-3`
- **Padding**: `p-0.5`
- **Border Radius**: `rounded-lg`
- **Width**: `w-fit`
- **Background**: `#E8E6DD`

### Tab Buttons
- **Padding**: `px-2.5 py-1`
- **Border Radius**: `rounded`
- **Font**: text-xs
- **Transition**: `transition-all`

**Active Tab:**
- Background: `white`
- Color: `#2D3330`
- Font Weight: `medium`

**Inactive Tab:**
- Background: `transparent`
- Color: `#2D3330`

### Explore Cards Grid
- **Grid**: `grid-cols-4` (4 columns on desktop)
- **Gap**: `gap-3` (12px)

### Explore Card
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Background**: `white`

---

## Typography Scale

### Page Elements
- **Page Title**: Inter, text-base (16px), #2D3330
- **Section Titles (h5)**: Inter, text-sm (14px), #2D3330
- **Card Content**: Inter, text-xs (12px), #2D3330
- **Metadata/Labels**: Inter, text-xs (12px), #6B6760
- **Button Text**: Inter, text-xs (12px)

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (active nav items, tab buttons)
- **Semibold**: 600 (titles, logo text)

### Line Heights
- **Title Text**: `leading-tight` (1.25)
- **Default**: Normal (1.5)

---

## Color Palette

### Backgrounds
- **Page**: `#F7F6F1` (Parchment)
- **Header/Sidebar**: `#FDFCFA` (Off-white)
- **Cards**: `#FFFFFF` (White)
- **Subtle Areas**: `#F7F6F1` (Parchment for metrics)
- **Toggle/Select**: `#E8E6DD` (Stone)

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary**: `#6B6760` (Secondary gray)
- **Muted/Meta**: `#6B6760` (Muted gray)
- **On Dark BG**: `#F7F6F1` (Parchment/white)

### Action Colors
- **Primary Button**: `#1C4D3A` (Forest)
- **Secondary/Accent**: `#C76B4A` (Terracotta)
- **Success**: `#1C4D3A` (Forest - check icons)
- **Attention**: `#C76B4A` (Terracotta - warnings)

### Borders
- **Default**: `rgba(232, 230, 221, 0.6)` (Stone with 60% opacity)
- **Sage Accent**: `rgba(124, 146, 120, 0.4)` (For notification card)

### State Colors
- **Hover**: `bg-[#E8E6DD]/50` (Stone 50% opacity)
- **Active Nav**: `#1C4D3A` (Forest)

---

## Spacing System

### Layout Gaps
- **Grid Gap**: `gap-4` (16px)
- **Card Inner Sections**: `space-y-3` (12px) or `space-y-2` (8px)
- **Between Items**: `gap-2` (8px) to `gap-4` (16px)
- **Page Padding**: `px-4 py-4` (16px)

### Card Padding
- **Standard Card**: `p-4` (16px)
- **Compact Cards**: `p-3` (12px)
- **Nested Items**: `p-2` (8px)

### Element Margins
- **Section Spacing**: `mb-4` (16px)
- **Item Spacing**: `mb-2` or `mb-3` (8px or 12px)

---

## Responsive Behavior

### Desktop (≥1024px)
- **Grid**: 3 columns
- **Sidebar**: Toggleable between 56px and 208px
- **Search Bar**: Visible (256px)
- **Matching Cards**: Horizontal scroll with multiple visible
- **Explore Grid**: 4 columns

### Tablet (768px - 1023px)
- **Grid**: Likely 2 columns (not explicitly defined, would collapse)
- **Sidebar**: Same toggle behavior
- **Search Bar**: Hidden or icon only
- **Matching Cards**: Horizontal scroll
- **Explore Grid**: Fewer columns

### Mobile (<768px)
- **Grid**: 1 column stack (`grid-cols-1`)
- **Sidebar**: Would need drawer/overlay treatment
- **Search Bar**: Hidden (`hidden md:flex`)
- **All Sections**: Stack vertically
- **Horizontal Scrolls**: Maintained

---

## Interactive States

### Buttons
- **Default**: Defined background and color
- **Hover**: `hover:bg-[color]/90` (90% opacity)
- **Active**: `active:bg-[darker]`
- **Disabled**: `disabled:opacity-50 disabled:pointer-events-none`
- **Transition**: `transition-all duration-250`

### Navigation Items
- **Default**: transparent, #2D3330
- **Hover**: `bg-[#E8E6DD]/50`
- **Active**: `bg-[#1C4D3A]`, color #F7F6F1
- **Transition**: `transition-colors`

### Cards (when interactive)
- **Hover**: `hover:shadow-md hover:border-[#1C4D3A]`
- **Transition**: `transition-all`

---

## Accessibility

### Focus Indicators
- **Ring Width**: `ring-[3px]`
- **Ring Color**: `ring-[rgba(28,77,58,0.2)]` (Forest with 20% opacity)
- **Outline**: `outline-none` (replaced by ring)

### Touch Targets
- **Minimum Size**: 32px (h-8) for small buttons, 40px for nav items
- **Icon Buttons**: At least 32x32px

### ARIA & Semantic HTML
- Proper heading hierarchy (h1, h2, h5)
- Button elements for interactive items
- Avatar with fallback content
- Semantic nav element for navigation

---

## Z-Index Layering

- **Page Content**: Base (z-0)
- **Sticky Header**: `z-50`
- **Sidebar**: Below header (default stacking)
- **Tooltips**: `z-10` (on sidebar hover)
- **Dialogs/Modals**: Not shown on this page, but would be z-50+

---

## Animations & Transitions

### Sidebar Toggle
- **Transition**: `transition-all duration-300`
- **Property**: Width change

### Nav Items
- **Transition**: `transition-colors`
- **Duration**: Default (150ms-200ms)

### Buttons
- **Transition**: `transition-all duration-250`
- **Properties**: Background, transform

### Tooltip Reveal
- **Transition**: `transition-opacity`
- **From**: `opacity-0`
- **To**: `opacity-100` on hover

---

## Empty States

Each section has an empty state with:
- **Icon**: w-10 h-10, color #E8E6DD (muted Stone)
- **Margin**: `mx-auto mb-2`
- **Message**: text-xs, color #6B6760
- **Margin Bottom**: `mb-3`
- **Button**: Small CTA button

### Examples
- **Goals**: Target icon, "Show your proofs..."
- **Tasks**: Shield icon, "Build trust through verification..."
- **Projects**: FolderKanban icon, "No active projects yet..."
- **Matching**: Sparkles icon, "Turn on matching..."
- **Impact**: TrendingUp icon, "Track your impact..."
- **Explore**: Briefcase icon, "Discover opportunities..."

---

## Notes for Implementation

1. **State Management**: Dashboard uses React hooks for persona switching and UI state (collapsed sidebar, dialogs, notifications)

2. **Navigation Handler**: `onNavigate` prop allows routing to different views

3. **Demo Features**: Empty/Filled toggle and Persona switcher are for demonstration only—implement only empty states in production

4. **Customization**: Customize button opens a dialog with widget toggles

5. **Data Requirements**: 
   - Goals with progress tracking
   - Tasks with status (attention, progress, done)
   - Projects with role and progress
   - Matches with avatars and fit descriptions
   - Impact metrics
   - Explore data categorized by people/projects/partners

6. **Responsive Images**: Uses dynamic sizing for avatars and icons based on viewport

7. **Performance**: Horizontal scrolling sections use `overflow-x-auto` for performance with many items

---

**Implementation Priority**: HIGH - Primary user landing page

**Related Components**:
- `Card` family from `ui/card.tsx`
- `Button` from `ui/button.tsx`
- `Avatar` from `ui/avatar.tsx`
- `Badge` from `ui/badge.tsx`
- `Progress` from `ui/progress.tsx`
- `Separator` from `ui/separator.tsx`
- `Switch` from `ui/switch.tsx`
- Dialog components for modals

