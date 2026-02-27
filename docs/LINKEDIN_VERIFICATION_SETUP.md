# LinkedIn Identity Verification - Setup Guide

This guide explains how to set up and configure the LinkedIn identity verification feature.

## Overview

The LinkedIn verification feature allows users to connect LinkedIn and classify trust at two official levels:

- `IDENTITY` -> identity-level verification (highest assurance)
- `WORKPLACE` -> workplace-level verification (not identity-level)

When no official LinkedIn signal is available, the system falls back to automated confidence analysis and admin review.

## Features

- ✅ **Free automated checking** using Playwright (already installed)
- ✅ **Tiered verification model**: Identity vs workplace vs pending manual review
- ✅ **Multi-layer verification**: OAuth + LinkedIn Verified API + Automated scraping + Optional enrichment + Admin review
- ✅ **Quick approvals**: High-confidence cases can be approved in 1-click
- ✅ **Smart confidence scoring**: 0-100 score based on multiple signals
- ✅ **Admin dashboard** with confidence-based tabs
- ✅ **Secure**: OAuth tokens encrypted, minimal data storage

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# LinkedIn OAuth (REQUIRED)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://proofound.io/api/auth/linkedin/callback
# Optional. Defaults to 202510.
LINKEDIN_API_VERSION=202510
# Optional manual-review notification recipients.
# Falls back to PLATFORM_ADMIN_EMAILS when unset.
LINKEDIN_VERIFICATION_ADMIN_EMAILS=pavlos@profound.io,yuriib@proofound.io
```

Important callback split:

- Proofound LinkedIn verification/integrations callback: `https://proofound.io/api/auth/linkedin/callback`
- Supabase LinkedIn social-login callback: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`

### Getting LinkedIn OAuth Credentials

1. Go to https://www.linkedin.com/developers/apps
2. Click **"Create app"**
3. Fill in app details:
   - App name: "Proofound"
   - LinkedIn Page: Your company page
   - Privacy policy URL: https://proofound.io/privacy
   - App logo: Upload Proofound logo
4. Once created, go to **"Auth"** tab
5. Add these redirect URLs in the same LinkedIn app:
   - Production app callback: `https://proofound.io/api/auth/linkedin/callback`
   - Supabase callback: `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
   - Local app callback (optional, for local testing): `http://localhost:3000/api/auth/linkedin/callback`
   - Additional live domains (optional): `https://<domain>/api/auth/linkedin/callback` for every domain that can initiate `/api/auth/linkedin`
6. Under **"OAuth 2.0 scopes"**, request:
   - `openid` (required)
   - `profile` (required)
   - `email` (required)
   - `r_profile_basicinfo` (required for LinkedIn `/rest/identityMe`)
   - `r_verify` (required for LinkedIn `/rest/verificationReport`)
7. Copy **Client ID** and **Client Secret** to your `.env.local`
8. Set `LINKEDIN_REDIRECT_URI` in your environment to your canonical app callback (recommended: `https://proofound.io/api/auth/linkedin/callback` without a trailing slash)

## Optional Environment Variables

These are completely optional - the system works great without them using only Playwright:

```bash
# Proxycurl API (optional - has free tier with 10 requests/month)
# Get API key at: https://nubela.co/proxycurl/
PROXYCURL_API_KEY=your_proxycurl_key

# PhantomBuster (optional - not yet implemented)
PHANTOMBUSTER_API_KEY=your_phantombuster_key
```

## Database Setup

1. Apply migrations:

```bash
npm run db:migrate
```

2. Verify schema changes:
   - `individual_profiles.linkedin_verification_level` exists (`unverified|pending|workplace|identity|failed`)
   - `individual_profiles.verification_tier` exists (`unverified|workplace_verified|identity_verified`)
   - `individual_profiles.verification_tier_source` exists
   - Existing compatibility columns remain (`verified`, `verification_status`, `verification_method`, `linkedin_verification_status`)

3. Backfill existing users into canonical tiers:

```bash
npx tsx scripts/backfill-verification-tiers.ts --dry-run
npx tsx scripts/backfill-verification-tiers.ts --apply
```

## Testing Locally

### 1. Start Development Server

```bash
npm run dev
```

### 2. Use ngrok for LinkedIn OAuth (Required for local testing)

LinkedIn OAuth requires HTTPS. Use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000
```

### 3. Update LinkedIn App Settings

1. Copy the ngrok HTTPS URL (e.g., `https://abc123.ngrok.io`)
2. Add it as a redirect URL in LinkedIn app: `https://abc123.ngrok.io/api/auth/linkedin/callback`
3. Update your `.env.local`:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
   ```
4. Restart your dev server

### 4. Test the Flow

1. Navigate to: `https://abc123.ngrok.io/settings`
2. Click **Identity Verification** → **Verify with LinkedIn**
3. Click **"Start Verification Check"**
4. Authorize with LinkedIn
5. Wait 5-10 seconds for automated check
6. View results with confidence score

## User Flow

1. **User initiates**: Settings → Identity Verification → Verify with LinkedIn
2. **OAuth**: Redirects to LinkedIn, user authorizes
3. **Automated check** (5-10 seconds):
   - Playwright scrapes public LinkedIn profile
   - Checks for verification badge
   - Analyzes signals (connections, completeness, age)
   - Generates confidence score (0-100)
4. **Optional enrichment**: If Proxycurl configured, fetches additional data
5. **Decision split**:
   - If LinkedIn `verificationReport` includes `IDENTITY`, auto-approve as `identity_verified`.
   - If LinkedIn `verificationReport` includes `WORKPLACE` only, auto-approve as `workplace_verified`.
   - If no official LinkedIn signal exists, mark as pending for admin review.
6. **Status**:
   - Identity auto-approved path: user gets identity-tier verification and verified badge.
   - Workplace auto-approved path: user gets workplace-tier verification (no identity badge).
   - Manual path: user sees pending admin review status.
7. **Admin review** (manual path only): Admin dashboard shows request sorted by confidence.
8. **Approval**: Admin approves/rejects pending requests (1-click for high confidence).
9. **Complete**: User receives final verified/failed status.

## Admin Dashboard

Access at: `/admin/verification`

### Features

- **Three confidence-based tabs**:
  - High Confidence (80-100%) - Quick approvals
  - Medium Confidence (50-79%) - Manual review
  - Low Confidence (<50%) - Likely rejection

- **For each verification**:
  - User info and LinkedIn profile link (when available)
  - Confidence badge and score
  - Detected signals checklist
  - Quick Approve / Review Manually / Reject buttons
  - Pending requests can still be reviewed when profile URL is unavailable (API report + signals fallback)

- **Admin notifications for manual review**:
  - Sent via email when a request stays pending.
  - Recipient order: `LINKEDIN_VERIFICATION_ADMIN_EMAILS` -> `PLATFORM_ADMIN_EMAILS`.
  - If both are unset, email is skipped and queue remains the source of truth.

- **Review actions**:
  - System auto-approve (`IDENTITY`) -> `linkedin_verification_level='identity'`, `verification_tier='identity_verified'`
  - System auto-approve (`WORKPLACE`) -> `linkedin_verification_level='workplace'`, `verification_tier='workplace_verified'`
  - Manual approve with identity signal (or explicit identity override) -> identity tier
  - Manual approve without identity signal -> workplace tier
  - Reject -> `linkedin_verification_status='failed'`, `linkedin_verification_level='failed'`
  - All actions keep legacy fields populated for compatibility

## What Gets Checked

The automated system analyzes:

1. **Official LinkedIn verification labels** (Primary)
   - `IDENTITY`, `GOVERNMENT_ID`, `GOVT_ID` -> identity-level
   - `WORKPLACE` -> workplace-level
2. **Connections** (+15 points max)
   - 500+ connections = high trust
3. **Profile Completeness** (+15 points max)
   - Photo, headline, about, experience, education, skills
4. **Account Age** (+10 points max)
   - Old accounts (5+ years) = more trustworthy
5. **Experience Count** (+5 points max)
   - Multiple work experiences = established profile
6. **Profile Photo** (+5 points)
   - Has professional photo

**Total possible**: 100 points

## Confidence Score Ranges

- **80-100**: High confidence → Quick approve (typically <1 hour)
- **50-79**: Medium confidence → Manual review (1-2 days)
- **0-49**: Low confidence → Consider rejection or alternate method

## Security & Privacy

- **OAuth tokens**: Stored encrypted in `user_integrations` table
- **Data minimization**: Only public profile data accessed
- **No permanent storage**: LinkedIn data discarded after verification
- **Admin audit trail**: All review decisions logged with timestamps
- **Rate limiting**: Prevents abuse of automated checks
- **HTTPS only**: All OAuth flows require HTTPS

## Troubleshooting

### "LinkedIn not connected" error

**Solution**:

- Verify `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REDIRECT_URI` are set.
- Verify `LINKEDIN_REDIRECT_URI` exactly matches LinkedIn Developer callback (including host, path, and trailing slash behavior).

### "LinkedIn verification scope is missing" warning

**Solution**:

- Ensure the LinkedIn app has access to Verified on LinkedIn product.
- Ensure OAuth scopes include `r_profile_basicinfo` and `r_verify`.
- Reconnect LinkedIn after scope changes so the token carries the new grants.

### OAuth redirect fails (`The redirect_uri does not match the registered value`)

**Solution**:

- Confirm the LinkedIn app includes both callback families:
  - `https://proofound.io/api/auth/linkedin/callback`
  - `https://<supabase-project-ref>.supabase.co/auth/v1/callback`
- Check redirect URL matches LinkedIn app settings exactly
- For local dev, use ngrok HTTPS URL
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly
- Verify `LINKEDIN_REDIRECT_URI` is set to your canonical app callback (not the Supabase callback)

### "Playwright not found" error

**Solution**:

```bash
npx playwright install chromium
```

### Automated check returns low confidence

**Solution**:

- Verify LinkedIn profile is public (not private)
- Check if profile has verification badge
- Ensure profile is complete (photo, experience, etc.)
- If confidence is genuinely low, suggest user try Veriff or Work Email instead

### Admin dashboard shows "Forbidden"

**Solution**: Ensure user has `role = 'admin'` in `profiles` table

## API Endpoints

### User Endpoints

- `GET /api/auth/linkedin` - OAuth initiation
- `GET /api/auth/linkedin/callback` - OAuth callback
- `POST /api/verification/linkedin/initiate` - Start verification
- `GET /api/verification/status` - Get verification status

### Admin Endpoints

- `GET /api/admin/verification/linkedin/queue` - Get pending verifications
- `POST /api/admin/verification/linkedin/[userId]/review` - Approve/reject

## Success Metrics

Track these metrics after deployment:

- **Automation efficiency**: % with high confidence (target: >60%)
- **Admin time saved**: Average review time (target: <30 seconds)
- **Approval rate**: % of high-confidence approved (target: >95%)
- **User satisfaction**: Time to approval (target: <2 hours for high-confidence)
- **False positive rate**: % of incorrect automated approvals (target: <1%)

## Future Enhancements

- [ ] Email notifications when verification completes
- [ ] Webhook to notify user's app
- [ ] Batch admin approvals (approve multiple at once)
- [ ] A/B test confidence thresholds
- [ ] Machine learning to improve confidence scoring
- [ ] Direct API integration if LinkedIn opens verification badge endpoint

## Support

For issues or questions:

1. Check troubleshooting section above
2. Review logs in browser console (F12)
3. Check server logs for API errors
4. Verify database migration applied correctly

---

**Last Updated**: 2026-02-26  
**Feature Status**: ✅ Fully Implemented  
**Migration**: `src/db/migrations/20260226180000_add_linkedin_verification_status_tracking.sql`
