# Profile Completion Guide

**Last Updated:** October 27, 2025  
**Purpose:** Strategies for encouraging and measuring profile completion  
**Audience:** Developers, Product Managers, UX Designers

---

## Overview

Profile completion is critical to Proofound's matching algorithm and trust-building mission. This guide provides:
- Completion percentage calculations
- Progressive disclosure strategies
- Onboarding best practices
- Measurement & optimization

---

## Profile Completion Tiers

### Individual Profiles

| Tier | Percentage | Requirements | Matching Eligibility | User Benefit |
|------|------------|--------------|---------------------|--------------|
| **Started** | 5-25% | Name, email verified | ❌ No | Account created |
| **Basic** | 25-50% | + Avatar, location, mission | ❌ No | Profile visible |
| **Good** | 50-75% | + 1 experience, 2 skills, values | ⚠️ Limited | Basic matching |
| **Complete** | 75-90% | + 2+ experiences, 4+ skills, 1 proof | ✅ Yes | Full matching |
| **Exceptional** | 90-100% | + Volunteering, 5+ verified proofs | ✅ Priority | Algorithm boost |

### Organization Profiles

| Tier | Percentage | Requirements | Posting Eligibility | Trust Badge |
|------|------------|--------------|--------------------|-----------| 
| **Started** | 5-25% | Name, basic info | ❌ No | None |
| **Basic** | 25-50% | + Logo, mission, industry | ❌ No | None |
| **Verified** | 50-75% | + Domain verification, ownership | ⚠️ 1 assignment | "Verified" |
| **Complete** | 75-90% | + Licenses, 1 project, values | ✅ Full access | "Verified + Complete" |
| **Exemplary** | 90-100% | + Impact pipeline, partnerships | ✅ Priority listing | "Trusted Partner" |

---

## Completion Percentage Formula

### Individual Profile Calculation

```typescript
interface ProfileCompletionWeights {
  // Basic Information (30 points total)
  fullName: 10;              // Required, realistic name
  avatar: 5;                 // Profile photo uploaded
  location: 3;               // Region/city added
  email: 2;                  // Email verified (auto)
  tagline: 10;               // Compelling tagline

  // Mission & Values (25 points total)
  mission: 15;               // Mission statement (50+ chars)
  values: 5;                 // At least 3 values
  causes: 5;                 // At least 2 causes

  // Journey (25 points total)
  experience: 10;            // At least 1 work experience
  education: 10;             // At least 1 education entry
  volunteering: 5;           // At least 1 volunteering (bonus)

  // Expertise & Proof (20 points total)
  expertiseAtlas: 10;        // At least 3 skills added
  proofs: 10;                // At least 1 verified proof

  // TOTAL: 100 points
}

function calculateIndividualCompletion(
  profile: Profile,
  experiences: Experience[],
  education: Education[],
  volunteering: Volunteering[],
  expertiseAtlas: ExpertiseAtlas[],
  proofs: Proof[]
): number {
  let score = 0;

  // Basic Info (30 points)
  if (profile.full_name && profile.full_name !== "Your Name" && profile.full_name.length > 3) {
    score += 10;
  }
  if (profile.avatar_url) score += 5;
  if (profile.region) score += 3;
  if (profile.email) score += 2; // Auto from auth
  if (profile.tagline && profile.tagline.length >= 20) score += 10;

  // Mission & Values (25 points)
  if (profile.mission && profile.mission.length >= 50) score += 15;
  
  if (profile.values) {
    const valuesArray = Array.isArray(profile.values) ? profile.values : [];
    if (valuesArray.length >= 3) score += 5;
  }
  
  if (profile.causes) {
    const causesArray = Array.isArray(profile.causes) ? profile.causes : [];
    if (causesArray.length >= 2) score += 5;
  }

  // Journey (25 points)
  if (experiences.length >= 1) score += 10;
  if (education.length >= 1) score += 10;
  if (volunteering.length >= 1) score += 5;

  // Expertise & Proof (20 points)
  if (expertiseAtlas.length >= 3) score += 10;
  
  const verifiedProofs = proofs.filter(p => p.verification_status === 'verified');
  if (verifiedProofs.length >= 1) score += 10;

  return Math.min(100, score);
}
```

### Organization Profile Calculation

```typescript
interface OrgCompletionWeights {
  // Basic Information (25 points)
  name: 5;
  logo: 5;
  location: 3;
  industry: 3;
  orgSize: 3;
  legalForm: 3;
  registryNumber: 3;

  // Verification (20 points) - CRITICAL
  isVerified: 20;           // Domain or manual verification

  // Identity & Purpose (25 points)
  tagline: 5;
  mission: 10;
  vision: 5;
  values: 5;                // At least 3 values

  // Transparency (20 points) - CRITICAL
  ownership: 15;            // Ownership structure disclosed
  licenses: 5;              // At least 1 license/certification

  // Impact & Operations (10 points)
  impactPipeline: 3;
  projects: 4;              // At least 1 project
  partnerships: 3;

  // TOTAL: 100 points
}

function calculateOrgCompletion(
  org: Organization,
  ownership: OwnershipStructure[],
  licenses: License[],
  projects: Project[]
): number {
  let score = 0;

  // Basic Info (25 points)
  if (org.name && org.name !== "Your Organization") score += 5;
  if (org.logo_url) score += 5;
  if (org.headquarters_location) score += 3;
  if (org.org_type) score += 3;
  // org_size would need to be added to schema
  // if (org.org_size) score += 3;
  // legal_form field needed
  if (org.registry_number) score += 3;

  // Verification (20 points) - VERY IMPORTANT
  if (org.is_verified) score += 20;

  // Identity & Purpose (25 points)
  if (org.tagline && org.tagline.length >= 20) score += 5;
  if (org.mission && org.mission.length >= 50) score += 10;
  // vision field needed in schema
  if (org.values) {
    const valuesArray = Array.isArray(org.values) ? org.values : [];
    if (valuesArray.length >= 3) score += 5;
  }

  // Transparency (20 points)
  if (ownership.length >= 1) score += 15;
  if (licenses.length >= 1) score += 5;

  // Impact & Operations (10 points)
  // Impact pipeline would need custom check
  if (projects.length >= 1) score += 4;
  // Partnerships would need separate table

  return Math.min(100, score);
}
```

---

## Progressive Disclosure Strategy

### Phase 1: Essential (0-50%)
**Goal:** Get users to visibility threshold

1. **Name & Avatar** (15 points)
   - CTA: "Add your photo to be recognized"
   - Why: Trust & memorability

2. **Location** (3 points)
   - CTA: "Where are you based?"
   - Why: Logistics matching

3. **Tagline** (10 points)
   - CTA: "What's your one-line intro?"
   - Why: First impression

4. **Mission** (15 points)
   - CTA: "What drives your work?"
   - Why: Values alignment

5. **One Experience or Skill** (10 points)
   - CTA: "Add your primary expertise"
   - Why: Matching capability

**Total: 53 points - Profile becomes visible**

### Phase 2: Matching-Ready (50-75%)
**Goal:** Enable algorithm matching

6. **Values** (5 points)
   - CTA: "Define your core values"
   - Why: Mission alignment scoring

7. **Causes** (5 points)
   - CTA: "What causes do you support?"
   - Why: Impact matching

8. **Additional Experience** (already counted)
   - CTA: "Add more of your journey"
   - Why: Better context

9. **Expertise Atlas** (10 points)
   - CTA: "Map your skills"
   - Why: Core matching factor

**Total: 73 points - Full matching enabled**

### Phase 3: Trust-Building (75-100%)
**Goal:** Maximize credibility & algorithm preference

10. **Verified Proof** (10 points)
    - CTA: "Add your first verified proof"
    - Why: Credibility boost

11. **Education** (10 points)
    - CTA: "Share your learning journey"
    - Why: Complete picture

12. **Volunteering** (5 points)
    - CTA: "Show your community impact"
    - Why: Values demonstration

**Total: 98+ points - Exceptional profile**

---

## Onboarding Flow Design

### Welcome Screen

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Welcome to Proofound! 🎉              │
│                                                     │
│  Let's build your trust profile in 5 minutes       │
│                                                     │
│  ┌───┬───┬───┬───┬───┐                            │
│  │ ● │ ○ │ ○ │ ○ │ ○ │  Step 1 of 5             │
│  └───┴───┴───┴───┴───┘                            │
│                                                     │
│  We'll help you:                                    │
│  ✓ Share your mission and values                   │
│  ✓ Map your expertise and journey                  │
│  ✓ Build verified credibility                      │
│                                                     │
│            [Let's Get Started →]                    │
│                                                     │
│  [Skip for now - complete later]                   │
└─────────────────────────────────────────────────────┘
```

### Step 1: Basic Identity (Required)

```
Step 1 of 5: Who are you?

[Photo Upload Area]
Add your photo

Full Name: [_______________]

Location: [_______________]
          [Dropdown: San Francisco, CA]

[Continue →]
```

### Step 2: Purpose (Required)

```
Step 2 of 5: What drives you?

In one sentence, what's your professional tagline?
[_________________________________________________]
e.g., "Building accessible tech for underserved communities"

What's your mission?
[                                                 ]
[                                                 ]
[                                                 ]
What change do you want to create in the world?

[← Back] [Continue →]
```

### Step 3: Values & Causes (Required)

```
Step 3 of 5: What do you care about?

Select your core values (at least 3):
[ ] Equity & Justice    [ ] Innovation
[ ] Community           [ ] Sustainability
[ ] Transparency        [ ] Collaboration
[+ Add custom value]

What causes do you support? (at least 2)
[Selected: Climate Justice, Education Access]

[Suggestions: Economic Equity, Healthcare, Arts & Culture...]

[← Back] [Continue →]
```

### Step 4: Expertise & Journey (Partial Required)

```
Step 4 of 5: What's your expertise?

Add your top 3 skills:
1. [_______________] Proficiency: [●●●○○]
2. [_______________] Proficiency: [●●●●○]
3. [_______________] Proficiency: [●●○○○]

Add one work experience:
Title: [___________________________]
Organization: [____________________]
Duration: [______] to [______]

What did you learn? [______________]
How did you grow? [________________]

[← Back] [Continue →]
```

### Step 5: Completion & Next Steps

```
Step 5 of 5: You're ready! 🎉

Your profile is 68% complete and ready for matching.

What you've added:
✓ Photo and basic info
✓ Mission and values
✓ 3 skills
✓ 1 work experience

Boost your profile further:
○ Add verified proofs (+15%)
○ Add education (+10%)
○ Add volunteering (+5%)

[Go to Dashboard] [Complete My Profile]
```

---

## In-App Prompts & Nudges

### Banner (Shown until 75%+)

```
┌─────────────────────────────────────────────────────┐
│ 🎯 Profile 68% complete                             │
│ [████████████████░░░░░░░░░] 68%                    │
│                                                     │
│ Add verified proofs to unlock full matching        │
│ [Add Proof] [Dismiss]                              │
└─────────────────────────────────────────────────────┘
```

### Contextual Prompts

**On Dashboard:**
```
[ Empty State Card ]
No verified proofs yet

Verified proofs boost your credibility and matching score by up to 30%
[Submit Your First Proof →]
```

**On Matches Page (if profile < 75%):**
```
⚠️ Limited Matching Enabled

Complete your profile to 75% to see all potential matches
Current: 68% | Need: +7%

Quick wins:
• Add 1 verified proof (+10%)
• Add education entry (+10%)

[Complete Profile]
```

### Email Reminders

**Day 1 After Signup (if < 25%):**
```
Subject: Welcome to Proofound! Let's complete your profile

Hi [Name],

Thanks for joining Proofound! Your profile is 15% complete. 
Let's finish setting it up so you can start making meaningful connections.

[Complete My Profile]

What you'll add (5 minutes):
✓ Your mission and what drives you
✓ Your top skills and expertise
✓ One recent work experience

See you soon!
```

**Day 7 (if < 50%):**
```
Subject: You're halfway there! 🎯

Your profile is 42% complete. Add your verified proofs to unlock full matching.

[Add Proofs →]

Why verified proofs matter:
• Build trust with potential matches
• Boost your credibility score
• Stand out in matching results
```

**Day 30 (if < 75%):**
```
Subject: Unlock full matching potential

You're close! Complete your profile to 75% to access all features.

Current: 68%
Need: +7% (about 3 minutes)

Quick action: Add your education background
[Complete Now →]
```

---

## Measurement & Optimization

### Key Metrics

1. **Profile Completion Distribution**
   ```sql
   SELECT 
     CASE 
       WHEN profile_completion_percentage < 25 THEN '0-25%'
       WHEN profile_completion_percentage < 50 THEN '25-50%'
       WHEN profile_completion_percentage < 75 THEN '50-75%'
       WHEN profile_completion_percentage < 90 THEN '75-90%'
       ELSE '90-100%'
     END as tier,
     COUNT(*) as user_count,
     COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
   FROM profiles
   WHERE deleted_at IS NULL
   GROUP BY tier
   ORDER BY tier;
   ```

2. **Average Completion Rate**
   ```sql
   SELECT 
     AVG(profile_completion_percentage) as avg_completion,
     PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY profile_completion_percentage) as median_completion
   FROM profiles
   WHERE deleted_at IS NULL;
   ```

3. **Time to Completion Milestones**
   ```sql
   SELECT 
     AVG(EXTRACT(EPOCH FROM (first_75_percent_at - created_at))/86400) as avg_days_to_75_percent
   FROM profiles
   WHERE profile_completion_percentage >= 75
   AND deleted_at IS NULL;
   ```

4. **Drop-off Points**
   ```sql
   SELECT 
     incomplete_section,
     COUNT(*) as stuck_users
   FROM (
     SELECT 
       id,
       CASE
         WHEN profile_completion_percentage < 25 THEN 'basic_info'
         WHEN mission IS NULL THEN 'mission'
         WHEN array_length(ARRAY(SELECT jsonb_array_elements(values)), 1) < 3 THEN 'values'
         -- Add more cases
       END as incomplete_section
     FROM profiles
     WHERE profile_completion_percentage < 75
     AND deleted_at IS NULL
   ) t
   WHERE incomplete_section IS NOT NULL
   GROUP BY incomplete_section
   ORDER BY stuck_users DESC;
   ```

### Success Criteria

**Individual Profiles:**
- 60% of users reach 50% completion within 7 days
- 40% of users reach 75% completion within 30 days
- Median completion: 65%+
- 90th percentile: 85%+

**Organization Profiles:**
- 50% reach 50% completion within 14 days
- 30% reach 75% completion within 45 days
- Median completion: 60%+
- 90th percentile: 80%+

---

## A/B Testing Recommendations

### Test 1: Onboarding Flow Length
- **A:** 5-step onboarding (current)
- **B:** 3-step onboarding (condensed)
- **Metric:** Completion rate within 24 hours

### Test 2: Empty State Messaging
- **A:** "Add your mission" (neutral)
- **B:** "Share what drives you" (emotional)
- **Metric:** Click-through rate on CTA

### Test 3: Progress Bar Position
- **A:** Banner at top (current)
- **B:** Sticky sidebar widget
- **Metric:** Profile completion rate

### Test 4: Proof Verification Timing
- **A:** Prompt immediately after signup
- **B:** Prompt after 50% completion
- **Metric:** Proof submission rate

---

## Best Practices

### Do:
✅ Celebrate milestones (25%, 50%, 75%, 100%)
✅ Show value of each section ("Why add this?")
✅ Use inline editing (don't force modal flows)
✅ Allow "skip for now" options
✅ Send gentle reminders, not spam
✅ Show examples of good entries
✅ Make verified proofs easy & rewarding

### Don't:
❌ Force 100% completion to use platform
❌ Use intimidating language ("Required", "Mandatory")
❌ Hide the completion percentage
❌ Require fields that aren't used in matching
❌ Over-email (max 1 per week)
❌ Make verification process confusing
❌ Punish low completion (just limit features gracefully)

---

## Edge Cases

### Inactive Users (< 25%, no activity in 30 days)
- Send one final "we miss you" email
- Offer 1-click profile completion wizard
- If no response in 60 days, mark as dormant (don't delete)

### Stuck Users (Same % for 14+ days)
- Identify the missing section
- Send targeted help: "Need help adding [section]?"
- Offer live chat or demo

### Over-Completers (100%)
- Celebrate & give badge ("Profile Champion")
- Invite to refer others
- Ask for testimonial/case study

---

## Related Documentation
- `individual-profile-states.md`
- `organization-profile-states.md`
- `IMPLEMENTATION_SUMMARY.md`
- `TESTING_GUIDE.md`

---

**Next Steps:**
1. Implement completion calculation functions
2. Build onboarding wizard
3. Create in-app nudges
4. Set up analytics tracking
5. Run A/B tests
6. Monitor drop-off points
7. Iterate based on data

