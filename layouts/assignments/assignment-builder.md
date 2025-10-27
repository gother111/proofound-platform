# Assignment Builder Layout Specifications

**Last Updated:** October 27, 2025  
**Source:** `components/AssignmentBuilder.tsx`  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

The Assignment Builder is a multi-step wizard interface for organizations to create and publish job assignments. It features a 5-step progressive flow with a visual progress indicator, validation, and a comprehensive review step before publication. The layout uses a fixed header, scrollable content area, and sticky footer navigation.

---

## Page Container

- **Height**: `h-full`
- **Display**: `flex flex-col`
- **Overflow**: `overflow-hidden`
- **Background**: `#F7F6F1` (Parchment)

**Structure**: Three-part layout (Header, Content, Footer)

---

## Header Section

### Container
- **Padding**: `px-6 py-4` (24px horizontal, 16px vertical)
- **Border Bottom**: `border-b`, color `#E8E6DD` (Stone)
- **Background**: `#FDFCFA` (Off-white)

### Layout
- **Display**: `flex items-center justify-between`

---

### Left Side (Title Area)

**Container:**
- Individual `<div>`

**Title (h1):**
- Font Size: text-2xl (24px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Color: `#2D3330` (Charcoal)
- Content: "Create Assignment"

**Step Indicator (p):**
- Font Size: text-sm (14px)
- Margin Top: `mt-1` (4px)
- Color: `#6B6760`
- Content: "Step {current} of {total}" (e.g., "Step 1 of 5")

---

### Right Side

**Draft Badge:**
- Component: Badge, variant outline
- Content: "Draft"

---

## Progress Bar Section

### Container
- **Padding**: `px-6 py-3` (24px horizontal, 12px vertical)
- **Background**: `#FDFCFA` (Off-white)

### Progress Bar Container
- **Display**: `flex items-center gap-2`
- **Max Width**: `max-w-3xl mx-auto` (768px, centered)

### Individual Progress Segment

**Element**: `<div>` (repeated 5 times)

- **Height**: `h-2` (8px)
- **Flex**: `flex-1` (equal width distribution)
- **Border Radius**: `rounded-full`
- **Transition**: `transition-colors`
- **Background**: Conditional
  - **Completed** (i < currentStep): `#1C4D3A` (Forest)
  - **Incomplete** (i >= currentStep): `#E8E6DD` (Stone)

---

## Content Area

### Container
- **Flex**: `flex-1` (fills available space)
- **Overflow Y**: `overflow-y-auto` (scrollable)
- **Padding**: `px-6 py-6` (24px horizontal, 24px vertical)

### Content Wrapper
- **Max Width**: `max-w-3xl mx-auto` (768px, centered)

---

## Step Cards (Common Layout)

All step content is wrapped in a Card component with consistent styling:

- **Component**: Card
- **Padding**: `p-8` (32px)

**Step Title (h2):**
- Font Size: text-xl (20px)
- Font Family: font-display (Crimson Pro)
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-6` (24px)
- Color: `#2D3330`

**Form Container:**
- Space Y: `space-y-6` (24px between form fields)

---

## Step 1: Assignment Overview

### Form Fields

#### 1. Role Title (Required)
**Label:**
- Component: Label
- For: "title"
- Content: "Role Title *"

**Input:**
- Component: Input
- ID: "title"
- Placeholder: "e.g., Senior Frontend Developer"
- Required: true

---

#### 2. Description (Required)
**Label:**
- Component: Label
- For: "description"
- Content: "Description *"

**Textarea:**
- Component: Textarea
- ID: "description"
- Placeholder: "What is this role about? What impact will they make?"
- Rows: 4
- Required: true

---

#### 3. Team/Department & Duration (2-Column Grid)

**Grid Container:**
- Grid: `grid-cols-2`
- Gap: `gap-4` (16px)

**Field 1: Team/Department**
**Label:**
- Content: "Team/Department"

**Input:**
- ID: "team"
- Placeholder: "e.g., Product & Engineering"

**Field 2: Duration**
**Label:**
- Content: "Duration"

**Input:**
- ID: "duration"
- Placeholder: "e.g., 6 months, Ongoing"

---

## Step 2: Location & Compensation

### Form Fields

#### 1. Location Type (Required)

**Label:**
- Component: Label
- Class: `mb-3 block`
- Content: "Location Type *"

**Radio Group:**
- Component: RadioGroup
- Value: locationType
- Space Y: `space-y-3` (12px between options)

**Radio Option Card** (3 options: remote, hybrid, onsite):

**Container:**
- Display: `flex items-center space-x-3`
- Padding: `p-4` (16px)
- Border Radius: `rounded-lg`
- Border: `border`
- Border Color: Conditional
  - **Selected**: `#1C4D3A` (Forest)
  - **Unselected**: `#E8E6DD` (Stone)

**Radio Button:**
- Component: RadioGroupItem
- Value: "remote" | "hybrid" | "onsite"
- ID: matches value

**Label:**
- For: matches radio ID
- Class: `flex-1 cursor-pointer`

**Option Title:**
- Content: "Remote" | "Hybrid" | "On-site"

**Option Description (p):**
- Font Size: text-xs (12px)
- Color: `#6B6760`
- Content:
  - Remote: "Work from anywhere"
  - Hybrid: "Mix of remote and on-site"
  - On-site: "Office-based"

---

#### 2. Compensation Type (Required)

**Label:**
- Component: Label
- Class: `mb-3 block`
- Content: "Compensation Type *"

**Radio Group:**
- Component: RadioGroup
- Value: compensationType
- Space Y: `space-y-3`

**Radio Options** (Same structure as Location Type):
1. **Paid**: "Compensated position"
2. **Volunteer**: "Unpaid opportunity"
3. **Negotiable**: "To be discussed"

---

#### 3. Compensation Range (Conditional)

**Display**: If `compensationType === 'paid'`

**Label:**
- Content: "Compensation Range"

**Input:**
- ID: "compensationRange"
- Placeholder: "e.g., $60k-$80k/year, €40-50/hour"

---

## Step 3: Required Skills

### Form Fields

#### 1. Required Skills (Required)

**Label:**
- Content: "Required Skills *"

**Textarea:**
- ID: "requiredSkills"
- Placeholder: "Enter required skills separated by commas (e.g., React, TypeScript, Node.js)"
- Rows: 4

**Help Text (p):**
- Font Size: text-xs (12px)
- Margin Top: `mt-2` (8px)
- Color: `#6B6760`
- Content: "List the essential technical or soft skills needed for this role"

---

#### 2. Preferred Skills (Optional)

**Label:**
- Content: "Preferred Skills (Optional)"

**Textarea:**
- ID: "preferredSkills"
- Placeholder: "Enter nice-to-have skills separated by commas"
- Rows: 4

---

## Step 4: Responsibilities

### Form Fields

#### Key Responsibilities

**Label:**
- Content: "Key Responsibilities"

**Textarea:**
- ID: "responsibilities"
- Placeholder: "Enter each responsibility on a new line"
- Rows: 8

**Help Text (p):**
- Font Size: text-xs (12px)
- Margin Top: `mt-2` (8px)
- Color: `#6B6760`
- Content: "Describe what this person will be doing day-to-day"

---

## Step 5: Review & Publish

### Summary Card

**Container:**
- Padding: `p-4` (16px)
- Border Radius: `rounded-lg`
- Background: `#F7F6F1` (Parchment)

**Title (h3):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-2` (8px)
- Color: `#2D3330`
- Content: Role title or "Untitled Role"

**Description (p):**
- Font Size: text-sm (14px)
- Margin Bottom: `mb-3` (12px)
- Color: `#6B6760`
- Content: Role description or "No description"

**Details Grid:**
- Grid: `grid-cols-2`
- Gap: `gap-4` (16px)
- Font Size: text-sm (14px)

**Detail Item** (4 items: Team, Duration, Location, Compensation):

**Label:**
- Color: `#6B6760`
- Content: Field name + ":"

**Value:**
- Margin Left: `ml-2` (8px)
- Color: `#2D3330`
- Content: Field value or "Not specified"

---

### Ready to Publish Alert

**Container:**
- Padding: `p-4` (16px)
- Border Radius: `rounded-lg`
- Border: `border`, color `#7A9278` (Sage)
- Background: `#7A927810` (Sage with 10% opacity, represented as hex + "10")

**Layout:**
- Display: `flex items-start gap-3`

**Icon:**
- Component: CheckCircle2
- Size: `w-5 h-5` (20px)
- Flex Shrink: `flex-shrink-0`
- Color: `#7A9278` (Sage)

**Content:**

**Title (h4):**
- Font Weight: font-semibold (600)
- Margin Bottom: `mb-1` (4px)
- Color: `#2D3330`
- Content: "Ready to publish"

**Description (p):**
- Font Size: text-sm (14px)
- Color: `#6B6760`
- Content: "Your assignment will be published and our matching algorithm will find qualified candidates"

---

## Footer Navigation Section

### Container
- **Border Top**: `border-t`, color `#E8E6DD` (Stone)
- **Padding**: `p-6` (24px)
- **Background**: `#FDFCFA` (Off-white)

### Navigation Bar
- **Max Width**: `max-w-3xl mx-auto` (768px, centered)
- **Display**: `flex items-center justify-between`

---

### Back Button

- **Variant**: outline
- **Disabled**: If currentStep === 1
- **Content**: 
  - Icon: ArrowLeft, w-4 h-4, mr-2
  - Text: "Back"

---

### Next/Submit Button (Conditional)

**Next Button** (Steps 1-4):
- **Disabled**: If step 1 and (no title or no description)
- **Background**: `#1C4D3A` (Forest)
- **Color**: white
- **Content**:
  - Text: "Next"
  - Icon: ArrowRight, w-4 h-4, ml-2

**Publish Button** (Step 5):
- **Disabled**: If isLoading or no title or no description
- **Background**: `#1C4D3A` (Forest)
- **Color**: white
- **Content**: "Publishing..." (if loading) or "Publish Assignment"

---

## Typography Scale

### Headings
- **H1 (Page Title)**: Crimson Pro, text-2xl (24px), font-semibold (600), #2D3330
- **H2 (Step Titles)**: Crimson Pro, text-xl (20px), font-semibold (600), #2D3330
- **H3 (Summary Title)**: Inter, font-semibold (600), #2D3330
- **H4 (Alert Title)**: Inter, font-semibold (600), #2D3330

### Body Text
- **Step Indicator**: Inter, text-sm (14px), #6B6760
- **Description**: Inter, text-sm (14px), #6B6760
- **Option Description**: Inter, text-xs (12px), #6B6760
- **Help Text**: Inter, text-xs (12px), #6B6760
- **Detail Labels**: Inter, text-sm (14px), #6B6760
- **Detail Values**: Inter, text-sm (14px), #2D3330

### Font Weights
- **Regular**: 400 (inputs, descriptions)
- **Medium**: 500 (labels)
- **Semibold**: 600 (titles, headers)

---

## Color Palette

### Page Background
- **Main**: `#F7F6F1` (Parchment)

### Header/Footer
- **Background**: `#FDFCFA` (Off-white)
- **Border**: `#E8E6DD` (Stone)

### Progress Bar
- **Completed**: `#1C4D3A` (Forest)
- **Incomplete**: `#E8E6DD` (Stone)

### Cards
- **Main Card**: white (default Card component)
- **Summary Card**: `#F7F6F1` (Parchment)
- **Alert Card**: 
  - Background: `#7A927810` (Sage 10%)
  - Border: `#7A9278` (Sage)

### Radio Options
- **Selected Border**: `#1C4D3A` (Forest)
- **Unselected Border**: `#E8E6DD` (Stone)

### Text
- **Primary**: `#2D3330` (Charcoal)
- **Secondary**: `#6B6760` (Gray)

### Buttons
- **Primary Action**: `#1C4D3A` (Forest) background, white text
- **Back Button**: outline variant

### Icons
- **Alert Icon**: `#7A9278` (Sage)
- **Arrow Icons**: Inherit from button

---

## Spacing System

### Page Layout
- **Header Padding**: 24px horizontal, 16px vertical
- **Progress Bar Padding**: 24px horizontal, 12px vertical
- **Content Padding**: 24px horizontal, 24px vertical
- **Footer Padding**: 24px

### Progress Bar
- **Height**: 8px (h-2)
- **Gap Between Segments**: 8px (gap-2)
- **Max Width**: 768px (max-w-3xl)

### Cards
- **Padding**: 32px (p-8)
- **Max Width**: 768px (max-w-3xl)

### Form Fields
- **Vertical Spacing**: 24px (space-y-6)
- **Grid Gap**: 16px (gap-4)
- **Label Margin**: 12px bottom (mb-3 for section labels)
- **Help Text Margin**: 8px top (mt-2)

### Radio Options
- **Padding**: 16px (p-4)
- **Vertical Spacing**: 12px (space-y-3)
- **Icon to Label Gap**: 12px (space-x-3)

### Summary Card
- **Padding**: 16px (p-4)
- **Title Margin**: 8px bottom (mb-2)
- **Description Margin**: 12px bottom (mb-3)
- **Grid Gap**: 16px (gap-4)

### Alert Card
- **Padding**: 16px (p-4)
- **Icon to Content Gap**: 12px (gap-3)
- **Title Margin**: 4px bottom (mb-1)

---

## Responsive Behavior

### Desktop (≥768px)
- **Content Width**: 768px max (max-w-3xl)
- **Grid**: 2 columns for Team/Duration
- **Summary Grid**: 2 columns for details
- **All Elements**: Full layout

### Mobile (<768px)
- **All Containers**: Full width within padding
- **Grid**: May stack to 1 column
- **Buttons**: May adjust sizing
- **Content**: Remains scrollable

---

## Interactive States

### Progress Bar
- **Transition**: Smooth color change (transition-colors)
- **Updates**: On step change

### Buttons
- **Back**: 
  - Disabled on step 1 (opacity reduction)
- **Next**:
  - Disabled if step 1 and missing required fields
  - Hover: Standard button hover (Forest at 90% opacity)
- **Publish**:
  - Disabled if loading or missing required fields
  - Loading state: Shows "Publishing..." text

### Radio Options
- **Default**: Stone border (#E8E6DD)
- **Selected**: Forest border (#1C4D3A)
- **Hover**: Cursor pointer (on label)

### Form Inputs
- **Focus**: Ring indicator (from UI library)
- **Required**: Asterisk (*) in label

---

## Validation

### Step 1
- **Title**: Required to proceed
- **Description**: Required to proceed

### Step 2-4
- **No Blocking Validation**: Can proceed without filling

### Step 5 (Final)
- **Title & Description**: Must be filled to publish

---

## Data Handling

### Form State (useState)
- title (string)
- description (string)
- team (string)
- duration (string)
- locationType ('remote' | 'hybrid' | 'onsite')
- compensationType ('paid' | 'volunteer' | 'negotiable')
- compensationRange (string)
- requiredSkills (string, comma-separated)
- preferredSkills (string, comma-separated)
- responsibilities (string, newline-separated)

### Navigation State
- currentStep (number, 1-5)
- isLoading (boolean)

### On Submit
1. Split comma-separated skills into arrays
2. Split newline-separated responsibilities into array
3. Insert into Supabase 'assignments' table
4. Set status to 'published'
5. Navigate to /assignments or call onComplete

---

## Accessibility

### Semantic HTML
- **Form Elements**: Proper label/input associations
- **Buttons**: Proper button elements
- **Headings**: Proper hierarchy (h1 → h2 → h3 → h4)

### Keyboard Navigation
- **All Form Fields**: Tab-navigable
- **Radio Options**: Arrow key navigation
- **Buttons**: Focusable and activatable

### Screen Readers
- **Labels**: Associated with inputs via htmlFor/id
- **Required Fields**: Marked with asterisk
- **Help Text**: Associated with fields
- **Progress**: Step indicator announced
- **Disabled States**: Announced properly

### ARIA
- **Required**: Communicated via 'required' attribute
- **Radio Groups**: Proper RadioGroup component

---

## Notes for Implementation

1. **5-Step Flow**: Overview → Location/Comp → Skills → Responsibilities → Review

2. **Progress Tracking**: Visual bar shows current position

3. **Validation**: Basic required field validation on step 1 and final publish

4. **Conditional Fields**: Compensation range only shows if "Paid" selected

5. **Data Transformation**:
   - Skills: Comma-separated → array
   - Responsibilities: Newline-separated → array

6. **Navigation**:
   - Back: Decrements step (disabled on step 1)
   - Next: Increments step (steps 1-4)
   - Publish: Submits to Supabase (step 5)

7. **Loading State**: Button shows "Publishing..." during submission

8. **Error Handling**: Alert shown if submission fails

9. **Completion**: Either calls onComplete callback or navigates to /assignments

10. **Router Integration**: Uses Next.js useRouter

11. **Supabase**: Creates record in 'assignments' table

12. **Props**:
    - organizationId: Required for FK
    - onComplete: Optional callback on success

---

**Implementation Priority**: HIGH - Critical for organization users

**Related Components**:
- Card, Button, Input, Label, Textarea, Badge, RadioGroup from UI library
- Lucide icons (Plus, ArrowLeft, ArrowRight, CheckCircle2)
- Supabase client for data submission
- Next.js router

**Key Features**:
- Multi-step wizard interface
- Visual progress indicator
- Conditional field rendering
- Form validation
- Review before publish
- Loading states
- Fixed header and footer
- Scrollable content area
- Responsive layout
- Keyboard accessible

