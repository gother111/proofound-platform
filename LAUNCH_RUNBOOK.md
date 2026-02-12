# Proofound MVP Launch Runbook

**Version:** 1.0  
**Last Updated:** November 5, 2025  
**Document Owner:** Pavlo Samoshko (CEO) & Yurii Bakurov (Technical Lead)  
**Purpose:** Operational playbook for MVP beta launch and ongoing operations

---

## Table of Contents

1. [Team Structure](#1-team-structure)
2. [Pre-Launch Checklist](#2-pre-launch-checklist)
3. [Launch Phases](#3-launch-phases)
4. [Incident Response](#4-incident-response)
5. [Monitoring & Alerts](#5-monitoring--alerts)
6. [Support Protocols](#6-support-protocols)
7. [Database Backup & Recovery](#7-database-backup--recovery)
8. [Deployment Procedures](#8-deployment-procedures)
9. [Emergency Contacts](#9-emergency-contacts)
10. [Post-Launch Review](#10-post-launch-review)

---

## 1. Team Structure

### Core Team

#### **Pavlo Samoshko** - CEO & Product Owner

**Role:** Product strategy, user feedback, product decisions  
**Responsibilities:**

- Product vision and roadmap
- User interviews and feedback analysis
- Fairness metric reviews
- Go/no-go launch decisions
- Support: Product and user experience questions
- Final approval on all product changes

**Contact:**

- Email: pavlo@proofound.io
- Timezone: [TBD]
- Availability: [TBD]
- Emergency: [Phone number TBD]

**Escalation Path:** CEO (final decision maker)

---

#### **Yurii Bakurov** - Technical Lead

**Role:** Engineering, infrastructure, technical operations  
**Responsibilities:**

- Code development and deployment
- Infrastructure management (Vercel, Supabase)
- Technical support and bug fixes
- Performance monitoring
- Database backups and security
- Technical documentation

**Contact:**

- Email: yurii@proofound.io
- Timezone: [TBD]
- Availability: [TBD]
- Emergency: [Phone number TBD]

**Escalation Path:** Technical Lead → CEO (for business decisions)

---

### On-Call Rotation

**Beta Phase (Nov 15 - Feb 1):**

- **Primary On-Call:** Yurii (technical issues)
- **Secondary On-Call:** Pavlo (product/user issues)
- **Hours:** Mon-Fri 9 AM - 6 PM UTC (business hours)
- **After-Hours:** Emergency only (site down, data breach)

**Response Time SLAs:**

- **P0 (Critical):** 15 minutes
- **P1 (High):** 2 hours
- **P2 (Medium):** 24 hours (next business day)
- **P3 (Low):** 1 week

---

### Communication Channels

**Internal Team:**

- Primary: Slack/Discord channel `#proofound-alerts`
- Urgent: Text message/phone call
- Status updates: Slack `#proofound-general`
- Planning: Weekly meeting (Mondays 10 AM UTC)

**User-Facing:**

- Support email: hello@proofound.io
- In-app chat: Crisp widget (Mon-Fri 9 AM - 6 PM UTC)
- Status page: [TBD - create simple status page]
- Social media: Twitter/LinkedIn for major announcements

---

## 2. Pre-Launch Checklist

### Two Weeks Before Private Beta (Nov 1-15)

**Technical Setup (Yurii):**

- [ ] All P0 critical gaps resolved (see PRD_IMPLEMENTATION_AUDIT_2025-11-05.md)
- [ ] Vercel Analytics configured and verified
- [ ] Database migrations applied to production
- [ ] Row-Level Security (RLS) policies tested
- [ ] Rate limiting enabled and tested
- [ ] Error tracking (Sentry or Vercel logs) confirmed working
- [ ] SSL certificates valid (auto-renewed by Vercel)
- [ ] Custom domain configured: proofound.io
- [ ] Environment variables set in Vercel production
- [ ] API keys rotated (OpenAI, Resend, Veriff if used)

**Data & Security (Yurii):**

- [ ] Supabase production database backed up
- [ ] Test database restore procedure once
- [ ] RLS policies verified for all tables
- [ ] Sensitive data encrypted (passwords, tokens)
- [ ] GDPR compliance reviewed (see DATA_REQUIREMENTS_AND_AI_STRATEGY.md)
- [ ] Privacy policy published and up-to-date
- [ ] Terms of service published

**Support Setup (Pavlo + Yurii):**

- [ ] hello@proofound.io email configured
- [ ] Auto-responder set up (see section 6.2)
- [ ] Email templates created for common issues
- [ ] Crisp chat widget installed and tested
- [ ] Support request tracking spreadsheet/Linear board ready
- [ ] FAQ page created (initial 10-15 questions)

**Monitoring & Analytics (Yurii):**

- [ ] Vercel Analytics Real User Monitoring enabled
- [ ] Core Web Vitals tracking confirmed
- [ ] Analytics events firing correctly (see METRICS_INSTRUMENTATION_COMPLETE.md)
- [ ] Admin metrics dashboard accessible at `/app/admin/metrics`
- [ ] Daily monitoring checklist created (see section 5.3)
- [ ] Weekly metrics review meeting scheduled (Mondays 10 AM UTC)

**Content & Documentation (Pavlo + Yurii):**

- [ ] Landing page copy finalized and deployed
- [ ] Help Center / FAQ page published
- [ ] Onboarding flow tested end-to-end
- [ ] Email templates for beta invitations ready
- [ ] Privacy policy and ToS links visible in footer
- [ ] Changelog page created (for weekly updates)

**Testing & QA (Pavlo + Yurii):**

- [ ] All critical user flows smoke tested:
  - [ ] Signup → Email verification → Login
  - [ ] Onboarding (5 steps) → Profile activation
  - [ ] Add skills → Request verification
  - [ ] View matches → Apply to assignment
  - [ ] Messaging → Schedule interview
  - [ ] Organization signup → Create assignment → Publish
- [ ] Mobile responsiveness tested (iOS Safari, Android Chrome)
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility audit completed (see MVP_LAUNCH_DECISIONS.md Decision 3)
- [ ] Performance targets verified (TTI <3.5s mobile)
- [ ] Error messages user-friendly and actionable

**Compliance & Legal (Pavlo):**

- [ ] Privacy policy reviewed by legal (if applicable)
- [ ] Terms of service finalized
- [ ] GDPR consent flows tested (EU users)
- [ ] Data retention policies documented
- [ ] User data export tested (GDPR Right to Access)
- [ ] Account deletion tested (GDPR Right to Erasure)

**Launch Materials (Pavlo):**

- [ ] Private beta invitation email drafted
- [ ] Welcome email sequence created (Day 0, 3, 7)
- [ ] Mid-beta survey prepared (2 weeks in)
- [ ] SUS survey implemented and tested
- [ ] Social media posts scheduled (Twitter, LinkedIn)

---

### Final 24 Hours Before Launch (Nov 14)

**Final Smoke Tests (Yurii):**

- [ ] Production database connection verified
- [ ] All API endpoints returning 200 OK
- [ ] Authentication working (signup, login, logout)
- [ ] Email delivery working (Resend test sends)
- [ ] File uploads working (Supabase Storage)
- [ ] Real-time features working (messaging, notifications)
- [ ] Payment processing disabled (not in MVP scope)

**Team Readiness (Pavlo + Yurii):**

- [ ] On-call schedule confirmed for first week
- [ ] Emergency contact numbers shared
- [ ] Runbook reviewed together
- [ ] Support email inbox cleared
- [ ] Crisp chat widget online and monitored
- [ ] First 10 beta invitations queued in email
- [ ] Go/no-go decision made (Pavlo final approval)

**Communication (Pavlo):**

- [ ] Beta users notified of launch timing
- [ ] Team Slack/Discord channel active
- [ ] Status page updated: "All systems operational"

---

## 3. Launch Phases

### Phase 0: Internal Testing (Nov 5-15, 2025)

**Goal:** Validate all critical paths work before real users arrive

**Participants:**

- Core team: Pavlo, Yurii
- Friends & family: 10 people
- Total: 12 users

**Activities:**

- **Daily smoke tests** (Yurii)
- **Bug triage and fixes** (Yurii, with Pavlo prioritization)
- **Performance optimization** (Yurii)
- **Content finalization** (Pavlo)

**Success Criteria:**

- 0 P0 (critical) bugs
- All core flows functional
- Performance targets met (TTI <3.5s)
- Database backups verified

**Timeline:**

- Week 1 (Nov 5-11): Bug fixes and optimization
- Week 2 (Nov 12-15): Final polish and testing

**Exit Criteria:** Pavlo + Yurii go/no-go on Nov 15 at 9 AM UTC

---

### Phase 1: Private Beta (Nov 15 - Dec 15, 2025)

**Goal:** Validate product-market fit with real users

**Duration:** 30 days

**Participants:**

- 50 invite-only users from waitlist
- Selection criteria:
  - Diverse roles (job seekers, career switchers, students)
  - Diverse locations (US, EU, other)
  - Mix of individual and organization accounts (80/20 split)
  - Active on social media (for potential word-of-mouth)

**Invitation Strategy:**

- **Staggered invitations:** 10 users/day for first 5 days
- **Email template:** See MVP_LAUNCH_DECISIONS.md Decision 4
- **Expiry:** Invite links expire in 7 days (create urgency)

**Key Metrics to Track:**

- **TTFQI (Time to First Qualified Introduction):** Target ≤72 hours
- **7-day retention:** Target ≥50%
- **SUS score:** Target ≥70 (Good usability)
- **Application rate:** % of users who apply to ≥1 assignment
- **Bug severity:** Track P0/P1/P2 bugs in Linear

**Weekly Activities:**

**Week 1 (Nov 15-22):**

- **Mon Nov 15:** Launch! Send first 10 invitations at 9 AM UTC
- **Tue-Fri Nov 16-19:** Send 10 invitations/day
- **Daily:** Monitor signups, errors, support emails
- **Thu Nov 18:** 1-on-1 user interviews (5 users, 30 min each)
- **Fri Nov 19:** Week 1 retro (Pavlo + Yurii)

**Week 2 (Nov 23-30):**

- **Mon Nov 23:** Weekly metrics review
- **Wed Nov 25:** Mid-beta survey sent to all users (NPS + qualitative)
- **Thu Nov 26:** Analyze survey results, prioritize top 3 issues
- **Fri Nov 27:** Week 2 retro

**Week 3 (Dec 1-8):**

- **Mon Dec 1:** Weekly metrics review
- **Tue-Thu Dec 2-4:** Implement fixes for top 3 issues
- **Fri Dec 5:** Deploy fixes to production
- **Fri Dec 5:** Week 3 retro

**Week 4 (Dec 9-15):**

- **Mon Dec 9:** Weekly metrics review
- **Tue Dec 10:** SUS survey push (email all users)
- **Thu Dec 12:** Calculate aggregate SUS score
- **Fri Dec 13:** Go/no-go decision for Public Beta (Pavlo + Yurii)
- **Sun Dec 15:** If approved, open Public Beta waitlist

**Success Criteria (Exit to Public Beta):**

- ✅ SUS score ≥70
- ✅ TTFQI ≤72 hours for ≥50% of users
- ✅ 7-day retention ≥50%
- ✅ 0 P0 bugs, <5 P1 bugs
- ✅ ≥20 completed SUS surveys (40% response rate)
- ✅ Positive qualitative feedback (majority of interviews)
- ✅ Pavlo approval

**Risk Mitigation:**

- If SUS <70: Extend Private Beta by 2 weeks, fix top UX issues
- If TTFQI >72h: Investigate matching algorithm, improve assignment quality
- If retention <50%: Conduct exit interviews, improve onboarding
- If critical bugs: Pause invitations, fix, resume

---

### Phase 2: Public Beta (Dec 15, 2025 - Jan 31, 2026)

**Goal:** Scale user base 10x, validate metrics at scale

**Duration:** 45 days (6.5 weeks)

**Participants:**

- Target: 500 users
- Access: Open waitlist → approval → invitation
- No selection criteria (accept all qualified signups)

**Invitation Strategy:**

- **Week 1-2 (Dec 15-29):** 50 users/week (throttle to manage load)
- **Week 3-4 (Dec 30-Jan 12):** 100 users/week (ramp up)
- **Week 5-6 (Jan 13-26):** 150 users/week (full ramp)
- **Week 7 (Jan 27-31):** 50 users/week (stabilize for GA)

**Key Metrics to Track:**

- **TTFQI:** Target ≤72 hours (median)
- **TTSC (Time to Signed Contract):** Target ≤30 days (median)
- **30-day retention:** Target ≥50%
- **SUS score:** Target ≥75 (Excellent usability)
- **Match quality:** Acceptance rate, interview rate, hire rate
- **Infrastructure:** API latency, error rate, database load

**Weekly Activities:**

**Week 1-2 (Dec 15-29):**

- Open waitlist with social media announcement
- Monitor infrastructure (database size, API limits)
- Daily metrics check: TTFQI, signups, errors
- Weekly retro: Fridays at 4 PM UTC

**Week 3-4 (Dec 30-Jan 12):**

- Ramp invitations to 100/week
- First Product Update email (changelog, new features)
- Community building: Consider Discord/Slack channel
- Weekly metrics review: Mondays at 10 AM UTC

**Week 5-6 (Jan 13-26):**

- Ramp to 150/week
- Prepare GA launch materials (Product Hunt, HN posts)
- Fix remaining P1 issues
- Weekly retro continues

**Week 7 (Jan 27-31):**

- Stabilize at 50/week
- Final polish and bug fixes
- GA launch announcement drafted
- Go/no-go decision for GA (Jan 30)

**Success Criteria (Exit to GA):**

- ✅ TTFQI ≤72 hours (median)
- ✅ 30-day retention ≥50%
- ✅ SUS ≥75
- ✅ 0 P0 bugs
- ✅ Infrastructure scales smoothly (no downtime >1 hour)
- ✅ ≥100 completed SUS surveys
- ✅ Positive community sentiment
- ✅ Pavlo + Yurii approval

**Risk Mitigation:**

- If infrastructure struggles: Upgrade Supabase tier early (Pro → Team)
- If metrics miss targets: Extend Public Beta to Feb 28
- If critical bugs emerge: Pause invitations, fix, resume
- If user feedback is negative: Conduct urgent user interviews, pivot if needed

---

### Phase 3: General Availability (Feb 1, 2026)

**Goal:** Public launch, drive user acquisition

**Launch Date:** February 1, 2026

**Access:** Open signup (no waitlist)

**Launch Activities:**

**Launch Week (Feb 1-7):**

- **Sat Feb 1, 6 AM PST:** Product Hunt launch (aim for top 5 of day)
- **Sun Feb 2, 8 AM PST:** Hacker News "Show HN" post
- **Mon Feb 3:** Email announcement to entire waitlist (remaining users)
- **Tue Feb 4:** Twitter/LinkedIn announcement posts
- **Wed Feb 5:** Press outreach (TechCrunch, VentureBeat, HR blogs)
- **Thu Feb 6:** First GA blog post: "Why We Built Proofound"
- **Fri Feb 7:** Week 1 retro and metrics review

**Month 1 (Feb 1-28):**

- Target: 1,000 users
- Daily monitoring of metrics
- Weekly product updates (changelog, new features)
- Community growth (Discord/Slack active moderation)
- PR and content marketing push

**Ongoing Operations:**

- Monitor metrics daily (Yurii)
- Monthly fairness audits (Pavlo + Yurii)
- Quarterly feature releases
- Annual security audits
- Continuous user feedback loop

**Success Criteria (Month 1):**

- ✅ 1,000 users by Feb 28
- ✅ TTFQI ≤72 hours
- ✅ TTSC ≤30 days (median)
- ✅ SUS ≥75
- ✅ 0 critical bugs
- ✅ Infrastructure scales smoothly
- ✅ Positive press coverage

**Growth Targets:**

- Month 1 (Feb): 1,000 users
- Month 2 (Mar): 2,500 users
- Month 3 (Apr): 5,000 users
- Month 6 (Jul): 20,000 users
- Year 1 (Feb 2027): 100,000 users

---

## 4. Incident Response

### 4.1 Severity Levels

| Severity          | Impact                                        | Examples                                                       | Response Time | Owner          |
| ----------------- | --------------------------------------------- | -------------------------------------------------------------- | ------------- | -------------- |
| **P0 - Critical** | Site down, data loss, security breach         | Database unavailable, XSS vulnerability, user data leaked      | 15 minutes    | Yurii          |
| **P1 - High**     | Core feature broken, major UX issue           | Signup broken, matching not working, payment processing failed | 2 hours       | Yurii          |
| **P2 - Medium**   | Non-critical bug, performance degradation     | Profile image upload slow, email delayed, minor UI bug         | 24 hours      | Yurii or Pavlo |
| **P3 - Low**      | Minor UX issue, feature request, cosmetic bug | Button misaligned, typo, color inconsistency                   | 1 week        | Pavlo          |

---

### 4.2 Incident Response Workflow

**1. Detection**

- Monitoring alert (Vercel, Sentry)
- User report (email, chat, social media)
- Internal testing/discovery

**2. Triage (5 minutes)**

- Assess severity (P0-P3)
- Assign owner (Yurii for technical, Pavlo for product)
- Create Linear issue with `[INCIDENT]` label
- Notify team in Slack `#proofound-alerts`

**3. Communicate (10 minutes)**

- **P0/P1:** Update status page immediately
- **P0/P1:** Email affected users if identifiable
- **P2/P3:** In-app notification or next changelog
- **Template:** "We're investigating [issue]. Updates in [timeframe]."

**4. Fix (varies)**

- **Immediate workaround:** Disable feature, rollback deployment
- **Root cause analysis:** Investigate logs, reproduce bug
- **Implement fix:** Code change, database migration, config update
- **Test fix:** Staging environment → production
- **Document:** Add to post-mortem (see section 4.5)

**5. Deploy (varies)**

- **Hotfix:** Direct to production (critical only)
- **Regular:** Via normal deployment process
- **Verify:** Smoke test after deployment
- **Monitor:** Watch metrics for 1 hour post-deploy

**6. Post-Mortem (within 24 hours for P0/P1)**

- Document: What happened, why, how fixed, prevention plan
- Store in `/docs/incidents/YYYY-MM-DD-incident-name.md`
- Review in next weekly meeting
- Implement prevention measures (if applicable)

---

### 4.3 Common Incidents & Runbooks

#### **Incident: Site Down (500 errors)**

**Severity:** P0 - Critical

**Response:**

1. Check Vercel deployment status: https://vercel.com/proofound/deployments
2. Check Supabase status: https://status.supabase.com
3. If Vercel issue: Rollback to last working deployment
4. If Supabase issue: Wait for Supabase resolution, communicate to users
5. If code issue: Identify error in Vercel logs, deploy hotfix
6. Update status page: "Service restored"

**Rollback Command:**

```bash
# In Vercel dashboard: Deployments → Select previous → Promote to Production
# Or via CLI:
vercel rollback proofound-prod
```

**Communication Template:**

```
Subject: [RESOLVED] Proofound service restored

Hi,

We experienced a brief service interruption from [START_TIME] to [END_TIME] UTC.

What happened: [BRIEF_EXPLANATION]
Resolution: [WHAT_WE_DID]
Prevention: [STEPS_TAKEN]

We apologize for the inconvenience. If you experienced any data loss, please contact hello@proofound.io.

- The Proofound Team
```

---

#### **Incident: Database Connection Lost**

**Severity:** P0 - Critical

**Response:**

1. Check Supabase dashboard: https://supabase.com/dashboard/project/proofound/settings
2. Verify connection string in Vercel environment variables
3. Check database connection pool limits (Supabase settings)
4. If pool exhausted: Restart Supabase or upgrade tier
5. If credentials changed: Update Vercel environment variables
6. Test connection: Run health check endpoint `/api/health`

**Prevention:**

- Monitor database connection pool usage (add to daily checks)
- Set up alerting for connection pool >80% utilization
- Document connection limit (Supabase Free: 60, Pro: 200, Team: 500)

---

#### **Incident: Signup Broken**

**Severity:** P1 - High

**Response:**

1. Reproduce issue locally: Try signup flow
2. Check Vercel logs for errors: `/api/auth/signup`
3. Check Supabase Auth logs: Supabase dashboard → Auth → Logs
4. Common causes:
   - Email delivery failure (Resend down or quota exceeded)
   - Database RLS policy blocking insert
   - Validation error in signup form
   - Rate limiting triggered
5. If email issue: Check Resend status, increase quota
6. If RLS issue: Review RLS policies in Supabase
7. Deploy fix and test signup end-to-end

---

#### **Incident: Matching Not Working**

**Severity:** P1 - High

**Response:**

1. Check `/api/core/matching/profile` endpoint logs
2. Verify matching algorithm running: Check cron job logs
3. Check database: Are there active assignments? Are profiles activated?
4. Common causes:
   - Cron job failed (Vercel cron limits exceeded)
   - Algorithm bug (empty matches returned)
   - Database query timeout
5. If cron issue: Trigger manual re-run
6. If algorithm bug: Review matching logic, add logging
7. Communicate to users: "We're improving match quality. New matches coming soon."

---

#### **Incident: Slow Performance**

**Severity:** P2 - Medium

**Response:**

1. Check Vercel Analytics: Identify slow pages
2. Check database query performance: Supabase dashboard → Performance
3. Common causes:
   - Missing database indexes
   - N+1 query problem
   - Large payload (images, JSON)
   - API rate limiting
4. Add database indexes if missing
5. Optimize queries (use `EXPLAIN ANALYZE`)
6. Implement caching (if applicable)
7. Monitor for 24 hours post-fix

**Query Performance Check:**

```sql
-- Run in Supabase SQL editor
EXPLAIN ANALYZE SELECT * FROM profiles WHERE email = 'user@example.com';
-- Look for "Seq Scan" → needs index
```

---

### 4.4 Rollback Plan

**When to Rollback:**

- Critical bug in new deployment
- Performance regression >50%
- Data loss or corruption risk
- Security vulnerability introduced

**How to Rollback:**

**Option 1: Vercel Dashboard (Fastest)**

1. Go to https://vercel.com/proofound/deployments
2. Find previous working deployment
3. Click "Promote to Production"
4. Verify rollback successful (check site)

**Option 2: Vercel CLI**

```bash
# List recent deployments
vercel list

# Rollback to specific deployment
vercel rollback <deployment-url>
```

**Option 3: Git Revert**

```bash
# Revert last commit
git revert HEAD

# Push to trigger new deployment
git push origin main
```

**Database Rollback:**

- Database migrations are reversible via Drizzle
- If migration caused issue: Run reverse migration
- If data corrupted: Restore from backup (see section 7.2)

```bash
# Drizzle rollback (if migration script exists)
npm run db:rollback

# Manual rollback: Apply reverse SQL
psql $DATABASE_URL < migrations/reverse/YYYY-MM-DD.sql
```

---

### 4.5 Post-Mortem Template

**File:** `/docs/incidents/YYYY-MM-DD-incident-name.md`

```markdown
# Incident Post-Mortem: [Title]

**Date:** YYYY-MM-DD  
**Severity:** P0/P1/P2/P3  
**Duration:** [START_TIME] - [END_TIME] (X hours)  
**Incident Owner:** [Name]  
**Affected Users:** [Number or "All users"]

## Summary

[1-2 sentence summary of what happened]

## Timeline (all times UTC)

- HH:MM - Incident detected via [monitoring/user report]
- HH:MM - Severity assessed as P0, team notified
- HH:MM - Status page updated, users notified
- HH:MM - Root cause identified: [cause]
- HH:MM - Fix deployed: [fix]
- HH:MM - Incident resolved, verified

## Root Cause

[Detailed explanation of what caused the incident]

## Impact

- Users affected: [number]
- Revenue impact: $[amount] (if applicable)
- Data loss: [Yes/No - describe if yes]
- Reputation: [Describe user sentiment]

## Resolution

[Detailed explanation of how the issue was fixed]

## Prevention

[Action items to prevent recurrence]

- [ ] [Action item 1] - Owner: [Name] - Deadline: [Date]
- [ ] [Action item 2] - Owner: [Name] - Deadline: [Date]

## Lessons Learned

- **What went well:** [Positive aspects of response]
- **What could improve:** [Areas for improvement]

## Follow-up

- [ ] Share post-mortem with team
- [ ] Implement prevention measures
- [ ] Update runbook with learnings
```

---

## 5. Monitoring & Alerts

### 5.1 Monitoring Tools

**Vercel Analytics (Free Tier):**

- **Enabled:** Real User Monitoring (RUM)
- **Metrics tracked:**
  - Core Web Vitals (LCP, FID, CLS)
  - Time to Interactive (TTI)
  - Page load times (P50, P95)
  - Error rates
- **Dashboard:** https://vercel.com/proofound/analytics
- **Limitation:** No custom alerts (manual daily checks required)

**Vercel Logs:**

- **Access:** https://vercel.com/proofound/logs
- **Filter:** By function, status code, time range
- **Use:** Debug errors, investigate incidents

**Supabase Dashboard:**

- **Metrics:** Database size, query performance, API requests
- **Dashboard:** https://supabase.com/dashboard/project/proofound
- **Auth logs:** Monitor signup/login failures
- **Storage logs:** Track file upload activity

---

### 5.2 Key Metrics to Monitor

| Metric                          | Target         | Check Frequency | Alert Threshold | Action                  |
| ------------------------------- | -------------- | --------------- | --------------- | ----------------------- |
| **Uptime**                      | 99.5% monthly  | Daily           | <99% in 24h     | Investigate immediately |
| **API Latency (P95)**           | ≤1.5s          | Daily           | >2.5s           | Optimize slow endpoints |
| **Page TTI (P95 Mobile)**       | ≤3.5s          | Daily           | >5s             | Optimize slow pages     |
| **Error Rate**                  | <1%            | Daily           | >2%             | Review error logs, fix  |
| **Database Size**               | Monitor growth | Weekly          | >80% of limit   | Upgrade tier or cleanup |
| **TTFQI (Time to First Intro)** | ≤72h median    | Daily           | >100h           | Investigate matching    |
| **7-day Retention**             | ≥50%           | Weekly          | <40%            | Improve onboarding/UX   |
| **SUS Score**                   | ≥75            | Weekly          | <70             | Fix top UX issues       |

---

### 5.3 Daily Monitoring Routine

**Owner:** Yurii Bakurov  
**Time:** Every weekday at 9 AM UTC  
**Duration:** 15-20 minutes

**Checklist:**

1. **Check Vercel Analytics** (5 min)
   - [ ] Review error rate (should be <1%)
   - [ ] Check P95 TTI for top pages (should be <3.5s mobile)
   - [ ] Identify slowest pages (if >5s, investigate)
   - [ ] Note any anomalies (traffic spike, new errors)

2. **Review Vercel Logs** (3 min)
   - [ ] Filter for 500 errors (should be 0)
   - [ ] Check 4xx errors (high rate may indicate bug)
   - [ ] Review recent function executions (look for failures)

3. **Check Supabase Dashboard** (3 min)
   - [ ] Database size (note growth rate)
   - [ ] API requests (note volume)
   - [ ] Auth logs (failed signups/logins?)
   - [ ] Query performance (slow queries >1s?)

4. **Review New User Signups** (3 min)
   - [ ] Count: How many new signups yesterday?
   - [ ] Completion rate: What % completed onboarding?
   - [ ] Activation rate: What % reached "ready to match"?
   - [ ] Log in spreadsheet: `[Date, Signups, Onboarding %, Activation %]`

5. **Check Support Emails** (3 min)
   - [ ] Review new emails in hello@proofound.io
   - [ ] Categorize: Bug / Question / Feature Request
   - [ ] Respond to urgent issues (P0/P1)
   - [ ] Log in support tracker

6. **Check In-App Chat** (3 min)
   - [ ] Open Crisp dashboard
   - [ ] Review new messages
   - [ ] Respond to open conversations
   - [ ] Escalate technical issues to Linear

**Log Results:** Maintain daily log in spreadsheet:

```
Date       | Errors | TTI P95 | Signups | Onboarding % | Support Tickets | Notes
-----------|--------|---------|---------|--------------|-----------------|------
2025-11-15 | 0      | 2.8s    | 5       | 80%          | 2               | All good
2025-11-16 | 3      | 3.2s    | 7       | 70%          | 4               | Slow matching, fixed
```

---

### 5.4 Weekly Metrics Review

**Owner:** Pavlo Samoshko + Yurii Bakurov  
**Time:** Every Monday at 10 AM UTC  
**Duration:** 30-45 minutes

**Agenda:**

1. **Review Weekly Metrics** (15 min)
   - Total users (cumulative)
   - New signups this week
   - 7-day retention (cohort analysis)
   - TTFQI (median and distribution)
   - Application rate (% of users who applied)
   - SUS score (if new responses)
   - Bug count by severity (P0/P1/P2/P3)

2. **Review User Feedback** (10 min)
   - Support email themes (common questions, issues)
   - In-app chat sentiment (positive, neutral, negative)
   - Survey responses (NPS, qualitative feedback)
   - User interview notes (if conducted this week)

3. **Identify Top 3 Issues** (10 min)
   - Prioritize by impact and frequency
   - Create Linear issues for each
   - Assign owners and deadlines

4. **Plan Week Ahead** (10 min)
   - What features/fixes to ship this week?
   - Any experiments to run?
   - Who's on-call?
   - Any external dependencies (e.g., waiting for Supabase support)?

**Document Decisions:** Update Linear, Slack, or shared doc with action items

---

### 5.5 Admin Metrics Dashboard

**URL:** `/app/admin/metrics`  
**Access:** Admin only (Pavlo, Yurii)  
**Purpose:** Real-time view of key platform metrics

**Metrics Displayed:**

- TTSC (Time to Signed Contract)
- TTFQI (Time to First Qualified Introduction)
- TTV (Time to Value)
- PAC (Purpose-Alignment Contribution) Lift
- SUS (System Usability Scale) Score
- Trend charts (last 30 days)
- Fairness gap analysis (if demographic data available)

**Refresh:** Auto-refresh every 60 seconds (SWR)

**See:** `docs/API_REFERENCE.md` for API details

---

## 6. Support Protocols

### 6.1 Support Channels

**Email Support:** hello@proofound.io  
**In-App Chat:** Crisp widget (Mon-Fri 9 AM - 6 PM UTC)  
**Social Media:** Twitter @proofound (monitor mentions)  
**Help Center:** https://proofound.io/help (FAQ)

---

### 6.2 Email Support (hello@proofound.io)

**Response SLA:**

- **P0 (Critical):** 1 hour (site down, data loss)
- **P1 (High):** 4 hours (feature broken, login issue)
- **P2 (Medium):** 24 hours (general questions)
- **P3 (Low):** 1 week (feature requests)

**Auto-Responder:**

```
Subject: We received your message

Hi there,

Thanks for reaching out to Proofound! We've received your message and will respond within 24 hours (Monday-Friday).

For immediate help, check our Help Center: https://proofound.io/help

If this is urgent (site down, data loss), please reply with "URGENT" in the subject line.

Best,
The Proofound Team
```

**Email Templates:**

**Template 1: Password Reset Help**

```
Subject: Re: Password reset help

Hi [Name],

To reset your password:
1. Go to https://proofound.io/login
2. Click "Forgot password?"
3. Enter your email address
4. Check your email for the reset link (it may take up to 5 minutes)
5. Click the link and enter your new password

If you don't receive the email:
- Check your spam folder
- Make sure you're using the same email you signed up with
- Try again in 5 minutes (rate limiting may be in effect)

Still having issues? Reply to this email and we'll help you out.

Best,
[Yurii/Pavlo]
Proofound Team
```

**Template 2: Profile Completion Guidance**

```
Subject: Re: How to complete my profile?

Hi [Name],

Great question! Here's how to complete your profile:

1. Add your professional headline and bio (Settings → Profile Basics)
2. Add at least 5 skills (Expertise → Add Skills)
3. Add your work experience (Profile → Experience)
4. Fill out your mission and values (Profile → Purpose)
5. Set your matching preferences (Matching → Preferences)

Once you complete these steps, your profile will be "ready to match" and you'll start seeing opportunities.

Need help with a specific step? Reply and let me know.

Best,
[Pavlo]
Proofound Team
```

**Template 3: Bug Report Acknowledgment**

```
Subject: Re: [Bug Description]

Hi [Name],

Thanks for reporting this! We've logged it as issue #[LINEAR_ID] and will investigate.

What we know so far:
- [Brief description of the bug]
- [Impact assessment]

We'll keep you updated on progress. Expect a fix within [TIMEFRAME based on severity].

If you need a workaround in the meantime, try [WORKAROUND if applicable].

Thanks for helping us improve Proofound!

Best,
[Yurii]
Proofound Team
```

**Template 4: Feature Request Acknowledgment**

```
Subject: Re: Feature request - [Feature Name]

Hi [Name],

Thanks for the suggestion! We love hearing ideas from users.

We've added your request to our roadmap: [FEATURE_NAME]

While we can't commit to a timeline, we'll keep you posted if/when we start building it. In the meantime, have you tried [ALTERNATIVE_SOLUTION if applicable]?

Keep the feedback coming!

Best,
[Pavlo]
Proofound Team
```

---

### 6.3 In-App Chat Support (Crisp)

**Widget Location:** Bottom-right corner of all authenticated pages  
**Hours:** Mon-Fri 9 AM - 6 PM UTC  
**After-Hours Message:**

```
Thanks for reaching out! Our support team is available Mon-Fri 9 AM - 6 PM UTC.

For urgent issues, email hello@proofound.io and we'll respond as soon as possible.
```

**Response Guidelines:**

- Respond within 5 minutes during business hours
- Keep messages concise and friendly
- Use emojis sparingly (professional tone)
- For technical issues: Collect details (browser, device, steps to reproduce)
- For bugs: Create Linear issue, share issue number with user
- For escalation: "Let me check with the team and get back to you"

**Crisp Settings:**

- Auto-away after 5 minutes of inactivity
- Show user email and name (if logged in)
- Save conversation history (for context)
- Tag conversations: `#bug`, `#question`, `#feedback`, `#urgent`

---

### 6.4 Support Request Tracking

**Tool:** Spreadsheet (Google Sheets) or Linear board

**Columns:**

- **Date:** When request was received
- **User:** Email or name
- **Channel:** Email / Chat / Twitter
- **Subject:** Brief description
- **Priority:** P0/P1/P2/P3
- **Status:** New / In Progress / Waiting / Resolved
- **Owner:** Pavlo / Yurii
- **Resolution:** What was done
- **Time to Resolve:** Hours or days

**Review:** Weekly during metrics review (Mondays 10 AM UTC)

**Metrics to Track:**

- Average response time
- Average time to resolution
- Most common issues (for FAQ)
- User satisfaction (CSAT survey post-resolution)

---

## 7. Database Backup & Recovery

### 7.1 Backup Strategy

**Automated Backups (Supabase):**

- **Frequency:** Daily (automatic)
- **Retention:** 7 days (Free tier), 30 days (Pro tier)
- **Backup Type:** Full database snapshot
- **Storage:** Supabase-managed (AWS S3)

**Manual Backups:**

- **Frequency:** Weekly (every Sunday at 2 AM UTC)
- **Tool:** `pg_dump` command
- **Storage:** Separate S3 bucket (owned by team)
- **Retention:** 90 days

**Backup Command:**

```bash
# Export database to SQL file
pg_dump $DATABASE_URL > backups/proofound-$(date +%Y-%m-%d).sql

# Compress for storage
gzip backups/proofound-$(date +%Y-%m-%d).sql

# Upload to S3
aws s3 cp backups/proofound-$(date +%Y-%m-%d).sql.gz s3://proofound-backups/

# Clean up local file
rm backups/proofound-$(date +%Y-%m-%d).sql.gz
```

**Verification:**

- **Test restore:** Once before beta launch (Nov 14)
- **Recurring tests:** Monthly (first Sunday of each month)
- **Document:** Record test results in Linear

---

### 7.2 Recovery Procedures

#### **Scenario 1: Data Corruption (Recent)**

**Recovery Time Objective (RTO):** 4 hours  
**Recovery Point Objective (RPO):** 24 hours (last backup)

**Steps:**

1. Identify scope of corruption (which tables, how many rows)
2. Pause all writes to affected tables (disable features if needed)
3. Access Supabase backups: Dashboard → Database → Backups
4. Select most recent backup before corruption
5. Restore to new Supabase project (test environment)
6. Verify data integrity in test environment
7. Export affected tables from backup: `pg_dump -t table_name`
8. Import into production: `psql $DATABASE_URL < table_name.sql`
9. Verify data restored correctly
10. Re-enable features
11. Notify affected users (if any)

**Communication Template:**

```
Subject: Data issue resolved

Hi,

We detected a data issue affecting [DESCRIPTION] between [START_TIME] and [END_TIME] UTC.

What happened: [BRIEF_EXPLANATION]
Resolution: We restored data from our latest backup.
Impact: [DESCRIBE IMPACT, e.g., "Lost data", "No data loss"]

If you notice any missing or incorrect data, please contact hello@proofound.io.

We apologize for the inconvenience.

- The Proofound Team
```

---

#### **Scenario 2: Complete Database Loss**

**Severity:** P0 - Critical  
**RTO:** 8 hours  
**RPO:** 24 hours

**Steps:**

1. **Immediate:** Notify team, update status page: "Service down"
2. **Assess:** Is Supabase down or is it our database specifically?
3. **If Supabase issue:** Wait for Supabase to resolve, monitor status.supabase.com
4. **If our database issue:**
   - Create new Supabase project
   - Restore from most recent backup (Supabase dashboard or manual S3 backup)
   - Update Vercel environment variables with new `DATABASE_URL`
   - Deploy to production
   - Run smoke tests (auth, profiles, matching)
   - Update status page: "Service restored"
5. **Verify data integrity:**
   - Check row counts match expectations
   - Test critical user flows
   - Review error logs
6. **Communicate to users:**
   - Email all users with incident details
   - Offer support for data loss (if any)
7. **Post-mortem:** Document what happened, prevention plan

---

#### **Scenario 3: Accidental Data Deletion**

**Example:** Admin accidentally deletes users or assignments

**RTO:** 2 hours  
**RPO:** Up to 24 hours (last backup)

**Steps:**

1. **Immediate:** Stop the action (if still in progress)
2. **Assess scope:** How many rows deleted? Which tables?
3. **If <1 hour ago:** Check Supabase transaction logs, may be able to rollback
4. **If >1 hour ago:** Restore from backup (see Scenario 1)
5. **If critical data:** Expedite restore (prioritize affected tables)
6. **Notify affected users:** Apologize, explain what data was lost, offer support
7. **Prevention:** Implement soft deletes (add `deleted_at` column), require confirmation for destructive actions

---

### 7.3 Backup Verification Checklist

**Run monthly:** First Sunday of each month at 2 AM UTC

- [ ] Download latest Supabase backup
- [ ] Restore to test Supabase project
- [ ] Verify row counts: `SELECT COUNT(*) FROM [table]` for key tables
- [ ] Test critical queries work (auth, matching, profiles)
- [ ] Document test results in Linear
- [ ] Delete test project after verification

**Tables to Verify:**

- `profiles` (user count)
- `individual_profiles` (should match profiles count)
- `organizations` (org count)
- `assignments` (assignment count)
- `matches` (match count)
- `messages` (message count)

---

## 8. Deployment Procedures

### 8.1 Standard Deployment

**Trigger:** Git push to `main` branch  
**Platform:** Vercel (automatic)  
**Typical Duration:** 2-3 minutes

**Process:**

1. Push code to GitHub: `git push origin main`
2. Vercel detects push, starts build
3. Build runs: `npm install && npm run build`
4. Tests run (if configured): `npm test`
5. Build succeeds → automatic deploy to production
6. Deployment URL: https://proofound.io

**Monitoring Post-Deploy:**

- Check Vercel dashboard for build logs
- Verify deployment status: "Ready"
- Run smoke test (see section 8.3)
- Monitor error rate for 30 minutes

---

### 8.2 Database Migrations

**Tool:** Drizzle ORM + Drizzle Kit

**Process:**

**1. Create Migration:**

```bash
# Generate migration from schema changes
npm run db:generate

# Creates file: drizzle/migrations/NNNN_migration_name.sql
```

**2. Review Migration:**

```bash
# Review generated SQL
cat drizzle/migrations/NNNN_migration_name.sql

# Ensure:
# - No accidental data deletion
# - Indexes added where needed
# - Foreign keys correct
```

**3. Test Migration (Staging):**

```bash
# Apply to staging database
DATABASE_URL=$STAGING_DATABASE_URL npm run db:migrate

# Test application works with new schema
# Run smoke tests
```

**4. Apply to Production:**

```bash
# Apply to production database
npm run db:migrate

# Vercel will run this automatically on deploy
# Or run manually if needed
```

**5. Verify:**

```bash
# Check tables exist
# Check data integrity
# Test critical flows
```

**Rollback (if needed):**

```bash
# Drizzle doesn't support automatic rollbacks
# Must write reverse migration manually
# Or restore from backup (see section 7.2)
```

---

### 8.3 Smoke Test Checklist

**Run after every production deployment**  
**Duration:** 5-10 minutes

- [ ] **Home page loads:** https://proofound.io
- [ ] **Signup works:** Create test account
- [ ] **Email delivery works:** Verify email received
- [ ] **Login works:** Log in with test account
- [ ] **Onboarding loads:** Start onboarding flow
- [ ] **Profile editing works:** Update profile, save
- [ ] **API responds:** Check `/api/health` returns 200
- [ ] **Database connected:** Profile changes persist
- [ ] **Matching works:** View matches (if activated)
- [ ] **Messaging works:** Send test message
- [ ] **Admin dashboard loads:** `/app/admin/metrics` (admin only)

**If any smoke test fails:**

1. Assess severity (P0 if critical path broken)
2. Decide: Rollback or hotfix
3. If rollback: See section 4.4
4. If hotfix: Fix, deploy, re-test

---

### 8.4 Hotfix Deployment

**When:** Critical bug in production (P0)  
**Goal:** Fix and deploy ASAP (target: <30 minutes)

**Process:**

**1. Create Hotfix Branch:**

```bash
# Create branch from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-critical-bug
```

**2. Implement Fix:**

```bash
# Make minimal changes (only fix the bug)
# Avoid scope creep
# Add comment: "HOTFIX: [description]"
```

**3. Test Locally:**

```bash
# Test the fix works
npm run dev
# Verify bug is fixed
```

**4. Deploy Directly to Production:**

```bash
# Push to main (skip PR for hotfixes)
git add .
git commit -m "HOTFIX: Fix critical bug [description]"
git push origin hotfix/fix-critical-bug

# Merge via GitHub (or direct push to main if emergency)
git checkout main
git merge hotfix/fix-critical-bug
git push origin main
```

**5. Monitor:**

- Watch Vercel deployment
- Run smoke test
- Monitor error rate for 30 minutes
- Notify team in Slack

**6. Post-Hotfix:**

- Create Linear issue documenting the bug
- Write post-mortem (if P0)
- Backport fix to any open feature branches

---

### 8.5 Feature Flags (Future)

**Status:** Not implemented in MVP (planned for Phase 2)

**Use Case:** Gradual rollout, A/B testing, kill switch

**Implementation Plan:**

- Use environment variables for simple flags
- Consider tools: LaunchDarkly, Flagsmith, PostHog
- Add flag checking in code: `if (featureFlags.newMatching) { ... }`

---

## 9. Emergency Contacts

### Team Contacts

**Pavlo Samoshko** - CEO & Product Owner

- Email: pavlo@proofound.io
- Phone: [TBD]
- Timezone: [TBD]
- Availability: [TBD]

**Yurii Bakurov** - Technical Lead

- Email: yurii@proofound.io
- Phone: [TBD]
- Timezone: [TBD]
- Availability: [TBD]

---

### Service Provider Contacts

**Vercel (Hosting & Deployment)**

- Status: https://www.vercel-status.com
- Support: https://vercel.com/support
- Dashboard: https://vercel.com/proofound
- Tier: Free (upgrade to Pro if needed)

**Supabase (Database & Auth)**

- Status: https://status.supabase.com
- Support: https://supabase.com/dashboard/support
- Dashboard: https://supabase.com/dashboard/project/proofound
- Tier: Free (upgrade to Pro if needed)

**Resend (Email Delivery)**

- Status: https://status.resend.com
- Support: support@resend.com
- Dashboard: https://resend.com/dashboard
- Tier: Free (100 emails/day)

**Crisp (In-App Chat)**

- Support: support@crisp.chat
- Dashboard: https://app.crisp.chat
- Tier: Free

**Cloudflare (DNS, if used)**

- Status: https://www.cloudflarestatus.com
- Support: https://dash.cloudflare.com/support

---

### Escalation Path

**Level 1:** Yurii (Technical Lead)  
→ Handles all technical issues, deploys fixes

**Level 2:** Pavlo (CEO)  
→ Makes go/no-go decisions, communicates to users for major incidents

**Level 3:** Service Provider Support  
→ If issue is with Vercel/Supabase/Resend, escalate to their support

---

## 10. Post-Launch Review

### 10.1 Daily Retro (First Week)

**Participants:** Pavlo + Yurii  
**Time:** Every day at 5 PM UTC (first week of Private Beta)  
**Duration:** 15 minutes

**Agenda:**

1. What went well today?
2. What didn't go well?
3. Any surprises?
4. Any urgent action items for tomorrow?

---

### 10.2 Weekly Retro (Ongoing)

**Participants:** Pavlo + Yurii  
**Time:** Every Friday at 4 PM UTC  
**Duration:** 30 minutes

**Agenda:**

1. **Review metrics:** Signups, retention, SUS, TTFQI
2. **Review feedback:** Support emails, chat, surveys
3. **Review incidents:** Any P0/P1 bugs this week?
4. **Celebrate wins:** What shipped? What improved?
5. **Identify issues:** Top 3 problems to fix next week
6. **Plan next week:** What to prioritize?

**Document:** Keep running notes in Slack or Linear

---

### 10.3 Phase Transition Review

**Trigger:** At end of each launch phase (Private Beta, Public Beta, GA)

**Participants:** Pavlo + Yurii  
**Duration:** 1-2 hours

**Agenda:**

1. **Review success criteria:** Did we meet targets?
2. **Review metrics:** Aggregate data for entire phase
3. **Review feedback:** Themes from users
4. **Lessons learned:** What worked? What didn't?
5. **Go/no-go decision:** Proceed to next phase?
6. **Action items:** What to fix before next phase?

**Document:** Create review doc in Linear or Google Docs

**Example: Private Beta → Public Beta Review (Dec 13, 2025)**

- **Success Criteria:**
  - ✅ SUS ≥70: Actual = 72
  - ✅ TTFQI ≤72h: Actual = 54 hours
  - ✅ 7-day retention ≥50%: Actual = 55%
  - ✅ 0 P0 bugs: Actual = 0
  - ✅ ≥20 SUS surveys: Actual = 24

- **Decision:** ✅ Proceed to Public Beta on Dec 15

- **Action Items before Public Beta:**
  - Fix top 3 UX issues (onboarding confusion, slow matching, unclear error messages)
  - Upgrade Supabase to Pro tier (for more connection pool)
  - Prepare Public Beta announcement (social media, email)

---

### 10.4 Monthly Business Review (Post-GA)

**Participants:** Pavlo + Yurii + advisors/investors (if applicable)  
**Time:** First Monday of each month at 10 AM UTC  
**Duration:** 1 hour

**Agenda:**

1. **Growth:** User count, revenue (future), retention
2. **Product:** Features shipped, roadmap updates
3. **Operations:** Incidents, support volume, infrastructure
4. **Metrics:** TTSC, TTFQI, SUS, fairness
5. **Financials:** Burn rate, runway, unit economics (future)
6. **Decisions:** Any major decisions needed?

**Document:** Create monthly report (PDF or slide deck)

---

## Appendix A: Useful Commands

### Vercel

```bash
# Deploy to production
git push origin main

# Rollback to previous deployment
vercel rollback

# View recent deployments
vercel list

# Check deployment logs
vercel logs [deployment-url]

# Set environment variable
vercel env add DATABASE_URL production
```

### Supabase

```bash
# Run migrations
npm run db:migrate

# Generate migration from schema
npm run db:generate

# Open Supabase dashboard
supabase dashboard

# View database logs
supabase logs db

# Backup database
pg_dump $DATABASE_URL > backup.sql
```

### Database

```bash
# Connect to production database
psql $DATABASE_URL

# Run query
psql $DATABASE_URL -c "SELECT COUNT(*) FROM profiles"

# Export table to CSV
psql $DATABASE_URL -c "COPY profiles TO STDOUT CSV HEADER" > profiles.csv

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Git

```bash
# Create hotfix branch
git checkout -b hotfix/fix-critical-bug

# Revert last commit
git revert HEAD

# Check out previous commit
git checkout [commit-hash]

# View commit history
git log --oneline --graph
```

---

## Appendix B: Status Page Template

**Simple status page:** Create at `/status` or use external service (e.g., status.io, statuspage.io)

**Statuses:**

- ✅ **All Systems Operational**
- ⚠️ **Performance Degraded**
- ❌ **Partial Outage**
- 🔴 **Major Outage**

**Components:**

- Web Application (proofound.io)
- API (api.proofound.io)
- Database (Supabase)
- Email Delivery (Resend)
- File Storage (Supabase Storage)
- Authentication (Supabase Auth)

**Incident Update Template:**

```markdown
## [TITLE] - [STATUS]

**Identified:** [TIME] UTC
**Last Update:** [TIME] UTC
**Affected:** [COMPONENTS]

### Current Status

[DESCRIPTION OF CURRENT STATE]

### Impact

[WHO IS AFFECTED, WHAT DOESN'T WORK]

### Next Update

[WHEN TO EXPECT NEXT UPDATE]

### Updates

- [TIME] UTC: [UPDATE DESCRIPTION]
- [TIME] UTC: [UPDATE DESCRIPTION]
```

---

## Document Revision History

| Date        | Version | Changes                 | Author        |
| ----------- | ------- | ----------------------- | ------------- |
| Nov 5, 2025 | 1.0     | Initial runbook created | Yurii Bakurov |

---

**Last Updated:** November 5, 2025  
**Next Review:** December 15, 2025 (Post-Private Beta)  
**Document Owner:** Pavlo Samoshko & Yurii Bakurov

---

**Questions or Updates?**  
Contact: yurii@proofound.io or pavlo@proofound.io
