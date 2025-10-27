# MASTER PROMPT: Proofound Profile Pages - Complete Replication Guide

**Copy everything below this line and paste into any AI chat to recreate the profile pages identically.**

---

# Create Profile Pages Matching This Exact Design

I need you to help me create profile pages that match the Proofound platform design exactly. There are two types of profiles:

1. **Individual Profile Page** - Comprehensive, story-focused profile
2. **Organization Profile Page** - Simplified business information form

## DESIGN SYSTEM

### Color Palette (Use These EXACT Values)

```css
/* Primary Brand Colors */
--brand-sage: #7A9278;          /* rgb(122, 146, 120) - Primary, Person nodes */
--brand-terracotta: #C67B5C;    /* rgb(198, 123, 92) - Organizations */
--brand-teal: #5C8B89;          /* rgb(92, 139, 137) - Government/Education */
--brand-ochre: #D4A574;         /* rgb(212, 165, 116) - Accent, Skills */

/* Base Colors */
--bg-base: #F5F3EE;             /* rgb(245, 243, 238) - Page background */
--card-bg: #FDFCFA;             /* rgb(253, 252, 250) - Card background */
--text-primary: #2C2A27;        /* rgb(44, 42, 39) - Primary text */
--muted-bg: #E8E4DC;            /* rgb(232, 228, 220) - Muted background */

/* Opacity Variants (for inline styles) */
rgba(122, 146, 120, 0.05)  /* sage-5 */
rgba(122, 146, 120, 0.1)   /* sage-10 */
rgba(122, 146, 120, 0.2)   /* sage-20 */
rgba(122, 146, 120, 0.3)   /* sage-30 */
rgba(198, 123, 92, 0.05)   /* terracotta-5 */
rgba(198, 123, 92, 0.1)    /* terracotta-10 */
rgba(198, 123, 92, 0.2)    /* terracotta-20 */
rgba(198, 123, 92, 0.6)    /* terracotta-60 */
rgba(92, 139, 137, 0.1)    /* teal-10 */
rgba(92, 139, 137, 0.6)    /* teal-60 */
rgba(212, 165, 116, 0.1)   /* ochre-10 */
rgba(212, 165, 116, 0.3)   /* ochre-30 */
```

### Typography

- **Display Font**: Use for headings, large titles
- **Body Font**: Use for regular text
- **Sizes**:
  - Hero Title: 4xl (2.25rem) or 3xl (1.875rem)
  - Section Title: 2xl (1.5rem)
  - Card Title: xl (1.25rem) or lg (1.125rem)
  - Body: base (1rem)
  - Small: sm (0.875rem)
  - Extra Small: xs (0.75rem)

### Spacing System

Use consistent spacing: 2 (0.5rem), 3 (0.75rem), 4 (1rem), 6 (1.5rem), 8 (2rem), 12 (3rem)

### Border Radius

- Cards: rounded-xl (0.75rem)
- Pills/Badges: rounded-full
- Buttons: rounded-lg or rounded-full

---

## PART 1: INDIVIDUAL PROFILE PAGE

### Data Structure (TypeScript Types)

```typescript
interface BasicInfo {
  name: string;
  tagline: string | null;
  location: string | null;
  joinedDate: string;              // e.g., "January 2024"
  avatar: string | null;           // Base64 or URL
  coverImage: string | null;       // Base64 or URL
}

interface Value {
  id: string;
  icon: string;                    // Icon name: Heart, Sparkles, Users, Eye, Target, Shield, Leaf, Lightbulb, HandHeart
  label: string;                   // e.g., "Compassion", "Innovation"
  verified: boolean;
}

interface Skill {
  id: string;
  name: string;
  verified: boolean;
}

interface ImpactStory {
  id: string;
  title: string;
  orgDescription: string;          // Organization context
  impact: string;                  // What changed
  businessValue: string;           // Value delivered
  outcomes: string;                // Measurable results
  timeline: string;                // e.g., "Jan 2023 - Dec 2023"
  verified: boolean | null;
}

interface Experience {
  id: string;
  title: string;                   // Job title
  orgDescription: string;          // Company/organization
  duration: string;                // e.g., "2 years"
  learning: string;                // What I learned
  growth: string;                  // How I grew
  verified: boolean | null;
}

interface Education {
  id: string;
  institution: string;             // School name
  degree: string;                  // Degree or course
  duration: string;                // e.g., "2015-2019"
  skills: string;                  // Skills gained
  projects: string;                // Meaningful projects
  verified: boolean | null;
}

interface Volunteering {
  id: string;
  title: string;                   // Role
  orgDescription: string;          // Organization
  duration: string;                // Time period
  cause: string;                   // Cause name
  impact: string;                  // Impact made
  skillsDeployed: string;          // Skills used
  personalWhy: string;             // Personal motivation
  verified: boolean | null;
}

interface ProfileData {
  basicInfo: BasicInfo;
  mission: string | null;
  values: Value[];
  causes: string[];                // Array of cause names
  skills: Skill[];
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
}
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│              COMPLETION BANNER (if < 80% complete)          │
│   [Sparkles Icon] Profile completion with progress bar      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    COVER IMAGE (h-48)                        │
│  Gradient: sage → teal → ochre with diagonal stripes        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ┌────────┐                                                  │
│  │        │  [Name - 3xl, display font] [Edit Icon]         │
│  │  👤    │  📍 Location | 📅 Joined Date                    │
│  │ AVATAR │  "Tagline text..." (base text)                  │
│  └────────┘                                                  │
│   128×128px, -mt-16 overlap, 4px white border, sage ring    │
└─────────────────────────────────────────────────────────────┘
┌────────────────────┬────────────────────────────────────────┐
│  LEFT SIDEBAR      │     MAIN CONTENT (TABS)                │
│  (1 col)           │     (2 cols on lg)                     │
│                    │                                         │
│  ┌──────────────┐  │  ┌─────────────────────────────────┐  │
│  │ MISSION      │  │  │ [Impact] [Journey] [Learning]   │  │
│  │ [Target] sage│  │  │ [Service] [Network]             │  │
│  └──────────────┘  │  │ (rounded-full tabs)             │  │
│                    │  └─────────────────────────────────┘  │
│  ┌──────────────┐  │                                       │
│  │ CORE VALUES  │  │  TAB CONTENT AREA:                    │
│  │ terracotta   │  │  • Impact Stories                     │
│  └──────────────┘  │  • Experiences                        │
│                    │  • Education                          │
│  ┌──────────────┐  │  • Volunteering                       │
│  │ CAUSES       │  │  • Network Graph                      │
│  │ teal badges  │  │                                       │
│  └──────────────┘  │                                       │
│                    │                                       │
│  ┌──────────────┐  │                                       │
│  │ SKILLS       │  │                                       │
│  │ ochre badges │  │                                       │
│  └──────────────┘  │                                       │
└────────────────────┴────────────────────────────────────────┘
```

### Component Specifications

#### 1. Completion Banner

**When to show**: Only if profile completion < 80%

**Design**:
- Padding: p-6 (24px)
- Border: 2px solid rgba(122, 146, 120, 0.3)
- Background: Gradient from sage/5% → background → teal/5%
- Animation: Fade in from top, 0.6s duration (use Framer Motion or CSS)

**Content**:
- Icon: Sparkles, 6×6 (w-6 h-6), sage color, in 12×12 rounded circle with sage/10% bg
- Title: "Welcome to Proofound!" (lg, semibold)
- Completion %: Display in top-right (sm text, muted)
- Description: "Your profile is a space to share your impact, values, and growth journey..."
- Progress Bar: 2px height (h-2), value = completion percentage
- Tip: Compass icon + "Start by adding a photo, tagline, and your mission"

#### 2. Cover Image

**Dimensions**: Full width, h-48 (192px)

**Default Gradient** (when no custom cover):
```css
background: linear-gradient(to bottom right,
  rgb(122,146,120),
  rgb(92,139,137),
  rgb(212,165,116)
);
background-image: repeating-linear-gradient(
  45deg,
  transparent,
  transparent 10px,
  rgba(255,255,255,.05) 10px,
  rgba(255,255,255,.05) 20px
);
```

#### 3. Avatar

**Specifications**:
- Size: 128×128px (w-32 h-32)
- Position: Relative, -mt-16 (overlaps cover by 64px)
- Border: 4px white border
- Ring: 2px sage color with 2px ring-offset
- Shadow: shadow-lg
- Shape: Fully rounded (rounded-full)

**Default Icon** (when no avatar):
- User icon from lucide-react, 12×12 (w-12 h-12)
- Color: sage rgb(122, 146, 120)
- Background: #F5F3EE

#### 4. Profile Header Card

**Card Specs**:
- Padding: p-6 (24px)
- Border: 2px solid
- Background: Card background color
- Margin: -mt-16 mb-8 (overlaps cover, spacing below)

**Layout**:
- Flexbox: flex-col on mobile, sm:flex-row on tablet+
- Gap: gap-6
- Items: items-start

**Name Section**:
- Name: 3xl (1.875rem), font-display, semibold
- Edit Button: Ghost variant, sm size, h-8, Edit3 icon 3×3

**Metadata**:
- Layout: Horizontal flex, gap-4, wrap
- Text: sm (0.875rem), muted foreground
- Icons: MapPin, Calendar (4×4)
- Format: "📍 Location | 📅 Joined [date]"

**Tagline**:
- Text: base (1rem), foreground color
- Max width: max-w-3xl (48rem)
- Margin: mb-4

**Empty State** (no tagline):
- Border: 2px dashed, muted-foreground/20
- Hover: Border becomes sage/40%
- Padding: p-4
- Rounded: rounded-xl
- Icon: Edit3 (4×4)
- Cursor: pointer

#### 5. Left Sidebar Cards

**Common Specs** (all cards):
- Border: 2px solid
- Border radius: rounded-xl
- Spacing between cards: space-y-6
- Card padding: p-6

**Mission Card**:
- Icon: Target (5×5), sage color
- Title: "Mission" (lg, flex with icon)
- Content: sm text, muted-foreground, leading-relaxed
- Header padding: pb-3

**Empty State** (clickable):
- Border: 2px dashed, muted-foreground/20
- Hover: sage/40% border
- Icon: Target (5×5), sage
- Placeholder: Italic text explaining what to add
- Button: Ghost, sm, w-full, justify-start

**Core Values Card**:
- Title: "Core Values" (lg)
- Layout: Vertical stack, space-y-2

**Value Item**:
- Layout: flex items-center gap-2
- Padding: p-2
- Background: muted/20%
- Border radius: rounded-lg
- Icon: 4×4, terracotta color (icons: Heart, Sparkles, Users, Eye, Target, Shield, Leaf, Lightbulb, HandHeart)
- Label: sm text, flex-1
- Verified badge: CheckCircle2 (4×4), sage color

**Causes Card**:
- Icon: Sparkles (5×5), teal color
- Title: "Causes I Support"
- Layout: flex flex-wrap gap-2

**Cause Badge**:
- Style: rounded-full, px-3 py-1
- Background: rgba(92, 139, 137, 0.1)
- Border: rgba(92, 139, 137, 0.3)
- Text color: rgb(92, 139, 137)

**Skills Card**:
- Icon: Lightbulb (5×5), ochre color
- Title: "Skills & Expertise"
- Layout: flex flex-wrap gap-2

**Skill Badge**:
- Style: rounded-full, px-3 py-1
- Background: rgba(212, 165, 116, 0.1)
- Border: rgba(212, 165, 116, 0.3)
- Text color: rgb(212, 165, 116)
- Verified icon: CheckCircle2 (3×3), sage color (if verified)

#### 6. Tab Navigation

**Container**:
- Layout: grid grid-cols-5 (5 equal columns)
- Background: muted/30%
- Padding: p-1
- Border radius: rounded-full
- Width: w-full

**Tab Button**:
- Border radius: rounded-full
- Icon: 4×4 (w-4 h-4), mr-1
- Text size: xs on mobile, sm on sm+
- Text hidden on mobile, visible on sm+

**Tabs**:
1. **Impact** - Target icon, sage theme
2. **Journey** - Briefcase icon, terracotta theme
3. **Learning** - GraduationCap icon, teal theme
4. **Service** - HandHeart icon, terracotta theme
5. **Network** - Network icon, sage theme

#### 7. Impact Stories (Tab Content)

**Empty State**:
- Padding: p-12
- Border: 2px dashed, muted-foreground/20
- Center aligned

**Icon Container**:
- Size: 32×32 (w-32 h-32) rounded circle
- Gradient: sage/10% → teal/10%
- Icon: Custom SVG - circle with plus sign (20×20), sage color

**SVG Code**:
```html
<svg viewBox="0 0 100 100" className="w-20 h-20">
  <circle cx="50" cy="50" r="30" fill="none"
    stroke="#7A9278" strokeWidth="1.5" strokeDasharray="4 4"/>
  <path d="M 50 30 L 50 70 M 30 50 L 70 50"
    stroke="#7A9278" strokeWidth="1.5" opacity="0.6"/>
</svg>
```

**Content**:
- Title: lg, semibold
- Description: sm, muted, max-w-md, centered
- Button: rounded-full, sage background
- Button text: "Add Your First Impact Story"
- Tip: "💡 Tip: Include context about the organization, your role, and measurable outcomes"

**Impact Story Card**:
- Padding: p-6
- Border: 2px solid
- Hover: border-sage/30%
- Transition: colors
- Position: relative (for delete button)

**Delete Button** (editable mode):
- Position: absolute top-4 right-4
- Opacity: 0, group-hover:opacity-100
- Variant: ghost, size: icon
- Icon: X (4×4)

**Story Header**:
- Title: xl, font-display, semibold
- Verified Badge: sage/10% bg, sage/30% border, sage text, CheckCircle2 icon (3×3)
- Organization: sm text, muted, mb-1
- Timeline: xs text, muted, Calendar icon (3×3)

**Story Sections** (space-y-4):

1. **Impact Section**:
   - Label: "Impact" (sm, medium weight, muted, mb-2)
   - Content: sm text

2. **Business Value Section**:
   - Label: "Business Value" (sm, medium weight, muted, mb-2)
   - Content: sm text

3. **Outcomes Section** (highlighted):
   - Container: p-4, bg-muted/20, rounded-xl
   - Label: "Outcomes" (sm, medium weight, muted, mb-2)
   - Content: sm text

#### 8. Journey/Experiences (Tab Content)

**Empty State**:
- Icon container: 32×32, gradient terracotta/10% → ochre/10%
- SVG: Growth path with dots

**SVG Code**:
```html
<svg viewBox="0 0 100 100" className="w-20 h-20">
  <path d="M 20 70 Q 35 40, 50 50 T 80 30" fill="none"
    stroke="#C67B5C" strokeWidth="2" strokeDasharray="4 4"/>
  <circle cx="20" cy="70" r="5" fill="#C67B5C"/>
  <circle cx="50" cy="50" r="5" fill="#D4A574"/>
  <circle cx="80" cy="30" r="5" fill="#7A9278"/>
</svg>
```

**Experience Card**:
- Layout: flex items-start gap-4
- Padding: p-6
- Border: 2px, hover: sage/30%

**Icon Container**:
- Size: 12×12 (w-12 h-12) rounded-full
- Background: muted/30%
- Icon: Briefcase (5×5), terracotta color

**Content**:
- Title: lg, font-display, semibold
- Verified: CheckCircle2 (4×4), sage color (if verified)
- Organization: sm, muted, mb-1
- Duration: xs, muted, mb-4

**Sections** (space-y-3):

1. **What I Learned**:
   - Label: xs, medium weight, muted, flex items-center
   - Icon: Lightbulb (3×3)
   - Content: sm text

2. **How I Grew**:
   - Label: xs, medium weight, muted, flex items-center
   - Icon: TrendingUp (3×3)
   - Content: sm text

#### 9. Learning/Education (Tab Content)

**Empty State**:
- Icon container: 32×32, gradient teal/10% → sage/10%
- Icon: GraduationCap (16×16), teal/60%
- Button: rounded-full, teal background

**Education Card**:
- Same layout as Experience Card
- Icon: GraduationCap (5×5), teal color

**Sections** (space-y-3):

1. **Skills Gained**:
   - Label: xs, medium weight, muted
   - Content: sm text

2. **Meaningful Projects**:
   - Label: xs, medium weight, muted
   - Content: sm text

#### 10. Service/Volunteering (Tab Content)

**Empty State**:
- Icon container: 32×32, gradient terracotta/10% → sage/10%
- Icon: HandHeart (16×16), terracotta/60%
- Button: rounded-full, terracotta background

**Volunteer Card**:
- Same layout as Experience Card
- Icon: HandHeart (5×5), terracotta color

**Sections** (space-y-3):

1. **Personal Connection** (HIGHLIGHTED):
   - Container: p-3, rounded-lg, border
   - Background: rgba(198, 123, 92, 0.05)
   - Border: rgba(198, 123, 92, 0.2)
   - Icon: HandHeart (3×3), terracotta color
   - Label: "Personal Connection" (xs, muted)
   - Cause: sm text, medium weight, mb-2
   - Personal Why: xs text, muted, italic

2. **Impact Made**:
   - Label: xs, medium weight, muted
   - Content: sm text

3. **Skills Deployed**:
   - Label: xs, medium weight, muted
   - Content: sm text

#### 11. Network Tab (Tab Content)

**Layout**: Center-aligned, p-8

**Header**:
- Icon: Network (16×16), sage color, centered, mb-4
- Title: "Living Network" (2xl, font-display, semibold, mb-2)
- Description: sm text, muted, max-w-2xl, centered

**Statistics Grid**:
- Layout: grid grid-cols-1 sm:grid-cols-3, gap-6, mb-6

**Stat Card**:
- Padding: p-4
- Background: muted/20%
- Rounded: xl
- Center-aligned

**Three Stats**:

1. **People**:
   - Icon: User (6×6), sage color
   - Label: "People" (sm, muted)
   - Count: 2xl, semibold
   - Sublabel: "Active connections" (xs, muted)

2. **Organizations**:
   - Icon: Briefcase (6×6), terracotta color
   - Label: "Organizations" (sm, muted)
   - Count: 2xl, semibold
   - Sublabel: "Active connections" (xs, muted)

3. **Institutions**:
   - Icon: GraduationCap (6×6), teal color
   - Label: "Institutions" (sm, muted)
   - Count: 2xl, semibold
   - Sublabel: "Active connections" (xs, muted)

**Action Button**:
- Text: "Visualize Network Graph"
- Icon: Network (4×4), mr-2
- Style: rounded-full, sage background
- Help text below: xs, muted, mt-3

---

## PART 2: ORGANIZATION PROFILE PAGE

Much simpler form-based layout.

### Data Structure

```typescript
interface Organization {
  id: string;
  slug: string;                    // URL slug
  displayName: string;             // Organization name
  legalName: string | null;        // Optional legal name
  mission: string | null;          // Mission statement (max 2000 chars)
  website: string | null;          // Website URL
  type: 'nonprofit' | 'for-profit' | 'government' | 'other';
}

interface Membership {
  role: 'owner' | 'admin' | 'member';
}
```

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  MAX-WIDTH: 3xl (48rem), CENTERED                   │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ HEADER                                         │ │
│  │ Organization Profile (4xl, display, semibold)  │ │
│  │ Update/View organization information (base)    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ CARD: Basic Information                        │ │
│  │                                                │ │
│  │ [Organization Name]                            │ │
│  │ [Legal Name (Optional)]                        │ │
│  │ [Mission Statement] (textarea, 120px min)      │ │
│  │ [Website]                                      │ │
│  │                                                │ │
│  │ [Save Changes Button] (if canEdit)             │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ CARD: Organization Details (Read-Only)         │ │
│  │                                                │ │
│  │ URL Slug                                       │ │
│  │ your-org-slug                                  │ │
│  │ Your organization URL: /app/o/your-org-slug   │ │
│  │                                                │ │
│  │ Type                                           │ │
│  │ nonprofit (capitalized)                        │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Component Specifications

#### Page Container
- Max width: max-w-3xl
- Center: mx-auto
- Spacing: space-y-8 (2rem between sections)

#### Header Section
- Title: "Organization Profile"
  - Size: 4xl (2.25rem)
  - Font: font-display
  - Weight: semibold
  - Color: Use sage color (#7A9278) or primary-500
  - Margin: mb-2
- Subtitle: Dynamic based on permissions
  - If canEdit: "Update your organization information"
  - Else: "View organization information"
  - Color: text-neutral-dark-600 or muted

#### Basic Information Card

**Card Structure**:
- Component: Card with CardHeader and CardContent
- CardHeader: "Basic Information"
- CardContent: Form with space-y-6

**Form Fields**:

1. **Organization Name**:
   - Label: "Organization Name"
   - Input type: text
   - Name: displayName
   - Placeholder: "Organization Name"
   - Disabled if !canEdit

2. **Legal Name**:
   - Label: "Legal Name (Optional)"
   - Input type: text
   - Name: legalName
   - Placeholder: "Legal company name"
   - Disabled if !canEdit

3. **Mission Statement**:
   - Label: "Mission Statement"
   - Component: textarea
   - Name: mission
   - Min height: 120px
   - Placeholder: "Describe your organization's mission and goals"
   - Max length: 2000
   - Disabled if !canEdit
   - Styling:
     - Rounded: rounded-lg
     - Border: border border-neutral-light-300 (or muted)
     - Background: bg-white
     - Padding: px-4 py-2
     - Text: text-base
     - Transitions: transition-colors
     - Focus: ring-2 ring-primary-300, border-primary-500
     - Placeholder: placeholder:text-neutral-dark-400

4. **Website**:
   - Label: "Website"
   - Input type: url
   - Name: website
   - Placeholder: "https://your-organization.com"
   - Disabled if !canEdit

**Save Button**:
- Only show if canEdit
- Text: "Save Changes"
- Type: submit

#### Organization Details Card

**Card Structure**:
- Component: Card with CardHeader and CardContent
- CardHeader: "Organization Details"
- CardContent: space-y-4

**Fields** (Read-only):

1. **URL Slug**:
   - Label: "URL Slug" (sm, medium weight, text-neutral-dark-700)
   - Value: Display slug (text-neutral-dark-600)
   - Help text: "Your organization URL: /app/o/{slug}" (xs, text-neutral-dark-500, mt-1)

2. **Type**:
   - Label: "Type" (sm, medium weight, text-neutral-dark-700)
   - Value: Display type capitalized (text-neutral-dark-600)

---

## RESPONSIVE DESIGN

### Breakpoints
- Mobile: < 640px (sm)
- Tablet: ≥ 640px (sm)
- Desktop: ≥ 1024px (lg)

### Individual Profile Responsive Rules

**Mobile** (< sm):
- Header: flex-col (stack vertically)
- Avatar: Centered above name
- Sidebar: Full width, stacks above tabs
- Tabs: Icons only (hide text)
- Tab text: hidden (use `hidden sm:inline`)
- Grid: Single column

**Tablet** (≥ sm):
- Header: flex-row (side by side)
- Tab text: Visible
- Sidebar: Still full width, above content

**Desktop** (≥ lg):
- Grid: `lg:grid-cols-3` (1 sidebar : 2 content)
- Sidebar: Fixed left column
- Max width: max-w-7xl (80rem)
- Padding: px-4 sm:px-6 lg:px-8

### Organization Profile Responsive Rules

- Always max-w-3xl (48rem)
- Always centered with mx-auto
- Maintains single column on all screen sizes
- Form inputs stack vertically

---

## ANIMATIONS

### Completion Banner (Framer Motion)
```javascript
initial={{ opacity: 0, y: -20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Hover Transitions
- All cards: `transition-colors`
- Hover border: Change to brand color at 30% opacity
- Delete button: `transition-opacity`
- Empty states: Dashed border becomes solid on hover

### Card Hover States
- Impact/Experience/Education/Volunteer cards: `hover:border-[rgb(122,146,120)]/30`
- Empty state cards: `hover:border-[BRAND_COLOR]/40`

---

## ACCESSIBILITY

1. **Keyboard Navigation**:
   - All buttons, links, and cards are keyboard accessible
   - Use proper button/link elements, not divs
   - Tab order follows visual hierarchy

2. **Click Handlers on Divs**:
   - Add `role="button"`
   - Add `tabIndex={0}`
   - Handle Enter and Space keys:
   ```javascript
   onKeyDown={(e) => {
     if (e.key === 'Enter' || e.key === ' ') {
       e.preventDefault();
       handler();
     }
   }}
   ```

3. **Icons with Text**:
   - Always pair icons with visible or aria-label text
   - Use proper semantic HTML

4. **Focus States**:
   - Use `focus-visible:outline-none`
   - Use `focus-visible:ring-2` with primary color

5. **Color Contrast**:
   - All text meets WCAG AA standards
   - Muted text uses opacity on base text color

---

## DEPENDENCIES

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "lucide-react": "^0.263.1",         // For all icons
    "framer-motion": "^10.0.0",         // For animations
    "@radix-ui/react-avatar": "^1.0.0", // Avatar component
    "@radix-ui/react-tabs": "^1.0.0",   // Tabs component
    "@radix-ui/react-progress": "^1.0.0", // Progress bar
    "@radix-ui/react-dialog": "^1.0.0"  // Modals (for forms)
  }
}
```

Or use shadcn/ui which includes all Radix UI components pre-styled.

---

## IMPLEMENTATION NOTES

### For Individual Profile:

1. Start with the layout structure (hero + sidebar + tabs)
2. Implement sidebar cards first (simplest)
3. Add tab navigation
4. Implement tab content with empty states
5. Add actual content cards
6. Add edit functionality (modals/forms)
7. Add animations last

### For Organization Profile:

1. Create page container with max-width
2. Add header section
3. Create Basic Information card with form
4. Create Organization Details card (read-only)
5. Add form submission handler
6. Add permission checks (canEdit)

### State Management:

- Use React Context or custom hook for profile data
- Store profile data in state
- Implement CRUD operations (Create, Read, Update, Delete)
- Use optimistic updates for better UX

### Image Handling:

- Accept Base64 or URLs for avatar/cover
- Implement client-side image compression before upload
- Show preview before saving
- Handle errors gracefully

---

## EXAMPLE DATA

### Individual Profile Sample:

```json
{
  "basicInfo": {
    "name": "Jane Doe",
    "tagline": "Social entrepreneur focused on education equity",
    "location": "San Francisco, CA",
    "joinedDate": "January 2024",
    "avatar": null,
    "coverImage": null
  },
  "mission": "Empowering underserved communities through education and technology",
  "values": [
    { "id": "1", "icon": "Heart", "label": "Compassion", "verified": true },
    { "id": "2", "icon": "Sparkles", "label": "Innovation", "verified": false }
  ],
  "causes": ["Education", "Climate Action", "Social Justice"],
  "skills": [
    { "id": "1", "name": "Project Management", "verified": true },
    { "id": "2", "name": "Strategic Planning", "verified": false }
  ],
  "impactStories": [
    {
      "id": "1",
      "title": "Built Education Platform",
      "orgDescription": "EdTech Nonprofit",
      "impact": "Reached 10,000 students in underserved communities",
      "businessValue": "Increased literacy rates by 25%",
      "outcomes": "Platform now used by 50 schools",
      "timeline": "Jan 2023 - Dec 2023",
      "verified": true
    }
  ],
  "experiences": [],
  "education": [],
  "volunteering": []
}
```

### Organization Profile Sample:

```json
{
  "id": "org-123",
  "slug": "impact-collective",
  "displayName": "Impact Collective",
  "legalName": "Impact Collective Inc.",
  "mission": "Creating sustainable solutions for social impact",
  "website": "https://impactcollective.org",
  "type": "nonprofit"
}
```

---

## DESIGN PHILOSOPHY

The Proofound profile pages emphasize:

1. **Storytelling over credentials**: Focus on impact, growth, and values rather than job titles
2. **Human connection**: Personal "why" and motivations are highlighted
3. **Verification**: Optional verification badges for credibility
4. **Visual hierarchy**: Color-coded sections with consistent iconography
5. **Progressive disclosure**: Empty states guide users to add content
6. **Accessibility first**: Keyboard navigation, proper contrast, semantic HTML
7. **Responsive beauty**: Looks great on all devices

---

## FINAL CHECKLIST

Before considering the implementation complete:

### Individual Profile:
- [ ] Cover image with gradient default
- [ ] Avatar with 128×128px, proper overlapping and ring
- [ ] Profile header with name, location, joined date, tagline
- [ ] Completion banner (if < 80%)
- [ ] Mission card (left sidebar)
- [ ] Values card with icons (left sidebar)
- [ ] Causes badges (left sidebar)
- [ ] Skills badges (left sidebar)
- [ ] 5 tabs: Impact, Journey, Learning, Service, Network
- [ ] Empty states for all tabs with SVG illustrations
- [ ] Content cards for Impact Stories
- [ ] Content cards for Experiences
- [ ] Content cards for Education
- [ ] Content cards for Volunteering
- [ ] Network statistics tab
- [ ] All colors match exact values from color palette
- [ ] Responsive on mobile, tablet, desktop
- [ ] Hover states on all interactive elements
- [ ] Keyboard accessible
- [ ] Delete buttons appear on card hover

### Organization Profile:
- [ ] Header with title and subtitle
- [ ] Basic Information card with 4 fields
- [ ] Mission textarea with 120px min height, 2000 max length
- [ ] Save Changes button (only if canEdit)
- [ ] Organization Details card (read-only)
- [ ] URL slug display with help text
- [ ] Type display (capitalized)
- [ ] Form disabled if user cannot edit
- [ ] Max width 3xl, centered
- [ ] Proper spacing between sections

---

**END OF MASTER PROMPT**

Copy everything above this line to recreate the Proofound profile pages identically on any platform.
