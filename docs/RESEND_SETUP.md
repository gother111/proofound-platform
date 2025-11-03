# Resend Email Service Setup Guide

> **✅ STATUS: RESEND CONFIGURED**
>
> RESEND_API_KEY is configured in:
>
> - ✅ Vercel environment variables (production)
> - ✅ .env.local (local development)
>
> Test your setup: `node scripts/test-email.mjs your-email@example.com`
>
> This guide is for reference. Skip to [Test Your Setup](#test-your-setup-quick-verification) to verify email functionality.

---

This guide walks you through setting up Resend, the transactional email service used by Proofound for sending emails to users.

## Why Resend?

Resend is used to send all transactional emails in the Proofound platform, including:

- Email verification during signup
- Password reset emails
- Organization invitations
- Skill verification requests
- Match notifications
- Account deletion notifications
- Work email verification

## Pricing

- **Free Tier**: 3,000 emails per month
- **No Credit Card Required** to start
- **Paid Plans**: Start at $20/month for 50,000 emails

For early-stage production, the free tier should be sufficient for hundreds of active users.

---

## Step 1: Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click **"Sign Up"**
3. Enter your email address and create a password
4. Verify your email address
5. Complete the onboarding questionnaire (optional)

---

## Step 2: Add and Verify Your Domain

### Why Verify a Domain?

- Improves email deliverability
- Allows custom "From" addresses (e.g., `no-reply@yourdomain.com`)
- Required for production use
- Builds sender reputation

### Add Your Domain

1. In the Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `proofound.com`)
4. Click **"Add"**

### Configure DNS Records

Resend will provide you with DNS records to add to your domain. You'll need to add:

#### 1. SPF Record (TXT)

```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all
```

#### 2. DKIM Records (3 CNAME records)

Resend will provide three CNAME records like:

```
Type: CNAME
Name: resend._domainkey
Value: resend1.resend.com

Type: CNAME
Name: resend2._domainkey
Value: resend2.resend.com

Type: CNAME
Name: resend3._domainkey
Value: resend3.resend.com
```

#### 3. DMARC Record (TXT) - Optional but Recommended

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### Where to Add DNS Records

- **Vercel Domains**: Vercel Dashboard → Your Project → Domains → DNS
- **Cloudflare**: Dashboard → DNS → Add Record
- **Namecheap**: Dashboard → Domain List → Manage → Advanced DNS
- **GoDaddy**: Domain Settings → DNS Management

### Verify Domain Status

1. After adding DNS records, return to Resend dashboard
2. Click **"Verify"** next to your domain
3. DNS propagation can take 5-60 minutes
4. Status will change to **"Verified"** once successful

---

## Step 3: Get Your API Key

1. In Resend dashboard, go to **"API Keys"**
2. Click **"Create API Key"**
3. Name it (e.g., "Proofound Production")
4. Select permissions: **"Sending access"**
5. Click **"Create"**
6. **IMPORTANT**: Copy the API key immediately (shown only once)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 4: Configure Environment Variables

### In Vercel (Production)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add two variables:

#### RESEND_API_KEY

- **Name**: `RESEND_API_KEY`
- **Value**: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx` (your API key)
- **Environment**: Production, Preview, Development (select all)

#### EMAIL_FROM

- **Name**: `EMAIL_FROM`
- **Value**: `Proofound <no-reply@yourdomain.com>`
- **Environment**: Production, Preview, Development (select all)
- **Format**: `Display Name <email@domain.com>`

4. Click **"Save"**
5. Redeploy your application for changes to take effect

### In Local Development

Add to your `.env.local` file:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Proofound <no-reply@yourdomain.com>"
```

---

## Test Your Setup (Quick Verification)

Since your RESEND_API_KEY is already configured, verify it's working:

### Option 1: Use Test Script (Recommended)

Run the included test script to send a test email:

```bash
# From your project root
node scripts/test-email.mjs your-email@example.com
```

**What it does:**

- Loads your RESEND_API_KEY from .env.local
- Sends a beautifully formatted test email
- Verifies your configuration is working
- Provides troubleshooting tips if it fails

**Expected output:**

```
✅ SUCCESS! Email sent successfully

📧 Email Details:
   Email ID: abc123...
   From: Proofound <no-reply@proofound.io>
   To: your-email@example.com
   Status: Sent

🔍 Next Steps:
   1. Check your inbox
   2. Check spam folder if not in inbox
   3. Verify Resend dashboard: https://resend.com/logs
```

### Option 2: Check Resend Dashboard

1. Login to [Resend Dashboard](https://resend.com/logs)
2. Check if any emails have been sent
3. Verify delivery status

### Option 3: Test in Application

1. Start your development server: `npm run dev`
2. Sign up for a new account
3. Check if verification email arrives
4. Check Resend dashboard for logs

---

## Step 5: Test Email Sending

### Test Locally

1. Start your development server: `npm run dev`
2. Trigger an email action (e.g., sign up for an account)
3. Check the terminal for email sending logs
4. Check Resend dashboard → **"Logs"** to see sent emails

### Test in Production

1. After deploying with environment variables set
2. Trigger an email action (e.g., request password reset)
3. Check Resend dashboard → **"Logs"** for delivery status
4. Verify email arrives in inbox (check spam folder too)

---

## Email Templates in Proofound

Your application includes 11 email templates:

### Authentication & Verification

1. **VerifyEmail** - Generic email verification
2. **VerifyEmailIndividual** - Individual user verification
3. **VerifyEmailOrganization** - Organization user verification
4. **ResetPassword** - Password reset emails
5. **WorkEmailVerification** - Work email domain verification

### Organization Management

6. **OrgInvite** - Team member invitation emails

### Skill & Matching System

7. **SkillVerificationRequest** - Peer skill verification requests
8. **NewMatchNotification** - New match alerts

### GDPR & Privacy

9. **DeletionScheduled** - Account deletion scheduled notification
10. **DeletionReminder** - 7-day reminder before deletion
11. **DeletionComplete** - Deletion completed confirmation

---

## Email Endpoints Using Resend

These API endpoints send emails:

| Endpoint                                 | Email Type              | Trigger                         |
| ---------------------------------------- | ----------------------- | ------------------------------- |
| `POST /api/auth/signup`                  | Verification            | User signs up                   |
| `POST /api/auth/reset-password`          | Password Reset          | User requests password reset    |
| `POST /api/org/invite`                   | Org Invitation          | Admin invites team member       |
| `POST /api/verification/work-email/send` | Work Email Verification | User adds work email            |
| `POST /api/verification/skill/request`   | Skill Verification      | User requests peer verification |
| `DELETE /api/user/account`               | Deletion Scheduled      | User requests account deletion  |
| `GET /api/cron/send-deletion-reminders`  | Deletion Reminder       | Cron job (7 days before)        |
| `GET /api/cron/process-deletions`        | Deletion Complete       | Cron job (after 30 days)        |

---

## Monitoring & Analytics

### Resend Dashboard

1. Go to **"Logs"** to see all sent emails
2. View delivery status: Delivered, Bounced, Complained
3. Click individual emails to see full details
4. Monitor open rates and click rates (if tracking enabled)

### Check Email Quota

1. Dashboard → **"Usage"**
2. See current month's email count
3. Monitor daily sending volume
4. Get alerts when approaching limits

---

## Troubleshooting

### Emails Not Sending

**Check 1: API Key is Set**

```bash
# In your deployment, verify environment variable exists
echo $RESEND_API_KEY
```

**Check 2: Domain is Verified**

- Resend Dashboard → Domains → Status should be "Verified"
- If not verified, emails will fail to send

**Check 3: DNS Records are Correct**

```bash
# Check SPF record
dig TXT yourdomain.com

# Check DKIM records
dig CNAME resend._domainkey.yourdomain.com
```

**Check 4: Check Resend Logs**

- Dashboard → Logs → Look for errors
- Common errors: Invalid API key, unverified domain, rate limits

### Emails Going to Spam

**Solution 1: Verify Domain Fully**

- Ensure all DNS records (SPF, DKIM, DMARC) are configured
- Wait for DNS propagation (up to 48 hours)

**Solution 2: Warm Up Your Domain**

- Start with low volume (10-20 emails/day)
- Gradually increase over 2-4 weeks
- Monitor bounce and complaint rates

**Solution 3: Follow Email Best Practices**

- Use clear, descriptive subject lines
- Include unsubscribe links (required for marketing emails)
- Maintain clean email list (remove bounces)
- Authenticate your sending domain

### Rate Limiting

**Free Tier Limits:**

- 3,000 emails per month
- No per-second rate limits (reasonable use)

**What Happens When You Hit Limits:**

- Emails will fail with 429 error
- Upgrade to paid plan for higher limits
- Monitor usage in dashboard

### API Key Issues

**API Key Not Working:**

1. Verify it's copied correctly (starts with `re_`)
2. Check it has "Sending access" permission
3. Regenerate key if compromised
4. Update environment variables after regeneration

---

## Best Practices

### Security

- ✅ Never commit API keys to Git
- ✅ Use environment variables for all credentials
- ✅ Rotate API keys periodically (every 6 months)
- ✅ Use different keys for production/staging

### Deliverability

- ✅ Verify your domain before sending production emails
- ✅ Configure SPF, DKIM, and DMARC records
- ✅ Use professional "From" addresses (avoid gmail/yahoo)
- ✅ Include clear unsubscribe links
- ✅ Monitor bounce and complaint rates

### Development

- ✅ Test emails in development before production
- ✅ Use real email addresses for testing (not fake ones)
- ✅ Check spam folders during testing
- ✅ Log email errors for debugging

### Compliance

- ✅ Include physical mailing address in footer (CAN-SPAM)
- ✅ Honor unsubscribe requests within 10 days
- ✅ Don't send marketing emails without consent
- ✅ Maintain email preference center

---

## Cost Management

### Free Tier (Current)

- 3,000 emails/month
- Sufficient for ~300-500 active users
- All features included

### When to Upgrade

- Approaching 3,000 emails/month
- Need higher sending rate
- Want advanced analytics

### Paid Plans

- **$20/month**: 50,000 emails
- **$75/month**: 100,000 emails
- Custom plans for higher volumes

### Optimization Tips

- Batch similar emails together
- Avoid sending duplicate notifications
- Implement smart notification preferences
- Use email digests instead of individual alerts

---

## Support & Resources

### Resend Documentation

- [Official Docs](https://resend.com/docs)
- [API Reference](https://resend.com/docs/api-reference)
- [React Email Guide](https://resend.com/docs/send-with-react)

### Getting Help

- [Resend Discord](https://resend.com/discord)
- [GitHub Issues](https://github.com/resend/resend-node/issues)
- Email: support@resend.com

### Additional Resources

- [Email Templates](https://react.email/examples)
- [Deliverability Guide](https://resend.com/docs/knowledge-base/deliverability)
- [SPF/DKIM Setup](https://resend.com/docs/knowledge-base/dns)

---

## Next Steps

After setting up Resend:

1. ✅ Configure Cron Jobs → See [CRON_SETUP.md](./CRON_SETUP.md)
2. ✅ Review Environment Variables → See [ENV_VARIABLES.md](./ENV_VARIABLES.md)
3. ✅ Complete Deployment Checklist → See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
4. ✅ Test all email flows in production

---

## Quick Reference

```env
# Add these to Vercel Environment Variables
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Proofound <no-reply@yourdomain.com>"
```

**Total Setup Time:** ~20 minutes (plus DNS propagation)

**Cost:** Free (up to 3,000 emails/month)

**Status Check:** Dashboard → Logs → See delivery status
