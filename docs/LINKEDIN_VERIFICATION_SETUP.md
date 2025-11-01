# LinkedIn Identity Verification - Setup Guide

This guide explains how to set up and configure the LinkedIn identity verification feature.

## Overview

The LinkedIn verification feature allows users to verify their identity by connecting their LinkedIn account. The system automatically checks for LinkedIn's official identity verification badge and analyzes profile signals using Playwright (free!) with optional third-party enrichment.

## Features

- ✅ **Free automated checking** using Playwright (already installed)
- ✅ **Multi-layer verification**: OAuth + Automated scraping + Optional enrichment + Admin review
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
```

### Getting LinkedIn OAuth Credentials

1. Go to https://www.linkedin.com/developers/apps
2. Click **"Create app"**
3. Fill in app details:
   - App name: "Proofound"
   - LinkedIn Page: Your company page
   - Privacy policy URL: https://proofound.io/privacy
   - App logo: Upload Proofound logo
4. Once created, go to **"Auth"** tab
5. Add these redirect URLs:
   - Local: `http://localhost:3000/api/auth/linkedin/callback`
   - Production: `https://proofound.io/api/auth/linkedin/callback`
6. Under **"OAuth 2.0 scopes"**, request:
   - `openid` (required)
   - `profile` (required)
   - `email` (required)
7. Copy **Client ID** and **Client Secret** to your `.env.local`

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

1. Apply the migration:

```bash
# Option 1: Using Drizzle
npm run db:push

# Option 2: Manually apply SQL
# Run the SQL in: drizzle/0029_add_linkedin_verification.sql
```

2. Verify schema changes:
   - `individual_profiles.verification_method` now accepts 'linkedin'
   - New columns: `linkedin_profile_url`, `linkedin_verification_data`

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
5. **Status**: User sees results and pending admin review message
6. **Admin review**: Admin dashboard shows request sorted by confidence
7. **Approval**: Admin approves/rejects (1-click for high confidence)
8. **Complete**: User receives verified badge

## Admin Dashboard

Access at: `/admin/verification`

### Features

- **Three confidence-based tabs**:
  - High Confidence (80-100%) - Quick approvals
  - Medium Confidence (50-79%) - Manual review
  - Low Confidence (<50%) - Likely rejection

- **For each verification**:
  - User info and LinkedIn profile link
  - Confidence badge and score
  - Detected signals checklist
  - Quick Approve / Review Manually / Reject buttons

- **Review actions**:
  - Approve → Sets `verified = true`, `verification_method = 'linkedin'`
  - Reject → Sets `verification_status = 'failed'`
  - Both actions log admin notes

## What Gets Checked

The automated system analyzes:

1. **Verification Badge** (Primary, +50 points)
   - LinkedIn's official identity verification badge
   
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
**Solution**: Verify `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are set in `.env.local`

### OAuth redirect fails
**Solution**: 
- Check redirect URL matches LinkedIn app settings exactly
- For local dev, use ngrok HTTPS URL
- Verify `NEXT_PUBLIC_SITE_URL` is set correctly

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

**Last Updated**: 2025-11-01  
**Feature Status**: ✅ Fully Implemented  
**Migration**: `drizzle/0029_add_linkedin_verification.sql`

