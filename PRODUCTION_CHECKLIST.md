# 🚀 Production Deployment Checklist

> Doc Class: `active`
> Last Verified: `2026-02-26`

This checklist ensures your Proofound application is properly configured for production deployment on Vercel.

## ✅ Environment Variables (Vercel)

Before deploying, ensure all required environment variables are set in Vercel:

### Required Variables

- [ ] **`NEXT_PUBLIC_SUPABASE_URL`**
  - What: Your Supabase project URL
  - Where: Supabase Dashboard → Settings → API → Project URL
  - Example: `https://your-project.supabase.co`

- [ ] **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
  - What: Supabase anon/public key
  - Where: Supabase Dashboard → Settings → API → Project API keys → anon/public
  - Note: This key is safe to expose in the browser

- [ ] **`SUPABASE_SERVICE_ROLE_KEY`**
  - What: Service role key for admin operations
  - Where: Supabase Dashboard → Settings → API → Project API keys → service_role
  - ⚠️ **CRITICAL**: Keep this secret! Never expose in client-side code

- [ ] **`DATABASE_URL`**
  - What: PostgreSQL connection string (pooled)
  - Where: Supabase Dashboard → Settings → Database → Connection pooling
  - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`
  - ⚠️ **MOST COMMON ISSUE**: Missing this causes all database operations to fail
  - Note: Use port **6543** (pooled), not 5432 (direct)

- [ ] **`DIRECT_URL`**
  - What: PostgreSQL direct connection string (non-pooled)
  - Where: Supabase Dashboard → Settings → Database → Connection string (Direct)
  - Format: Supabase "Direct" connection URI (port **5432**, not pooled)
  - Note: Used by tooling and migrations; keep `DATABASE_URL` as the pooled runtime connection

- [ ] **`NEXT_PUBLIC_SITE_URL`**
  - What: Your production domain
  - Example: `https://proofound.vercel.app` or `https://your-domain.com`
  - Note: No trailing slash

- [ ] **`SITE_URL`**
  - What: Same as NEXT_PUBLIC_SITE_URL (for server-side)
  - Example: Same value as above

### Required Variables (Cron and Providers)

- [ ] **`CRON_SECRET`**
  - What: Bearer token used to authenticate Vercel Cron requests
  - Generate: `openssl rand -base64 32`
  - Used by: `/api/cron/*` routes

- [ ] **Zoom OAuth** (`ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_REDIRECT_URI`)
  - Required for: interview scheduling with Zoom
  - Redirect URI (prod): `https://proofound.io/api/integrations/zoom/callback`

- [ ] **Google OAuth** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`)
  - Required for: interview scheduling with Google Meet
  - Redirect URI (prod): `https://proofound.io/api/integrations/google/callback`

- [ ] **LinkedIn OAuth** (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`)
  - Required for: LinkedIn verification flow

### Optional Variables (Email Features)

- [ ] **`RESEND_API_KEY`** (if using email verification)
  - What: Resend API key for sending emails
  - Where: [resend.com](https://resend.com) dashboard

- [ ] **`EMAIL_FROM`** (if using email verification)
  - What: Email sender address
  - Example: `"Proofound <no-reply@proofound.io>"`

### Optional Variables (Monitoring & Support)

- [ ] **`RATE_LIMIT_WINDOW_SECONDS`** (default: 60)
  - What: Rate limiting window in seconds

- [ ] **`RATE_LIMIT_MAX`** (default: 30)
  - What: Maximum requests per window

- [ ] **`NEXT_PUBLIC_CRISP_WEBSITE_ID`** (optional - for in-app chat support)
  - What: Crisp chat widget website ID
  - Where: [crisp.chat](https://crisp.chat) dashboard
  - Note: If not set, chat widget won't load (see `EMAIL_SUPPORT_SETUP.md`)

## 🗄️ Supabase Configuration

- [ ] **Database schema applied**
  - Safety checkpoint (recommended before production DDL): `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:backup:checkpoint`
  - Apply canonical migrations: `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:migrate`
  - Note: Do not run `npm run db:push` against production. Use versioned SQL under `src/db/migrations/`.
  - Verify tables exist in Supabase Dashboard → Database → Tables

- [ ] **RLS (Row Level Security) policies applied**
  - Location: `src/db/policies.sql` (applied by `npm run db:migrate`)
  - Test: Try accessing data without proper authentication

- [ ] **Database triggers set up**
  - Location: `src/db/triggers.sql` (applied by `npm run db:migrate`)

- [ ] **Auth settings configured**
  - Go to Supabase Dashboard → Authentication → URL Configuration
  - Set **Site URL**: Your production URL (e.g., `https://proofound.io`)
  - Add **Redirect URLs**:
    - `https://your-domain.com/auth/callback`
    - `https://your-domain.com/reset-password/confirm`
    - `https://your-domain.com/verify-email`

- [ ] **Email templates customized** (optional)
  - Go to Supabase Dashboard → Authentication → Email Templates
  - Customize: Magic Link, Confirmation, Password Reset, etc.

## 🔐 Security Checks

- [ ] **Environment variables scoped correctly**
  - Public variables start with `NEXT_PUBLIC_`
  - Sensitive keys (SERVICE*ROLE_KEY) do NOT have `NEXT_PUBLIC*` prefix
  - Service role key is only used in server-side code

- [ ] **RLS policies tested**
  - Users cannot access other users' data
  - Anonymous users cannot access protected data
  - Organization members can only see their org's data

- [ ] **API routes protected**
  - All sensitive routes use `requireAuth()` or similar
  - Organization routes verify membership
  - Rate limiting is enabled

## 🧪 Testing After Deployment

### 1. Health Check

- [ ] Visit `/api/health` endpoint
- [ ] Verify response shows:
  ```json
  {
    "status": "healthy",
    "database": {
      "connected": true,
      "usingMockDb": false
    },
    "environment": {
      "hasSupabaseUrl": true,
      "hasDatabaseUrl": true,
      "hasSiteUrl": true
    }
  }
  ```
- [ ] If status is not "healthy", check warnings array for missing env vars

### 2. Authentication Flow

- [ ] Sign up with new account works
- [ ] Email verification works (if enabled)
- [ ] Sign in works
- [ ] Sign out works
- [ ] Password reset flow works

### 3. Core Features

- [ ] **Matching Profile**
  - [ ] Can create matching profile
  - [ ] Profile saves successfully
  - [ ] Profile data persists after refresh
  - [ ] Can view matches

- [ ] **Assignments** (Organizations)
  - [ ] Can create assignment
  - [ ] Assignment saves successfully
  - [ ] Can view assignment details
  - [ ] Can edit assignment

- [ ] **Expertise Profile**
  - [ ] Can add skills
  - [ ] Skills save successfully
  - [ ] Can view expertise dashboard

### 4. Browser Console Check

- [ ] Open browser DevTools (F12)
- [ ] Check Console for errors
- [ ] Should NOT see:
  - "DATABASE_URL is missing" errors
  - Connection timeout errors
  - 503 Service Unavailable errors
- [ ] Check Network tab for failed API calls

### 5. Vercel Logs Check

- [ ] Go to Vercel → Your Project → Logs
- [ ] Filter by "Errors"
- [ ] Should NOT see:
  - Database connection failures
  - "DATABASE_URL missing" warnings
  - Repeated 500 errors
- [ ] All API calls should return appropriate status codes

## 🐛 Common Issues & Solutions

### Issue: "Failed to save matching profile"

**Cause**: Missing DATABASE_URL or database connection issue

**Solution**:

1. Check `/api/health` endpoint
2. Verify DATABASE_URL is set in Vercel
3. Verify DATABASE_URL uses pooled connection (port 6543)
4. Check Supabase project is active (not paused)

### Issue: "Buttons don't work" or "Nothing happens when I click"

**Cause**: JavaScript errors or API failures

**Solution**:

1. Open browser console (F12)
2. Look for red error messages
3. Check Network tab for failed API calls
4. Verify all environment variables are set
5. Check Vercel logs for server errors

### Issue: Auth redirect loops or "Invalid URL" errors

**Cause**: Incorrect Site URL or Redirect URLs in Supabase

**Solution**:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Verify Site URL matches your production domain exactly
3. Add all redirect URLs listed above
4. Redeploy application after changes

### Issue: "Database not found" or RLS policy errors

**Cause**: Migrations not applied or RLS policies missing

**Solution**:

1. Apply canonical migrations: `PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:migrate`
2. Verify RLS + triggers are applied (policies and triggers are included in `db:migrate`)
3. Verify tables exist in Supabase Dashboard

### Issue: Email features not working

**Cause**: Missing RESEND_API_KEY or incorrect configuration

**Solution**:

1. Verify RESEND_API_KEY is set in Vercel
2. Check Resend dashboard for API errors
3. Verify domain is verified in Resend
4. Check DNS records (SPF, DKIM, DMARC)

## 📊 Monitoring After Launch

### Daily Checks (First Week)

- [ ] Check Vercel logs for errors
- [ ] Monitor `/api/health` endpoint
- [ ] Check Supabase Dashboard → Reports for:
  - Database performance
  - Active connections
  - Query performance
  - Storage usage
- [ ] **Follow daily monitoring routine** (See `LAUNCH_RUNBOOK.md` Section 5.3)
  - Review Vercel Analytics (error rate, TTI)
  - Check new user signups and completion rate
  - Review support emails (hello@proofound.io)
  - Check in-app chat messages (Crisp)

### Weekly Checks

- [ ] Review error logs in Vercel
- [ ] Check database usage and performance
- [ ] Verify backups are running (Supabase)
- [ ] Test critical user flows
- [ ] **Weekly metrics review** (See `LAUNCH_RUNBOOK.md` Section 5.4)
  - TTFQI, retention, SUS score
  - Bug count by severity
  - Support email themes

## 🆘 Getting Help

If you encounter issues after deployment:

1. **Check `/api/health`** - Shows environment status
2. **Check Vercel logs** - Shows server-side errors
3. **Check browser console** - Shows client-side errors
4. **Review `PRODUCTION_ENV_CHECK.md`** - Detailed environment setup
5. **Check Supabase logs** - Database connection issues
6. **Review `LAUNCH_RUNBOOK.md`** - Comprehensive incident response procedures

### Additional Launch Resources

- **`MVP_LAUNCH_DECISIONS.md`** - Critical decisions for launch readiness
- **`LAUNCH_RUNBOOK.md`** - Complete operational playbook
- **`docs/API_REFERENCE.md`** - Metrics and admin endpoint documentation
- **`EMAIL_SUPPORT_SETUP.md`** - Email support configuration and templates
- **`SUPPORT.md`** - User-facing support documentation

## ✅ Deployment Complete

Once all items are checked:

- ✅ All environment variables set
- ✅ Database configured and migrated
- ✅ Auth flows tested
- ✅ Core features working
- ✅ No errors in logs
- ✅ `/api/health` returns "healthy"

**Your production deployment is ready! 🎉**

---

**Last Updated**: November 5, 2025
**Version**: 1.1

## 📋 MVP Launch Pre-Flight Checklist

Before launching Private Beta (Nov 15, 2025), complete these additional checks:

### Pre-Launch Documentation

- [ ] Review `MVP_LAUNCH_DECISIONS.md` - All 5 decisions finalized
- [ ] Review `LAUNCH_RUNBOOK.md` - Team is familiar with procedures
- [ ] Confirm on-call schedule (Yurii: Technical, Pavlo: Product)
- [ ] Test incident response workflow (Section 4 of runbook)

### Support Setup

- [ ] Email support configured (hello@proofound.io)
- [ ] Auto-responder active (see `EMAIL_SUPPORT_SETUP.md`)
- [ ] Email templates ready (password reset, bug acknowledgment, etc.)
- [ ] Support tracker spreadsheet created
- [ ] In-app chat widget tested (if `NEXT_PUBLIC_CRISP_WEBSITE_ID` set)

### Monitoring & Metrics

- [ ] Vercel Analytics Real User Monitoring enabled
- [ ] Admin metrics dashboard accessible (`/app/admin/metrics`)
- [ ] Test metrics API endpoint (`/api/metrics?metric=all`)
- [ ] Daily monitoring checklist printed/bookmarked
- [ ] Weekly metrics review meeting scheduled (Mondays 10 AM UTC)

### Backups & Recovery

- [ ] Database backup tested (restore from backup once)
- [ ] Rollback procedure documented and tested
- [ ] Recovery time objectives confirmed (RTO: 8 hours, RPO: 24 hours)

### Team Readiness

- [ ] Pavlo and Yurii have access to all systems (Vercel, Supabase, email)
- [ ] Emergency contact numbers shared
- [ ] Go/no-go decision made (Nov 15, 9 AM UTC)

**Launch Status:** [ ] Ready for Private Beta

---

**Last Updated**: November 5, 2025
**Version**: 1.1
