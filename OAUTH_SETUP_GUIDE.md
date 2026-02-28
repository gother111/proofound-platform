# 🔐 OAuth Setup Guide

Complete guide for setting up Zoom and Google Meet OAuth integrations for video interview scheduling.

---

## Prerequisites

- Admin access to create OAuth apps
- Production domain URL (or ngrok for local testing)
- Access to environment variables

---

## Part 1: Zoom OAuth Setup

### Step 1: Create Zoom OAuth App

1. **Go to Zoom Marketplace**
   - Visit: https://marketplace.zoom.us/
   - Click "Develop" → "Build App"

2. **Select OAuth App Type**
   - Choose "OAuth"
   - App type: "User-managed app"
   - Would you like to publish this app: "No" (for internal use)

3. **Basic Information**
   - App Name: `Proofound Interview Scheduler`
   - Short Description: `Schedule video interviews through Proofound`
   - Company Name: Your company name
   - Developer Name: Your name
   - Developer Email: Your email

4. **App Credentials**
   - Copy **Client ID** and **Client Secret**
   - You'll add these to your `.env.local` file

5. **Redirect URLs**
   - Recommended: `https://yourdomain.com/api/integrations/zoom/callback`
   - For local dev: `http://localhost:3000/api/integrations/zoom/callback`
   - Stable preview domain: `https://preview.yourdomain.com/api/integrations/zoom/callback`
   - Supported legacy callback: `/api/auth/zoom/callback` (only use if your Zoom app is already configured to it)

6. **Scopes Required**
   - `meeting:write` - Create meetings
   - `meeting:read` - Read meeting details
   - `user:read` - Read user profile

7. **Activation**
   - Click "Activate"
   - Note: For production, you'll need to submit for review

### Step 2: Add Credentials to Environment

Add to your `.env.local`:

```env
# Zoom OAuth
ZOOM_CLIENT_ID=your_zoom_client_id_here
ZOOM_CLIENT_SECRET=your_zoom_client_secret_here
ZOOM_REDIRECT_URI=/api/integrations/zoom/callback
```

### Step 3: Test OAuth Flow

1. Navigate to `/app/i/settings/integrations`
2. Click "Connect Zoom"
3. Authorize the app
4. You should be redirected back with a success message

---

## Part 2: Google Meet OAuth Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Click "Select a project" → "New Project"

2. **Project Details**
   - Project name: `Proofound`
   - Location: Your organization (or No organization)
   - Click "Create"

3. **Enable Google Calendar API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### Step 2: Create OAuth Consent Screen

1. **Go to OAuth consent screen**
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - User Type: Select "External" (unless you have Google Workspace)
   - Click "Create"

2. **App Information**
   - App name: `Proofound`
   - User support email: Your email
   - Developer contact: Your email
   - Click "Save and Continue"

3. **Scopes**
   - Click "Add or Remove Scopes"
   - Add these scopes:
     - `https://www.googleapis.com/auth/calendar` - Full calendar access
     - `https://www.googleapis.com/auth/calendar.events` - Event management
   - Click "Update" → "Save and Continue"

4. **Test Users** (for development)
   - Add your email and any test user emails
   - Click "Save and Continue"

5. **Summary**
   - Review and click "Back to Dashboard"

### Step 3: Create OAuth Credentials

1. **Create Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"

2. **Application Type**
   - Select "Web application"
   - Name: `Proofound Web Client`

3. **Authorized Redirect URIs**
   - Recommended: `https://yourdomain.com/api/integrations/google/callback`
   - For local dev: `http://localhost:3000/api/integrations/google/callback`
   - Stable preview domain: `https://preview.yourdomain.com/api/integrations/google/callback`
   - Supported legacy callback: `/api/auth/google/callback` (only use if your Google OAuth client is already configured to it)

4. **Create**
   - Click "Create"
   - Copy **Client ID** and **Client Secret**

### Step 4: Add Credentials to Environment

Add to your `.env.local`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=/api/integrations/google/callback
```

Using a relative callback path is recommended for multi-domain setups because the app resolves it against the current request origin.

### Step 5: Test OAuth Flow

1. Navigate to `/app/i/settings/integrations`
2. Click "Connect Google Calendar"
3. Authorize the app (select calendars)
4. You should be redirected back with a success message

---

## Part 3: Environment Variables Reference

Complete `.env.local` file:

```env
# === Zoom OAuth ===
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=/api/integrations/zoom/callback

# === Google OAuth ===
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=/api/integrations/google/callback

# === Other Required Env Vars ===
# (Your existing Supabase, database, etc. variables)
```

---

## Part 4: Code Implementation Checklist

Primary paths used by the app:

- OAuth connect and callback:
  - `src/app/api/integrations/zoom/connect/route.ts`
  - `src/app/api/integrations/zoom/callback/route.ts`
  - `src/app/api/integrations/google/connect/route.ts`
  - `src/app/api/integrations/google/callback/route.ts`
- Token storage table:
  - `user_video_integrations` (migration: `supabase/migrations/20251108_add_video_integrations.sql`)
- Meeting creation:
  - `src/lib/integrations/zoom.ts`
  - `src/lib/integrations/google-meet.ts`
- Interview scheduling:
  - `src/app/api/interviews/schedule/route.ts`

---

## Part 5: Testing Checklist

### Zoom OAuth

- [ ] Connect Zoom account
- [ ] Create a test meeting via API
- [ ] Verify meeting appears in Zoom account
- [ ] Disconnect and reconnect
- [ ] Test token refresh

### Google OAuth

- [ ] Connect Google account
- [ ] Create a test calendar event
- [ ] Verify event appears in Google Calendar
- [ ] Verify Meet link is generated
- [ ] Test with multiple calendars

### Interview Scheduling

- [ ] Schedule interview with Zoom
- [ ] Schedule interview with Google Meet
- [ ] Verify calendar invites sent
- [ ] Test timezone conversion
- [ ] Test reminder notifications

---

## Part 6: Production Deployment

### Before Going Live

1. **Zoom:**
   - Submit app for review if publishing
   - Add production redirect URI
   - Enable rate limit monitoring

2. **Google:**
   - Move OAuth consent screen from "Testing" to "Production"
   - Complete verification process (if needed)
   - Add production redirect URI

3. **Security:**
   - Store secrets in secure environment variables
   - Never commit credentials to git
   - Use HTTPS for all OAuth redirects
   - Implement CSRF protection

4. **Monitoring:**
   - Track OAuth success/failure rates
   - Monitor token refresh errors
   - Log API rate limit usage
   - Set up error alerting

---

## Part 7: Troubleshooting

### Common Issues

**Zoom: "Invalid redirect_uri"**

- Double-check the redirect URI matches exactly
- Include http:// or https://
- No trailing slash

**Google: "Access blocked: This app's request is invalid"**

- OAuth consent screen not configured
- Missing required scopes
- Test user not added (in development)

**Google: "Access blocked: proofound.io has not completed the Google verification process" (403 `access_denied`)**

Operator checklist:

1. OAuth consent screen publishing status
   - In Google Cloud Console, open **APIs & Services -> OAuth consent screen**.
   - Confirm whether app is in **Testing** or **In production**.
2. If consent screen is in Testing mode
   - Add every affected Google account under **Test users**.
   - Save changes and retry OAuth with one of those test users.
3. If consent screen is in Production mode
   - Verify whether your configured scopes (especially Calendar scopes) require Google app verification.
   - Complete verification requirements in Google Cloud Console before expecting broad account access.
4. Re-test flow
   - Retry from `/app/i/settings?tab=integrations` -> **Connect Google Calendar**.
   - Confirm callback returns to Proofound with `success=google_connected`.
   - If it still fails, capture the full `error`, `error_description`, and `error_subtype` query params for diagnostics.

**Token Expired Errors**

- Implement token refresh logic
- Store refresh tokens securely
- Handle 401 responses gracefully

**Rate Limit Errors**

- Zoom: 100 requests per day (free tier)
- Google: 1,000,000 queries per day
- Implement request queuing

---

## Part 8: Support Resources

### Zoom

- Documentation: https://marketplace.zoom.us/docs/guides
- API Reference: https://marketplace.zoom.us/docs/api-reference/zoom-api
- Support: https://devsupport.zoom.us/

### Google

- Documentation: https://developers.google.com/calendar
- API Reference: https://developers.google.com/calendar/api/v3/reference
- Support: https://support.google.com/code

---

## ✅ Quick Start

1. Complete Part 1 (Zoom) OR Part 2 (Google)
2. Add credentials to `.env.local`
3. Restart your development server
4. Test OAuth flow
5. Implement interview scheduling UI

---

**Next Steps:** Once you have OAuth credentials, the code scaffolding is ready to use. Uncomment the implementation files and follow the TODO comments.

**Estimated Time:**

- Zoom setup: 15-20 minutes
- Google setup: 20-30 minutes
- Testing: 15 minutes
- **Total: ~1 hour**
