# Profile Page Specifications

## Overview

The Proofound platform features two types of profile pages:
1. **Individual Profile Page** (`/app/i/profile`) - For individual users
2. **Organization Profile Page** (`/app/o/[slug]/profile`) - For organizations

This document focuses on the Individual Profile Page, which is a comprehensive, editable profile showcasing a user's mission, values, impact stories, experiences, education, and volunteer work.

---

## File Structure

### Main Components

```
src/
├── app/
│   └── app/
│       ├── i/
│       │   └── profile/
│       │       └── page.tsx                    # Individual profile route
│       └── o/
│           └── [slug]/
│               └── profile/
│                   └── page.tsx                # Organization profile route
├── components/
│   └── profile/
│       ├── EditableProfileView.tsx             # Main editable profile component
│       ├── ProfileView.tsx                     # Read-only profile view
│       ├── AvatarUpload.tsx                    # Avatar upload/edit
│       ├── CoverUpload.tsx                     # Cover image upload/edit
│       ├── EditProfileModal.tsx                # Basic info editor
│       ├── MissionCard.tsx                     # Mission display card
│       ├── MissionEditor.tsx                   # Mission editor modal
│       ├── ValuesCard.tsx                      # Values display card
│       ├── ValuesEditor.tsx                    # Values editor modal
│       ├── CausesCard.tsx                      # Causes display card
│       ├── CausesEditor.tsx                    # Causes editor modal
│       ├── SkillsCard.tsx                      # Skills display card
│       ├── SkillsEditor.tsx                    # Skills editor modal
│       └── forms/
│           ├── ImpactStoryForm.tsx             # Impact story form
│           ├── ExperienceForm.tsx              # Experience form
│           ├── EducationForm.tsx               # Education form
│           └── VolunteerForm.tsx               # Volunteer work form
├── types/
│   └── profile.ts                              # TypeScript type definitions
├── hooks/
│   └── useProfileData.ts                       # Profile data management hook
└── actions/
    └── profile.ts                              # Server actions for profile CRUD
```

---

## Visual Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     COMPLETION BANNER                        │
│               (shown when profile < 80% complete)            │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      COVER IMAGE                             │
│              (gradient with pattern overlay)                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  ┌────┐                                                      │
│  │    │  [Name] [Edit Button]                               │
│  │ 👤 │  📍 Location | 📅 Joined Date                        │
│  │    │  "Tagline text goes here..."                        │
│  └────┘                                                      │
│         AVATAR                                               │
└─────────────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────────────┐
│   LEFT SIDEBAR   │        MAIN CONTENT (TABS)               │
│                  │                                           │
│  • Mission       │  [Impact] [Journey] [Learning]           │
│  • Core Values   │  [Service] [Network]                     │
│  • Causes        │                                           │
│  • Skills        │  Tab Content Area:                       │
│                  │  - Impact Stories                        │
│                  │  - Experiences                           │
│                  │  - Education                             │
│                  │  - Volunteering                          │
│                  │  - Network Statistics                    │
└──────────────────┴──────────────────────────────────────────┘
```

### Color Palette

Based on the Proofound design system (`docs/STYLEMAP.md`):

| Element          | Color Name     | Hex Value | RGB Value        | Usage                           |
|------------------|----------------|-----------|------------------|---------------------------------|
| Primary (Person) | Sage Green     | #7A9278   | rgb(122,146,120) | Primary buttons, icons, accents |
| Secondary (Org)  | Terracotta     | #C67B5C   | rgb(198,123,92)  | Organization-related elements   |
| Tertiary (Gov)   | Teal           | #5C8B89   | rgb(92,139,137)  | Education, government elements  |
| Accent           | Ochre          | #D4A574   | rgb(212,165,116) | Skills, additional accents      |
| Background       | Warm Cream     | #F5F3EE   | rgb(245,243,238) | Page background                 |
| Card Background  | Off-White      | #FDFCFA   | rgb(253,252,250) | Card backgrounds                |
| Text Primary     | Dark Brown     | #2C2A27   | rgb(44,42,39)    | Primary text                    |
| Text Muted       | N/A            | N/A       | N/A              | Secondary text (uses opacity)   |

---

## Component Specifications

### 1. Hero Section

#### Cover Image
- **Dimensions**: Full width, 192px height (h-48)
- **Default**: Gradient from sage → teal → ochre with diagonal stripe pattern
- **Pattern**: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)`
- **Editable**: Yes, via `CoverUpload` component
- **Upload format**: Base64 encoded images

#### Avatar
- **Dimensions**: 128px × 128px (w-32 h-32)
- **Position**: Overlaps cover image by -64px (relative -mt-16)
- **Border**: 4px white border + 2px sage ring with 2px offset
- **Default Icon**: User icon (lucide-react) in sage color
- **Background**: Warm cream (#F5F3EE)
- **Editable**: Yes, via `AvatarUpload` component
- **Shape**: Circular (fully rounded)

#### Profile Header Card
- **Padding**: 24px (p-6)
- **Border**: 2px solid
- **Background**: Card background color
- **Layout**: Flexbox (column on mobile, row on desktop)

##### Name & Edit Button
- **Typography**:
  - Size: 3xl (1.875rem)
  - Weight: Semibold
  - Font: Display font family
- **Edit Button**:
  - Ghost variant
  - Size: sm (h-8)
  - Icon: Edit3 (3×3, w-3 h-3)

##### Location & Join Date
- **Typography**: Small text (text-sm)
- **Color**: Muted foreground
- **Icons**: MapPin, Calendar (4×4, w-4 h-4)
- **Layout**: Horizontal flex with gap-4
- **Spacing**: 4-unit gap between items

##### Tagline
- **Typography**: Base text size (text-base)
- **Color**: Foreground
- **Max Width**: 3xl (48rem)
- **Empty State**: Dashed border card with hover effect

---

### 2. Completion Banner

**Displayed When**: Profile completion < 80%

#### Visual Elements
- **Animation**: Fade in from top (framer-motion)
- **Duration**: 0.6 seconds
- **Background**: Gradient from sage/5% → background → teal/5%
- **Border**: 2px sage/30%
- **Padding**: 24px (p-6)

#### Content
- **Icon**: Sparkles (6×6, w-6 h-6) in sage color
- **Icon Background**: 12×12 rounded circle, sage/10%
- **Title**: "Welcome to Proofound!"
- **Progress Percentage**: Displayed in top-right
- **Progress Bar**: 2px height (h-2)
- **Tip Icon**: Compass (3×3)

---

### 3. Left Sidebar Cards

Common specifications for all sidebar cards:

#### Card Container
- **Border**: 2px solid
- **Border Radius**: xl (rounded-xl)
- **Spacing**: 6-unit gap between cards (space-y-6)

#### Empty State (Clickable)
- **Border**: 2px dashed, muted-foreground/20
- **Hover**: Border becomes brand color at 40% opacity
- **Cursor**: Pointer
- **Transition**: Colors transition smoothly

#### Mission Card
- **Icon**: Target (5×5) in sage color
- **Title**: "Mission"
- **Content**: Small text, muted foreground, relaxed leading
- **File**: `src/components/profile/MissionCard.tsx:1`

#### Core Values Card
- **Title**: "Core Values"
- **Icons**: Multiple (Heart, Sparkles, Users, Eye, Target, Shield, Leaf, Lightbulb, HandHeart)
- **Icon Color**: Terracotta (#C67B5C)
- **Layout**: Vertical stack with 2-unit spacing
- **Item Background**: Muted/20%
- **Item Padding**: 2 (p-2)
- **Verified Badge**: CheckCircle2 in sage color
- **File**: `src/components/profile/ValuesCard.tsx:1`

#### Causes Card
- **Icon**: Sparkles (5×5) in teal color
- **Title**: "Causes I Support"
- **Layout**: Tag-style badges
- **Empty State**: Hover border color: teal/40%

#### Skills Card
- **Icon**: Wrench/Lightbulb (5×5) in ochre color
- **Title**: "Skills & Expertise"
- **Badge Style**:
  - Rounded full (fully rounded pills)
  - Background: ochre/10%
  - Border: ochre/30%
  - Text: ochre color
  - Padding: 3×1 (px-3 py-1)
- **Layout**: Flex wrap with 2-unit gap
- **File**: `src/components/profile/SkillsCard.tsx:1`

---

### 4. Main Content Tabs

#### Tab Navigation
- **Layout**: 5 equal columns (grid-cols-5)
- **Style**: Rounded full (fully rounded)
- **Background**: Muted/30%
- **Padding**: 1 (p-1)
- **Icons**: 4×4 (w-4 h-4)
- **Text**: Hidden on small screens, visible on sm and up

#### Tab List
1. **Impact** - Target icon, sage theme
2. **Journey** - Briefcase icon, terracotta theme
3. **Learning** - GraduationCap icon, teal theme
4. **Service** - HandHeart icon, terracotta theme
5. **Network** - Network icon, sage theme

---

### 5. Tab Content: Impact Stories

#### Empty State
- **Container**: 12-unit padding (p-12)
- **Border**: 2px dashed
- **Icon Container**: 32×32 rounded circle
- **Icon**: Custom SVG (circle with plus sign)
- **Gradient**: sage/10% → teal/10%
- **Button**: Sage background with hover effect
- **Tip Section**: Small text at bottom with lightbulb emoji

#### Impact Story Card
- **Padding**: 24px (p-6)
- **Border**: 2px solid, hover: sage/30%
- **Transition**: Colors
- **Delete Button**:
  - Position: Absolute top-4 right-4
  - Opacity: 0 → 100 on hover
  - Icon: X (4×4)

##### Story Header
- **Title**: xl, display font, semibold
- **Verified Badge**:
  - Background: sage/10%
  - Border: sage/30%
  - Text: sage color
  - Icon: CheckCircle2 (3×3)
- **Organization**: Small text, muted
- **Timeline**: Extra small text with Calendar icon (3×3)

##### Story Content Sections
1. **Impact**
   - Label: Small, medium weight, muted
   - Content: Small text

2. **Business Value**
   - Label: Small, medium weight, muted
   - Content: Small text

3. **Outcomes** (Highlighted)
   - Container: muted/20% background, rounded-xl, 4-unit padding
   - Label: Small, medium weight, muted
   - Content: Small text

---

### 6. Tab Content: Journey (Experiences)

#### Empty State
- **Icon Container**: 32×32 rounded circle
- **Gradient**: terracotta/10% → ochre/10%
- **Icon**: Custom SVG (path with dots - growth journey visualization)
- **Button**: Terracotta background

#### Experience Card
- **Layout**: Horizontal flex with icon + content
- **Icon Container**: 12×12 rounded circle, muted/30% background
- **Icon**: Briefcase (5×5) in terracotta color

##### Content Structure
- **Title**: lg, display font, semibold
- **Organization**: Small text, muted
- **Duration**: Extra small text, muted
- **Sections**:
  1. **What I Learned** - Lightbulb icon (3×3)
  2. **How I Grew** - TrendingUp icon (3×3)

---

### 7. Tab Content: Learning (Education)

#### Empty State
- **Icon Container**: 32×32 rounded circle
- **Gradient**: teal/10% → sage/10%
- **Icon**: GraduationCap (16×16) in teal/60%
- **Button**: Teal background

#### Education Card
- **Icon**: GraduationCap (5×5) in teal color
- **Icon Container**: 12×12 rounded circle, muted/30%

##### Content Structure
- **Title**: lg, display font, semibold (degree)
- **Institution**: Small text, muted
- **Duration**: Extra small text, muted
- **Sections**:
  1. **Skills Gained** - Extra small label
  2. **Meaningful Projects** - Extra small label

---

### 8. Tab Content: Service (Volunteering)

#### Empty State
- **Icon Container**: 32×32 rounded circle
- **Gradient**: terracotta/10% → sage/10%
- **Icon**: HandHeart (16×16) in terracotta/60%
- **Button**: Terracotta background

#### Volunteer Card
- **Icon**: HandHeart (5×5) in terracotta color
- **Icon Container**: 12×12 rounded circle, muted/30%

##### Content Structure
- **Title**: lg, display font, semibold
- **Organization**: Small text, muted
- **Duration**: Extra small text, muted
- **Personal Connection Section** (Highlighted):
  - Background: terracotta/5%
  - Border: terracotta/20%
  - Padding: 3 (p-3)
  - Icon: HandHeart (3×3) in terracotta
  - Cause: Small text, medium weight
  - Personal Why: Extra small text, muted, italic
- **Impact Made**: Small text
- **Skills Deployed**: Small text

---

### 9. Tab Content: Network

#### Layout
- **Center Alignment**: All content centered
- **Icon**: Network (16×16) in sage color
- **Title**: 2xl, display font, semibold
- **Description**: Small text, muted, max-width 2xl

#### Statistics Grid
- **Layout**: 3 columns on desktop, 1 on mobile
- **Gap**: 6 units
- **Card Style**:
  - Center alignment
  - Padding: 4 (p-4)
  - Background: muted/20%
  - Rounded: xl

##### Stat Cards
1. **People**
   - Icon: User (6×6) in sage
   - Count: 2xl font, semibold
   - Label: "Active connections"

2. **Organizations**
   - Icon: Briefcase (6×6) in terracotta
   - Count: 2xl font, semibold
   - Label: "Active connections"

3. **Institutions**
   - Icon: GraduationCap (6×6) in teal
   - Count: 2xl font, semibold
   - Label: "Active connections"

#### Action Button
- **Text**: "Visualize Network Graph"
- **Icon**: Network (4×4)
- **Style**: Rounded full, sage background
- **Help Text**: Extra small, muted, margin-top 3

---

## Data Model

### Type Definitions

Located in `src/types/profile.ts:1`

```typescript
interface BasicInfo {
  name: string;
  tagline: string | null;
  location: string | null;
  joinedDate: string;
  avatar: string | null;        // Base64 or URL
  coverImage: string | null;     // Base64 or URL
}

interface Value {
  id: string;
  icon: string;                  // Icon name from lucide-react
  label: string;
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
  orgDescription: string;
  impact: string;
  businessValue: string;
  outcomes: string;
  timeline: string;
  verified: boolean | null;
}

interface Experience {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  learning: string;
  growth: string;
  verified: boolean | null;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  duration: string;
  skills: string;
  projects: string;
  verified: boolean | null;
}

interface Volunteering {
  id: string;
  title: string;
  orgDescription: string;
  duration: string;
  cause: string;
  impact: string;
  skillsDeployed: string;
  personalWhy: string;
  verified: boolean | null;
}

interface ProfileData {
  basicInfo: BasicInfo;
  mission: string | null;
  values: Value[];
  causes: string[];
  skills: Skill[];
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
}
```

---

## Interactive Elements

### Editing Features

#### Inline Editing
- **Avatar**: Click to upload new image
- **Cover**: Click to upload new cover image
- **Cards**: Click entire card to open editor (Mission, Values, Causes, Skills)

#### Modal/Form Editors
- **Edit Profile**: Opens `EditProfileModal` for name, tagline, location
- **Mission Editor**: Full-screen or modal editor for mission statement
- **Values Editor**: Multi-select with icon picker
- **Causes Editor**: Tag-based input
- **Skills Editor**: Tag-based input with verification support

#### Content Forms
- **Impact Story**: Multi-field form with title, organization, impact, business value, outcomes, timeline
- **Experience**: Form with title, organization, duration, learning, growth
- **Education**: Form with institution, degree, duration, skills, projects
- **Volunteer**: Form with title, organization, duration, cause, impact, skills, personal connection

### Hover States
- **Cards**: Border color changes to brand color at 30% opacity
- **Empty States**: Dashed border becomes more prominent (40% opacity)
- **Delete Buttons**: Fade in on card hover (opacity 0 → 100)
- **Links/Buttons**: Smooth transitions on all interactive elements

### Animations
- **Completion Banner**: Fade in from top with y-translation
- **Duration**: 0.6 seconds
- **Easing**: Default (ease-out)
- **Library**: Framer Motion

---

## Responsive Design

### Breakpoints
- **Mobile**: Default (< 640px)
- **Tablet**: sm (≥ 640px)
- **Desktop**: lg (≥ 1024px)

### Mobile Adjustments
- **Header**: Column layout instead of row
- **Avatar**: Centered on mobile
- **Sidebar**: Full width, stacks above main content
- **Tabs**: Icons only, text hidden
- **Statistics**: Single column grid

### Desktop Enhancements
- **Grid Layout**: 1:2 ratio (sidebar:content)
- **Max Width**: 7xl (80rem) with auto margins
- **Padding**: Horizontal padding scales (px-4 sm:px-6 lg:px-8)

---

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows visual hierarchy
- Enter/Space activates clickable cards

### ARIA Labels
- Buttons have descriptive labels
- Icons paired with text or aria-labels
- Forms have proper label associations

### Focus States
- Focus ring on all interactive elements
- Focus visible utilities applied
- Focus ring color: primary-300

### Color Contrast
- Text meets WCAG AA standards
- All interactive elements have sufficient contrast
- Verified badges use contrasting colors

---

## Performance Considerations

### Image Handling
- Avatar and cover images stored as Base64 or URLs
- Client-side image optimization before upload
- Lazy loading for tab content

### State Management
- Profile data managed via custom hook (`useProfileData`)
- Local storage for draft changes
- Optimistic UI updates

### Code Splitting
- Form components loaded on-demand
- Tab content rendered conditionally
- Modal components lazy-loaded

---

## File References

### Key Components
- Individual Profile Page: `src/app/app/i/profile/page.tsx:1`
- Organization Profile Page: `src/app/app/o/[slug]/profile/page.tsx:1`
- Editable Profile View: `src/components/profile/EditableProfileView.tsx:1`
- Read-Only Profile View: `src/components/profile/ProfileView.tsx:1`
- Type Definitions: `src/types/profile.ts:1`

### Style Documentation
- Design System: `docs/STYLEMAP.md:1`
- Color Tokens: Documented in STYLEMAP
- Tailwind Configuration: `tailwind.config.ts`

---

## Future Enhancements

### Planned Features
1. **Network Graph Visualization**: Interactive D3.js visualization
2. **Verification System**: Third-party verification for impact stories
3. **Export Profile**: PDF/resume generation
4. **Profile Analytics**: View statistics and engagement
5. **Privacy Controls**: Granular visibility settings
6. **Dark Mode**: Full dark theme support (tokens prepared)

### Design Improvements
1. **Animations**: More sophisticated transitions between states
2. **Microinteractions**: Subtle animations on hover/click
3. **Loading States**: Skeleton screens for better perceived performance
4. **Empty States**: More engaging illustrations

---

## Development Guidelines

### Adding New Profile Sections
1. Define TypeScript interface in `src/types/profile.ts`
2. Create display card component
3. Create editor/form component
4. Add to `ProfileData` interface
5. Update `useProfileData` hook
6. Add tab in `EditableProfileView`
7. Update profile completion calculation

### Styling Best Practices
- Use design tokens from `docs/STYLEMAP.md`
- Follow the brand color scheme (sage, terracotta, teal, ochre)
- Maintain consistent spacing (4px, 8px, 12px, 16px, 24px)
- Use semantic color names (not hex values in components)
- Apply hover states to all interactive elements

### Testing Considerations
- Test with empty profile data
- Test with fully populated profile
- Test image upload functionality
- Test form validation
- Test responsive layouts
- Test keyboard navigation
- Test accessibility with screen readers

---

## Summary

The Proofound profile page is a comprehensive, editable interface that emphasizes impact, values, and meaningful connections over traditional resume-style listings. The design uses a warm, organic color palette and focuses on storytelling through structured content sections. The implementation follows modern React patterns with TypeScript for type safety, shadcn/ui for consistent UI components, and Framer Motion for smooth animations.
