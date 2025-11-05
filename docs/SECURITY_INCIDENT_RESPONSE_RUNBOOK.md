# Security Incident Response Runbook

**Version**: 1.0  
**Last Updated**: November 6, 2025  
**Owner**: Security Team  
**Contact**: security@proofound.com

---

## Overview

This runbook provides step-by-step procedures for detecting, responding to, and recovering from security incidents at Proofound. It ensures compliance with GDPR Article 33 (72-hour breach notification requirement) and protects user data.

---

## Incident Severity Classification

| Severity | Definition | Examples | Response Time |
|----------|------------|----------|---------------|
| **CRITICAL** | Confirmed data breach with PII exposure | Database breach, mass account takeover | Immediate (< 1 hour) |
| **HIGH** | Potential breach or significant vulnerability | RLS policy bypass, authentication bypass | < 4 hours |
| **MEDIUM** | Security issue without confirmed data exposure | DDoS attack, brute force attempts | < 24 hours |
| **LOW** | Minor security concerns | Suspicious login patterns, scanning attempts | < 48 hours |

---

## Phase 1: Detection

### Automated Detection Triggers

Security incidents are detected through:

1. **Sentry Alerts** (configured in `sentry.server.config.ts`)
   - SECURITY_CRITICAL events
   - SECURITY_WARNING events
   - RLS policy violations

2. **Application Logs** (`src/lib/log.ts`)
   - Failed authentication attempts (10+ in 5 minutes)
   - Unusual data access patterns
   - Unauthorized API access attempts

3. **Manual Reports**
   - User reports to security@proofound.com
   - Internal team discovery
   - Third-party security researcher disclosure

### Detection Checklist

When an alert fires:
- [ ] Verify the alert is not a false positive
- [ ] Determine incident severity using table above
- [ ] Document initial observations
- [ ] Alert incident response team

---

## Phase 2: Containment (CRITICAL/HIGH Incidents)

### Immediate Actions (< 1 hour)

1. **Alert Team**
   - Post in #security-incidents Slack channel
   - Tag: @security-team @engineering-leads
   - Include: Severity, timestamp, initial assessment

2. **Contain the Breach**
   
   For database breaches:
   ```bash
   # Revoke compromised API keys immediately
   # Run in Supabase Dashboard > Settings > API
   
   # Force logout all users (if needed)
   # Run in Supabase SQL Editor:
   UPDATE auth.refresh_tokens SET revoked = true WHERE revoked = false;
   ```
   
   For authentication bypass:
   ```bash
   # Rotate JWT secrets (Supabase dashboard)
   # Enable MFA requirement temporarily
   ```
   
   For RLS policy bypass:
   ```sql
   -- Disable affected table temporarily
   ALTER TABLE [affected_table] FORCE ROW LEVEL SECURITY;
   
   -- Review and fix RLS policies
   -- Re-enable after verification
   ```

3. **Preserve Evidence**
   - Export relevant logs from Sentry
   - Capture database query logs (pg_stat_statements)
   - Screenshot error messages
   - Save all communications

4. **Initial Notification**
   - Notify platform owner (Yurii Bakurov)
   - Notify legal counsel (if PII exposed)
   - Prepare initial incident report

---

## Phase 3: Assessment (< 4 hours)

### Determine Breach Scope

Answer these questions:

1. **What data was accessed/exposed?**
   - [ ] Tier 1 PII (emails, phone numbers)
   - [ ] Tier 2 Sensitive (compensation data, verifier info)
   - [ ] Tier 3 Semi-Public (skills, experience)
   - [ ] Tier 4 Public (org profiles, assignments)

2. **How many users affected?**
   - Query affected user IDs
   - Export list for notification
   - Categorize by data sensitivity

3. **When did the breach occur?**
   - Check oldest access timestamp
   - Determine breach duration
   - Calculate time to detection

4. **Who was the attacker?**
   - IP addresses
   - User agents
   - Attack patterns
   - Attribution (if possible)

5. **How did the breach happen?**
   - Vulnerability exploited
   - Misconfiguration
   - Social engineering
   - Insider threat

### Assessment Template

```
INCIDENT REPORT: INC-2025-[NUMBER]

Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Detected: [YYYY-MM-DD HH:MM UTC]
Contained: [YYYY-MM-DD HH:MM UTC]

BREACH SCOPE:
- Data Categories: [List tiers]
- Users Affected: [Number]
- Breach Duration: [X hours/days]
- Attack Vector: [Description]

ROOT CAUSE:
[Detailed explanation]

IMMEDIATE ACTIONS TAKEN:
- [Action 1]
- [Action 2]

EVIDENCE PRESERVED:
- [Link to logs]
- [Link to screenshots]

NEXT STEPS:
- [Action items]
```

---

## Phase 4: Notification

### GDPR 72-Hour Requirement

If Tier 1 PII was exposed:

**Hour 0-24: Internal Assessment**
- Complete breach scope analysis
- Document all findings
- Prepare notification materials

**Hour 24-48: Regulatory Notification**
- Notify supervisory authority (if EU users affected)
- Provide initial breach report
- Follow local data protection authority procedures

**Hour 48-72: User Notification**
- Send breach notification emails
- Update status page
- Prepare FAQ for support team

### User Notification Template

```
Subject: Security Incident Notification - Proofound

Dear [User Name],

We are writing to inform you of a security incident that may have 
affected your Proofound account.

WHAT HAPPENED:
On [date], we discovered that [brief description]. We immediately 
took action to [containment actions].

WHAT INFORMATION WAS INVOLVED:
[List specific data categories - be transparent]

WHAT WE'RE DOING:
- [Security improvements]
- [Monitoring enhancements]
- [Additional protections]

WHAT YOU SHOULD DO:
- Change your password immediately: [link]
- Enable two-factor authentication: [link]
- Monitor your account for suspicious activity
- Report any concerns to security@proofound.com

We sincerely apologize for this incident and are committed to 
protecting your data. For questions, contact security@proofound.com.

Sincerely,
Proofound Security Team
```

### Notification Checklist

- [ ] Draft notification email (legal review)
- [ ] Identify all affected users
- [ ] Send emails via Resend
- [ ] Post status page update
- [ ] Prepare support team with FAQ
- [ ] Monitor for user questions

---

## Phase 5: Remediation

### Short-Term Fixes (< 1 week)

1. **Patch Vulnerability**
   - Fix code/configuration issue
   - Deploy patch to production
   - Verify fix works

2. **Rotate Credentials**
   - Database passwords
   - API keys
   - JWT secrets
   - Service account tokens

3. **Enhanced Monitoring**
   - Add specific alerts for this attack vector
   - Increase logging detail
   - Set up dashboards

### Long-Term Improvements (< 1 month)

1. **Architecture Changes**
   - Implement additional security layers
   - Enhance access controls
   - Add redundant protections

2. **Process Improvements**
   - Update security checklist
   - Enhance code review process
   - Additional security training

3. **Testing**
   - Penetration testing
   - Red team exercise
   - Automated security scans

---

## Phase 6: Post-Incident Review

### Review Meeting (Within 1 week)

Attendees:
- Engineering leads
- Security team
- Product owner
- Legal counsel (if needed)

Agenda:
1. Timeline review
2. Root cause analysis
3. Response effectiveness
4. Lessons learned
5. Action items

### Post-Incident Report Template

```
POST-INCIDENT REVIEW: INC-2025-[NUMBER]

Date: [YYYY-MM-DD]
Attendees: [Names]

INCIDENT SUMMARY:
[Brief description]

TIMELINE:
- [HH:MM] Detection
- [HH:MM] Containment
- [HH:MM] Assessment complete
- [HH:MM] Notifications sent
- [HH:MM] Remediation complete

ROOT CAUSE:
[Deep dive analysis]

WHAT WENT WELL:
- [Item 1]
- [Item 2]

WHAT COULD BE IMPROVED:
- [Item 1]
- [Item 2]

ACTION ITEMS:
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | [Name] | [Date] | [ ] |

LESSONS LEARNED:
[Key takeaways]

RECOMMENDATIONS:
[Future improvements]
```

---

## Contact Information

### Primary Contacts

**Security Email**: security@proofound.com  
**Emergency Phone**: [To be configured]  
**Status Page**: https://status.proofound.com (future)

### Escalation Path

1. **Level 1**: Engineering Team
   - First responders
   - Initial containment

2. **Level 2**: Security Lead
   - Incident coordination
   - External communications

3. **Level 3**: Platform Owner
   - Executive decisions
   - Legal/regulatory liaison

### External Resources

**Data Protection Authorities**:
- EU GDPR: https://edpb.europa.eu/about-edpb/board/members_en
- California (CCPA): https://oag.ca.gov/privacy/ccpa

**Incident Response Vendors** (if needed):
- Cloud forensics provider
- Legal counsel specializing in data breaches
- PR firm for crisis communications

---

## Tools & Access

### Required Access

Incident responders need:
- [ ] Supabase dashboard admin access
- [ ] Vercel deployment access
- [ ] Sentry project access
- [ ] GitHub repository access
- [ ] Email sending access (Resend)
- [ ] Analytics dashboard access

### Useful Commands

**Check recent RLS violations** (Supabase SQL Editor):
```sql
SELECT 
  timestamp,
  user_id,
  query,
  error_message
FROM pg_stat_statements
WHERE error_message LIKE '%RLS%'
  AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;
```

**Audit failed login attempts**:
```sql
SELECT 
  created_at,
  email,
  ip_address_hash,
  error_message
FROM analytics_events
WHERE event_type = 'auth_failure'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 5;
```

**Check recent data exports** (potential exfiltration):
```sql
SELECT 
  user_id,
  created_at,
  properties->>'tables' as exported_tables
FROM analytics_events
WHERE event_type = 'data_exported'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## Training & Drills

### Required Training

All engineering team members complete:
- [ ] Security incident response overview (annual)
- [ ] GDPR compliance training (annual)
- [ ] Phishing awareness training (quarterly)
- [ ] Secure coding practices (onboarding + annual)

### Incident Response Drills

**Quarterly Drill Schedule**:
- Q1: Database breach simulation
- Q2: Authentication bypass scenario
- Q3: DDoS attack response
- Q4: Insider threat scenario

**Drill Format**:
1. Scenario introduction (30 min)
2. Simulated incident response (2 hours)
3. Debrief and feedback (30 min)
4. Document lessons learned

---

## Appendices

### Appendix A: Breach Notification Templates

Email templates stored in: `emails/` directory
- SecurityIncidentNotification.tsx
- PasswordResetForced.tsx
- AccountSuspended.tsx

### Appendix B: Legal Requirements

**GDPR Article 33**: Breach notification to supervisory authority
- Required within 72 hours
- Must include nature of breach, affected data, contact point, likely consequences, measures taken

**GDPR Article 34**: Breach notification to data subjects
- Required if "high risk to rights and freedoms"
- Clear and plain language
- Recommendations for individuals to mitigate

**CCPA Requirements**:
- No specific breach notification timeline
- Follow California Civil Code Section 1798.82

### Appendix C: Incident Log

All incidents logged in: `docs/incidents/`

Format: `YYYY-MM-DD-incident-brief-description.md`

---

## Document Maintenance

**Review Schedule**: Quarterly  
**Next Review**: February 2026  
**Version History**:
- v1.0 (2025-11-06): Initial creation
- [Future updates]

**Change Approval**: Security Lead + Engineering Manager

---

## Quick Reference Card

**For immediate incidents**:

1. ⚠️ Alert #security-incidents Slack channel
2. 🔒 Contain: Revoke access, disable compromised systems
3. 📝 Document: Screenshot, export logs, preserve evidence
4. 🔍 Assess: Determine scope using assessment template
5. 📢 Notify: 72-hour GDPR clock starts for Tier 1 PII breaches
6. 🔧 Remediate: Fix root cause, rotate credentials
7. 📊 Review: Post-incident meeting within 1 week

**Emergency Contacts**: security@proofound.com

