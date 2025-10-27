# Individual Profile View Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/IndividualProfileView.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Individual Profile View displays a comprehensive overview of an individual user's professional profile, including their bio, expertise atlas, verified proofs, and profile statistics. The layout uses a card-based design with a clear information hierarchy optimized for showcasing credibility and capabilities.

---

## Page Container

- **Max Width**: `max-w-5xl mx-auto` (1024px, centered)
- **Padding**: `px-6 py-8` (24px horizontal, 32px vertical)
- **Background**: Inherited from parent (bg-background)
- **Space Between Sections**: `space-y-8` (32px)

---

## Header Section

### Container
- **Display**: `flex flex-col md:flex-row`
- **Gap**: `gap-6` (24px)
- **Align Items**: `items-start`
- **Responsive**: Stacks vertically on mobile, side-by-side on tablet+

---

### Avatar

- **Component**: Avatar from UI library
- **Size**: `w-24 h-24` (96x96px)
- **Fallback**:
  - Font Size: text-2xl (24px)
  - Background: `#7A9278` (Sage)
  - Text Color: white
  - Content: Initials (first 2 letters from name parts, uppercase)

---

### Profile Info Section

#### Container
- **Flex**: `flex-1`
- **Space Y**: `space-y-4` (16px between elements)

#### Top Row
- **Display**: `flex items-start justify-between`

**Left Side (Name & Tagline):**

**Name (h1):**
- Font Size: text-3xl (30px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330` (Charcoal)
- Content: Full name or "User Profile"

**Tagline (p)** (Conditional, if exists):
- Font Size: text-lg (18px)
- Margin Top: `mt-1` (4px)
- Color: `#6B6760`
- Content: User's tagline

**Right Side:**

**Edit Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2` (8px between icon and text)
- Icon: Edit, w-4 h-4
- Text: "Edit Profile"
- Action: Router push to '/profile/edit'

#### Quick Info Row
- **Display**: `flex flex-wrap gap-4`
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`

**Info Items** (Each if present):

1. **Location**:
   - Icon: MapPin, w-4 h-4
   - Display: `flex items-center gap-1`
   - Content: User's location

2. **Join Date**:
   - Icon: Calendar, w-4 h-4
   - Display: `flex items-center gap-1`
   - Content: "Joined {Month Year}" (e.g., "Joined Jan 2024")

#### Profile Completion Card (Conditional)

**Display**: If `completionPercent < 100`

- **Component**: Card
- **Padding**: `p-4` (16px)
- **Background**: `#F7F6F1` (Parchment)

**Top Row:**
- Display: `flex items-center justify-between`
- Margin Bottom: `mb-2` (8px)

**Label:**
- Font Size: text-sm (14px)
- Font Weight: font-medium (500)
- Color: `#2D3330`
- Content: "Profile Completion"

**Percentage:**
- Font Size: text-sm (14px)
- Font Weight: font-semibold (600)
- Color: `#1C4D3A` (Forest)
- Content: "{percent}%"

**Progress Bar:**
- Component: Progress from UI library
- Value: completionPercent (0-100)
- Height: `h-2` (8px)

**Help Text:**
- Font Size: text-xs (12px)
- Margin Top: `mt-2` (8px)
- Color: `#6B6760`
- Content: "Complete your profile to unlock full matching potential"

---

## Stats Cards Section

### Grid
- **Display**: `grid`
- **Columns**: `grid-cols-1 md:grid-cols-3` (1 on mobile, 3 on tablet+)
- **Gap**: `gap-4` (16px)

### Individual Stat Card

- **Component**: Card
- **Padding**: `p-6` (24px)

#### Layout
- **Display**: `flex items-center gap-3`

**Icon Container:**
- Padding: `p-3` (12px)
- Border Radius: `rounded-lg`
- Background: Color-specific with 10% opacity
  - Card 1 (Proofs): `#7A9278/10` (Sage)
  - Card 2 (Expertise): `#5C8B89/10` (Teal)
  - Card 3 (Matches): `#C76B4A/10` (Terracotta)

**Icon:**
- Size: `w-6 h-6` (24px)
- Color: Matches container background base color
  - Card 1: Shield icon, color #7A9278
  - Card 2: Award icon, color #5C8B89
  - Card 3: Star icon, color #C76B4A

**Content:**

**Value:**
- Font Size: text-2xl (24px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Numeric value

**Label:**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: Stat label
  - "Verified Proofs"
  - "Expertise Areas"
  - "Matches Received"

---

## About Section (Conditional)

**Display**: If `profile.bio` exists

- **Component**: Card
- **Padding**: `p-6` (24px)

**Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-4` (16px)
- Color: `#2D3330`
- Content: "About"

**Bio Text (p):**
- Font Size: text-base (16px)
- Line Height: `leading-relaxed` (1.625)
- Color: `#2D3330`
- Content: User's bio text

---

## Expertise Atlas Section

### Card
- **Component**: Card
- **Padding**: `p-6` (24px)

### Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-6` (24px)

**Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: "Expertise Atlas"

**Add Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2`
- Icon: Plus, w-4 h-4
- Text: "Add Skill"
- Action: Router push to '/profile/expertise'

---

### Expertise List (With Items)

**Display**: If `expertiseAtlas.length > 0`

- **Container**: `space-y-4` (16px between items)
- **Items Shown**: First 5 (slice(0, 5))

#### Individual Expertise Item

**Container:**
- Display: `flex items-start justify-between`
- Padding: `p-4` (16px)
- Border Radius: `rounded-lg`
- Background: `#F7F6F1` (Parchment)

**Left Side (Flex-1):**

**Header Row:**
- Display: `flex items-center gap-2`
- Margin Bottom: `mb-2` (8px)

**Icon:**
- Component: Award
- Size: `w-4 h-4` (16px)
- Color: `#7A9278` (Sage)

**Skill Name (h3):**
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Skill name or "Skill"

**Sub-skills** (Conditional, if exists):
- Display: `flex flex-wrap gap-2`
- Margin Top: `mt-2` (8px)
- Items Shown: First 3 (slice(0, 3))

**Sub-skill Badge:**
- Component: Badge, variant outline
- Font Size: text-xs (12px)
- Content: Sub-skill name

**Right Side (Conditional):**

**Verified Icon** (if proof_links exist and have items):
- Component: CheckCircle2
- Size: `w-5 h-5` (20px)
- Margin Left: `ml-3` (12px)
- Color: `#7A9278` (Sage)

#### View All Button (Conditional)

**Display**: If `expertiseAtlas.length > 5`

- **Variant**: outline
- **Width**: `w-full`
- **Content**: "View All {count} Skills"
- **Action**: Router push to '/profile/expertise'

---

### Empty State (No Expertise)

**Display**: If `expertiseAtlas.length === 0`

#### Container
- **Text Align**: `text-center`
- **Padding Y**: `py-12` (48px)

#### Icon
- **Component**: Award
- **Size**: `w-12 h-12` (48px)
- **Margin**: `mx-auto mb-4` (centered, 16px bottom)
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-lg (18px)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: "No expertise added yet"

#### Description (p)
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Content**: "Add your skills to improve matching accuracy"

#### CTA Button
- **Content**: "Add Your First Skill"
- **Action**: Router push to '/profile/expertise'

---

## Verified Proofs Section

### Card
- **Component**: Card
- **Padding**: `p-6` (24px)

### Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-6` (24px)

**Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: "Verified Proofs"

**Add Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2`
- Icon: Plus, w-4 h-4
- Text: "Add Proof"
- Action: Router push to '/profile/proofs/new'

---

### Proofs List (With Items)

**Display**: If `proofs.length > 0`

- **Container**: `space-y-4` (16px between items)
- **Items Shown**: First 5 (slice(0, 5))

#### Individual Proof Item

**Container:**
- Display: `flex items-start gap-4`
- Padding: `p-4` (16px)
- Border Radius: `rounded-lg`
- Background: `#F7F6F1` (Parchment)

**Icon Container:**
- Padding: `p-2` (8px)
- Border Radius: `rounded-lg`
- Background: white

**Icon** (Conditional based on status):
- **Verified**:
  - Component: CheckCircle2
  - Size: `w-5 h-5` (20px)
  - Color: `#7A9278` (Sage)
- **Not Verified**:
  - Component: Shield
  - Size: `w-5 h-5` (20px)
  - Color: `#C76B4A` (Terracotta)

**Content (Flex-1):**

**Top Row:**
- Display: `flex items-start justify-between`
- Margin Bottom: `mb-1` (4px)

**Claim Text (h3):**
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Claim text or "Claim"

**Status Badge:**
- Component: Badge
- Variant: Conditional
  - verified: 'default'
  - Other: 'outline'
- Font Size: text-xs (12px)
- Content: Verification status or "pending"

**Meta Text (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "{proof_type} • {date}" (formatted date)

#### View All Button (Conditional)

**Display**: If `proofs.length > 5`

- **Variant**: outline
- **Width**: `w-full`
- **Content**: "View All {count} Proofs"
- **Action**: Router push to '/profile/proofs'

---

### Empty State (No Proofs)

**Display**: If `proofs.length === 0`

#### Container
- **Text Align**: `text-center`
- **Padding Y**: `py-12` (48px)

#### Icon
- **Component**: Shield
- **Size**: `w-12 h-12` (48px)
- **Margin**: `mx-auto mb-4`
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-lg (18px)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: "No proofs submitted yet"

#### Description (p)
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Content**: "Build trust by adding verified proofs of your work"

#### CTA Button
- **Content**: "Submit Your First Proof"
- **Action**: Router push to '/profile/proofs/new'

---

## Typography Scale

### Headings
- **H1 (Name)**: Crimson Pro, text-3xl (30px), font-semibold (600), #2D3330
- **H2 (Section Titles)**: Crimson Pro, text-xl (20px), font-semibold (600), #2D3330
- **H3 (Item Titles)**: Inter, font-semibold (600), #2D3330

### Body Text
- **Tagline**: Inter, text-lg (18px), #6B6760
- **Bio**: Inter, text-base (16px), leading-relaxed, #2D3330
- **Meta Text**: Inter, text-sm (14px), #6B6760
- **Labels**: Inter, text-sm (14px), #2D3330
- **Help Text**: Inter, text-xs (12px), #6B6760

### Stats
- **Value**: Crimson Pro, text-2xl (24px), font-semibold (600), #2D3330

### Font Weights
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600

---

## Color Palette

### Backgrounds
- **Page**: Inherited (bg-background)
- **Cards**: white (default Card component)
- **Completion Card**: `#F7F6F1` (Parchment)
- **Expertise Items**: `#F7F6F1` (Parchment)
- **Proof Items**: `#F7F6F1` (Parchment)
- **Icon Containers**: 
  - Proofs: `#7A9278/10` (Sage 10%)
  - Expertise: `#5C8B89/10` (Teal 10%)
  - Matches: `#C76B4A/10` (Terracotta 10%)
  - Proof Icon: white

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary/Meta**: `#6B6760` (Gray)
- **Completion Percent**: `#1C4D3A` (Forest)

### Icon Colors
- **Avatar Fallback**: `#7A9278` (Sage)
- **Verified Proofs**: `#7A9278` (Sage)
- **Expertise Stat**: `#5C8B89` (Teal)
- **Matches Stat**: `#C76B4A` (Terracotta)
- **Unverified Proof**: `#C76B4A` (Terracotta)
- **Expertise Icon**: `#7A9278` (Sage)
- **Empty State Icons**: `#E8E6DD` (Stone)

---

## Spacing System

### Page Level
- **Container Max Width**: 1024px (max-w-5xl)
- **Padding**: 24px horizontal, 32px vertical
- **Section Spacing**: 32px (space-y-8)

### Header Section
- **Avatar to Info**: 24px (gap-6)
- **Info Section Internal**: 16px (space-y-4)

### Stats Grid
- **Between Cards**: 16px (gap-4)

### Cards
- **Padding**: 24px (p-6)
- **Header Margin**: 24px bottom (mb-6)

### Lists
- **Between Items**: 16px (space-y-4)
- **Item Padding**: 16px (p-4)

### Empty States
- **Padding**: 48px vertical (py-12)
- **Icon Margin**: 16px bottom (mb-4)
- **Description Margin**: 16px bottom (mb-4)

---

## Responsive Behavior

### Desktop (≥768px)
- **Header**: Side-by-side (flex-row)
- **Stats**: 3 columns (md:grid-cols-3)
- **All Sections**: Full layout

### Mobile (<768px)
- **Header**: Stacked (flex-col)
- **Stats**: 1 column (grid-cols-1)
- **All Sections**: Stacked vertically
- **Buttons**: May stack or wrap

---

## Interactive States

### Buttons
- **Edit Button**: outline variant with hover
- **Add Buttons**: outline variant
- **View All**: outline variant, full width
- **CTA Buttons**: Primary styling

### Cards
- **Default**: White background, subtle border
- **No Hover**: Static (not clickable)

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **Sections**: Wrapped in semantic elements
- **Buttons**: Proper button elements

### Keyboard Navigation
- **All Buttons**: Keyboard accessible
- **Focus Indicators**: From UI library

### Screen Readers
- **Icons**: Decorative (with meaningful adjacent text)
- **Badges**: Announced with status
- **Empty States**: Descriptive messages

---

## State Management

### Component Props
- **profile**: User profile object
- **proofs**: Array of proof objects
- **expertiseAtlas**: Array of expertise objects

### Computed Values
- **verifiedProofs**: Count of verified proofs
- **totalExpertise**: Count of expertise items
- **completionPercent**: Profile completion percentage

---

## Notes for Implementation

1. **Router Integration**: Uses Next.js router for navigation

2. **Avatar Fallback**: Generates initials from full_name

3. **Conditional Rendering**: Many sections conditional on data presence

4. **Truncated Lists**: Shows first 5 items with "View All" option

5. **Empty States**: Context-aware messages with CTA buttons

6. **Date Formatting**: Uses toLocaleDateString for join date

7. **Profile Completion**: Only shows if <100%

8. **Sub-skills Limit**: Shows first 3 sub-skills per expertise

9. **Proof Status**: Visual indicators (icons and badges)

10. **Navigation Paths**:
    - Edit profile: '/profile/edit'
    - Expertise: '/profile/expertise'
    - Add expertise: '/profile/expertise/new'
    - Proofs: '/profile/proofs'
    - Add proof: '/profile/proofs/new'

---

**Implementation Priority**: HIGH - Core profile feature

**Related Components**:
- Card, Button, Badge, Avatar, Progress, Separator from UI library
- All Lucide icons used
- Next.js router

**Key Features**:
- Profile statistics dashboard
- Expertise preview
- Proofs showcase
- Profile completion indicator
- Empty states with CTAs
- Responsive card layout

