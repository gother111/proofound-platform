# Organization Profile States Documentation

**Last Updated:** October 27, 2025  
**Purpose:** Documentation of empty vs filled profile states for organization accounts  
**Figma Reference:** [Proofound MVP Design](https://www.figma.com/make/DPu8hugcNJTJQ7JGK0qiMi/)

---

## Overview

Organization profiles in Proofound emphasize **transparency, accountability, and impact**. Unlike individual profiles that focus on personal growth, organization profiles showcase structure, governance, verified credentials, and societal impact. This document contrasts empty and filled states to guide implementation.

---

## Key Differences from Individual Profiles

| Aspect | Individual | Organization |
|--------|-----------|--------------|
| **Focus** | Personal journey & growth | Structure & transparency |
| **Verification** | Optional proofs | Required domain/legal verification |
| **Key Sections** | Education, Experience, Volunteering | Ownership, Structure, Licenses, Projects |
| **Governance** | N/A | Ownership structure, decision-making |
| **Team** | Solo profile | Team members, roles |
| **Impact** | Personal contribution | Organizational operations & projects |

---

## Profile Completion Indicator

### Empty State (5% complete)

```
┌─────────────────────────────────────────────────────────────┐
│ ✨ Welcome to Proofound!                        5% complete │
│                                                               │
│ Build trust and transparency by completing your              │
│ organization profile.                                        │
│                                                               │
│ [█░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 5%                  │
│                                                               │
│ 🧭 Start by adding your logo, basic information, and        │
│    ownership structure                                       │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- Emphasizes "trust and transparency"
- Guidance focuses on verification requirements
- Higher completion bar for matching (75%+ recommended)

---

## Section-by-Section Breakdown

### 1. Organization Header

#### Empty State

**Visual:**
```
┌────────────────────────────────────────────────────────┐
│  [  Cover - dashed border hover state  ]              │
│                                                        │
│  [🏢]  Your Organization  ✎                          │
│   ↑                                                    │
│  Logo                                                  │
│  (building                                             │
│   icon)                                                │
│                                                        │
│  [ + Add a tagline                                  ] │
│  A brief statement that captures your purpose...       │
└────────────────────────────────────────────────────────┘
```

**UI Details:**
- **Logo**: 128px square, Building2 icon placeholder
- **Gradient**: `from-[#7A9278]/30 to-[#5C8B89]/30`
- **No verification badge** until verified
- **Upload overlay** on hover

**Data Structure:**
```typescript
{
  name: "Your Organization", // Placeholder
  logo_url: null,
  tagline: null,
  is_verified: false,
  created_at: "2025-10-27T..."
}
```

#### Filled State

**Visual:**
```
┌────────────────────────────────────────────────────────┐
│  [  Cover image with organizational pattern  ]         │
│                                                        │
│  [Logo] GreenTech Innovations  ✓ Verified  ✎         │
│                                                        │
│  Clean energy solutions for rural communities          │
│  building sustainable futures                          │
└────────────────────────────────────────────────────────┘
```

**UI:**
- **Logo**: Actual uploaded image
- **Verified Badge**: `CheckCircle2 w-4 h-4 text-[#7A9278]`
- **Tagline**: `text-lg`

**Data:**
```typescript
{
  name: "GreenTech Innovations",
  slug: "greentech-innovations",
  logo_url: "https://...",
  tagline: "Clean energy solutions for rural communities...",
  is_verified: true,
  verification_method: "domain_verification", // or "manual_review", "registry_check"
  verified_domain: "greentech-innovations.com",
  verified_at: "2025-09-15T..."
}
```

---

### 2. Organization Details (Critical Business Information)

#### Empty State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Organization Details                    ℹ️ Required  │
│                                                          │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Industry     │ Org Size     │ Impact Area  │       │
│  │ Add industry │ Add size     │ Add area     │       │
│  └──────────────┴──────────────┴──────────────┘       │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Legal Form   │ Founded      │ Registration │       │
│  │ Add form     │ Add date     │ Add region   │       │
│  └──────────────┴──────────────┴──────────────┘       │
│  ┌──────────────┬─────────────────────────────┐       │
│  │ Org Number   │ Locations                   │       │
│  │ Add #        │ Add locations               │       │
│  └──────────────┴─────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**UI:**
- **Card**: `p-8 border-2 border-dashed hover:border-[#7A9278]/40`
- **Info badge**: `text-xs gap-1 ml-auto`
- **Grid**: `grid-cols-3` on desktop, `grid-cols-1` on mobile
- **Each field**: `p-4 border-2 border-dashed rounded-lg`

#### Filled State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Organization Details                    ✓ Complete   │
│                                                          │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Industry     │ Org Size     │ Impact Area  │       │
│  │ Clean Energy │ 10-50        │ Climate      │       │
│  └──────────────┴──────────────┴──────────────┘       │
│  ┌──────────────┬──────────────┬──────────────┐       │
│  │ Legal Form   │ Founded      │ Registration │       │
│  │ B Corporation│ 2020         │ Germany      │       │
│  └──────────────┴──────────────┴──────────────┘       │
│  ┌──────────────┬─────────────────────────────┐       │
│  │ Org Number   │ Locations                   │       │
│  │ HRB 123456   │ Berlin, Munich              │       │
│  └──────────────┴─────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**UI:**
- **Solid borders**: `border-2 border-border/30`
- **Normal text**: Not muted
- **Green checkmark**: On complete badge

**Data Structure:**
```typescript
interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  org_type: 'ngo' | 'startup' | 'sme' | 'enterprise' | 'other';
  mission: string | null;
  values: Json | null;                  // Array of value objects
  causes: Json | null;                  // Array of causes
  headquarters_location: string | null;
  is_remote_friendly: boolean;
  is_verified: boolean;
  verification_method: string | null;
  verified_domain: string | null;
  verified_at: string | null;
  registry_number: string | null;      // Official registration number
  contact_email: string | null;
  contact_phone: string | null;
  created_by: string | null;           // Profile ID of creator
  admin_ids: string[] | null;          // Array of admin profile IDs
  subscription_tier: 'free' | 'pilot' | 'pro';
  is_ngo: boolean;
  max_active_assignments: number;
  active_assignments_count: number;
}
```

---

### 3. Ownership & Control Structure (CRITICAL)

#### Empty State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Ownership & Control Structure          ℹ️ Transparency│
│                                                          │
│ Build trust by disclosing who holds ownership and       │
│ decision-making power in your organization. This        │
│ transparency helps stakeholders understand your          │
│ governance structure.                                    │
│                                                          │
│             ┌─────────────────────┐                     │
│             │        👤           │                     │
│             │   (user cog icon)   │                     │
│             │                      │                     │
│             │ Add Ownership        │                     │
│             │ Information          │                     │
│             │                      │                     │
│             │ List individuals,    │                     │
│             │ organizations, or    │                     │
│             │ collectives who hold │                     │
│             │ ownership stakes...  │                     │
│             │                      │                     │
│             │ [+ Add Owner/       │                     │
│             │    Controller]       │                     │
│             └─────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

**UI:**
- **Emphasis**: This is a TRUST-BUILDING section
- **Badge**: Info icon with "Transparency" label
- **Empty card**: `border-dashed hover:border-[#C76B4A]/40`
- **Icon color**: `text-[#C76B4A]` (terracotta for governance)
- **CTA button**: `bg-[#C76B4A]`

#### Filled State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ 👤 Ownership & Control Structure          ✓ Disclosed   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Founders & Leadership (60%)                        │ │
│  │ • Dr. Emma Weber (CEO & Co-founder) - 30%         │ │
│  │ • Marcus Klein (CTO & Co-founder) - 30%           │ │
│  │ Control: Strategic direction, hiring, budget       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Employee Ownership Cooperative (25%)               │ │
│  │ • 12 employee-owners                               │ │
│  │ Control: Voting rights on major decisions          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Impact Investors (15%)                             │ │
│  │ • GreenFuture Capital - 10%                        │ │
│  │ • Climate Ventures - 5%                            │ │
│  │ Control: Board observer seats, veto on major       │ │
│  │           changes to mission                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [+ Add Owner/Controller]                              │
└─────────────────────────────────────────────────────────┘
```

**UI:**
- **Each owner card**: `p-4 border-2 rounded-lg`
- **Percentage**: Bold, prominent
- **Control description**: Italic, `text-sm text-muted-foreground`
- **List formatting**: Bullet points with names

**Data (stored in custom field or separate table):**
```typescript
interface OwnershipStructure {
  owner_type: 'individual' | 'organization' | 'collective' | 'cooperative';
  owner_name: string;
  ownership_percentage: number;
  control_description: string;      // What decisions they control
  individuals?: string[];           // If collective
}
```

---

### 4. Licenses & Certifications

#### Empty State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Licenses & Certifications                             │
│                                                          │
│             ┌─────────────────────┐                     │
│             │        ✅           │                     │
│             │                      │                     │
│             │ Add Licenses &       │                     │
│             │ Certifications       │                     │
│             │                      │                     │
│             │ Display your official│                     │
│             │ licenses, certifi-   │                     │
│             │ cations, and         │                     │
│             │ accreditations       │                     │
│             │ (B Corp, ISO, Fair   │                     │
│             │ Trade, etc.)         │                     │
│             │                      │                     │
│             │ [+ Add License/     │                     │
│             │    Certification]    │                     │
│             └─────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

#### Filled State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Licenses & Certifications                   ✓ 3 Active│
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [🏆] B Corporation Certification          ✓       │ │
│  │      Certified: 2021 | Expires: 2024              │ │
│  │      Impact Score: 92.5 (Top 5% globally)         │ │
│  │      [ View Certificate → ]                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [✅] ISO 14001 Environmental Management    ✓      │ │
│  │      Certified: 2022 | Expires: 2025              │ │
│  │      Certifying Body: TÜV Rheinland               │ │
│  │      [ View Certificate → ]                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [✅] Fair Trade Certified                  ✓      │ │
│  │      Certified: 2020 | Ongoing                     │ │
│  │      [ View Certificate → ]                        │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [+ Add License/Certification]                         │
└─────────────────────────────────────────────────────────┘
```

**UI:**
- **Icon circle**: `w-12 h-12 bg-[#5C8B89]/10`
- **Verified check**: `text-[#7A9278]`
- **Dates**: `text-xs text-muted-foreground`
- **Link button**: `variant="link"`

**Data:**
```typescript
interface License {
  name: string;
  certifying_body: string | null;
  certified_date: string;
  expires_date: string | null;
  certificate_url: string | null;
  verification_status: 'verified' | 'pending' | 'expired';
  details: string | null;          // E.g., "Impact Score: 92.5"
}
```

---

### 5. Mission, Vision, Values

#### Empty State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────────────┬──────────────────────┐       │
│  │ 🎯 Mission            │ 👁 Vision            │       │
│  │                      │                      │       │
│  │ What is your         │ What future are you  │       │
│  │ organization's       │ working toward?      │       │
│  │ purpose?             │                      │       │
│  └──────────────────────┴──────────────────────┘       │
│                                                          │
│  ─────────────────────────────────────────────          │
│                                                          │
│  ❤️ Core Values                                         │
│  ┌─────┬─────┬─────┬─────┐                            │
│  │  ○  │  ○  │  ○  │  ○  │                            │
│  │Value│Value│Value│Value│                            │
│  │  1  │  2  │  3  │  4  │                            │
│  └─────┴─────┴─────┴─────┘                            │
│  [+ Define Your Core Values]                            │
└─────────────────────────────────────────────────────────┘
```

#### Filled State

**Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  ┌──────────────────────┬──────────────────────┐       │
│  │ 🎯 Mission            │ 👁 Vision            │       │
│  │                      │                      │       │
│  │ To accelerate the    │ A world where every  │       │
│  │ transition to clean  │ community has access │       │
│  │ energy in rural and  │ to reliable,         │       │
│  │ underserved regions  │ affordable, and      │       │
│  │ through innovative   │ clean energy         │       │
│  │ technology and       │ solutions.           │       │
│  │ community            │                      │       │
│  │ partnerships.        │                      │       │
│  └──────────────────────┴──────────────────────┘       │
│                                                          │
│  ❤️ Core Values                                         │
│  ┌─────────────────┬─────────────────┬──────────────┐ │
│  │ 🌱 Sustainability│ 🤝 Partnership  │ 💡 Innovation│ │
│  │                  │                 │              │ │
│  │ Environmental    │ Community-led   │ Continuous   │ │
│  │ stewardship in   │ solutions that  │ improvement  │ │
│  │ all operations   │ empower locals  │ & learning   │ │
│  └─────────────────┴─────────────────┴──────────────┘ │
│  ┌─────────────────┬─────────────────────────────────┐ │
│  │ ⚖️ Equity        │                                  │ │
│  │ Fair access &    │                                  │ │
│  │ inclusive design │                                  │ │
│  └─────────────────┴─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Data:**
```typescript
{
  mission: string;
  vision: string | null;
  values: [
    { label: "Sustainability", icon: "Leaf", description: "Environmental stewardship..." },
    { label: "Partnership", icon: "Handshake", description: "Community-led solutions..." },
    { label: "Innovation", icon: "Lightbulb", description: "Continuous improvement..." },
    { label: "Equity", icon: "Scale", description: "Fair access..." }
  ]
}
```

---

### 6. Tabbed Content (Impact, Projects, Partnerships, Structure, etc.)

_Note: Organizations have 7 tabs vs individuals' 2 tabs_

#### Tabs Overview

| Tab | Purpose | Empty State Icon | Filled State Shows |
|-----|---------|------------------|-------------------|
| **Impact** | Operational impact pipeline | TrendingUp | Value chain, sourcing to end-of-life |
| **Projects** | Time-bound initiatives | Briefcase | Project cards with outcomes |
| **Partnerships** | Strategic collaborations | Handshake | Partner cards with impact |
| **Structure** | Org chart & teams | Layers | Departments, executives |
| **Statute** | Governing documents | ScrollText | Key provisions |
| **Culture** | Work environment | Coffee | Working styles, benefits |
| **Goals** | Strategic objectives | Flag | Goal cards with progress |

#### Impact Tab (Example)

**Empty State:**
```
┌─────────────────────────────────────────────────────────┐
│             Impact Creation Pipeline                     │
│                                                          │
│                    📈 (circle)                           │
│                                                          │
│ Map how your organization creates value and impact      │
│ through your core operations. Show each stage from      │
│ sourcing to end-of-life.                                │
│                                                          │
│            [+ Add Impact Pipeline]                       │
│                                                          │
│ 💡 Tip: Focus on continuous operations - sourcing,     │
│ processing, manufacturing, distribution, end-of-life     │
└─────────────────────────────────────────────────────────┘
```

**Filled State:**
```
┌─────────────────────────────────────────────────────────┐
│             Impact Creation Pipeline                     │
│                                                          │
│  ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐          │
│  │ 🌱 │ → │ ⚙️ │ → │ 📦 │ → │ 🚚 │ → │ ♻️ │          │
│  └────┘   └────┘   └────┘   └────┘   └────┘          │
│  Source   Produce  Package  Deliver  Recycle           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🌱 Ethical Sourcing                               │ │
│  │ • 100% renewable materials from local suppliers    │ │
│  │ • Fair wages verified by Fair Trade certification  │ │
│  │ Impact: 50+ local suppliers supported              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [More stages...]                                       │
│                                                          │
│  [+ Add Pipeline Stage]                                 │
└─────────────────────────────────────────────────────────┘
```

#### Projects Tab

**Empty State:**
```
Strategic Projects

📋 (circle)

Showcase time-bound initiatives with defined start 
and end dates. Include impact created, business value, 
and measurable outcomes.

[+ Add Project]

💡 Tip: Include completed and ongoing projects with 
verified impact metrics
```

**Filled State:**
```
┌─────────────────────────────────────────────────────────┐
│  [Filter: All | Ongoing | Completed]                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Rural Solar Microgrids Initiative                  │ │
│  │ Jan 2024 - Dec 2025 • Ongoing                      │ │
│  │                                                     │ │
│  │ 🎯 Goal: Deploy 50 microgrids in 10 communities   │ │
│  │                                                     │ │
│  │ 📊 Progress: 32 deployed (64%)                     │ │
│  │    [████████████████░░░░░░░░░] 64%                │ │
│  │                                                     │ │
│  │ 💚 Impact:                                         │ │
│  │ • 2,400 households with clean energy               │ │
│  │ • 120 tons CO₂ avoided annually                   │ │
│  │ • 15 local technicians trained                     │ │
│  │                                                     │ │
│  │ 💰 Budget: €1.2M | Partners: 3                    │ │
│  │                                                     │ │
│  │ [View Full Project →]                              │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Data:**
```typescript
interface Project {
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: 'planning' | 'ongoing' | 'completed' | 'paused';
  goal: string;
  progress_percentage: number | null;
  impact_metrics: {
    metric: string;
    value: string;
  }[];
  budget: number | null;
  partners: string[];
  verified: boolean;
}
```

---

## Organization-Specific Features

### Team Management

**Empty:**
```
No team members added
[+ Invite Team Member]
```

**Filled:**
```
┌─────────────────────────────────────────┐
│ Team (12 members)                       │
│                                         │
│ [Photo] Dr. Emma Weber                  │
│         CEO & Co-founder                │
│         emma@greentech.com              │
│                                         │
│ [Photo] Marcus Klein                    │
│         CTO & Co-founder                │
│         marcus@greentech.com            │
│                                         │
│ [+ 10 more team members]               │
│ [+ Invite Team Member]                  │
└─────────────────────────────────────────┘
```

### Active Assignments

Links to assignments posted by this organization.

```
┌─────────────────────────────────────────┐
│ Active Assignments (2)                  │
│                                         │
│ • Senior Solar Engineer                 │
│   Published 5 days ago • 12 matches     │
│                                         │
│ • Community Outreach Coordinator        │
│   Published 2 weeks ago • 8 matches     │
│                                         │
│ [+ Post New Assignment]                 │
└─────────────────────────────────────────┘
```

---

## Profile Completion Calculation (Organizations)

```typescript
function calculateOrgProfileCompletion(org: Organization): number {
  let score = 0;
  const weights = {
    basicInfo: 10,          // name, logo, location, industry
    verification: 20,       // Domain or legal verification
    tagline: 5,
    mission: 10,
    vision: 5,
    values: 10,
    ownership: 15,          // CRITICAL - ownership structure
    licenses: 10,           // At least 1 license/cert
    impact: 5,              // Impact pipeline
    projects: 5,            // At least 1 project
    partnerships: 3,        // Optional
    structure: 2            // Team/departments
  };

  // Basic info
  if (org.name && org.logo_url) score += 5;
  if (org.headquarters_location) score += 3;
  if (org.org_type) score += 2;

  // Verification (VERY IMPORTANT)
  if (org.is_verified) score += weights.verification;

  // Tagline
  if (org.tagline) score += weights.tagline;

  // Mission & Vision
  if (org.mission && org.mission.length > 50) score += weights.mission;
  if (org.vision && org.vision.length > 30) score += weights.vision;

  // Values (at least 3)
  if (org.values && Array.isArray(org.values) && org.values.length >= 3) {
    score += weights.values;
  }

  // Ownership structure (check separate table/field)
  // If at least one owner disclosed
  // score += weights.ownership;

  // Rest calculated via joins/related data

  return Math.min(100, score);
}
```

---

## Verification Badge States

### Not Verified
No badge shown

### Verification Pending
```
⏳ Verification Pending
```
`text-[#D4A574]`

### Verified - Domain
```
✓ Verified
```
`text-[#7A9278] bg-[#7A9278]/10`

Hover: "Verified via domain greentech.com"

### Verified - Manual Review
```
✓ Verified by Proofound
```
Hover: "Manually verified by Proofound team"

---

## Responsive Behavior

### Desktop
- Full multi-column layouts
- 7 visible tabs
- Wide ownership structure cards

### Tablet
- 2-column layouts
- Tabs remain
- Smaller cards

### Mobile
- Single column
- Tabs scroll horizontally
- Stacked ownership cards
- Collapsible sections

---

## Empty State Messaging (Organizations)

### Tone
- **Professional**: More formal than individual profiles
- **Transparency-focused**: Emphasize trust-building
- **Value-oriented**: Why this matters for stakeholders
- **Compliance-aware**: Some fields required for verification

### Examples

**Good:**
- "Transparency builds trust with stakeholders and partners"
- "Disclose ownership to demonstrate accountability"
- "Add licenses to verify your credentials"

**Avoid:**
- "Required by law" (unless actually true)
- "Competitors have completed this"
- Overly casual tone

---

## Related Documentation
- `individual-profile-states.md` - Individual account states
- `profile-completion-guide.md` - Completion strategies
- `DASHBOARD_DESIGN_SPECIFICATIONS.md` - Design system

---

**Implementation Priority:**
1. ✅ Basic info & header
2. ✅ Verification system
3. ✅ Ownership structure (CRITICAL for trust)
4. ✅ Licenses & certifications
5. ⚠️ Impact pipeline (complex but valuable)
6. ⚠️ Projects & partnerships
7. ⏸ Culture & statute (nice-to-have)

