# Individual Profile States Documentation

**Last Updated:** October 27, 2025  
**Purpose:** Documentation of empty vs filled profile states for individual accounts  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

Individual profiles in Proofound serve as trust-building portfolios that emphasize impact, values, and verified expertise. This document contrasts the **empty state** (new user experience) with the **filled state** (complete profile) to guide implementation and user onboarding.

---

## Visual State Comparison

### Empty State Goals
- **Encourage completion** with clear CTAs and helper text
- **Explain value** of each section (why add this?)
- **Progressive disclosure** - prioritize essential sections
- **Non-intimidating** - use friendly language and guidance

### Filled State Goals
- **Showcase credibility** through verified proofs and endorsements
- **Tell a story** - journey, values, and impact narrative
- **Enable matching** - complete data for algorithm
- **Build trust** - transparency and anti-bias design

---

## Profile Completion Indicator

### Empty State (5% complete)
```
┌─────────────────────────────────────────────────────────────┐
│ ✨ Welcome to Proofound!                        5% complete │
│                                                               │
│ Your profile is a space to share your impact, values,       │
│ and growth journey.                                          │
│                                                               │
│ [█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 5%                  │
│                                                               │
│ 🧭 Start by adding a photo, tagline, and your mission       │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Card**: `p-6 border-2 border-[#7A9278]/30 bg-gradient-to-br from-[#7A9278]/5`
- **Icon**: Sparkles `w-6 h-6 text-[#7A9278]`
- **Progress Bar**: `h-2` from Progress component
- **Guidance**: Compass icon with next steps

### Filled State (85%+ complete)
```
Hidden (shown only when < 100%)
┌─────────────────────────────────────────────────────────────┐
│ Profile Completion                           85% │
│ [████████████████████████████████████░░░░░] 85%  │
│ Complete your profile to unlock full matching potential     │
└─────────────────────────────────────────────────────────────┘
```

---

## Section-by-Section Breakdown

### 1. Profile Header

#### Empty State
**Visual:**
```
┌────────────────────────────────────────────────────────┐
│  [  Cover - dashed border hover state  ]              │
│                                                        │
│  [ ○ ]  Your Name  ✎                                 │
│   ↑                                                    │
│  Avatar  📍 Add location • 📅 Joined October 2025    │
│  (line                                                 │
│   art)                                                 │
│                                                        │
│  [ + Add a tagline                                  ] │
│  A brief statement that captures who you are...        │
└────────────────────────────────────────────────────────┘
```

**UI Details:**
- **Cover**: 192px height, gradient `from-[#7A9278]/10`, subtle network SVG pattern
- **Upload prompt**: Appears on hover with `bg-background/90 backdrop-blur-sm`
- **Avatar**: 128px (w-32 h-32), dashed ring on empty
  - Empty: Line art placeholder SVG (person icon)
  - Hover: Upload icon overlay
- **Name**: `text-3xl text-muted-foreground/60` when default
- **Location**: Click to add, MapPin icon
- **Tagline**: Dashed border box with edit icon, helper text

**Data Structure:**
```typescript
{
  full_name: null | "Your Name",  // Default placeholder
  avatar_url: null,
  region: null,
  tagline: null,
  created_at: "2025-10-27T..." // Auto-set
}
```

#### Filled State
**Visual:**
```
┌────────────────────────────────────────────────────────┐
│  [  Cover image with network overlay  ]               │
│                                                        │
│  [Photo] Sarah Chen  ✓ Verified  ✎                   │
│         📍 San Francisco, CA • 📅 Joined March 2024   │
│                                                        │
│  Building bridges between technology, sustainability,  │
│  and community empowerment                             │
└────────────────────────────────────────────────────────┘
```

**UI Details:**
- **Avatar**: Actual image, `ring-2 ring-[#7A9278]/20`
- **Verified Badge**: `bg-[#7A9278]/10 border-[#7A9278]/30`
- **Name**: `text-3xl` in standard color
- **Tagline**: `text-lg max-w-3xl` regular text

**Data Structure:**
```typescript
{
  full_name: "Sarah Chen",
  avatar_url: "https://...",
  region: "San Francisco, CA",
  timezone: "America/Los_Angeles",
  tagline: "Building bridges between...",
  created_at: "2024-03-15T..."
}
```

---

### 2. Mission & Core Values (Left Sidebar)

#### Empty State - Mission Card

**Visual:**
```
┌─────────────────────────────────────┐
│ 🎯 Mission                     ✎   │
│                                     │
│ What drives your work? Share the   │
│ change you want to create in the   │
│ world.                              │
│                                     │
│ [ + Add your mission ]             │
└─────────────────────────────────────┘
```

**UI:**
- **Card**: `p-6 border-2 border-dashed hover:border-[#7A9278]/40`
- **Icon**: Target, `w-5 h-5 text-[#7A9278]`
- **Helper text**: `text-sm text-muted-foreground/60 italic`
- **CTA**: Ghost button, `text-xs`

#### Filled State - Mission Card

**Visual:**
```
┌─────────────────────────────────────┐
│ 🎯 Mission                     ✎   │
│                                     │
│ To create accessible pathways for  │
│ underrepresented communities to    │
│ participate in the green economy,  │
│ ensuring climate solutions are     │
│ equitable and inclusive.           │
└─────────────────────────────────────┘
```

**UI:**
- **Card**: `p-6 border-2` solid border
- **Text**: `text-sm text-muted-foreground leading-relaxed`
- **Edit**: Pencil icon button, `w-8 h-8`

**Data:**
```typescript
{
  mission: "To create accessible pathways for...",
}
```

#### Empty State - Core Values Card

**Visual:**
```
┌─────────────────────────────────────┐
│ ❤️ Core Values                 ✎   │
│                                     │
│ The principles that guide your     │
│ decisions and actions.             │
│                                     │
│ [ ○ Value 1 ] [ ○ Value 2 ]       │
│ [ ○ Value 3 ]                      │
│                                     │
│ [ + Define your values ]           │
└─────────────────────────────────────┘
```

**UI:**
- **Badges**: `border-dashed` with CircleDashed icons
- **Card**: `hover:border-[#C67B5C]/40`

#### Filled State - Core Values Card

**Visual:**
```
┌─────────────────────────────────────┐
│ ❤️ Core Values                 ✎   │
│                                     │
│ ❤️ Equity & Justice           ✓   │
│ ✨ Innovation for Good        ✓   │
│ 👥 Community-First             ✓   │
│ 👁 Transparency                    │
└─────────────────────────────────────┘
```

**UI:**
- **Each value**: Icon + Label + Check (if verified)
- **Icons**: `w-4 h-4 text-muted-foreground`
- **Verified**: `CheckCircle2 w-4 h-4 text-[#7A9278]`

**Data:**
```typescript
{
  values: [
    { label: "Equity & Justice", icon: "Heart", verified: true },
    { label: "Innovation for Good", icon: "Sparkles", verified: true },
    ...
  ]
}
```

#### Causes Card (Similar pattern)

**Empty:**
- Helper text explaining causes
- + Add causes button

**Filled:**
- Pills/badges with cause names
- Colors: `variant="secondary" rounded-full`

**Data:**
```typescript
{
  causes: ["Climate Justice", "Economic Equity", "Education Access"]
}
```

---

### 3. Journey Section (Tabbed - Main Content)

#### Empty State

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│ [ Journey ] [ Volunteering ]                             │
│                                                           │
│ Chronological timeline of educational and working        │
│ experiences                                               │
│                                                           │
│                   [ Large Empty State ]                  │
│                                                           │
│               ⚬────⚬────⚬  (dotted path)               │
│                                                           │
│            Map Your Journey                               │
│                                                           │
│  Share your chronological timeline of education and     │
│  work experiences. Focus on what you learned, how you   │
│  grew, and the skills you developed along the way.      │
│                                                           │
│           [ 💼 Add Work Experience ]                     │
│           [ 🎓 Add Education ]                           │
│                                                           │
│  💡 Tip: Emphasize personal growth and learning over    │
│  job titles and responsibilities                         │
└──────────────────────────────────────────────────────────┘
```

**UI:**
- **Empty illustration**: 128px circle with dotted path SVG
- **Gradient bg**: `from-[#C67B5C]/10 to-[#D4A574]/10`
- **Primary CTA**: `bg-[#C67B5C]`
- **Secondary CTA**: `variant="outline"`

**Additional Quick-Add Cards:**
```
┌──────────────────────┬──────────────────────┐
│ 💼 Professional      │ 🎓 Education         │
│    Experience         │                      │
│                      │                      │
│ Share what you       │ Include skills       │
│ learned and how      │ gained and meaningful│
│ you grew in each     │ projects             │
│ role                 │                      │
│                      │                      │
│ [ + Add Experience ] │ [ + Add Education ]  │
└──────────────────────┴──────────────────────┘
```

**UI:**
- **Cards**: `p-6 border-2 border-dashed hover:border-[#C67B5C]/40`
- **Icon colors**: Work `text-[#C67B5C]`, Education `text-[#5C8B89]`

#### Filled State - Work Experience

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│ 💼 Professional Experience                               │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [💼] Leading systemic change initiatives      ✓   │ │
│  │      National nonprofit, Climate Justice,          │ │
│  │      50-200 employees                              │ │
│  │      2023 - Present                                │ │
│  │                                                     │ │
│  │      💡 What I Learned                             │ │
│  │      Deepening my understanding of policy          │ │
│  │      advocacy and coalition building...            │ │
│  │                                                     │ │
│  │      📈 How I Grew                                 │ │
│  │      Transitioned from program execution to        │ │
│  │      strategic leadership...                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                           │
│  [More experiences...]                                   │
└──────────────────────────────────────────────────────────┘
```

**UI Details:**
- **Card**: `p-6 border-2 hover:border-[#7A9278]/30`
- **Icon circle**: `w-12 h-12 rounded-full bg-muted/30`
- **Verified**: `CheckCircle2 w-4 h-4 text-[#7A9278]`
- **Section icons**: Lightbulb (learned), TrendingUp (growth)
- **Text hierarchy**: 
  - Title: `h4` (font-size derived from heading)
  - Org: `text-sm text-muted-foreground`
  - Duration: `text-xs text-muted-foreground`
  - Content: `text-sm`

**Data Structure:**
```typescript
interface Experience {
  title: string;                    // "Leading systemic change initiatives"
  orgDescription: string;           // "National nonprofit, Climate Justice, 50-200 employees"
  duration: string;                 // "2023 - Present"
  learning: string;                 // What they learned
  growth: string;                   // How they grew
  verified: boolean;                // Proof verified
}
```

#### Filled State - Education

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│ 🎓 Education                                             │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [🎓] Master's in Public Policy              ✓     │ │
│  │      University                                    │ │
│  │      2017 - 2019                                   │ │
│  │                                                     │ │
│  │      Skills Gained                                 │ │
│  │      Policy analysis, stakeholder mapping,         │ │
│  │      impact evaluation, systems thinking           │ │
│  │                                                     │ │
│  │      Meaningful Projects                           │ │
│  │      Thesis: 'Equitable Pathways to Clean Energy   │ │
│  │      Access' - Research adopted by state energy    │ │
│  │      commission...                                 │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**UI:**
- Icon color: `text-[#5C8B89]` for education
- Otherwise similar to work experience

**Data Structure:**
```typescript
interface Education {
  institution: string;
  degree: string;
  duration: string;
  skills: string;                  // Comma-separated or array
  projects: string;                // Meaningful projects
  verified: boolean;
}
```

---

### 4. Volunteering Tab

#### Empty State

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│ [ Journey ] [ Volunteering ]                             │
│                                                           │
│               [ Large Empty State ]                      │
│                                                           │
│               ❤️ (in circle)                            │
│                                                           │
│          Share Your Volunteering                         │
│                                                           │
│  Highlight your volunteer work and community            │
│  involvement. Explain why these causes matter to you    │
│  and what impact you've created.                        │
│                                                           │
│           [ + Add Volunteer Experience ]                 │
│                                                           │
│  💡 Tip: Connect your service to your values and        │
│  explain your personal motivation                        │
└──────────────────────────────────────────────────────────┘
```

**UI:**
- **Icon**: HandHeart `w-16 h-16 text-[#C67B5C]/60`
- **Gradient**: `from-[#C67B5C]/10 to-[#7A9278]/10`

#### Filled State

**Visual:**
```
┌──────────────────────────────────────────────────────────┐
│ [ Journey ] [ Volunteering ]                             │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [❤️] Board governance and strategic direction  ✓  │ │
│  │      Youth-led climate organization, National      │ │
│  │      2022 - Present                                │ │
│  │                                                     │ │
│  │      ┌─────────────────────────────────────────┐  │ │
│  │      │ ❤️ Personal Connection                  │  │ │
│  │      │ Climate Justice - Amplifying youth      │  │ │
│  │      │ voices in climate policy                │  │ │
│  │      │                                          │  │ │
│  │      │ Climate action must center the voices   │  │ │
│  │      │ of those who will inherit our           │  │ │
│  │      │ decisions...                            │  │ │
│  │      └─────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │      Impact Made                                   │ │
│  │      Helped secure $500K in funding, expanded to   │ │
│  │      12 new cities...                              │ │
│  │                                                     │ │
│  │      Skills Deployed                               │ │
│  │      Strategic planning, fundraising, mentorship   │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**UI Details:**
- **Personal connection box**: `p-3 bg-[#C67B5C]/5 border border-[#C67B5C]/20`
- **Heart icon**: `w-3 h-3 text-[#C67B5C]`
- **"Why" text**: `text-xs italic`

**Data Structure:**
```typescript
interface Volunteering {
  title: string;
  orgDescription: string;
  duration: string;
  cause: string;                   // e.g., "Climate Justice - Amplifying youth voices"
  personalWhy: string;             // Personal motivation
  impact: string;                  // Measurable impact
  skillsDeployed: string;          // Skills used
  verified: boolean;
}
```

---

### 5. Expertise Atlas (Separate Page)

_Note: See `layouts/expertise/expertise-atlas.md` for full specs_

**Empty State Preview:**
```
┌────────────────────────────────────┐
│ 🏆 Expertise Atlas            ✎   │
│                                     │
│ No expertise added yet              │
│                                     │
│ Add your skills to improve          │
│ matching accuracy                   │
│                                     │
│ [ Add Your First Skill ]           │
└────────────────────────────────────┘
```

**Filled State Preview (on profile):**
```
┌────────────────────────────────────┐
│ 🏆 Expertise Atlas            ✎   │
│                                     │
│ 🏆 UX Research              ✓     │
│    [ Interviews ] [ Surveys ]      │
│                                     │
│ 🏆 Figma                    ✓     │
│    [ Prototyping ] [ Systems ]     │
│                                     │
│ [3 more skills...]                 │
│                                     │
│ [ View All 8 Skills ]              │
└────────────────────────────────────┘
```

**Data:**
```typescript
interface ExpertiseAtlas {
  id: string;
  profile_id: string;
  skill_name: string;              // "UX Research"
  skill_category: string | null;   // "Design"
  proficiency_level: string | null; // "expert" | "advanced" | "intermediate" | "beginner"
  rank_order: number | null;       // Display order
  is_core_expertise: boolean;      // Top 3-5 skills
  years_of_experience: number | null;
  last_used_date: string | null;
  is_verified: boolean;
  proof_count: number;             // Number of linked proofs
}
```

---

### 6. Verified Proofs Section

#### Empty State

**Visual:**
```
┌────────────────────────────────────┐
│ 🛡️ Verified Proofs            ✎   │
│                                     │
│          🛡️ (large icon)          │
│                                     │
│   No proofs submitted yet          │
│                                     │
│   Build trust by adding verified   │
│   proofs of your work              │
│                                     │
│   [ Submit Your First Proof ]      │
└────────────────────────────────────┘
```

#### Filled State

**Visual:**
```
┌────────────────────────────────────┐
│ 🛡️ Verified Proofs            ✎   │
│                                     │
│  [✓] Led sustainability program    │
│      verified_reference • Oct 2024 │
│                                     │
│  [⏳] Developed design system       │
│      pending • Sep 2024            │
│                                     │
│  [✓] Built community platform      │
│      link • Aug 2024               │
│                                     │
│  [ View All 6 Proofs ]             │
└────────────────────────────────────┘
```

**UI:**
- **Verified icon**: `CheckCircle2 w-5 h-5 text-[#7A9278]`
- **Pending icon**: `Shield w-5 h-5 text-[#C76B4A]`
- **Badge colors**: Verified = default, Pending = outline

**Data:**
```typescript
interface Proof {
  id: string;
  profile_id: string;
  claim_type: string;              // 'skill' | 'experience' | 'education' | 'achievement' | 'volunteering'
  claim_reference_id: string | null;
  claim_text: string;              // "Led sustainability program for 500+ participants"
  proof_type: string;              // 'verified_reference' | 'link' | 'file' | 'credential'
  verification_status: string;     // 'unverified' | 'pending' | 'verified' | 'declined' | 'expired'
  verified_by: string | null;      // Profile ID of verifier
  verified_at: string | null;
  artifact_id: string | null;      // Link to artifact if applicable
}
```

---

## Stats Cards (Profile Overview)

### Empty State
Not shown or shows zeros

### Filled State

**Visual:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│  🛡️             │  🏆              │  ⭐             │
│   3              │   8              │   0              │
│  Verified Proofs │ Expertise Areas  │ Matches Received │
└──────────────────┴──────────────────┴──────────────────┘
```

**UI:**
- **Card**: `p-6` individual cards
- **Icon bg**: `p-3 rounded-lg bg-[color]/10`
- **Number**: `text-2xl font-display font-semibold`
- **Label**: `text-sm text-muted-foreground`

---

## Profile Completion Calculation

```typescript
function calculateProfileCompletion(profile: Profile): number {
  let score = 0;
  const weights = {
    basicInfo: 15,        // name, avatar, location
    tagline: 10,
    mission: 15,
    values: 10,
    causes: 5,
    education: 15,        // At least one entry
    experience: 15,       // At least one entry
    volunteering: 5,      // Optional but valued
    expertiseAtlas: 5,    // At least 3 skills
    proofs: 5            // At least 1 verified proof
  };

  // Basic info (name required, avatar + location bonus)
  if (profile.full_name && profile.full_name !== "Your Name") score += 10;
  if (profile.avatar_url) score += 3;
  if (profile.region) score += 2;

  // Tagline
  if (profile.tagline) score += weights.tagline;

  // Mission
  if (profile.mission && profile.mission.length > 50) score += weights.mission;

  // Values (at least 3)
  if (profile.values && Array.isArray(profile.values) && profile.values.length >= 3) {
    score += weights.values;
  }

  // Causes (at least 2)
  if (profile.causes && Array.isArray(profile.causes) && profile.causes.length >= 2) {
    score += weights.causes;
  }

  // Journey entries (checked separately via joins)
  // Education: at least 1 entry
  // Experience: at least 1 entry
  // Volunteering: at least 1 entry (bonus)

  // Expertise: at least 3 skills
  // Proofs: at least 1 verified

  return Math.min(100, score);
}
```

---

## Responsive Behavior

### Desktop (≥1024px)
- **Layout**: 3-column grid (left sidebar + main content spans 2)
- **Sidebar width**: 1 column
- **Journey tabs**: Full width with proper spacing
- **Cards**: Normal padding `p-6`

### Tablet (768px - 1023px)
- **Layout**: 2-column grid or stacked
- **Sidebar**: Maintains separate column
- **Journey**: Possibly narrower

### Mobile (<768px)
- **Layout**: Single column stack `grid-cols-1`
- **All sections**: Vertical stack
- **Padding**: Reduced to `p-4`
- **Font sizes**: Slightly smaller
- **Touch targets**: Minimum 40px

---

## Empty State Messaging Guidelines

### Tone & Voice
- **Encouraging**: "Show your proofs" not "You haven't added proofs"
- **Value-focused**: Explain WHY each section matters
- **Action-oriented**: Clear CTAs with verbs (Add, Share, Build)
- **Non-judgmental**: No pressure, just guidance

### Examples

**Good:**
- "Add your mission to help matches understand your purpose"
- "Share your journey to showcase how you've grown"
- "Build trust through verified proofs"

**Avoid:**
- "Your profile is incomplete"
- "You must add this information"
- "Required fields missing"

---

## Implementation Checklist

### Empty State Requirements
- [ ] Profile completion banner with percentage
- [ ] All sections show empty state cards with CTAs
- [ ] Helper text explains value of each section
- [ ] Dashed borders indicate "add content here"
- [ ] Icons use muted colors (`text-muted-foreground/60`)
- [ ] Hover states show upload/edit prompts

### Filled State Requirements
- [ ] All sections show actual data
- [ ] Verified badges appear where applicable
- [ ] Edit buttons visible on hover
- [ ] Solid borders replace dashed
- [ ] Full color icons
- [ ] Data properly formatted (dates, locations, etc.)

### Interaction Requirements
- [ ] Click empty cards to open add/edit modal
- [ ] Edit buttons toggle inline edit mode
- [ ] Save/cancel buttons for all edits
- [ ] Loading states during save
- [ ] Success/error toasts
- [ ] Optimistic UI updates

---

## Related Documentation
- `organization-profile-states.md` - Organization account states
- `profile-completion-guide.md` - Detailed completion strategies
- `layouts/expertise/expertise-atlas.md` - Expertise section specs
- `DASHBOARD_DESIGN_SPECIFICATIONS.md` - Overall design system

---

**Next Steps:**
1. Implement empty state components
2. Create edit modals for each section
3. Build profile completion logic
4. Test onboarding flow
5. Measure completion rates

