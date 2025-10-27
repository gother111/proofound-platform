# Organization Profile View Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/OrganizationProfileView.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Organization Profile View displays a comprehensive overview of an organization account, including mission, impact areas, active assignments, team size, and verified credentials. The layout emphasizes organizational credibility and active opportunities, optimized for recruiting and establishing trust.

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
  - Background: `#C76B4A` (Terracotta - organization color)
  - Text Color: white
  - Content: Initials (first 2 letters from name parts, uppercase, or "ORG")

---

### Profile Info Section

#### Container
- **Flex**: `flex-1`
- **Space Y**: `space-y-4` (16px between elements)

#### Top Row
- **Display**: `flex items-start justify-between`

**Left Side (Organization Info):**

**Name (h1):**
- Font Size: text-3xl (30px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330` (Charcoal)
- Content: Organization name or "Organization Name"

**Tagline (p)** (Conditional, if exists):
- Font Size: text-lg (18px)
- Margin Top: `mt-1` (4px)
- Color: `#6B6760`
- Content: Organization's tagline

**Badges Row:**
- Display: `flex items-center gap-2`
- Margin Top: `mt-2` (8px)

**Organization Type Badge:**
- Component: Badge, variant outline
- Gap: `gap-1` (4px between icon and text)
- Icon: Building2, w-3 h-3
- Text: "Organization"

**Verified Badge** (Conditional, if verification_status='verified'):
- Component: Badge
- Gap: `gap-1`
- Background: `#7A9278` (Sage)
- Text Color: white
- Icon: CheckCircle2, w-3 h-3
- Text: "Verified"

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
   - Content: Organization's location

2. **Join Date**:
   - Icon: Calendar, w-4 h-4
   - Display: `flex items-center gap-1`
   - Content: "Joined {Month Year}"

3. **Website Link** (if exists):
   - Tag: `<a>` with target="_blank" rel="noopener noreferrer"
   - Display: `flex items-center gap-1`
   - Hover: `hover:text-[#1C4D3A] transition-colors`
   - Icon: Globe, w-4 h-4
   - Text: "Website"
   - External Icon: ExternalLink, w-3 h-3
   - Content: Links to organization's website

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
  - Card 1 (Assignments): `#C76B4A/10` (Terracotta)
  - Card 2 (Team): `#7A9278/10` (Sage)
  - Card 3 (Credentials): `#5C8B89/10` (Teal)

**Icon:**
- Size: `w-6 h-6` (24px)
- Color: Matches container background base color
  - Card 1: Briefcase icon, color #C76B4A
  - Card 2: Users icon, color #7A9278
  - Card 3: Award icon, color #5C8B89

**Content:**

**Value:**
- Font Size: text-2xl (24px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Numeric value
  - assignments_count (default 0)
  - team size (admin_ids.length, default 0)
  - verified proofs count

**Label:**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: Stat label
  - "Active Assignments"
  - "Team Members"
  - "Verified Credentials"

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
- Content: Organization's bio text

---

## Mission & Impact Section

### Card
- **Component**: Card
- **Padding**: `p-6` (24px)

**Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-4` (16px)
- Color: `#2D3330`
- Content: "Mission & Impact"

### Content Container
- **Space Y**: `space-y-4` (16px between subsections)

---

#### Mission Subsection (Conditional)

**Display**: If `profile.mission` exists

**Container:**
- Individual `<div>`

**Subtitle (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330`
- Content: "Our Mission"

**Mission Text (p):**
- Font Size: text-sm (14px)
- Line Height: `leading-relaxed`
- Color: `#6B6760`
- Content: Organization's mission statement

---

#### Impact Areas Subsection (Conditional)

**Display**: If `profile.impact_areas` exists and has items

**Container:**
- Individual `<div>`

**Subtitle (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330`
- Content: "Impact Areas"

**Badges Container:**
- Display: `flex flex-wrap gap-2`

**Impact Area Badge:**
- Component: Badge, variant outline
- Font Size: text-sm (14px)
- Content: Impact area name

---

## Active Assignments Section

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
- Content: "Active Assignments"

**Post Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2`
- Icon: Plus, w-4 h-4
- Text: "Post Assignment"
- Action: Router push to '/assignments/new'

---

### Content (With Assignments)

**Display**: If `profile.assignments_count > 0`

**Container:**
- Space Y: `space-y-4` (16px between elements)

**Count Text (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "You have {count} active assignment{s}."

**View All Button:**
- Variant: outline
- Width: `w-full`
- Content: "View All Assignments"
- Action: Router push to '/assignments'

---

### Empty State (No Assignments)

**Display**: If `profile.assignments_count === 0` or not exists

#### Container
- **Text Align**: `text-center`
- **Padding Y**: `py-12` (48px)

#### Icon
- **Component**: Briefcase
- **Size**: `w-12 h-12` (48px)
- **Margin**: `mx-auto mb-4`
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-lg (18px)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: "No active assignments"

#### Description (p)
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Content**: "Post your first assignment to find verified experts"

#### CTA Button
- **Content**: "Post Your First Assignment"
- **Action**: Router push to '/assignments/new'

---

## Credentials & Verification Section

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
- Content: "Credentials & Verification"

**Add Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2`
- Icon: Plus, w-4 h-4
- Text: "Add Credential"
- Action: Router push to '/profile/proofs/new'

---

### Credentials List (With Items)

**Display**: If `proofs.length > 0`

- **Container**: `space-y-4` (16px between items)
- **Items Shown**: First 3 (slice(0, 3))

#### Individual Credential Item

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
  - Component: Award
  - Size: `w-5 h-5` (20px)
  - Color: `#C76B4A` (Terracotta)

**Content (Flex-1):**

**Top Row:**
- Display: `flex items-start justify-between`
- Margin Bottom: `mb-1` (4px)

**Claim Text (h3):**
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Claim text or "Credential"

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

**Display**: If `proofs.length > 3`

- **Variant**: outline
- **Width**: `w-full`
- **Content**: "View All {count} Credentials"
- **Action**: Router push to '/profile/proofs'

---

### Empty State (No Credentials)

**Display**: If `proofs.length === 0`

#### Container
- **Text Align**: `text-center`
- **Padding Y**: `py-12` (48px)

#### Icon
- **Component**: Award
- **Size**: `w-12 h-12` (48px)
- **Margin**: `mx-auto mb-4`
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-lg (18px)
- **Font Weight**: font-semibold (600)
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: "No credentials added yet"

#### Description (p)
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Color**: `#6B6760`
- **Content**: "Build trust by adding verified credentials"

#### CTA Button
- **Content**: "Add Your First Credential"
- **Action**: Router push to '/profile/proofs/new'

---

## Typography Scale

### Headings
- **H1 (Name)**: Crimson Pro, text-3xl (30px), font-semibold (600), #2D3330
- **H2 (Section Titles)**: Crimson Pro, text-xl (20px), font-semibold (600), #2D3330
- **H3 (Subsection/Item Titles)**: Inter, font-semibold (600), #2D3330

### Body Text
- **Tagline**: Inter, text-lg (18px), #6B6760
- **Bio/Mission**: Inter, text-base (16px) or text-sm (14px), leading-relaxed, #2D3330 or #6B6760
- **Meta Text**: Inter, text-sm (14px), #6B6760
- **Labels**: Inter, text-sm (14px), #6B6760
- **Empty State Description**: Inter, text-sm (14px), #6B6760

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
- **Credential Items**: `#F7F6F1` (Parchment)
- **Icon Containers**: 
  - Assignments: `#C76B4A/10` (Terracotta 10%)
  - Team: `#7A9278/10` (Sage 10%)
  - Credentials: `#5C8B89/10` (Teal 10%)
  - Credential Icon: white

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary/Meta**: `#6B6760` (Gray)
- **Link Hover**: `#1C4D3A` (Forest)

### Icon Colors
- **Avatar Fallback**: `#C76B4A` (Terracotta - org color)
- **Assignment Stat**: `#C76B4A` (Terracotta)
- **Team Stat**: `#7A9278` (Sage)
- **Credentials Stat**: `#5C8B89` (Teal)
- **Verified Badge BG**: `#7A9278` (Sage)
- **Verified Check**: `#7A9278` (Sage)
- **Unverified Credential**: `#C76B4A` (Terracotta)
- **Empty State Icons**: `#E8E6DD` (Stone)

### Badge Colors
- **Organization Type**: outline variant (border with transparent bg)
- **Verified**: `#7A9278` background, white text
- **Impact Areas**: outline variant
- **Status**: Conditional (default or outline)

---

## Spacing System

### Page Level
- **Container Max Width**: 1024px (max-w-5xl)
- **Padding**: 24px horizontal, 32px vertical
- **Section Spacing**: 32px (space-y-8)

### Header Section
- **Avatar to Info**: 24px (gap-6)
- **Info Section Internal**: 16px (space-y-4)
- **Tagline Margin**: 4px top (mt-1)
- **Badges Margin**: 8px top (mt-2)
- **Badges Gap**: 8px (gap-2)

### Stats Grid
- **Between Cards**: 16px (gap-4)

### Cards
- **Padding**: 24px (p-6)
- **Header Margin**: 24px bottom (mb-6)
- **Title Margin**: 16px bottom (mb-4)

### Mission & Impact
- **Subsection Spacing**: 16px (space-y-4)
- **Subtitle Margin**: 8px bottom (mb-2)
- **Badges Gap**: 8px (gap-2)

### Lists
- **Between Items**: 16px (space-y-4)
- **Item Padding**: 16px (p-4)
- **Icon Container Padding**: 8px (p-2)
- **Item Gap**: 16px (gap-4)

### Empty States
- **Padding**: 48px vertical (py-12)
- **Icon Margin**: 16px bottom (mb-4)
- **Title Margin**: 8px bottom (mb-2)
- **Description Margin**: 16px bottom (mb-4)

---

## Responsive Behavior

### Desktop (≥768px)
- **Header**: Side-by-side (md:flex-row)
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
- **Post/Add Buttons**: outline variant
- **View All**: outline variant, full width
- **CTA Buttons**: Primary styling

### Links
- **Website Link**: Hover changes color to Forest (#1C4D3A)
- **Transition**: transition-colors

### Cards
- **Default**: White background, subtle border
- **No Hover**: Static (not clickable)

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h2 → h3)
- **Sections**: Wrapped in semantic elements
- **Buttons**: Proper button elements
- **Links**: External links with target="_blank" rel="noopener noreferrer"

### Keyboard Navigation
- **All Buttons**: Keyboard accessible
- **External Links**: Tab-navigable
- **Focus Indicators**: From UI library

### Screen Readers
- **Icons**: Decorative (with meaningful adjacent text)
- **Badges**: Announced with status
- **Empty States**: Descriptive messages
- **External Links**: Icon indicates new tab

---

## State Management

### Component Props
- **profile**: Organization profile object
- **proofs**: Array of proof objects

### Computed Values
- **verifiedProofs**: Count of verified proofs (filtered)
- **teamSize**: Length of admin_ids array (default 0)

---

## Notes for Implementation

1. **Organization Color**: Avatar uses Terracotta (#C76B4A) vs Sage for individuals

2. **Verification Badge**: Only shows if organization is verified

3. **Website Link**: Opens in new tab with proper security attributes

4. **Stats**:
   - Assignments from profile.assignments_count
   - Team size from admin_ids array
   - Credentials from filtered proofs

5. **Conditional Sections**:
   - Bio: Only if exists
   - Mission: Only if exists
   - Impact Areas: Only if exists and has items

6. **Truncated Lists**: Shows first 3 credentials with "View All" option

7. **Empty States**: Context-aware messages with CTA buttons

8. **Date Formatting**: Uses toLocaleDateString for join date

9. **Router Navigation**:
   - Edit profile: '/profile/edit'
   - Post assignment: '/assignments/new'
   - View assignments: '/assignments'
   - Add credential: '/profile/proofs/new'
   - View credentials: '/profile/proofs'

10. **Impact Areas**: Displayed as outline badges, comma-separated sources

---

**Implementation Priority**: HIGH - Core organization feature

**Related Components**:
- Card, Button, Badge, Avatar, Separator from UI library
- All Lucide icons used
- Next.js router

**Key Features**:
- Organization-specific stats
- Mission and impact display
- Active assignments overview
- Credentials showcase
- Empty states with CTAs
- Verification indicators
- External website link

