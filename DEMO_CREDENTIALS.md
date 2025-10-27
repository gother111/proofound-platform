# Proofound Demo Credentials

This document contains all demo user credentials and test data for the Proofound MVP platform.

## Important Notes

⚠️ **These demo profiles exist in the seed SQL file but require Supabase Auth users to be created first.**

To use these credentials:
1. Create Supabase Auth users via Dashboard or API
2. Run the seed SQL script: `supabase/seed/demo_profiles.sql`
3. Use the emails below to log in

---

## Individual Demo Profiles

### 1. Sofia Martinez - UX Designer
**Email:** `sofia.martinez@proofound-demo.com`
**Password:** Set when creating Supabase Auth user

**Profile Details:**
- **Location:** Barcelona, Spain
- **Experience:** 8 years in UX Design
- **Specialization:** Accessibility and Inclusive Design
- **Mission:** Create digital experiences that are accessible and empowering for everyone
- **Salary Range:** €65,000 - €85,000
- **Status:** Open to opportunities
- **Profile Completion:** 85%

**Key Skills:**
- UX Research (Expert, 8 years)
- Accessibility/WCAG (Expert, 6 years)
- Figma (Expert, 5 years)
- Design Systems (Advanced, 4 years)

**Languages:** Spanish (Native), English (Fluent), Catalan (Native)

---

### 2. James Chen - Software Engineer
**Email:** `james.chen@proofound-demo.com`
**Password:** Set when creating Supabase Auth user

**Profile Details:**
- **Location:** Vancouver, BC, Canada
- **Experience:** 5 years in Software Engineering
- **Specialization:** Climate Tech & Full-Stack Development
- **Mission:** Build technology that accelerates the transition to a sustainable future
- **Salary Range:** $80,000 - $110,000 CAD
- **Status:** Available
- **Profile Completion:** 82%

**Key Skills:**
- React.js (Expert, 5 years)
- Node.js (Advanced, 4 years)
- PostgreSQL (Advanced, 4 years)
- Python (Advanced, 3 years)
- TypeScript (Expert, 4 years)

**Languages:** English (Fluent), Mandarin (Native), French (Conversational)

---

### 3. Amara Okafor - Community Organizer
**Email:** `amara.okafor@proofound-demo.com`
**Password:** Set when creating Supabase Auth user

**Profile Details:**
- **Location:** London, United Kingdom
- **Experience:** 10 years in Community Organizing
- **Specialization:** Grassroots Activism & Education Equity
- **Mission:** Build grassroots movements that center marginalized voices in education policy
- **Salary Range:** £45,000 - £65,000
- **Status:** Open to opportunities
- **Profile Completion:** 88%

**Key Skills:**
- Community Organizing (Expert, 10 years)
- Program Management (Expert, 8 years)
- Grant Writing (Advanced, 7 years)
- Public Speaking (Expert, 9 years)
- Youth Development (Expert, 10 years)

**Languages:** English (Fluent), Igbo (Native), Yoruba (Conversational)

---

### 4. Dr. Yuki Tanaka - Data Scientist
**Email:** `yuki.tanaka@proofound-demo.com`
**Password:** Set when creating Supabase Auth user

**Profile Details:**
- **Location:** Tokyo, Japan
- **Experience:** 12 years in Data Science & Public Health Research
- **Specialization:** Healthcare Analytics & AI Ethics
- **Mission:** Leverage data science to improve healthcare outcomes for underserved populations
- **Salary Range:** $95,000 - $130,000 USD
- **Status:** Not available
- **Profile Completion:** 90%

**Key Skills:**
- Machine Learning (Expert, 10 years)
- Python (Expert, 12 years)
- R (Expert, 12 years)
- Healthcare Analytics (Expert, 12 years)
- Statistical Analysis (Expert, 12 years)

**Languages:** Japanese (Native), English (Fluent), Mandarin (Intermediate)

**Education:** PhD in Health Informatics, University of Tokyo

---

### 5. Alex Rivera - Social Entrepreneur
**Email:** `alex.rivera@proofound-demo.com`
**Password:** Set when creating Supabase Auth user

**Profile Details:**
- **Location:** Austin, TX, USA
- **Experience:** 6 years in Social Entrepreneurship
- **Specialization:** Regenerative Agriculture & Impact Investing
- **Mission:** Build regenerative economic systems honoring indigenous wisdom
- **Salary Range:** $70,000 - $95,000 USD
- **Status:** Available
- **Profile Completion:** 83%

**Key Skills:**
- Business Strategy (Expert, 6 years)
- Fundraising (Advanced, 5 years)
- Partnership Development (Expert, 6 years)
- Supply Chain Design (Advanced, 4 years)
- Impact Measurement (Advanced, 5 years)

**Languages:** Spanish (Native), English (Fluent), Nahuatl (Conversational)

---

## Organization Demo Profiles

### 1. GreenTech Innovations
**Contact Email:** `hello@greentech-innovations.com`
**Type:** Social Enterprise / Startup
**Location:** Berlin, Germany

**About:**
Accelerates the transition to clean energy in rural and underserved regions through innovative technology and community partnerships.

**Active Assignments:**
- **Senior Solar Engineer** - €75,000-€95,000, Full-time, Berlin + 40% travel to East Africa
- **Community Outreach Coordinator** - €45,000-€60,000, Full-time, Remote (Kenya preferred)

**Focus Areas:** Clean Energy, Climate Action, Rural Development

---

### 2. Code for Good Foundation
**Contact Email:** `team@codeforgood.org`
**Type:** NGO / Nonprofit
**Location:** Nairobi, Kenya

**About:**
Bridges the digital divide by providing free coding education and tech skills training to underserved youth across Africa. Trained 5,000+ students with 70% placement rate.

**Active Assignments:**
- **Lead Instructor - Web Development** - Volunteer, Part-time (20 hrs/week), Nairobi
- **Program Manager - Expansion Strategy** - $35,000-$50,000, Full-time, Remote
- **Volunteer Mentor - Career Guidance** - Volunteer, Flexible (2-5 hrs/week), Remote

**Focus Areas:** Education Equity, Digital Literacy, Youth Empowerment

---

### 3. Impact Capital Partners
**Contact Email:** `careers@impactcapitalpartners.com`
**Type:** Investment Firm / For-profit
**Location:** London, United Kingdom

**About:**
Impact investing firm with 50+ portfolio companies across clean energy, healthcare, education, and sustainable agriculture. Manages 8-year track record of combining financial returns with measurable impact.

**Active Assignments:**
- **Senior Impact Measurement Analyst** - £70,000-£90,000, Full-time, London (hybrid)

**Focus Areas:** Impact Investing, ESG, Climate Finance, Social Innovation

---

## How to Set Up Demo Data

### Step 1: Create Supabase Auth Users

Go to your Supabase Dashboard → Authentication → Users, then create users with these emails:

```
sofia.martinez@proofound-demo.com
james.chen@proofound-demo.com
amara.okafor@proofound-demo.com
yuki.tanaka@proofound-demo.com
alex.rivera@proofound-demo.com
```

Set a simple password for testing (e.g., `Demo123!` for all).

### Step 2: Run the Seed Script

In Supabase SQL Editor, run:

```sql
-- Copy and paste contents of: supabase/seed/demo_profiles.sql
```

This will create:
- 5 individual profiles with complete data
- 3 organization profiles
- 6 job assignments
- Expertise atlas entries (35+ skills)
- Proofs and verifications (20+ items)
- Sample artifacts and analytics

### Step 3: Verify Data

Run this query to check:

```sql
SELECT
  full_name,
  email,
  region,
  profile_completion_percentage || '%' as completion,
  CASE WHEN available_for_match THEN 'Available' ELSE 'Not Available' END as status
FROM profiles
WHERE email LIKE '%proofound-demo.com'
ORDER BY full_name;
```

---

## Quick Test Scenarios

### Scenario 1: Individual Job Seeker
**Login as:** Sofia Martinez or James Chen
**Test:** Browse assignments, view matches, update profile

### Scenario 2: Community Organizer
**Login as:** Amara Okafor
**Test:** View matching organizations, explore community-focused assignments

### Scenario 3: Researcher (Not Available)
**Login as:** Dr. Yuki Tanaka
**Test:** View profile, see "not available" status, manage visibility settings

### Scenario 4: Social Entrepreneur
**Login as:** Alex Rivera
**Test:** Explore impact investing opportunities, partnership matches

---

## Admin Dashboard Testing

To test the admin dashboard:

1. Create an admin user (see `ADMIN_SETUP.md`)
2. Run: `UPDATE profiles SET is_admin = true WHERE email = 'your-admin@email.com';`
3. Access `/admin` route
4. View all demo profiles, analytics, and moderation queue

---

## Database Schema Reference

All demo data follows the schema defined in:
- `supabase/migrations/00_initial_schema.sql` - Main schema
- `supabase/migrations/20250127_subscription_waitlist.sql` - Waitlist table
- `supabase/seed/demo_profiles.sql` - Demo data

---

## Notes for Testing

- All profiles have 80%+ completion for realistic testing
- Profiles include diverse backgrounds, locations, and expertise levels
- Organizations range from nonprofits to for-profits
- Assignments include full-time, part-time, contract, and volunteer roles
- All data is realistic and suitable for demo presentations

---

**Last Updated:** January 27, 2025
**Maintained By:** Proofound Development Team
