# Organization Dashboard Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `DashboardPage.tsx` (persona='organization')  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Organization Dashboard is the primary landing page for organization users. It focuses on team management, active assignments, candidate pipeline, and organizational impact metrics in a card-based layout optimized for oversight and recruitment needs.

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

**Identical to Individual Dashboard** - See [individual-dashboard.md](./individual-dashboard.md#header-top-bar) for complete specifications.

### Key Differences
- **Page Title**: "Organization Dashboard" instead of "Dashboard"
- **Avatar**: Shows organization logo/initials instead of user avatar

---

## Navigation Sidebar

**Identical structure to Individual Dashboard** with different menu items.

See [individual-dashboard.md](./individual-dashboard.md#navigation-sidebar) for complete structural specifications.

### Organization-Specific Nav Items
1. **Dashboard** (Home icon)
2. **Assignments** (Briefcase icon)
3. **Candidates** (Users icon)
4. **Team** (Users icon, different from Candidates)
5. **Analytics** (BarChart icon)
6. **Settings** (Settings icon)

---

## Main Content Area

### Container
- **Display**: `flex-1`
- **Overflow**: `overflow-y-auto`

### Inner Container
- **Max Width**: `max-w-[1400px]`
- **Margin**: `mx-auto` (centered)
- **Padding**: `px-4 py-4` (16px all around)

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
┌──────────────┬───────────────┬─────────────┐
│ Assignments  │   Pipeline    │ Team Members│
│  (Column 1)  │   (Column 2)  │ (Column 3)  │
├──────────────┴───────────────┴─────────────┤
│     Candidate Matches (Spans 2 columns)    │Team Activity│
│                                            │ (Column 3) │
├────────────────────────────────────────────┴────────────┤
│     Organization Impact (Spans 3 columns)                │
└──────────────────────────────────────────────────────────┘
```

---

## Active Assignments Card

### Grid Column
- 1 column (1/3 width on desktop)

### Dimensions
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl` (12px)
- **Background**: `white`

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-3` (12px)
- **Title (h5)**: text-sm, color #2D3330
- **Add Button**: ghost variant, sm size, h-6, px-2

### Assignment Items
- **Space Between**: `space-y-3` (12px)
- **Separator Between Items**: `mt-3`, bg rgba(232, 230, 221, 0.6)

### Individual Assignment Item
- **Space Y**: `space-y-1.5` (6px between elements)

#### Assignment Title
- **Font**: text-xs
- **Color**: `#2D3330`
- **Line Height**: `leading-tight`

#### Assignment Metadata
- **Display**: `flex items-center gap-1.5`
- **Font**: text-xs
- **Color**: `#6B6760`
- **Icon**: `Users`, w-3 h-3

#### Assignment Progress Bar
- **Height**: `h-1` (4px)
- **Component**: `<Progress />` with value representing applicants/positions

### Empty State
- **Padding**: `py-6` (24px vertical)
- **Text Align**: `text-center`
- **Icon**: `Briefcase`, w-10 h-10, color #E8E6DD
- **Icon Margin**: `mx-auto mb-2`
- **Message**: text-xs, color #6B6760, mb-3
- **CTA Button**: h-7, text-xs, bg #1C4D3A, color #F7F6F1

---

## Candidate Pipeline Card

### Grid Column
- 1 column (1/3 width on desktop)

### Dimensions
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl` (12px)
- **Background**: `white`

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-3`
- **Title**: text-sm, color #2D3330
- **View All Link**: text-xs, color #C76B4A (Terracotta)

### Pipeline Stage Items
- **Space Between**: `space-y-2` (8px)

### Individual Stage Item
- **Display**: `flex items-center gap-2`
- **Padding**: `p-2` (8px)
- **Border Radius**: `rounded-lg`

### Stage Backgrounds (by status)
- **Screening**: `rgba(199, 107, 74, 0.08)` (Terracotta 8%)
- **Interview**: `rgba(28, 77, 58, 0.08)` (Forest 8%)
- **Offer**: `#F7F6F1` (Parchment)

### Stage Icons
- **Size**: `w-4 h-4`
- **Flex Shrink**: `0`
- **Colors by status**:
  - Screening: `#C76B4A` (UserCheck icon)
  - Interview: `#1C4D3A` (Calendar icon)
  - Offer: `#6B6760` (FileText icon)

### Stage Content
- **Flex**: `flex-1`
- **Display**: `flex items-center justify-between`

#### Stage Text
- **Font**: text-xs
- **Color**: `#2D3330`

#### Stage Count Badge
- **Padding**: `px-1.5 py-0.5`
- **Border Radius**: `rounded-full`
- **Background**: `#E8E6DD`
- **Font**: text-xs
- **Color**: `#2D3330`
- **Min Width**: `min-w-[20px]`
- **Text Align**: `text-center`

### Empty State
- **Icon**: `UserCheck`, w-10 h-10, color #E8E6DD
- **Message**: "No candidates in pipeline..."
- **Button**: "View matching candidates", h-7

---

## Team Members Card

### Grid Column
- 1 column (1/3 width on desktop)

### Dimensions
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl`
- **Background**: `white`

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-3`
- **Title**: text-sm, color #2D3330
- **Add Button**: ghost variant, sm size, h-6

### Team Member Items
- **Space Between**: `space-y-2` (8px)

### Individual Team Member
- **Display**: `flex items-center gap-2`
- **Padding**: `p-2` (8px)
- **Border Radius**: `rounded-lg`
- **Background**: `#F7F6F1` (Parchment)

#### Member Avatar
- **Size**: `w-6 h-6` (24px)
- **Background**: `#1C4D3A` (Forest)
- **Text Color**: `#F7F6F1`
- **Font Size**: text-xs (smaller for initials)
- **Flex Shrink**: `0`

#### Member Info
- **Flex**: `flex-1`
- **Display**: `flex flex-col`

##### Member Name
- **Font**: text-xs
- **Color**: `#2D3330`
- **Line Height**: `leading-tight`

##### Member Role
- **Font**: text-xs
- **Color**: `#6B6760`

#### Status Indicator (if active/away)
- **Size**: `w-2 h-2` (8px)
- **Border Radius**: `rounded-full`
- **Colors**:
  - Active: `#7C9278` (Sage - online)
  - Away: `#9B9891` (Muted gray)
- **Flex Shrink**: `0`

### Empty State
- **Icon**: `Users`, w-10 h-10, color #E8E6DD
- **Message**: "No team members yet..."
- **Button**: "Invite team members", h-7

---

## Candidate Matches Card

### Grid Column
- **Spans**: `lg:col-span-2` (2/3 width on desktop)

### Dimensions
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl`
- **Background**: `white`

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-3`
- **Title**: text-sm, color #2D3330
- **View All Link**: text-xs, color #C76B4A

### Match Cards Container
- **Display**: `flex gap-2`
- **Overflow X**: `overflow-x-auto`
- **Padding Bottom**: `pb-1` (for scrollbar)

### Individual Candidate Match Card
- **Flex Shrink**: `0` (flex-shrink-0)
- **Width**: `w-48` (192px fixed width)
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Background**: `white`

#### Candidate Avatar
- **Size**: `w-8 h-8` (32px)
- **Background**: `#E8E6DD`
- **Text Color**: `#2D3330`
- **Font Size**: text-xs (for initials)
- **Margin Bottom**: `mb-2`

#### Candidate Name
- **Font**: text-xs
- **Color**: `#2D3330`
- **Truncate**: `truncate`
- **Margin Bottom**: `mb-0.5`

#### Candidate Role/Skills
- **Font**: text-xs
- **Color**: `#6B6760`
- **Margin Bottom**: `mb-2`

#### Match Score/Fit
- **Display**: `flex items-center gap-1`
- **Margin Bottom**: `mb-2`
- **Icon**: `CheckCircle`, w-3 h-3, color #1C4D3A
- **Text**: text-xs, color #1C4D3A
- **Example**: "95% match for Backend Dev"

#### View Profile Button
- **Size**: `sm`
- **Width**: `w-full`
- **Height**: `h-6` (24px)
- **Font**: text-xs
- **Background**: `#1C4D3A`
- **Color**: `#F7F6F1`

### Empty State
- **Icon**: `Sparkles`, w-10 h-10, color #E8E6DD
- **Message**: "Turn on candidate matching..."
- **Button**: "Enable matching", h-7

---

## Team Activity Card

### Grid Column
- 1 column (1/3 width on desktop)

### Dimensions
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl`
- **Background**: `white`

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-3`
- **Title**: text-sm, color #2D3330

### Activity Items
- **Space Between**: `space-y-2` (8px)

### Individual Activity Item
- **Display**: `flex gap-2`
- **Padding**: `p-2` (8px)
- **Border Radius**: `rounded-lg`
- **Border Left**: `2px solid [status-color]`
- **Background**: `#F7F6F1` (Parchment)

#### Activity Types & Colors
- **Interview scheduled**: `#1C4D3A` (Forest)
- **Application reviewed**: `#C76B4A` (Terracotta)
- **Offer sent**: `#7C9278` (Sage)
- **General**: `#E8E6DD` (Stone)

#### Activity Icon
- **Size**: `w-3 h-3`
- **Color**: Matches border left color
- **Margin Top**: `mt-0.5`
- **Flex Shrink**: `0`

#### Activity Content
- **Flex**: `flex-1`

##### Activity Description
- **Font**: text-xs
- **Color**: `#2D3330`
- **Margin Bottom**: `mb-0.5`

##### Activity Timestamp
- **Font**: text-xs
- **Color**: `#6B6760`

### Empty State
- **Icon**: `Activity`, w-10 h-10, color #E8E6DD
- **Message**: "No recent team activity..."

---

## Organization Impact Section

### Grid Column
- **Spans**: `lg:col-span-3` (full width)

### Dimensions
- **Padding**: `p-4` (16px)
- **Border**: `1px solid rgba(232, 230, 221, 0.6)`
- **Border Radius**: `rounded-xl`
- **Background**: `white`

### Card Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-4` (16px)
- **Title**: text-sm, color #2D3330

### Metrics Grid
- **Grid**: `grid-cols-2 md:grid-cols-4`
- **Gap**: `gap-4` (16px)

### Individual Metric Box
- **Text Align**: `text-center`
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Background**: `#F7F6F1` (Parchment)

#### Metric Icon (optional)
- **Size**: `w-5 h-5`
- **Color**: Based on metric type
- **Margin**: `mx-auto mb-1`

#### Metric Value
- **Font Size**: text-2xl (24px)
- **Font Weight**: font-bold
- **Color**: Varies by metric
  - Total hires: `#1C4D3A` (Forest)
  - Active assignments: `#C76B4A` (Terracotta)
  - Candidates: `#2D3330` (Charcoal)
  - Avg time to hire: `#7C9278` (Sage)
- **Margin Bottom**: `mb-0.5`

#### Metric Label
- **Font**: text-xs
- **Color**: `#6B6760`
- **Line Height**: `leading-tight`

### Change Indicator (optional)
- **Display**: `flex items-center justify-center gap-0.5`
- **Font**: text-xs
- **Margin Top**: `mt-1`
- **Colors**:
  - Positive: `#1C4D3A` (with ArrowUp icon)
  - Negative: `#C76B4A` (with ArrowDown icon)
- **Icon Size**: w-3 h-3

### Empty State
- **Icon**: `TrendingUp`, w-10 h-10, color #E8E6DD
- **Message**: "Track your organization's impact..."
- **Button**: "View analytics", h-7

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
- **Medium**: 500 (active states)
- **Semibold**: 600 (titles)
- **Bold**: 700 (metric values)

### Line Heights
- **Tight**: `leading-tight` (1.25) for titles
- **Normal**: Default (1.5) for body

---

## Color Palette

### Backgrounds
- **Page**: `#F7F6F1` (Parchment)
- **Header/Sidebar**: `#FDFCFA` (Off-white)
- **Cards**: `#FFFFFF` (White)
- **Subtle Areas**: `#F7F6F1` (Parchment for metrics/items)
- **Stage Highlights**: 
  - Screening: `rgba(199, 107, 74, 0.08)` (Terracotta 8%)
  - Interview: `rgba(28, 77, 58, 0.08)` (Forest 8%)

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary**: `#6B6760` (Secondary gray)
- **On Dark BG**: `#F7F6F1` (Parchment/white)

### Action Colors
- **Primary**: `#1C4D3A` (Forest)
- **Secondary/Accent**: `#C76B4A` (Terracotta)
- **Success**: `#7C9278` (Sage)
- **Status Active**: `#7C9278` (Sage - online indicator)

### Borders
- **Default**: `rgba(232, 230, 221, 0.6)` (Stone 60%)
- **Activity Indicators**: Solid colors based on type

---

## Spacing System

### Layout Gaps
- **Grid Gap**: `gap-4` (16px)
- **Card Inner Sections**: `space-y-2` (8px) or `space-y-3` (12px)
- **Between Items**: `gap-2` (8px) typical
- **Page Padding**: `px-4 py-4` (16px)

### Card Padding
- **Standard Card**: `p-4` (16px)
- **Nested Items**: `p-2` (8px) or `p-3` (12px)

### Margins
- **Card Header**: `mb-3` (12px) or `mb-4` (16px)
- **Item Spacing**: `mb-2` (8px)

---

## Responsive Behavior

### Desktop (≥1024px)
- **Grid**: 3 columns
- **Sidebar**: Toggleable (56px ↔ 208px)
- **Search Bar**: Visible (256px)
- **Candidate Matches**: Horizontal scroll
- **Impact Metrics**: 4 columns

### Tablet (768px - 1023px)
- **Grid**: 2 columns
- **Sidebar**: Same toggle
- **Candidate Matches**: Horizontal scroll
- **Impact Metrics**: 2 columns (md:grid-cols-4)

### Mobile (<768px)
- **Grid**: 1 column stack
- **Sidebar**: Drawer/overlay
- **Search Bar**: Hidden
- **Impact Metrics**: 2 columns
- **All sections**: Stack vertically

---

## Interactive States

### Buttons
- **Hover**: `hover:bg-[color]/90` (90% opacity)
- **Active**: `active:bg-[darker]`
- **Disabled**: `disabled:opacity-50`
- **Transition**: `transition-all duration-250`

### Cards (when clickable)
- **Hover**: `hover:shadow-md hover:border-[#1C4D3A]`
- **Transition**: `transition-all`

### Links
- **Default**: Color based on context
- **Hover**: `hover:underline`

---

## Accessibility

### Focus Indicators
- **Ring**: `ring-[3px]`
- **Color**: `ring-[rgba(28,77,58,0.2)]` (Forest 20%)

### Touch Targets
- **Minimum**: 32px (h-8) for small elements, 40px for nav
- **Avatar Buttons**: 24px+ (w-6 h-6 or larger)

### Semantic HTML
- Proper heading hierarchy
- Button elements for actions
- Semantic nav for navigation
- ARIA labels where needed

---

## Z-Index Layering

- **Page Content**: Base (z-0)
- **Sticky Header**: `z-50`
- **Sidebar**: Default stacking
- **Tooltips**: `z-10`

---

## Animations & Transitions

### Sidebar Toggle
- **Transition**: `transition-all duration-300`
- **Property**: Width

### Buttons & Interactive Elements
- **Transition**: `transition-all duration-250`
- **Properties**: Background, color, transform

### Hover Effects
- **Transition**: `transition-colors` or `transition-all`
- **Duration**: 150-250ms

---

## Empty States

Each section includes contextual empty states:

- **Assignments**: Briefcase icon, "Post your first assignment..."
- **Pipeline**: UserCheck icon, "No candidates in pipeline..."
- **Team**: Users icon, "Invite team members..."
- **Matches**: Sparkles icon, "Enable candidate matching..."
- **Activity**: Activity icon, "No recent activity..."
- **Impact**: TrendingUp icon, "Track your impact..."

All empty states follow the same pattern:
- **Icon**: w-10 h-10, color #E8E6DD
- **Message**: text-xs, color #6B6760
- **CTA Button**: h-7, text-xs, primary action color

---

## Notes for Implementation

1. **Organization Context**: All data should be scoped to the organization's ID

2. **Team Management**: Requires role-based permissions (admin, recruiter, member)

3. **Candidate Pipeline**: Should update in real-time as candidates progress through stages

4. **Activity Feed**: Consider real-time updates via WebSocket or polling

5. **Data Requirements**:
   - Active assignments with applicant counts
   - Candidate pipeline stages with counts
   - Team members with roles and status
   - Matched candidates with scores
   - Team activity events with timestamps
   - Organization-wide impact metrics

6. **Assignment Filtering**: May need tabs/filters for active/draft/closed assignments

7. **Candidate Actions**: Cards should be clickable to view full candidate profiles

8. **Activity Types**: Support multiple activity event types with appropriate icons and colors

9. **Metrics Calculation**: Impact metrics should calculate dynamically from database

10. **Performance**: Use pagination/virtual scrolling for long lists, horizontal scroll for matches

---

**Implementation Priority**: HIGH - Primary organization landing page

**Related Components**:
- All shared components from Individual Dashboard
- Additional: Status indicators, activity timeline items
- Consider: Real-time updates for pipeline and activity

**Key Differences from Individual Dashboard**:
- Focus on team and recruitment metrics
- Pipeline stages instead of personal goals
- Candidate matching instead of peer matching
- Team activity feed instead of personal tasks
- Organization-level impact metrics

