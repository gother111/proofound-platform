# Email Support Setup Guide

**Document Version:** 1.0  
**Last Updated:** November 5, 2025  
**Email Address:** hello@proofound.io  
**Team:** Pavlo Samoshko (Product/User Questions), Yurii Bakurov (Technical Issues)

---

## Table of Contents

1. [Email Provider Configuration](#1-email-provider-configuration)
2. [Auto-Responder Setup](#2-auto-responder-setup)
3. [Email Templates](#3-email-templates)
4. [Forwarding Rules](#4-forwarding-rules)
5. [Response Workflow](#5-response-workflow)
6. [Common Issues & Responses](#6-common-issues--responses)

---

## 1. Email Provider Configuration

### Provider Options

**Option A: Google Workspace (Recommended)**

- **Cost:** $6/user/month
- **Features:** Gmail interface, 30GB storage, custom domain
- **Setup:** Add hello@proofound.io as an alias or separate user
- **Link:** https://workspace.google.com

**Option B: ProtonMail**

- **Cost:** Free (1 custom domain) or $3.99/month
- **Features:** Privacy-focused, custom domain
- **Setup:** Configure hello@proofound.io
- **Link:** https://proton.me/mail

**Option C: Zoho Mail**

- **Cost:** Free (5 users) or $1/user/month
- **Features:** Ad-free, custom domain
- **Setup:** Add hello@proofound.io mailbox
- **Link:** https://www.zoho.com/mail/

---

### Initial Setup Steps

1. **Add custom domain to email provider**
   - Domain: proofound.io
   - Verify domain ownership (DNS TXT record)

2. **Create hello@proofound.io mailbox**
   - Type: Shared mailbox or individual user
   - Access: Grant to Pavlo and Yurii

3. **Configure DNS records** (if not using Vercel Email)
   - MX records: Point to email provider
   - SPF record: Authorize email provider to send
   - DKIM: Enable email authentication
   - DMARC: Set email policy

4. **Test email delivery**
   - Send test email to hello@proofound.io
   - Reply from hello@proofound.io to personal email
   - Verify SPF/DKIM passing (use mail-tester.com)

---

## 2. Auto-Responder Setup

### Google Workspace Auto-Responder

1. **Open Gmail Settings**
   - Go to Settings → See all settings → General
   - Scroll to "Vacation responder"

2. **Configure Auto-Responder**
   - **Subject:** We received your message
   - **Message:** (See template below)
   - **First day:** (Leave blank for always-on)
   - **Last day:** (Leave blank for always-on)
   - **Send a response to people in my Contacts:** Checked
   - **Send a response to people outside my Contacts:** Checked
   - **Save Changes**

---

### Auto-Responder Template

```
Hi there,

Thanks for reaching out to Proofound! We've received your message and will respond within 24 hours (Monday-Friday, 9 AM - 6 PM UTC).

For immediate help, check our Help Center: https://proofound.io/help

If this is urgent (site down, data loss, security issue), please reply with "URGENT" in the subject line and we'll prioritize your request.

Best regards,
The Proofound Team

---
Need faster support? Use our in-app chat (available Mon-Fri 9 AM - 6 PM UTC).
```

---

### Zoho Mail Auto-Responder

1. **Open Zoho Mail Settings**
   - Go to Settings → Mail → Vacation Responder

2. **Enable Auto-Responder**
   - Toggle "Enable Auto-Reply"
   - **Subject:** We received your message
   - **Message:** (Use template above)
   - **Send replies to:** Everyone
   - **Save**

---

## 3. Email Templates

### Template 1: Password Reset Help

**Subject:** Re: Password reset help

**Body:**

```
Hi [Name],

Thanks for reaching out! Here's how to reset your password:

1. Go to https://proofound.io/login
2. Click "Forgot password?"
3. Enter your email address: [USER_EMAIL]
4. Check your email for the reset link (it may take up to 5 minutes)
5. Click the link and enter your new password

Didn't receive the email? Try these:
- Check your spam/junk folder
- Make sure you're using the same email you signed up with
- Wait 5 minutes and try again (rate limiting may be in effect)
- If still no luck, reply to this email and we'll reset it manually

Best regards,
[Yurii/Pavlo]
Proofound Team
```

---

### Template 2: Profile Completion Guidance

**Subject:** Re: How to complete my profile?

**Body:**

```
Hi [Name],

Great question! Here's your step-by-step guide to completing your profile:

**For Individuals:**
1. Add your professional headline and bio (Profile → Basics)
2. Build at least one strong Proof Pack with evidence and outcomes
3. Add the experience or context that supports that proof
4. Fill out your mission and values (Profile → Purpose)
5. Set your matching preferences and practical constraints (Matching → Preferences)

The day-1 goal is to become portfolio-ready with a clear, shareable trust surface. Intro-eligible is a stricter later state and may require stronger proof or scoped trust signals.

**For Organizations:**
1. Complete your organization profile (Profile → Edit)
2. Add your mission, vision, and values (Profile → Purpose)
3. Create your first assignment (Assignments → New Assignment)
4. Publish the assignment when it is ready for blind-by-default review

Need help with a specific step? Just reply to this email.

Best regards,
[Pavlo]
Proofound Team
```

---

### Template 3: Bug Report Acknowledgment

**Subject:** Re: [Bug Description]

**Body:**

```
Hi [Name],

Thanks for reporting this issue! We've logged it as ticket #[TICKET_ID] and are investigating.

**What we know so far:**
- Issue: [BRIEF_DESCRIPTION]
- Affected: [WHO/WHAT_IS_AFFECTED]
- Priority: [P0/P1/P2/P3]

**What's next:**
- We'll investigate the root cause
- Expected fix timeline: [TIMEFRAME based on severity]
- We'll update you as soon as we have more information

**Need a workaround in the meantime?**
[WORKAROUND if applicable, or "We'll prioritize a fix"]

Thanks for helping us improve Proofound! Your feedback makes the platform better for everyone.

Best regards,
[Yurii]
Proofound Team

---
Bug Details (for our records):
- Reported: [DATE_TIME]
- Browser: [IF_PROVIDED]
- Device: [IF_PROVIDED]
- Steps to reproduce: [IF_PROVIDED]
```

---

### Template 4: Feature Request Acknowledgment

**Subject:** Re: Feature request - [Feature Name]

**Body:**

```
Hi [Name],

Thanks for the suggestion! We love hearing ideas from users.

**Your request:** [FEATURE_NAME_OR_DESCRIPTION]

We've added it to our roadmap backlog: [LINK_TO_LINEAR_ISSUE or "Internal tracking: #[ID]"]

While we can't commit to a timeline, here's what happens next:
1. We'll review the request with the team
2. If it aligns with our product vision, we'll prioritize it
3. We'll keep you posted if/when we start building it

**In the meantime:**
[ALTERNATIVE_SOLUTION if applicable, or "Thanks for your patience"]

Keep the feedback coming! User input shapes our roadmap.

Best regards,
[Pavlo]
Proofound Team

---
Have more ideas? We'd love to hear them: just reply to this email.
```

---

### Template 5: Account Deletion Request

**Subject:** Re: Account deletion request

**Body:**

```
Hi [Name],

We're sorry to see you go. We've received your account deletion request.

**Before we proceed:**
- Are you sure you want to delete your account? This action is permanent and cannot be undone.
- All your data (profile, skills, matches, messages) will be deleted within 30 days.
- If you're having an issue, we'd love to help fix it instead!

**To confirm deletion:**
Reply to this email with "CONFIRM DELETE" and we'll process your request within 48 hours.

**Need help instead?**
If something isn't working right, reply with your issue and we'll work to fix it.

Best regards,
[Pavlo/Yurii]
Proofound Team

---
Your privacy matters to us. Learn more: https://proofound.io/privacy
```

---

### Template 6: GDPR Data Export Request

**Subject:** Re: Data export request (GDPR)

**Body:**

```
Hi [Name],

We've received your request to export your personal data under GDPR Article 15 (Right to Access).

**What's included:**
- Profile information (name, email, bio, etc.)
- Skills and expertise data
- Matches and applications
- Messages (with identities masked as per privacy policy)
- Account activity logs
- Verification data (if any)

**Timeline:**
We'll prepare your data export within 30 days (GDPR requirement).

**Delivery:**
We'll send a secure download link to this email address when your export is ready. The link will expire in 7 days.

**Questions?**
Reply to this email if you need clarification on what's included.

Best regards,
[Yurii]
Proofound Team

---
Learn more about your data rights: https://proofound.io/privacy
```

---

### Template 7: General Inquiry Response

**Subject:** Re: [Original Subject]

**Body:**

```
Hi [Name],

Thanks for reaching out!

[ANSWER_TO_QUESTION or CUSTOM_RESPONSE]

Is there anything else I can help with?

Best regards,
[Pavlo/Yurii]
Proofound Team

---
Quick links:
- Help Center: https://proofound.io/help
- Profile Settings: https://proofound.io/app/i/settings
- Contact us: Just reply to this email
```

---

## 4. Forwarding Rules

### Google Workspace Forwarding

**Option A: Forward all to both Pavlo and Yurii**

1. Go to Settings → Forwarding and POP/IMAP
2. Add forwarding address: pavlo@proofound.io, yurii@proofound.io
3. Confirm forwarding via email

**Option B: Filters for auto-routing**

1. Technical keywords → Yurii
2. Product/UX keywords → Pavlo
3. All others → Both

**Filter Example (Technical → Yurii):**

```
From: *
To: hello@proofound.io
Subject: [bug, error, crash, broken, not working, slow, down, login issue, password, database]
Action: Forward to yurii@proofound.io, Skip Inbox
```

**Filter Example (Product → Pavlo):**

```
From: *
To: hello@proofound.io
Subject: [feature, suggestion, feedback, improvement, UX, profile, matching, assignment]
Action: Forward to pavlo@proofound.io, Skip Inbox
```

---

## 5. Response Workflow

### Daily Email Triage (9 AM UTC)

**Step 1: Review Inbox (5 min)**

- Check hello@proofound.io for new emails
- Count: How many new emails?
- Categorize: Bug / Question / Feature Request / Other

**Step 2: Prioritize (2 min)**

- **P0 (Urgent):** Site down, data loss, security issue → Respond immediately
- **P1 (High):** Feature broken, login issue → Respond within 4 hours
- **P2 (Medium):** General question, minor bug → Respond within 24 hours
- **P3 (Low):** Feature request, feedback → Respond within 1 week

**Step 3: Assign Owner (1 min)**

- Technical issues → Yurii
- Product/UX questions → Pavlo
- General inquiries → Whoever is available

**Step 4: Respond (varies)**

- Use email templates for common issues
- Personalize greeting and closing
- Keep responses friendly and concise
- Offer next steps or alternatives

**Step 5: Track (1 min)**

- Log email in support tracker (spreadsheet or Linear)
- Mark as: New / In Progress / Waiting / Resolved
- Set follow-up reminder if needed

---

### Support Tracker (Google Sheets)

**Columns:**
| Date | User Email | Subject | Category | Priority | Owner | Status | Resolution | Time to Resolve |
|------|------------|---------|----------|----------|-------|--------|------------|-----------------|
| 2025-11-15 | user@example.com | Password reset | Technical | P1 | Yurii | Resolved | Sent reset link | 15 min |
| 2025-11-16 | org@example.com | Feature request | Product | P3 | Pavlo | Open | Logged in roadmap | - |

**Link:** [Create shared Google Sheet and add link here]

---

### Response Time SLAs

| Priority        | Response Time | Resolution Time | Owner       |
| --------------- | ------------- | --------------- | ----------- |
| **P0 - Urgent** | 1 hour        | Same day        | Yurii       |
| **P1 - High**   | 4 hours       | 1-2 days        | Yurii       |
| **P2 - Medium** | 24 hours      | 3-5 days        | Pavlo/Yurii |
| **P3 - Low**    | 1 week        | 2-4 weeks       | Pavlo       |

---

## 6. Common Issues & Responses

### Issue: "I didn't receive the verification email"

**Quick Response:**

```
Hi [Name],

Try these steps:
1. Check your spam/junk folder
2. Add hello@proofound.io to your contacts
3. Try resending the verification email: https://proofound.io/resend-verification
4. If still no luck, reply with your email address and I'll manually verify your account.

Best,
[Yurii]
```

---

### Issue: "Why aren't I seeing any matches?"

**Quick Response:**

```
Hi [Name],

A few things to check:
1. Is your profile complete? (At least 5 skills, bio, preferences)
2. Have you activated your profile? (Profile → Activate)
3. Are there assignments in your area/skills? (Matching Hub → Browse)
4. Are your matching preferences too narrow? (Settings → Preferences)

If everything looks good, it may just take time for new assignments to be posted. We'll notify you as soon as new matches are available.

Best,
[Pavlo]
```

---

### Issue: "How do I delete my account?"

**Quick Response:**

```
Hi [Name],

To delete your account:
1. Go to Settings → Account → Delete Account
2. Confirm deletion (this is permanent!)
3. All your data will be deleted within 30 days per GDPR

Before you go: Is there something we can fix? We'd love to help if you're having an issue.

Best,
[Pavlo]
```

---

### Issue: "I think I found a bug"

**Quick Response:**

```
Hi [Name],

Thanks for reporting! To help us investigate, could you provide:
1. What were you trying to do?
2. What happened instead?
3. What browser/device are you using?
4. Screenshot (if possible)

I'll log this as a bug and update you on the fix timeline.

Best,
[Yurii]
```

---

### Issue: "Can you add [feature]?"

**Quick Response:**

```
Hi [Name],

Great idea! We're always looking to improve Proofound.

I've added your suggestion to our roadmap backlog. While I can't promise a timeline, we'll definitely consider it for a future release.

Have any other ideas? We'd love to hear them!

Best,
[Pavlo]
```

---

## Appendix A: Email Signature

**Standard Signature:**

```
Best regards,
[Pavlo Samoshko / Yurii Bakurov]
Proofound Team

---
Need faster support? Use our in-app chat (Mon-Fri 9 AM - 6 PM UTC)
Help Center: https://proofound.io/help
Privacy Policy: https://proofound.io/privacy
```

---

## Appendix B: Email Etiquette

**Guidelines:**

1. **Tone:** Friendly, helpful, professional (not corporate)
2. **Length:** Keep responses concise (max 200 words)
3. **Personalization:** Use user's name, reference their specific issue
4. **Empathy:** Acknowledge frustration for bugs/issues
5. **Next steps:** Always provide clear next steps or timeline
6. **Follow-up:** Set reminder to follow up if no response in 3 days

**Examples:**

- ✅ Good: "Hi Maria, sorry for the confusion! Here's how..."
- ❌ Bad: "Dear User, per your inquiry regarding..."

---

## Appendix C: Escalation Path

**When to escalate:**

- User threatens legal action
- Data breach or security concern
- Repeated complaints (3+ emails about same issue)
- Request for refund (if payments implemented)
- Press/media inquiry
- Angry user (3+ frustrated emails)

**How to escalate:**

- Forward email to Pavlo (CEO) with context
- Mark as "Escalation" in support tracker
- Respond to user: "I'm looping in our CEO to address this personally"

---

## Document Revision History

| Date        | Version | Changes                     | Author        |
| ----------- | ------- | --------------------------- | ------------- |
| Nov 5, 2025 | 1.0     | Initial email support guide | Yurii Bakurov |

---

**Last Updated:** November 5, 2025  
**Next Review:** December 1, 2025  
**Document Owner:** Yurii Bakurov & Pavlo Samoshko

---

**Questions?**  
Contact: yurii@proofound.io or pavlo@proofound.io
