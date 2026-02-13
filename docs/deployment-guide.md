# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Proofound application to production using Vercel, Supabase, and associated services.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Domain Configuration](#domain-configuration)
6. [Service Integration](#service-integration)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] GitHub repository with latest code
- [ ] Vercel account (free or pro tier)
- [ ] Supabase project (production database)
- [ ] Domain name (optional, for custom domain)
- [ ] Required API keys and secrets
- [ ] All tests passing locally

**Accounts Needed:**

- Vercel: https://vercel.com
- Supabase: https://supabase.com
- Sentry: https://sentry.io
- Resend: https://resend.com (for email)

---

## Environment Setup

### 1. Staging Environment (Recommended First)

Create a staging environment before production:

**Branch Strategy:**

```bash
# Create staging branch
git checkout -b staging
git push -u origin staging

# Production deploys from master
# Staging deploys from staging
```

### 2. Environment Variables

Create environment variable files for reference (DO NOT commit):

**`.env.example`** (commit this as template):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Email (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com

# Caching (Vercel KV)
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=proofound
SENTRY_AUTH_TOKEN=xxx

# Cron Jobs
CRON_SECRET=generate-random-secret-here

# Feature Flags
MATCHING_FEATURE_ENABLED=true

# Logging
LOG_LEVEL=info

# App Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com
```

**Security Note:** Never commit `.env.local` or `.env.production` files. Use Vercel's environment variable management.

---

## Database Setup

### 1. Create Production Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization
4. Enter project details:
   - **Name:** Proofound Production
   - **Database Password:** Generate strong password (save in password manager)
   - **Region:** Choose closest to your users
5. Click "Create new project"
6. Wait for provisioning (2-3 minutes)

### 2. Configure Database

**Get connection details:**

```
Project Settings → Database → Connection string
```

**Connection strings:**

- **Direct:** `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`
- **Pooler (Transaction):** `postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres`

**Use Transaction pooler** for Next.js (port 6543).

### 3. Run Database Migrations

Proofound uses canonical SQL migrations under `src/db/migrations/` and a migration runner:

- Canonical path: `src/db/migrations/*.sql` (enforced by CI drift checks)
- Runner: `npm run db:migrate` (runs `run-migrations.mjs`)

**Apply migrations:**

```bash
# Prefer DIRECT_URL (direct connection) for DDL where possible
PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:migrate
```

**Alternative: SQL Editor in Supabase:**

1. Go to Supabase dashboard → SQL Editor
2. Copy your schema from `src/db/schema.ts`
3. Convert to SQL and run manually
4. Verify all tables, indexes, RLS policies created

### 4. Seed Essential Data

**Expertise Taxonomy (Required):**

```bash
# Seed taxonomy data
PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:seed-taxonomy
```

**Demo Data (Optional for staging):**

```bash
# Only for staging environment
DATABASE_URL="your-staging-url" PATH=/opt/homebrew/opt/node@20/bin:$PATH npm run db:seed
```

### 5. Enable Row Level Security (RLS)

**Verify RLS policies:**

```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Should return 0 rows (all tables have RLS)
```

**Enable RLS on tables:**

```sql
-- If any tables missing RLS, enable it
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
-- ... etc for all tables
```

### 6. Configure Supabase Auth

**Email Templates:**

1. Go to Authentication → Email Templates
2. Customize templates:
   - Confirm signup
   - Magic link
   - Password reset
3. Update sender name: "Proofound"
4. Update email content with branding

**Auth Settings:**

1. Go to Authentication → Settings
2. Configure:
   - **Site URL:** `https://yourdomain.com`
   - **Redirect URLs:** `https://yourdomain.com/auth/callback`
   - **JWT expiry:** 3600 (1 hour)
   - **Refresh token rotation:** Enabled
   - **Password requirements:** Minimum 8 characters

**Email Provider:**

1. Go to Authentication → Settings → SMTP
2. Option 1: Use Supabase's email (limited, not recommended for production)
3. Option 2: Configure custom SMTP (e.g., Resend via SMTP)
   - **Host:** smtp.resend.com
   - **Port:** 465
   - **Username:** resend
   - **Password:** Your Resend API key

---

## Vercel Deployment

### 1. Connect GitHub Repository

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your Proofound repository
4. Click "Import"

### 2. Configure Project Settings

**Framework Preset:** Next.js (auto-detected)

**Build & Development Settings:**

- **Build Command:** `npm run build`
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

**Root Directory:** `.` (leave as root)

### 3. Add Environment Variables

**In Vercel project settings → Environment Variables:**

Add all variables from `.env.example`:

**For Production:**

1. Click "Add Environment Variable"
2. Select "Production" environment
3. Add each variable:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:6543/postgres
DIRECT_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=proofound
SENTRY_AUTH_TOKEN=xxx
CRON_SECRET=generate-random-secret-here
MATCHING_FEATURE_ENABLED=true
LOG_LEVEL=info
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com
```

**For Preview/Development:**
Repeat for Preview and Development environments (use staging database for preview).

**Important:** KV environment variables (KV_REST_API_URL, KV_REST_API_TOKEN) are auto-added when you create a Vercel KV database in the next step.

### 4. Enable Vercel KV (Caching)

**Create KV Database:**

1. In Vercel dashboard → Storage → Create Database
2. Select "KV" (Redis-compatible)
3. Enter database name: "proofound-cache"
4. Select region (same as your app)
5. Click "Create"
6. Connect to project:
   - Select your Proofound project
   - Click "Connect"
   - Environment variables automatically added

**Verify KV Connection:**

After deployment, check logs for:

```
{"level":"info","event":"cache.hit","key":"taxonomy:l1",...}
```

### 5. Deploy

**Initial Deployment:**

Click "Deploy" button in Vercel dashboard.

**Deployment from Git:**

Every push to `master` triggers production deployment.
Every push to `staging` triggers staging deployment.
Every PR creates a preview deployment.

**Monitor Deployment:**

1. View build logs in Vercel dashboard
2. Check for errors during build
3. Wait for deployment to complete (~2-3 minutes)

**Deployment URL:**

Vercel provides auto-generated URL:

```
https://proofound-xxx.vercel.app
```

---

## Domain Configuration

### 1. Add Custom Domain

**In Vercel:**

1. Go to Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `yourdomain.com`
4. Click "Add"

**DNS Configuration:**

Vercel provides DNS records to add:

**For root domain (yourdomain.com):**

- Type: A
- Name: @
- Value: 76.76.21.21

**For www subdomain (www.yourdomain.com):**

- Type: CNAME
- Name: www
- Value: cname.vercel-dns.com

**Add DNS records in your domain registrar:**

1. Go to your domain registrar (e.g., Namecheap, GoDaddy, Cloudflare)
2. Navigate to DNS settings
3. Add the A and CNAME records provided by Vercel
4. Save changes
5. Wait for DNS propagation (5 minutes to 48 hours, usually < 1 hour)

### 2. SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

**Verify SSL:**

1. Wait for DNS propagation
2. Check Vercel dashboard → Domains
3. Status should show "Valid Certificate"
4. Visit `https://yourdomain.com` to verify

**Force HTTPS:**
Vercel automatically redirects HTTP → HTTPS.

### 3. Domain Redirects (Optional)

**Redirect www to root (or vice versa):**

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.yourdomain.com',
          },
        ],
        destination: 'https://yourdomain.com/:path*',
        permanent: true,
      },
    ];
  },
};
```

---

## Service Integration

### 1. Sentry Setup

**Create Sentry Project:**

1. Go to https://sentry.io
2. Click "Create Project"
3. Select "Next.js"
4. Enter project name: "proofound"
5. Copy DSN

**Add to Vercel Environment Variables:**

```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=proofound
SENTRY_AUTH_TOKEN=xxx
```

**Verify Integration:**

1. Deploy with Sentry configured
2. Trigger a test error (temporarily):
   ```typescript
   throw new Error('Test Sentry integration');
   ```
3. Check Sentry dashboard for error
4. Remove test error

**Configure Alerts:**

1. Go to Sentry → Alerts
2. Create alert rule:
   - **Condition:** Error rate > 10 per minute
   - **Action:** Email team
3. Save alert

### 2. Email (Resend) Setup

**Get API Key:**

1. Go to https://resend.com
2. Sign up / log in
3. Navigate to API Keys
4. Click "Create API Key"
5. Copy key

**Add Domain:**

1. Go to Domains → Add Domain
2. Enter your domain: `yourdomain.com`
3. Add DNS records (TXT, CNAME) to your domain registrar
4. Verify domain

**Add to Vercel:**

```
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
```

**Test Email:**

```typescript
// Test endpoint: /api/test/email
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: process.env.EMAIL_FROM!,
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<p>Test email from Proofound</p>',
});
```

### 3. Cron Jobs (Vercel Cron)

**Configure in vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-sessions",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-digest-emails",
      "schedule": "0 9 * * 1"
    }
  ]
}
```

**Protect Cron Endpoints:**

```typescript
// /api/cron/cleanup-expired-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Perform cleanup
  // ...

  return NextResponse.json({ success: true });
}
```

**Verify Cron Jobs:**

1. Deploy with cron configuration
2. Go to Vercel dashboard → Cron Jobs
3. Verify jobs are scheduled
4. Check logs after scheduled run

---

## Post-Deployment Verification

### 1. Smoke Tests

**Test critical flows:**

- [ ] Homepage loads (`https://yourdomain.com`)
- [ ] Sign up new user
- [ ] Log in existing user
- [ ] View profile
- [ ] Navigate app (matching, messaging)
- [ ] Test assignment creation (organization)
- [ ] Test matching (individual)

**Check for errors:**

- [ ] No console errors in browser
- [ ] No 500 errors in Vercel logs
- [ ] No errors in Sentry dashboard

### 2. Monitor Logs

**Vercel Logs:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# View logs
vercel logs --follow
```

**Check for:**

- Structured logs appearing
- No error logs
- Request IDs present
- User IDs present (after auth)

**Example good log:**

```json
{
  "level": "info",
  "event": "match.profile.computed",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "requestId": "abc123xyz789",
  "userId": "user-uuid-123",
  "poolSize": 50,
  "resultCount": 10,
  "durationMs": 145
}
```

### 3. Check Monitoring Services

**Sentry:**

- [ ] No errors in dashboard
- [ ] Performance monitoring working
- [ ] Alerts configured

**Vercel Analytics:**

- [ ] Web Vitals being tracked
- [ ] Page views recording
- [ ] No anomalies

### 4. Database Health

**Check connections:**

1. Go to Supabase dashboard → Database → Connection pooling
2. Verify connections < 50 (transaction pooler)
3. Check for connection errors in logs

**Check query performance:**

1. Go to Supabase dashboard → Database → Query performance
2. Review slow queries (> 100ms)
3. Verify indexes are being used

### 5. Performance Verification

**Run Lighthouse:**

```bash
lighthouse https://yourdomain.com \
  --output html \
  --output-path ./lighthouse-production.html \
  --view
```

**Target scores:**

- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

**Check Core Web Vitals:**

- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

---

## Rollback Procedures

### 1. Instant Rollback (Vercel)

**Rollback to previous deployment:**

1. Go to Vercel dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu
4. Select "Promote to Production"
5. Confirm rollback

**CLI Rollback:**

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

### 2. Database Rollback

**Restore from backup:**

1. Go to Supabase dashboard → Database → Backups
2. Select backup before deployment
3. Click "Restore"
4. Confirm restore

**Note:** This overwrites current database. Use with caution.

**Manual Migration Rollback:**

```bash
# If using migration files, rollback specific migration
npm run db:rollback

# Or manually in SQL Editor
DROP TABLE new_table;
-- Revert schema changes
```

### 3. DNS Rollback (if needed)

1. Update DNS records to point to old deployment
2. Wait for DNS propagation
3. Verify old site is live

---

## Troubleshooting

### Build Failures

**TypeScript Errors:**

```bash
# Run typecheck locally
npm run typecheck

# Fix errors before deploying
```

**Missing Environment Variables:**

Check Vercel build logs for:

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

Add missing variables in Vercel dashboard.

**Dependency Issues:**

```bash
# Clear lock file and reinstall
rm package-lock.json
npm install

# Or use Yarn if that's your lock file
rm yarn.lock
yarn install

# Commit updated lock file
git add package-lock.json
git commit -m "Update dependencies"
git push
```

### Runtime Errors

**Database Connection Errors:**

```
Error: connect ETIMEDOUT
```

**Fixes:**

- Verify DATABASE_URL is correct
- Check DATABASE_URL uses port 6543 (pooler)
- Verify IP allowlist in Supabase (should allow all for Vercel)
- Check connection pooler is enabled

**Authentication Errors:**

```
Error: Invalid JWT
```

**Fixes:**

- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check Supabase project URL matches
- Verify Auth settings in Supabase dashboard

**Cache Connection Errors:**

```
Error: KV connection failed
```

**Fixes:**

- Verify Vercel KV is created and connected
- Check KV_REST_API_URL and KV_REST_API_TOKEN are set
- Ensure KV database is in same region as app

### Performance Issues

**Slow Response Times:**

1. Check Vercel Analytics for slow endpoints
2. Review Sentry performance monitoring
3. Check database query performance in Supabase
4. Verify caching is working (cache hit rate > 70%)

**High Memory Usage:**

1. Check Vercel logs for memory warnings
2. Review function execution times
3. Consider upgrading Vercel plan (if needed)

**Database Connection Pool Exhausted:**

```
Error: sorry, too many clients already
```

**Fixes:**

- Use transaction pooler (port 6543)
- Close connections properly in code
- Check for connection leaks

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass locally (`npm test`, `npm run test:e2e`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Supabase production project created
- [ ] Domain DNS configured (if using custom domain)
- [ ] API keys obtained (Sentry, Resend)

### Deployment

- [ ] Connect GitHub to Vercel
- [ ] Configure build settings
- [ ] Add all environment variables
- [ ] Create Vercel KV database
- [ ] Run database migrations
- [ ] Seed essential data (taxonomy)
- [ ] Deploy to production
- [ ] Configure custom domain
- [ ] Verify SSL certificate

### Post-Deployment

- [ ] Run smoke tests
- [ ] Monitor logs for errors
- [ ] Verify Sentry integration
- [ ] Check Vercel Analytics
- [ ] Test email delivery
- [ ] Verify caching working
- [ ] Run Lighthouse performance test
- [ ] Check database connections
- [ ] Verify cron jobs scheduled
- [ ] Document deployment date and version

### Rollback Plan

- [ ] Know how to rollback via Vercel dashboard
- [ ] Have database backup available
- [ ] Documented previous deployment URL
- [ ] Team notified of deployment
- [ ] On-call person available for issues

---

## Deployment Timeline

**Estimated Duration:** 2-4 hours (first deployment)

1. **Setup (30-60 min):**
   - Create Supabase project
   - Configure database
   - Obtain API keys

2. **Deployment (30-60 min):**
   - Connect Vercel
   - Configure environment variables
   - Initial deployment

3. **Domain Setup (15-30 min + DNS propagation):**
   - Configure custom domain
   - Update DNS records
   - Wait for SSL provisioning

4. **Verification (30-60 min):**
   - Smoke tests
   - Monitor logs
   - Performance tests
   - Document issues

---

## Next Steps After Deployment

1. **Monitor First 24 Hours:**
   - Check error rates
   - Monitor performance metrics
   - Review user feedback
   - Watch database load

2. **Set Up Alerts:**
   - Sentry error alerts
   - Vercel deployment notifications
   - Database performance alerts
   - Uptime monitoring

3. **Documentation:**
   - Update team on deployment
   - Document any issues encountered
   - Create runbook for common issues
   - Schedule post-deployment review

4. **Optimization:**
   - Review Lighthouse suggestions
   - Optimize slow queries
   - Adjust cache TTLs based on usage
   - Fine-tune Sentry sampling rates

---

## Support Contacts

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/docs
- **Sentry Support:** https://sentry.io/support
- **Resend Support:** https://resend.com/docs

---

**Last Updated:** 2025-11-03
