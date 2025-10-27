# Matching Space Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/MatchingSpace.tsx`, `MatchingIndividualView.tsx`, `MatchingOrganizationView.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Matching Space is a core feature that connects individuals with opportunities and organizations with candidates. The layout dynamically switches between two distinct views based on account type:
- **Individual View**: Browse and respond to opportunity matches
- **Organization View**: Review candidate matches for assignments with sidebar navigation

---

## Page Container (Shared)

### Container
- **Height**: `h-screen` (full viewport height)
- **Display**: `flex flex-col`
- **Background**: `#F7F6F1` (Parchment)

### Top Navigation Bar
- **Height**: `h-14` (56px)
- **Border Bottom**: `border-b`, color `rgba(232, 230, 221, 0.6)`
- **Display**: `flex items-center justify-between`
- **Padding**: `px-6` (24px horizontal)
- **Background**: `#FDFCFA` (Off-white)

#### Page Title
- **Font Size**: text-base (16px)
- **Font Weight**: font-semibold (600)
- **Color**: `#2D3330` (Charcoal)
- **Content**:
  - Individual: "Opportunity Matches"
  - Organization: "Candidate Matches"

### Content Area
- **Flex**: `flex-1` (takes remaining height)
- **Overflow**: `overflow-hidden` (managed by child views)

---

## Individual View Layout

### Container
- **Height**: `h-full`
- **Display**: `flex flex-col`
- **Overflow**: `overflow-hidden`

---

### Search & Filters Bar

#### Container
- **Padding**: `p-6` (24px)
- **Border Bottom**: `border-b`, color `rgba(232, 230, 221, 0.6)`
- **Background**: `#FDFCFA` (Off-white)

#### Inner Layout
- **Display**: `flex items-center gap-3`
- **Max Width**: `max-w-4xl` (896px)

#### Search Input Container
- **Position**: `relative`
- **Flex**: `flex-1` (takes remaining width)

**Search Icon:**
- **Icon**: Search (Lucide)
- **Size**: `w-4 h-4` (16px)
- **Position**: `absolute left-3 top-1/2 -translate-y-1/2`
- **Color**: `#6B6760`

**Input:**
- **Component**: Input from UI library
- **Type**: text
- **Placeholder**: "Search opportunities..."
- **Padding Left**: `pl-10` (40px - accommodates icon)
- **Background**: `#F7F6F1` (Parchment)

#### Filters Button
- **Variant**: outline
- **Size**: sm
- **Display**: `gap-2` (8px between icon and text)
- **Icon**: Sliders, w-4 h-4
- **Text**: "Filters"

---

### Matches List

#### Container
- **Flex**: `flex-1` (takes remaining height)
- **Overflow Y**: `overflow-y-auto` (scrollable)
- **Padding**: `p-6` (24px)

#### Inner Container
- **Max Width**: `max-w-4xl mx-auto` (896px, centered)
- **Space Y**: `space-y-4` (16px between elements)

#### Section Header
- **Display**: `flex items-center justify-between`
- **Margin Bottom**: `mb-6` (24px)

**Left Side:**
- **Title (h2)**: 
  - Font: font-display (Crimson Pro), text-2xl (24px), font-semibold (600)
  - Color: `#2D3330`
  - Content: "Your Matches"
- **Count Text (p)**:
  - Font Size: text-sm (14px)
  - Margin Top: `mt-1` (4px)
  - Color: `#6B6760`
  - Content: "{count} opportunities match your profile"

**Right Side:**
- **Button**: "Update Preferences"
  - Variant: outline
  - Action: Router push to '/profile'

---

### Match Card (Individual)

#### Card Container
- **Component**: Card from UI library
- **Padding**: `p-6` (24px)
- **Hover**: `hover:shadow-md` (shadow increases)
- **Transition**: `transition-shadow`
- **Cursor**: `cursor-pointer`
- **Click Action**: View match details

#### Header Section
- **Display**: `flex items-start justify-between`
- **Margin Bottom**: `mb-4` (16px)

**Left Side (Flex-1):**
1. **Title Row**:
   - Display: `flex items-center gap-3`
   - Margin Bottom: `mb-2` (8px)
   
   **Title (h3):**
   - Font: font-display, text-xl (20px), font-semibold (600)
   - Color: `#2D3330`
   - Content: Assignment title
   
   **New Match Badge** (Conditional, if status='suggested'):
   - Variant: outline
   - Gap: `gap-1` (4px)
   - Background: `#7A9278/10` (Sage 10%)
   - Text Color: `#7A9278` (Sage)
   - Border: `border-[#7A9278]`
   - Icon: TrendingUp, w-3 h-3
   - Text: "New Match"

2. **Organization Name**:
   - Font Size: text-sm (14px)
   - Margin Bottom: `mb-3` (12px)
   - Color: `#6B6760`
   - Content: Organization name

**Right Side:**
- **Match Score Container**:
  - Display: `flex flex-col items-end gap-2`
  
  **Label Row:**
  - Display: `flex items-center gap-2`
  - Label: "Match Score", text-sm, font-medium, color #6B6760
  
  **Score Badge:**
  - Padding: `px-3 py-1` (12px horizontal, 4px vertical)
  - Border Radius: `rounded-full`
  - Font Weight: font-semibold (600)
  - Text Color: `#FFFFFF` (white)
  - Background Color (Dynamic):
    - ≥80%: `#7A9278` (Sage - green)
    - 60-79%: `#D4A574` (Ochre - yellow)
    - <60%: `#C76B4A` (Terracotta - orange/red)
  - Content: "{score}%" (rounded)

#### Description
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Line Clamp**: `line-clamp-2` (max 2 lines, ellipsis)
- **Color**: `#2D3330`
- **Content**: Assignment description

#### Details Row
- **Display**: `flex flex-wrap gap-4`
- **Margin Bottom**: `mb-4` (16px)
- **Font Size**: text-sm (14px)
- **Color**: `#6B6760`

**Detail Items** (Each if present):
1. **Location**:
   - Icon: MapPin, w-4 h-4
   - Display: `flex items-center gap-1`
   - Content: location_type

2. **Compensation**:
   - Icon: DollarSign, w-4 h-4
   - Display: `flex items-center gap-1`
   - Content: compensation_type

3. **Duration**:
   - Icon: Clock, w-4 h-4
   - Display: `flex items-center gap-1`
   - Content: duration

#### Skills Match Section (Conditional)
**Display**: If matched_expertise exists and has items

- **Margin Bottom**: `mb-4` (16px)

**Header:**
- Display: `flex items-center gap-2`
- Margin Bottom: `mb-2` (8px)
- Icon: Award, w-4 h-4, color #7A9278 (Sage)
- Text: "Matching Skills", text-sm, font-medium, color #2D3330

**Skills Container:**
- Display: `flex flex-wrap gap-2`

**Individual Skill Badge:**
- Component: Badge, variant outline
- Font Size: text-xs (12px)
- Content: Skill name
- Limit: First 5 shown

**More Badge** (if > 5 skills):
- Badge, variant outline, text-xs
- Content: "+{count} more"

#### Match Explanation (Conditional)
**Display**: If explanation exists

- **Margin Bottom**: `mb-4` (16px)
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Background**: `#F7F6F1` (Parchment)

**Text:**
- Font Size: text-sm (14px)
- Color: `#2D3330`
- Content: "**Why this match?** {explanation}"

#### Actions Row
- **Display**: `flex items-center gap-3`
- **Padding Top**: `pt-4` (16px)
- **Border Top**: `border-t`, color `rgba(232, 230, 221, 0.6)`

**Buttons (Left to Right):**

1. **I'm Interested Button**:
   - Background: `#1C4D3A` (Forest)
   - Hover: `hover:bg-[#1C4D3A]/90`
   - Text Color: white
   - Icon: CheckCircle2, w-4 h-4, mr-2
   - Text: "I'm Interested"
   - Action: Accept match (stopPropagation)

2. **View Details Button**:
   - Variant: outline
   - Text: "View Details"
   - Action: View match (stopPropagation)

3. **Not Interested Button**:
   - Variant: ghost
   - Margin Left: `ml-auto` (pushed to right)
   - Text: "Not Interested"
   - Action: Decline match (stopPropagation)

---

### Empty State (Individual)

#### Card Container
- **Component**: Card
- **Padding**: `p-12` (48px)
- **Text Align**: `text-center`

#### Icon
- **Component**: TrendingUp (Lucide)
- **Size**: `w-16 h-16` (64px)
- **Margin**: `mx-auto mb-4` (centered, 16px bottom)
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-xl (20px)
- **Font**: font-display, font-semibold
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content**: 
  - With search: "No matches found"
  - Without search: "No matches yet"

#### Description
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-6` (24px)
- **Color**: `#6B6760`
- **Content**:
  - With search: "Try adjusting your search criteria"
  - Without search: "Complete your profile to receive personalized matches"

#### CTA Button (Conditional)
**Display**: If no search query

- **Text**: "Complete Your Profile"
- **Action**: Router push to '/profile'

---

## Organization View Layout

### Container
- **Height**: `h-full`
- **Display**: `flex`
- **Overflow**: `overflow-hidden`

---

### Left Sidebar (Assignments List)

#### Container
- **Width**: `w-80` (320px)
- **Border Right**: `border-r`, color `rgba(232, 230, 221, 0.6)`
- **Overflow Y**: `overflow-y-auto` (scrollable)
- **Flex Shrink**: `flex-shrink-0` (fixed width)
- **Background**: `#FDFCFA` (Off-white)

#### Header
- **Padding**: `p-4` (16px)
- **Border Bottom**: `border-b`, color `rgba(232, 230, 221, 0.6)`

**Top Row:**
- Display: `flex items-center justify-between`
- Margin Bottom: `mb-4` (16px)

**Title (h3):**
- Font Weight: font-semibold (600)
- Color: `#2D3330`
- Text: "Your Assignments"

**New Button:**
- Size: sm
- Variant: outline
- Gap: `gap-1` (4px between icon and text)
- Icon: Plus, w-3 h-3
- Text: "New"
- Action: Router push to '/assignments/new'

#### Assignments List
- **Padding**: `p-2` (8px)

**Individual Assignment Button:**
- **Width**: `w-full`
- **Text Align**: `text-left`
- **Padding**: `p-3` (12px)
- **Border Radius**: `rounded-lg`
- **Margin Bottom**: `mb-2` (8px)
- **Transition**: `transition-colors`
- **Background**:
  - Selected: `#E8E6DD` (Stone)
  - Not selected: transparent

**Assignment Title:**
- Font Weight: font-medium (500)
- Font Size: text-sm (14px)
- Margin Bottom: `mb-1` (4px)
- Color: `#2D3330`
- Content: Assignment title

**Candidate Count:**
- Font Size: text-xs (12px)
- Color: `#6B6760`
- Content: "{count} candidates"

**Status Badge:**
- Variant: outline
- Font Size: text-xs
- Margin Top: `mt-2` (8px)
- Content: Assignment status (e.g., "published")

**Empty State (No Assignments):**
- Padding: `p-4` (16px)
- Text Align: `text-center`
- Message: "No assignments yet", text-sm, color #6B6760, mb-3
- Button: "Create First Assignment", size sm

---

### Main Content (Organization)

#### Container
- **Flex**: `flex-1` (takes remaining width)
- **Display**: `flex flex-col`
- **Overflow**: `overflow-hidden`

#### Search & Filters Bar
**Same structure as Individual view**, with adjustments:
- Max Width: Not specified (uses available width)
- Placeholder: "Search candidates..."

#### Candidates List

**Container:**
- Flex: `flex-1`
- Overflow Y: `overflow-y-auto`
- Padding: `p-6` (24px)

**Inner Container:**
- Max Width: `max-w-4xl mx-auto` (896px, centered)
- Space Y: `space-y-4` (16px)

**Header:**
- Margin Bottom: `mb-6` (24px)

**Title (h2):**
- Font: font-display, text-2xl (24px), font-semibold
- Margin Bottom: `mb-1` (4px)
- Color: `#2D3330`
- Content: Current assignment title or "Select an Assignment"

**Count Text:**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "{count} candidates match this assignment"

---

### Candidate Card (Organization)

#### Card Container
- **Component**: Card
- **Padding**: `p-6` (24px)
- **Hover**: `hover:shadow-md`
- **Transition**: `transition-shadow`
- **Cursor**: `cursor-pointer`
- **Click Action**: View candidate profile

#### Candidate Header
- **Display**: `flex items-start gap-4`
- **Margin Bottom**: `mb-4` (16px)

**Avatar:**
- Component: Avatar from UI library
- Size: `w-16 h-16` (64px)
- Fallback Background: `#7A9278` (Sage)
- Fallback Text Color: white
- Fallback Font Size: text-lg (18px)
- Content: Initials (first 2 letters)

**Info Section (Flex-1):**

1. **Top Row**:
   - Display: `flex items-start justify-between`
   - Margin Bottom: `mb-2` (8px)
   
   **Left:**
   - **Name (h3)**: font-display, text-xl (20px), font-semibold, color #2D3330
   - **Tagline** (if exists): text-sm, mt-1 (4px), color #6B6760
   
   **Right:**
   - **Match Score Badge**:
     - Padding: `px-3 py-1`
     - Border Radius: `rounded-full`
     - Font Weight: font-semibold
     - Background (Dynamic, same as Individual view):
       - ≥80%: #7A9278
       - 60-79%: #D4A574
       - <60%: #C76B4A
     - Text Color: white
     - Content: "{score}% Match"

2. **Quick Info Row**:
   - Display: `flex flex-wrap gap-3`
   - Font Size: text-sm (14px)
   - Color: `#6B6760`
   
   **Location** (if exists):
   - Display: `flex items-center gap-1`
   - Icon: MapPin, w-4 h-4
   - Content: Location
   
   **Availability** (if exists):
   - Display: `flex items-center gap-1`
   - Icon: Clock, w-4 h-4
   - Content: Availability from matching preferences

#### Bio Section (Conditional)
**Display**: If bio exists

- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-4` (16px)
- **Line Clamp**: `line-clamp-2`
- **Color**: `#2D3330`
- **Content**: Candidate bio

#### Matching Skills Section (Conditional)
**Structure**: Same as Individual view
- Icon: Award, color #7A9278
- Label: "Matching Expertise"
- Badges: First 5 skills + more indicator

#### Match Explanation (Conditional)
**Structure**: Same as Individual view

#### Verification Status (Conditional)
**Display**: If profile_completion_percentage ≥ 80

- **Display**: `flex items-center gap-2`
- **Margin Bottom**: `mb-4` (16px)
- **Font Size**: text-sm (14px)

**Icon:**
- Component: CheckCircle2
- Size: `w-4 h-4` (16px)
- Color: `#7A9278` (Sage)

**Text:**
- Color: `#7A9278` (Sage)
- Content: "Verified profile"

#### Actions Row
- **Display**: `flex items-center gap-3`
- **Padding Top**: `pt-4` (16px)
- **Border Top**: `border-t`, color `rgba(232, 230, 221, 0.6)`

**Buttons:**

1. **Contact Candidate Button**:
   - Background: `#1C4D3A` (Forest)
   - Hover: `hover:bg-[#1C4D3A]/90`
   - Text Color: white
   - Icon: User, w-4 h-4, mr-2
   - Text: "Contact Candidate"
   - Action: Contact candidate (stopPropagation)

2. **View Full Profile Button**:
   - Variant: outline
   - Text: "View Full Profile"
   - Action: View candidate profile (stopPropagation)

---

### Empty State (Organization)

#### Card Container
- **Padding**: `p-12` (48px)
- **Text Align**: `text-center`

#### Icon
- **Component**: User (Lucide)
- **Size**: `w-16 h-16` (64px)
- **Margin**: `mx-auto mb-4`
- **Color**: `#E8E6DD` (Stone)

#### Title (h3)
- **Font Size**: text-xl (20px)
- **Font**: font-display, font-semibold
- **Margin Bottom**: `mb-2` (8px)
- **Color**: `#2D3330`
- **Content** (Conditional):
  - With search: "No candidates found"
  - With assignment, no matches: "No matches yet"
  - No assignment: "Select an assignment"

#### Description
- **Font Size**: text-sm (14px)
- **Margin Bottom**: `mb-6` (24px)
- **Color**: `#6B6760`
- **Content** (Conditional):
  - With search: "Try adjusting your search criteria"
  - With assignment: "Matches will appear here once the algorithm processes your assignment"
  - No assignment: "Choose an assignment from the left to view candidate matches"

#### CTA Button (Conditional)
**Display**: If no current assignment

- **Text**: "Create New Assignment"
- **Action**: Router push to '/assignments/new'

---

## Typography Scale

### Page Elements
- **Page Title**: Inter, text-base (16px), font-semibold (600), #2D3330
- **Section Titles (h2)**: Crimson Pro, text-2xl (24px), font-semibold (600), #2D3330
- **Card Titles (h3)**: Crimson Pro, text-xl (20px), font-semibold (600), #2D3330
- **Sidebar Title**: Inter, font-semibold (600), #2D3330
- **Body Text**: Inter, text-sm (14px), #2D3330
- **Meta Text**: Inter, text-sm (14px), #6B6760
- **Badge Text**: Inter, text-xs (12px)
- **Button Text**: Inter, default size

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (assignment titles)
- **Semibold**: 600 (section titles, card titles)

---

## Color Palette

### Backgrounds
- **Page**: `#F7F6F1` (Parchment)
- **Top Bar**: `#FDFCFA` (Off-white)
- **Sidebar**: `#FDFCFA` (Off-white)
- **Search Bar**: `#FDFCFA` (Off-white)
- **Search Input**: `#F7F6F1` (Parchment)
- **Cards**: white (default Card component)
- **Selected Assignment**: `#E8E6DD` (Stone)
- **Match Explanation Box**: `#F7F6F1` (Parchment)

### Text Colors
- **Primary**: `#2D3330` (Charcoal)
- **Secondary/Meta**: `#6B6760` (Gray)
- **On Badge/Button**: white
- **Verification**: `#7A9278` (Sage)

### Action Colors
- **Primary Button**: `#1C4D3A` (Forest)
- **Success/High Match**: `#7A9278` (Sage)
- **Medium Match**: `#D4A574` (Ochre)
- **Low Match**: `#C76B4A` (Terracotta)
- **New Badge**: `#7A9278` (Sage)

### Borders
- **Default**: `rgba(232, 230, 221, 0.6)` (Stone 60%)
- **New Badge**: `#7A9278` (Sage)

### Empty State
- **Icon**: `#E8E6DD` (Stone)

---

## Spacing System

### Layout Spacing
- **Top Bar Padding**: `px-6` (24px)
- **Search Bar Padding**: `p-6` (24px)
- **Sidebar Padding**: `p-4` header, `p-2` list (16px, 8px)
- **Content Padding**: `p-6` (24px)
- **Card Padding**: `p-6` (24px)

### Section Spacing
- **Header Margin**: `mb-6` (24px)
- **Card Spacing**: `space-y-4` (16px between cards)

### Card Internal Spacing
- **Sections**: `mb-4` (16px)
- **Title to Meta**: `mb-2` (8px) or `mb-3` (12px)
- **Icon to Text**: `gap-1` to `gap-4` (4px-16px)

### Assignment List
- **Between Items**: `mb-2` (8px)
- **Sidebar Header**: `mb-4` (16px)

---

## Responsive Behavior

### Desktop (≥1024px)
- **Organization View**: Sidebar visible (320px) + main content
- **Individual View**: Full width with max-w-4xl content
- **Cards**: Full card layout
- **Search Bar**: max-w-4xl (Individual) or max-w-md (Organization)

### Tablet (768px - 1023px)
- **Organization View**: Sidebar likely collapses to overlay or icons
- **Individual View**: Same structure
- **Content**: max-w-4xl maintained

### Mobile (<768px)
- **Organization View**: Sidebar becomes drawer/overlay
- **Individual View**: Full-width stacked
- **Cards**: Single column, full width
- **Actions**: May stack vertically

**Note**: Responsive breakpoints not explicitly defined in code, would need implementation

---

## Interactive States

### Cards
- **Default**: White background, subtle border
- **Hover**: `hover:shadow-md` (shadow increases)
- **Click**: Navigates to detail view
- **Transition**: `transition-shadow`

### Buttons
- **Primary**: bg #1C4D3A, hover bg #1C4D3A/90
- **Outline**: Border with transparent background
- **Ghost**: Minimal styling
- **Disabled**: Not shown but would have reduced opacity

### Assignment Items (Organization)
- **Default**: Transparent background
- **Selected**: `#E8E6DD` background
- **Hover**: Would benefit from hover state (not defined)
- **Transition**: `transition-colors`

### Match Score Badges
- **Colors**: Dynamic based on score
- **No Hover**: Static display

---

## Animations & Transitions

### Card Hover
- **Property**: box-shadow
- **Class**: `transition-shadow`
- **Duration**: Default (150-200ms)

### Assignment Selection
- **Property**: background-color
- **Class**: `transition-colors`
- **Duration**: Default

### Page Navigation
- **Router**: Next.js router transitions

---

## Accessibility

### Semantic HTML
- **Headings**: Proper hierarchy (h1 in top bar → h2 for sections → h3 for cards)
- **Buttons**: Proper button elements for actions
- **Lists**: Could be enhanced with proper list semantics for matches

### Keyboard Navigation
- **Search Input**: Keyboard accessible
- **Buttons**: All focusable
- **Cards**: Clickable, should have keyboard access
- **Assignment List**: Keyboard navigable

### Screen Readers
- **Icon-only Buttons**: Could benefit from ARIA labels (Filters button)
- **Match Scores**: Announced as part of card content
- **Status Indicators**: Announced with text

### Color Contrast
- **Text on Backgrounds**: AA compliant
- **Match Score Badges**: White text on colored backgrounds (verify contrast)

---

## State Management

### Individual View
- **searchQuery**: string (filter state)
- **filteredMatches**: Computed from matches + search

### Organization View
- **searchQuery**: string (filter state)
- **selectedAssignment**: string | null (active assignment ID)
- **filteredMatches**: Computed from matches + assignment + search
- **currentAssignment**: Computed from assignments + selectedAssignment

### Shared Props
- **profile**: User profile object
- **matches**: Array of match objects
- **assignments**: Array of assignment objects (organization only)

---

## API Integration

### Data Requirements

**Match Object:**
- id: string
- status: 'suggested' | other
- overall_score: number (0-100)
- matched_expertise: string[]
- explanation: string
- assignment_id: string (for organization)
- assignment: { title, description, location_type, compensation_type, duration, organization: { name } }
- profile: { full_name, tagline, bio, location, matching_preferences, profile_completion_percentage }

**Assignment Object:**
- id: string
- title: string
- status: string

### Actions (TODO)
- **Accept Match**: Individual view, not implemented
- **Decline Match**: Individual view, not implemented
- **Contact Candidate**: Organization view, not implemented
- **View Match/Candidate**: Router navigation to `/matches/{id}`

---

## Notes for Implementation

1. **Persona Detection**: Based on `profile.account_type`

2. **Router Integration**: Uses Next.js router for navigation

3. **Search**: Client-side filtering only, no backend search

4. **Filters Button**: Present but not implemented

5. **Empty States**: Context-aware messages

6. **Card Clicks**: Whole card clickable, actions stopPropagation

7. **Match Score Colors**: Dynamic thresholds (80%, 60%)

8. **Skills Display**: Truncated to 5 with "+X more"

9. **Sidebar Selection**: Auto-selects first assignment

10. **Responsive**: Needs explicit mobile/tablet handling for org view sidebar

11. **Loading States**: Not shown, should add

12. **Error Handling**: Not shown, should add

13. **Pagination**: Not implemented, would be needed for large lists

14. **Real-time Updates**: Not implemented, would enhance UX

15. **Match Actions**: Placeholder implementations, need backend

---

**Implementation Priority**: HIGH - Core product feature

**Related Components**:
- Card, Input, Button, Badge, Avatar from UI library
- All Lucide icons (Search, Sliders, User, Award, etc.)
- Next.js router

**Key Features**:
- Persona-aware dual views
- AI-powered match scoring
- Skills matching visualization
- Search and filter (partial)
- Assignment sidebar (organization)
- Empty states
- Match explanations

**Dependencies**:
- Match generation algorithm
- Assignment system
- Profile completion tracking
- Backend for match actions

