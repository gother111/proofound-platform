> Doc Class: `historical`
> Historical Snapshot Reviewed: `2026-02-26`
> Canonical Current Testing Docs:
>
> - `docs/testing-strategy.md`
> - `docs/qa/e2e-matrix.md`
> - `docs/qa/summary.md`
> - `agent/checklists/verification.md`
> - `agent/runbooks/setup.md`
>
> Note: This archived file preserves historical context. For current routes, commands, and gate criteria, use the canonical docs above.

---

# Feature Documentation - New MVP Enhancements

**Last Updated:** November 8, 2025  
**Target Audience:** Product Team, Support Team, End Users

---

## Overview

This document describes all new features implemented in the MVP enhancement phase. Each feature includes:

- ✅ **What it does** (user benefit)
- 🎯 **How to use it** (step-by-step)
- 🔧 **Technical details** (for support/dev teams)

---

## Table of Contents

### For Individuals

1. [Match Transparency](#1-match-transparency)
2. [Verification Gates](#2-verification-gates)
3. [AI Skill Extraction](#3-ai-skill-extraction)
4. [Profile Sharing](#4-profile-sharing)
5. [Activity Log](#5-activity-log)
6. [Match Snoozing](#6-match-snoozing)

### For Organizations

7. [Interview Scheduling](#7-interview-scheduling)
8. [Decision Workflow](#8-decision-workflow)
9. [Evidence Pack Export](#9-evidence-pack-export)
10. [Matching Profile Customization](#10-matching-profile-customization)

### For Admins

11. [Performance Monitoring](#11-performance-monitoring)
12. [Fairness Analytics](#12-fairness-analytics)
13. [Metrics Dashboard](#13-metrics-dashboard)

### Platform-Wide

14. [AI Policy Assistant](#14-ai-policy-assistant)
15. [Usability Surveys](#15-usability-surveys)
16. [Data Import](#16-data-import)

---

## For Individuals

### 1. Match Transparency

**✅ What it does:**
Shows you exactly why you were matched with an assignment, including your rank among all candidates.

**🎯 How to use it:**

1. Go to **Matching** page
2. Find a match you're interested in
3. Click **"Why this match?"** button
4. View your match explanation:
   - **Overall Score:** Your total match percentage
   - **Score Breakdown:** How each factor contributed (skills, values, experience, etc.)
   - **PAC Score:** Purpose-Alignment-Contribution rating
   - **Your Rank:** Where you stand (e.g., "#3 of 47 candidates")
   - **Skill Matches:** Specific skills that aligned
   - **Constraints:** Requirements you met

**💡 Benefits:**

- Understand why you're a good fit
- See your competitive position
- Identify areas to improve

**🔧 Technical:**

- Component: `MatchExplainerModal.tsx`
- API: `GET /api/match/explain/[matchId]`
- Calculation: Real-time based on latest profile data

---

### 2. Verification Gates

**✅ What it does:**
Ensures you've completed required verification steps before expressing interest in a match.

**🎯 How to use it:**

1. Try to click **"Interested"** on a match
2. If requirements aren't met, you'll see a warning
3. The warning shows what's needed:
   - ✉️ **Email Verification:** Click link in welcome email
   - 📱 **Phone Verification:** Enter code sent via SMS
   - 👤 **Profile Completion:** Add at least 3 skills
4. Complete the missing steps
5. Return to the match and click **"Interested"** again

**💡 Benefits:**

- Organizations only see verified, complete profiles
- Higher quality matches
- Better response rates

**🔧 Technical:**

- Component: `VerificationGatesWarning.tsx`
- API: `GET /api/match/gates`
- Gates checked: `email_verified`, `phone_verified`, `profile_complete`

---

### 3. AI Skill Extraction

**✅ What it does:**
Automatically suggests skills to add to your profile from your resume or work history text.

**🎯 How to use it:**

1. Go to **Expertise** page
2. Click **"Auto-Suggest Skills"** button
3. Paste your resume text or job description
4. Click **"Analyze"**
5. Wait 5-10 seconds for AI analysis
6. Review suggested skills:
   - Skill name
   - Proficiency level (1-5)
   - Confidence score
   - Estimated experience
7. Select skills to add
8. Click **"Add Selected Skills"**

**💡 Benefits:**

- Save time building your profile
- Don't forget important skills
- Get proficiency level suggestions
- See AI confidence scores

**🔧 Technical:**

- Component: Skills auto-suggest in Expertise page
- API: `POST /api/expertise/auto-suggest`
- AI Model: Anthropic Claude Opus
- Fallback: Rule-based keyword matching

---

### 4. Profile Sharing

**✅ What it does:**
Create shareable links or embeddable cards of your profile for websites, social media, or email signatures.

**🎯 How to use it:**

1. Go to **Profile** page
2. Click **"Share Profile"** button
3. Choose what to share:
   - Select fields (name, skills, bio, etc.)
   - Choose format:
     - 📛 **Mini:** Small badge
     - 🃏 **Card:** Standard profile card
     - 📄 **Full:** Complete profile
   - Select theme (light/dark/auto)
   - Set expiration (optional)
4. Click **"Generate Link"**
5. Copy and use:
   - **Link:** Share URL directly
   - **Embed Code:** Add to website
   - **Social Text:** Pre-written share text

**💡 Benefits:**

- Professional online presence
- Easy to share accomplishments
- Control what's visible
- Track views

**🔧 Technical:**

- Component: `ShareProfileDialog.tsx`
- API: `POST /api/profile/snippet`
- Storage: `profile_snippets` table
- Access: Public (no auth required)

---

### 5. Activity Log

**✅ What it does:**
Shows complete history of all actions on your account for transparency and GDPR compliance.

**🎯 How to use it:**

1. Go to **Settings** → **Privacy**
2. Click **"Activity Log"** tab
3. View your activity:
   - When: Timestamp of each action
   - What: Description (e.g., "Updated profile", "Viewed match")
   - Where: Device and hashed IP address
4. **Search:** Type keywords to filter events
5. **Export:** Download as JSON file for your records

**💡 Benefits:**

- Full transparency
- Security monitoring (spot unauthorized access)
- GDPR right to access compliance

**🔧 Technical:**

- Component: `AuditLogViewer.tsx`
- API: `GET /api/user/audit-log`
- Data Source: `analytics_events` table
- Privacy: IP addresses hashed (SHA-256)

---

### 6. Match Snoozing

**✅ What it does:**
Temporarily hide matches you're not ready to decide on.

**🎯 How to use it:**

1. Find a match on **Matching** page
2. Click **"Snooze"** button (⏰ icon)
3. Choose duration:
   - 1 day
   - 1 week
   - 1 month
   - Custom date
4. Match disappears from list
5. It reappears automatically after snooze period

**💡 Benefits:**

- Focus on high-priority matches
- Revisit later without losing opportunity
- Keep matching page clean

**🔧 Technical:**

- Component: `SnoozeDialog.tsx`
- API: `POST /api/matches/[id]/snooze`
- Field: `snoozedUntil` timestamp in `matches` table

---

## For Organizations

### 7. Interview Scheduling

**✅ What it does:**
Schedule interviews with automatic Zoom or Google Meet meeting creation.

**🎯 How to use it:**

1. Go to candidate profile or match
2. Click **"Schedule Interview"**
3. **Connect Platform** (first time only):
   - Click "Connect Zoom" or "Connect Google Meet"
   - Authorize Proofound
4. **Select Date:**
   - Click calendar date (within 7 days)
   - Choose 30-minute time slot
5. **Add Details:**
   - Participant emails
   - Interview notes
6. Click **"Schedule"**
7. Meeting created automatically:
   - Meeting link generated
   - Calendar invites sent
   - Download .ics file

**💡 Benefits:**

- One-click meeting creation
- No manual link sharing
- Automatic calendar integration
- 7-day window ensures responsiveness

**🔧 Technical:**

- Component: `InterviewScheduler.tsx`
- API: `POST /api/interviews/schedule`
- Integrations: Zoom OAuth, Google OAuth
- Storage: `user_video_integrations` table
- Constraints: 30-min duration, 7-day window

---

### 8. Decision Workflow

**✅ What it does:**
Track hiring decisions with automatic reminders to meet 48-hour SLA.

**🎯 How to use it:**

1. After interview completes, see **"Make Decision"** button
2. Click button to open decision dialog
3. See countdown timer (48 hours from interview)
4. **Make Decision:**
   - ✅ **Hire:** Offer position
   - ❌ **Reject:** Do not hire
   - 🤔 **Maybe:** Need more info
   - ⏸️ **Hold:** Put on hold
5. Add feedback notes
6. Click **"Confirm Decision"**
7. Decision recorded (immutable)

**⏰ Automatic Reminders:**

- **24 hours:** Friendly reminder
- **40 hours:** Urgent reminder
- **48 hours:** SLA deadline
- **54 hours:** Escalation notice

**💡 Benefits:**

- Never miss decision deadlines
- Better candidate experience
- Accountability tracking
- Historical record

**🔧 Technical:**

- Component: `DecisionDialog.tsx`
- API: `POST /api/decisions`
- Reminders: Cron job every 6 hours
- Storage: `decisions` table (immutable)
- SLA: 48 hours from interview end

---

### 9. Evidence Pack Export

**✅ What it does:**
Generate comprehensive PDF report of candidate's verified profile, skills, and match information.

**🎯 How to use it:**

1. Go to candidate profile
2. Click **"Download Evidence Pack"** button
3. Wait for PDF generation (5-10 seconds)
4. PDF downloads automatically

**📄 PDF Contents:**

- Candidate profile (name, headline, bio, contact)
- Match score and rank
- Complete skills list with verification badges
- Work experience history
- Education background
- Verification status (email, phone, identity)
- Interview and decision record (if any)

**💡 Benefits:**

- Professional hiring documentation
- Shareable with stakeholders
- Audit trail for compliance
- Offline reference

**🔧 Technical:**

- Component: `EvidencePackButton.tsx`
- API: `GET /api/evidence-pack/[candidateId]`
- Generator: PDFKit library
- Size: Typically 100-300 KB

---

### 10. Matching Profile Customization

**✅ What it does:**
Adjust how much each factor matters when candidates are ranked for your assignments.

**🎯 How to use it:**

1. Go to **Settings** → **Matching**
2. Click **"Customize Weights"**
3. **Adjust Sliders:**
   - **Skills:** 0-100%
   - **Values:** 0-100%
   - **Experience:** 0-100%
   - **Location:** 0-100%
   - **Compensation:** 0-100%
   - (Totals must equal 100%)
4. **Set Constraints:**
   - ☑️ Require skill match (hard requirement)
   - Set minimum score threshold (e.g., 70%)
5. Click **"Save Profile"**
6. Future matches use new weights

**💡 Benefits:**

- Find candidates that fit your priorities
- Flexibility per hiring need
- Transparent scoring

**🔧 Technical:**

- Component: `MatchingProfileEditor.tsx`
- API: `POST /api/matching/profile`
- Storage: `matching_profiles` table
- Validation: Weights must sum to 1.0

---

## For Admins

### 11. Performance Monitoring

**✅ What it does:**
Track Core Web Vitals and dashboard load times to ensure fast, smooth user experience.

**🎯 How to use it:**

1. Go to **Admin** → **Performance**
2. View metrics:
   - **LCP** (Largest Contentful Paint): ≤2.5s target
   - **FID** (First Input Delay): ≤100ms target
   - **CLS** (Cumulative Layout Shift): ≤0.1 target
   - **FCP** (First Contentful Paint): ≤1.8s target
   - **TTFB** (Time to First Byte): ≤600ms target
3. Each metric shows:
   - P50, P75, P95 values
   - Good/Needs Improvement/Poor breakdown
   - Daily trends
4. **Dashboard Load Times:**
   - Individual dashboard: <2s target
   - Organization dashboard: <2s target
   - Slowest pages flagged

**💡 Benefits:**

- Proactive performance issues detection
- User experience optimization
- Compliance with NFR targets

**🔧 Technical:**

- Component: `PerformanceDashboard.tsx`
- APIs:
  - `GET /api/analytics/web-vitals`
  - `GET /api/analytics/dashboard-load-time`
- Collection: Client-side via `web-vitals` library
- Storage: `web_vitals_metrics`, `dashboard_load_times`

---

### 12. Fairness Analytics

**✅ What it does:**
Automatically generate weekly reports analyzing demographic fairness in matching and hiring.

**🎯 How to use it:**

1. Go to **Admin** → **Fairness**
2. View latest report:
   - **Demographic Breakdown:** Opt-in self-reported data
   - **Match Rates:** By demographic group
   - **Statistical Significance:** Chi-square tests
   - **Identified Gaps:** Disparities flagged
3. **Per Assignment:**
   - Filter by specific role
   - See assignment-specific fairness metrics
4. **Export:** Download as markdown

**⏰ Automatic Generation:**

- Runs every Monday at midnight UTC
- Analyzes previous week's data
- Stored in `fairness_reports` table

**💡 Benefits:**

- Proactive bias detection
- Compliance with fairness goals
- Data-driven improvements
- Transparency

**🔧 Technical:**

- Component: `FairnessReport.tsx`
- API: `GET /api/analytics/fairness/report`
- Generator: `/lib/analytics/fairness.ts`
- Cron: Weekly via `/api/cron/fairness-report`
- Privacy: Opt-in demographic data only

---

### 13. Metrics Dashboard

**✅ What it does:**
Real-time display of key platform health metrics.

**🎯 How to use it:**

1. Go to **Admin** → **Metrics**
2. View KPIs:
   - **TTFQI** (Time to First Quality Interview): Target <5 days
   - **TTV** (Time to Value): Target <14 days
   - **TTSC** (Time to Successful Completion): Target <45 days
   - **PAC Lift:** Alignment improvement vs baseline
3. **Trend Charts:**
   - 7-day, 30-day, 90-day views
   - Compare periods
4. **Segmentation:**
   - By organization type
   - By skill category
   - By geographic region

**💡 Benefits:**

- Platform health at a glance
- Early warning of issues
- Data for strategic decisions

**🔧 Technical:**

- Component: `MetricsDashboard.tsx`
- API: `GET /api/metrics/all`
- Calculations: `/lib/analytics/metrics.ts`
- Data: Aggregated from `analytics_events`

---

## Platform-Wide

### 14. AI Policy Assistant

**✅ What it does:**
Explains complex privacy policies and terms in plain language using AI.

**🎯 How to use it:**

1. Go to **Settings** → **Privacy** → **Policy Help**
2. Read policy text
3. If confused, click **"Ask AI"**
4. Type your question (e.g., "What happens when I delete my account?")
5. Get plain language explanation
6. See related questions

**💡 Benefits:**

- Understand your rights
- No legal jargon
- Instant answers
- GDPR transparency

**🔧 Technical:**

- Component: `PolicyAssistant.tsx`
- API: `POST /api/policy/explain`
- AI Model: Anthropic Claude
- Context: Privacy policy, terms of service

---

### 15. Usability Surveys

**✅ What it does:**
Collect feedback on system usability using the standardized SUS (System Usability Scale).

**🎯 How to use it:**

**Triggers:**

- After completing key actions (interview scheduling, etc.)
- Randomly for active users (10% sample)
- Manual trigger from profile menu

**Survey:**

1. 10 questions, 1-5 scale
2. Takes ~2 minutes
3. Questions alternate positive/negative
4. Example: "I found the system easy to use"

**Results:**

- Your score calculated (0-100)
- Rating: Excellent (80+), Good (68-79), OK (51-67), Poor (0-50)

**💡 Benefits:**

- Improve platform based on real feedback
- Benchmark against industry standards
- Identify pain points

**🔧 Technical:**

- Component: `SUSDialog.tsx`
- API: `POST /api/surveys/sus`
- Hook: `useSUSurvey.ts`
- Storage: `sus_responses` table
- Scoring: Standard SUS formula

---

### 16. Data Import

**✅ What it does:**
Import your profile from JSON file with intelligent conflict resolution.

**🎯 How to use it:**

1. Go to **Settings** → **Data** → **Import**
2. Upload JSON file
3. System detects conflicts:
   - New value different from existing
   - Shows both versions
4. **Choose Strategy Per Conflict:**
   - **Keep Current:** Don't change
   - **Overwrite:** Use new value
   - **Merge:** Combine both (where applicable)
5. Preview changes
6. Click **"Confirm Import"**
7. Data imported

**💡 Benefits:**

- Easy platform migration
- Smart conflict handling
- Data portability (GDPR)
- Backup restoration

**🔧 Technical:**

- Component: `ConflictResolutionDialog.tsx`
- APIs:
  - `POST /api/data-import/preview`
  - `POST /api/data-import`
- Logic: `/lib/data-import/conflict-resolver.ts`

---

## FAQ

### General

**Q: Where can I find these new features?**  
A: Most are integrated into existing pages. Check the navigation menu for new icons/badges.

**Q: Do I need to do anything to activate them?**  
A: No, all features are automatically available. Some require one-time setup (e.g., video platform connection).

**Q: Are these features included in my plan?**  
A: Yes, all features are included in both Individual and Organization plans.

### Technical

**Q: Is my data secure with AI features?**  
A: Yes. AI processing happens server-side. Your data is never stored by the AI provider. See [Security Review](SECURITY_REVIEW_REPORT.md).

**Q: Can I opt out of performance tracking?**  
A: Performance metrics (Web Vitals) are anonymous and don't require opt-in. For analytics events, see Privacy Settings.

**Q: How accurate is the AI skill extraction?**  
A: Confidence scores average 85-95% for common skills. Always review suggestions before adding.

### Support

**Q: A feature isn't working for me**  
A: Contact support@proofound.com with:

- Feature name
- What you were trying to do
- Error message (if any)
- Screenshot (if possible)

**Q: I have feedback on a new feature**  
A: Great! Send to feedback@proofound.com or use the in-app SUS survey.

---

## Glossary

- **TTFQI:** Time To First Quality Interview - Days from profile activation to first interview
- **TTV:** Time To Value - Days from first match to contract signed
- **TTSC:** Time To Successful Completion - Days from contract to project completion
- **PAC:** Purpose-Alignment-Contribution score (0-1)
- **SUS:** System Usability Scale (0-100)
- **SLA:** Service Level Agreement (e.g., 48-hour decision window)
- **RLS:** Row-Level Security (database access control)
- **GDPR:** General Data Protection Regulation (EU privacy law)
- **WCAG:** Web Content Accessibility Guidelines

---

## Version History

**v2.0 - November 8, 2025**

- Initial release of all 22 new features
- Comprehensive match transparency
- AI-powered features
- Organization decision workflow
- Admin analytics dashboards

---

**Questions?** Contact support@proofound.com  
**Product Docs:** https://docs.proofound.com  
**API Docs:** [API_DOCUMENTATION_FINAL.md](API_DOCUMENTATION_FINAL.md)
