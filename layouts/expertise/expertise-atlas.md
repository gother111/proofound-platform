# Expertise Atlas Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/ExpertiseAtlas.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Expertise Atlas is an innovative skill mapping interface that moves beyond traditional CVs. It organizes skills into six cognitive-science-based categories and requires proof artifacts for each claim. The page features animated backgrounds, collapsible information sections, and comprehensive skill management.

---

## Page Container

- **Min Height**: `min-h-screen`
- **Background**: `#F7F6F1` (Parchment)

---

## Animated Background Layer

### Container
- **Position**: `fixed inset-0`
- **Opacity**: `opacity-30`
- **Pointer Events**: `pointer-events-none` (non-interactive decoration)

### SVG Background
- **Size**: `w-full h-full`

#### Gradient Definition
- **ID**: "bg-gradient"
- **Direction**: x1="0%" y1="0%" x2="100%" y2="100%" (diagonal)

**Gradient Stops:**
1. **0%**: `#1C4D3A` (Forest), opacity 0.1
2. **50%**: `#C76B4A` (Terracotta), opacity 0.05
3. **100%**: `#5F8C6F` (Sage variant), opacity 0.1

#### Animated Circles (Framer Motion)

**Circle 1 (Top-Left):**
- Initial Position: cx="20%", cy="30%"
- Radius: r="300"
- Fill: `#1C4D3A` (Forest)
- Opacity: 0.03
- Animation:
  - cx: ['20%', '25%', '20%']
  - cy: ['30%', '35%', '30%']
  - Duration: 20s
  - Repeat: Infinity
  - Easing: easeInOut

**Circle 2 (Bottom-Right):**
- Initial Position: cx="80%", cy="70%"
- Radius: r="250"
- Fill: `#C76B4A` (Terracotta)
- Opacity: 0.03
- Animation:
  - cx: ['80%', '75%', '80%']
  - cy: ['70%', '65%', '70%']
  - Duration: 25s
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
- **Space Y**: `space-y-6` (24px between elements)

---

### Top Row

#### Container
- **Display**: `flex items-start justify-between gap-6`

#### Left Side
**Title (h1):**
- Font Size: text-4xl (36px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330` (Charcoal)
- Content: "Expertise Atlas"

**Subtitle (p):**
- Font Size: text-lg (18px)
- Color: `#6B6760`
- Content: "Map your capabilities with proof—individuals and organizations"

#### Right Side
**Add Skill Button:**
- Background: `#1C4D3A` (Forest)
- Hover: `hover:bg-[#1C4D3A]/90`
- Text Color: white
- Gap: `gap-2` (8px)
- Icon: Plus, w-4 h-4
- Text: "Add Skill"
- Action: handleAddSkill (router push to '/profile/expertise/new')

---

### Progress Card

- **Component**: Card
- **Padding**: `p-6` (24px)
- **Background**: `bg-gradient-to-br from-[#1C4D3A]/5 to-[#C76B4A]/5` (gradient from Forest to Terracotta, each 5%)

#### Top Row
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-4` (16px)

**Left Side:**

**Title (h3):**
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: "Atlas Completion"

**Description (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "{verifiedSkills} of {totalSkills} skills verified"

**Right Side:**

**Percentage Display:**
- Font Size: text-3xl (30px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-bold (700)
- Color: `#1C4D3A` (Forest)
- Content: "{percent}%"

#### Progress Bar
- **Component**: Progress from UI library
- **Value**: completionPercentage (0-100)
- **Height**: `h-3` (12px)

---

### About Section (Collapsible)

#### Card Container
- **Component**: Card
- **Padding**: `p-6` (24px)
- **Background**: `bg-gradient-to-br from-[#1C4D3A]/5 to-[#C76B4A]/5`
- **Border**: `border border-[#1C4D3A]/20` (Forest with 20% opacity)

#### Collapsible Trigger

**Button:**
- Variant: ghost
- Width: `w-full`
- Display: `flex items-center justify-between`
- Padding: `p-0`
- Hover: `hover:bg-transparent`

**Title (h3):**
- Font Size: text-lg (18px)
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: "About Expertise Atlas"

**Toggle Icon** (Conditional):
- **Collapsed**: ChevronDown, w-5 h-5
- **Expanded**: ChevronUp, w-5 h-5
- **Color**: `#2D3330`

#### Collapsible Content

**Container:**
- Margin Top: `mt-6` (24px)
- Space Y: `space-y-6` (24px)

**Introduction Text (p):**
- Color: `#2D3330`
- Content: Mission statement about improving CV standards

**Feature Cards Grid:**
- Grid: `grid-cols-1 md:grid-cols-2` (1 on mobile, 2 on tablet+)
- Gap: `gap-4` (16px)

---

### Feature Card (4 cards)

**Container:**
- Component: Card
- Padding: `p-5` (20px)

**Icon Container:**
- Size: `w-10 h-10` (40px)
- Border Radius: `rounded-xl` (12px)
- Background: Color-specific with 10% opacity
- Display: `flex items-center justify-center`
- Margin Bottom: `mb-3` (12px)

**Icon:**
- Size: `w-5 h-5` (20px)
- Color: Matches container background

**Feature Cards:**

1. **Scientific Research Base**:
   - Icon: Microscope
   - Icon Background: `#1C4D3A/10` (Forest)
   - Icon Color: `#1C4D3A`
   - Content: About cognitive science foundation

2. **Proof Artifacts**:
   - Icon: FileCheck
   - Icon Background: `#C76B4A/10` (Terracotta)
   - Icon Color: `#C76B4A`
   - Content: About artifact requirements

3. **Verification Layer**:
   - Icon: ShieldCheck
   - Icon Background: `#5F8C6F/10` (Sage variant)
   - Icon Color: `#5F8C6F`
   - Content: About external verification

4. **Seniority to Expertise**:
   - Icon: TrendingUp
   - Icon Background: `#D4A574/10` (Ochre)
   - Icon Color: `#D4A574`
   - Content: About expertise mapping

**Title (h4):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330`

**Description (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`

---

## Skill Categories Section

### Container
- **Space Y**: `space-y-6` (24px between category cards)

### Skill Categories (6 total)

**Categories:**
1. **Cognitive** (🧠): `#7A9278` (Sage)
2. **Interpersonal** (🤝): `#C76B4A` (Terracotta)
3. **Technical** (⚙️): `#5C8B89` (Teal)
4. **Creative** (🎨): `#D4A574` (Ochre)
5. **Leadership** (👥): `#8B9556` (Olive)
6. **Specialized** (🎯): `#B5695C` (Rust)

---

### Category Card

**Container:**
- Component: Card
- Padding: `p-6` (24px)

#### Category Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-6` (24px)

**Left Side:**
- Display: `flex items-center gap-3`

**Icon Container:**
- Size: `w-12 h-12` (48px)
- Border Radius: `rounded-xl` (12px)
- Display: `flex items-center justify-center`
- Font Size: text-2xl (24px - for emoji)
- Background: Category color with 20% opacity (e.g., `#7A9278` + "20")

**Category Info:**

**Name (h3):**
- Font Size: text-xl (20px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330`

**Count (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "{count} skills" or "{count} skill"

**Right Side:**

**Add Button:**
- Variant: outline
- Size: sm
- Gap: `gap-2`
- Icon: Plus, w-4 h-4
- Text: "Add"
- Action: handleAddSkill

---

### Skills List (With Skills)

**Display**: If `categorySkills.length > 0`

**Container:**
- Space Y: `space-y-4` (16px between skills)

---

### Individual Skill Card

**Container:**
- Padding: `p-4` (16px)
- Border Radius: `rounded-lg`
- Background: `#FDFCFA` (Off-white)

#### Top Row
- **Display**: `flex items-start justify-between`
- **Margin Bottom**: `mb-3` (12px)

**Left Side (Flex-1):**

**Header Row:**
- Display: `flex items-center gap-2`
- Margin Bottom: `mb-2` (8px)

**Skill Name (h4):**
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Content: Skill name

**Verified Icon** (Conditional, if status='verified'):
- Component: CheckCircle2
- Size: `w-4 h-4` (16px)
- Color: `#7A9278` (Sage)

**Proficiency Badge** (Conditional, if proficiency_level exists):
- Component: Badge, variant outline
- Margin Bottom: `mb-2` (8px)
- Content: "Level {level}"

**Description** (Conditional, if exists):
- Font Size: text-sm (14px)
- Margin Top: `mt-2` (8px)
- Color: `#6B6760`
- Content: Skill description

**Right Side:**

**Action Buttons:**
- Display: `flex items-center gap-2`
- Margin Left: `ml-4` (16px)

**Edit Button:**
- Variant: ghost
- Size: sm
- Icon: Edit, w-4 h-4
- Action: handleEditSkill(skillId)

**Delete Button:**
- Variant: ghost
- Size: sm
- Icon: Trash2, w-4 h-4
- Action: handleDeleteSkill(skillId)

---

#### Sub-skills Section (Conditional)

**Display**: If `skill.sub_skills` exists and has items

**Container:**
- Display: `flex flex-wrap gap-2`
- Margin Bottom: `mb-3` (12px)

**Sub-skill Badge:**
- Component: Badge, variant outline
- Font Size: text-xs (12px)
- Content: Sub-skill name

---

#### Linked Proofs Section (Conditional)

**Display**: If `linkedProofs.length > 0`

**Container:**
- Margin Top: `mt-3` (12px)
- Padding Top: `pt-3` (12px)
- Border Top: `border-t`, color `#E8E6DD` (Stone)

**Header:**
- Display: `flex items-center gap-2`
- Margin Bottom: `mb-2` (8px)

**Icon:**
- Component: Award
- Size: `w-4 h-4` (16px)
- Color: `#7A9278` (Sage)

**Label:**
- Font Size: text-sm (14px)
- Font Weight: font-medium (500)
- Color: `#2D3330`
- Content: "Linked Proofs"

**Proofs List:**
- Space Y: `space-y-2` (8px between proofs)

**Individual Proof:**
- Display: `flex items-center gap-2`
- Font Size: text-sm (14px)

**Check Icon:**
- Component: CheckCircle2
- Size: `w-3 h-3` (12px)
- Color: `#7A9278` (Sage)

**Claim Text:**
- Color: `#2D3330`
- Content: Proof claim text

**External Link** (Conditional, if proof_url exists):
- Tag: `<a>` with proper attributes
- Target: _blank
- Rel: noopener noreferrer
- Margin Left: `ml-auto` (pushed to right)
- Icon: ExternalLink, w-3 h-3, color #6B6760

---

### Empty State (No Skills in Category)

**Display**: If `categorySkills.length === 0`

**Container:**
- Text Align: `text-center`
- Padding Y: `py-8` (32px)

**Message (p):**
- Font Size: text-sm (14px)
- Margin Bottom: `mb-4` (16px)
- Color: `#6B6760`
- Content: "No skills in this category yet"

**CTA Button:**
- Variant: outline
- Action: handleAddSkill
- Content: "Add Your First {CategoryName} Skill"

---

## Typography Scale

### Headings
- **H1 (Page Title)**: Crimson Pro, text-4xl (36px), font-semibold (600), #2D3330
- **H2**: (Not used)
- **H3 (Section/Category)**: Crimson Pro, text-xl (20px), font-semibold (600), #2D3330
- **H3 (Progress Title)**: Inter, font-semibold (600), #2D3330
- **H3 (About Title)**: Inter, text-lg (18px), font-semibold (600), #2D3330
- **H4 (Feature/Skill)**: Inter, font-semibold (600), #2D3330

### Body Text
- **Subtitle**: Inter, text-lg (18px), #6B6760
- **Description**: Inter, text-sm (14px), #6B6760
- **About Content**: Inter, #2D3330
- **Progress Count**: Inter, text-sm, #6B6760

### Stats
- **Completion Percent**: Crimson Pro, text-3xl (30px), font-bold (700), #1C4D3A

### Font Weights
- **Semibold**: 600 (titles, skill names)
- **Bold**: 700 (completion percentage)
- **Medium**: 500 (linked proofs label)

---

## Color Palette

### Page
- **Background**: `#F7F6F1` (Parchment)

### Animated Background
- **Gradient Stop 1**: `#1C4D3A` (Forest), 10% opacity
- **Gradient Stop 2**: `#C76B4A` (Terracotta), 5% opacity
- **Gradient Stop 3**: `#5F8C6F` (Sage variant), 10% opacity
- **Animated Circles**: Forest and Terracotta at 3% opacity

### Cards
- **Main Cards**: white (default)
- **Progress Card**: Gradient from Forest/5 to Terracotta/5
- **About Card**: Gradient from Forest/5 to Terracotta/5
- **About Border**: Forest with 20% opacity
- **Feature Cards**: white
- **Category Cards**: white
- **Skill Cards**: `#FDFCFA` (Off-white)

### Category Colors (for icon backgrounds)
- **Cognitive**: `#7A9278` (Sage)
- **Interpersonal**: `#C76B4A` (Terracotta)
- **Technical**: `#5C8B89` (Teal)
- **Creative**: `#D4A574` (Ochre)
- **Leadership**: `#8B9556` (Olive)
- **Specialized**: `#B5695C` (Rust)

### Text
- **Primary**: `#2D3330` (Charcoal)
- **Secondary**: `#6B6760` (Gray)
- **Completion**: `#1C4D3A` (Forest)

### Icons
- **Verified Check**: `#7A9278` (Sage)
- **Award**: `#7A9278` (Sage)
- **External Link**: `#6B6760`

### Borders
- **Separator**: `#E8E6DD` (Stone)
- **About Card Border**: `#1C4D3A/20` (Forest 20%)

---

## Spacing System

### Page Level
- **Max Width**: 1280px (max-w-7xl)
- **Padding**: 24px horizontal, 48px vertical
- **Content Spacing**: 32px (space-y-8)

### Header Section
- **Section Spacing**: 24px (space-y-6)
- **Top Row Gap**: 24px (gap-6)
- **Title Margin**: 8px bottom (mb-2)

### Progress Card
- **Padding**: 24px (p-6)
- **Top Row Margin**: 16px bottom (mb-4)

### About Section
- **Card Padding**: 24px (p-6)
- **Content Margin**: 24px top (mt-6)
- **Content Spacing**: 24px (space-y-6)
- **Grid Gap**: 16px (gap-4)

### Feature Cards
- **Padding**: 20px (p-5)
- **Icon Margin**: 12px bottom (mb-3)
- **Title Margin**: 8px bottom (mb-2)

### Category Cards
- **Padding**: 24px (p-6)
- **Header Margin**: 24px bottom (mb-6)
- **Icon Container**: 48px (w-12 h-12)
- **Header Gap**: 12px (gap-3)
- **Skills Spacing**: 16px (space-y-4)

### Skill Cards
- **Padding**: 16px (p-4)
- **Top Row Margin**: 12px bottom (mb-3)
- **Header Row Margin**: 8px bottom (mb-2)
- **Description Margin**: 8px top (mt-2)
- **Sub-skills Margin**: 12px bottom (mb-3)
- **Proofs Section**: 12px top margin, 12px top padding (mt-3 pt-3)

### Empty States
- **Padding**: 32px vertical (py-8)
- **Message Margin**: 16px bottom (mb-4)

---

## Responsive Behavior

### Desktop (≥768px)
- **About Grid**: 2 columns (md:grid-cols-2)
- **All Sections**: Full layout

### Mobile (<768px)
- **About Grid**: 1 column (grid-cols-1)
- **Header**: May wrap buttons
- **Skill Actions**: May need adjustment

---

## Interactive States

### Buttons
- **Primary (Add Skill)**: bg Forest, hover Forest/90
- **Outline**: Border with transparent background
- **Ghost**: Minimal styling
- **Hover**: Standard hover states

### Collapsible
- **Trigger**: Chevron rotates (Up/Down based on state)
- **Content**: Smooth expand/collapse animation

### Cards
- **Skill Cards**: Not interactive (contain buttons)
- **No Hover Effects**: Static

---

## Animations

### Background
- **Gradient**: Static
- **Circles**: Infinite loop animations (20s and 25s)
- **Movement**: Subtle position changes (5% radius)
- **Easing**: easeInOut for smooth motion

### Collapsible
- **Content**: Smooth height animation (from UI library)

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 → h3 → h4)
- **Sections**: Wrapped in semantic elements
- **Buttons**: Proper button elements
- **Links**: External links with proper attributes

### Keyboard Navigation
- **Collapsible**: Keyboard accessible trigger
- **All Buttons**: Focusable and activatable
- **External Links**: Tab-navigable

### Screen Readers
- **Icon Emojis**: Decorative (with text labels)
- **Icons**: Meaningful adjacent text
- **External Link**: Should have ARIA label (TODO)

### Focus Management
- **All Interactive**: Should have visible focus indicators

---

## State Management

### Component Props
- **profile**: User profile object
- **expertiseData**: Array of expertise objects
- **proofs**: Array of proof objects

### Component State
- **isAboutOpen**: boolean (collapsible state)
- **selectedCategory**: string | null (filtering - not currently used)

### Computed Values
- **expertiseByCategory**: Grouped expertise by category
- **totalSkills**: Count of all expertise
- **verifiedSkills**: Count of verified expertise
- **completionPercentage**: Percentage of verified skills

---

## Notes for Implementation

1. **Cognitive Science Foundation**: Six categories based on research

2. **Proof Requirements**: Each skill must have linked proof artifacts

3. **Animated Background**: Decorative, non-interactive layer

4. **Collapsible About**: Expandable information section

5. **Category Organization**: Skills grouped by cognitive category

6. **Verification Status**: Visual indicators for verified skills

7. **Sub-skills**: Granular skill breakdown within main skills

8. **Linked Proofs**: Direct connections to verification proofs

9. **External Links**: Opens proof URLs in new tabs

10. **Empty States**: Per-category empty states with CTAs

11. **Router Navigation**:
    - Add skill: '/profile/expertise/new'
    - Edit skill: `/profile/expertise/{skillId}/edit`

12. **Delete Functionality**: TODO - needs implementation

13. **Proficiency Levels**: Numeric levels for skills

14. **Responsive Design**: Grid adapts to viewport

15. **Performance**: Animated circles use GPU-accelerated transforms

---

**Implementation Priority**: HIGH - Core differentiator feature

**Related Components**:
- Card, Button, Badge, Progress, Collapsible from UI library
- Framer Motion for animations
- All Lucide icons
- Next.js router

**Key Features**:
- Scientific skill categorization
- Proof-based verification system
- Animated decorative background
- Collapsible information
- Skill management (add/edit/delete)
- Linked proof artifacts
- Progress tracking
- Empty states per category
- Sub-skill granularity

