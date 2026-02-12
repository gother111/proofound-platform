# Deployment Checklist

Complete pre-deployment and post-deployment checklist for Proofound. Follow this guide to ensure a smooth deployment with all features working correctly.

## Pre-Deployment Checklist

### 1. Environment Variables ✅

Verify all required environment variables are set:

#### Critical (Must Have)

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
- [ ] `NEXT_PUBLIC_SITE_URL` - Your production URL

#### Email Features

- [x] `RESEND_API_KEY` - Resend API key configured ✅
- [x] `EMAIL_FROM` - Sender email address configured ✅
- [x] API key added to Vercel and .env.local ✅
- [ ] Resend domain verified (optional - can use Resend's domain for now)
- [ ] DNS records configured (optional - SPF, DKIM, DMARC)

**Test email setup**: `node scripts/test-email.mjs your-email@example.com`

See [RESEND_SETUP.md](./RESEND_SETUP.md) for testing and domain verification.

#### Cron Jobs

- [x] `CRON_SECRET` - Generated secure token ✅
- [x] Cron jobs configured in cron-job.org ✅
  - [x] Send Deletion Reminders (1:00 AM UTC daily)
  - [x] Process Deletions (2:00 AM UTC daily)
  - [x] Refresh Matches (2:00 AM UTC daily)
- [x] Production URLs configured: `https://proofound.io/api/cron/*` ✅

See [CRON_SETUP.md](./CRON_SETUP.md) for verification and monitoring.

**Verification**:

```bash
# Run locally to check
npm run prebuild

# Expected output:
# ✅ Deploy readiness: all required env vars present.
```

---

### 2. Database Setup ✅

Ensure your database is properly configured:

#### Supabase Database

- [ ] Supabase project created
- [ ] All migrations applied
- [ ] Row-Level Security (RLS) policies enabled
- [ ] Database tables verified
- [ ] Required indexes created

#### Storage Buckets

- [ ] Run `supabase/storage-setup.sql` in Supabase SQL Editor
- [ ] Verify buckets created:
  - `avatars` (public)
  - `covers` (public)
  - `documents` (private)
- [ ] RLS policies applied to storage

#### Database Functions

- [ ] `anonymize_user_account()` function exists (GDPR deletions)
- [ ] `get_moderation_stats()` function exists (admin moderation)
- [ ] Any custom functions from migrations

**Verification**:

```sql
-- In Supabase SQL Editor:
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check if storage buckets exist
SELECT * FROM storage.buckets;

-- Check if functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
```

---

### 3. Code Quality ✅

Run all checks before deploying:

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Check TypeScript types
npm run type-check  # or npx tsc --noEmit

# Run tests (if available)
npm test

# Build locally to catch errors
npm run build
```

**Expected Output**:

```
✓ Linting and checking validity of types
✓ Compiled successfully
```

---

### 4. Git Repository ✅

Ensure code is properly committed and pushed:

- [ ] All changes committed to Git
- [ ] Working on correct branch
- [ ] Pushed to GitHub/remote
- [ ] No uncommitted sensitive files (.env, secrets)
- [ ] `.gitignore` properly configured

```bash
# Check status
git status

# Should see:
# nothing to commit, working tree clean

# Verify remote
git remote -v

# Push if needed
git push origin main
```

---

### 5. Vercel Configuration ✅

#### Project Settings

- [ ] Project connected to Git repository
- [ ] Correct branch selected for production (usually `main` or `master`)
- [ ] Build settings configured:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

#### Environment Variables in Vercel

- [ ] All variables added to Vercel dashboard
- [ ] Correct environments selected (Production/Preview/Development)
- [ ] No typos in variable names (case-sensitive)
- [ ] Values copied correctly (no extra spaces)

#### Domain Configuration (if custom domain)

- [ ] Custom domain added in Vercel
- [ ] DNS records configured
- [ ] SSL certificate provisioned
- [ ] `NEXT_PUBLIC_SITE_URL` matches domain

---

## Deployment Steps

### Step 1: Deploy to Vercel

**If using Vercel CLI:**

```bash
vercel --prod
```

**If using Git integration:**

1. Push to main branch
2. Vercel auto-deploys
3. Monitor deployment in dashboard

---

### Step 2: Monitor Deployment

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Watch build logs in real-time
3. Look for errors or warnings
4. Wait for "Deployment Complete" status

**Common Build Errors**:

- Missing environment variables
- TypeScript type errors
- Import errors
- Database connection issues

---

### Step 3: Verify Deployment URL

Once deployed, Vercel provides a URL:

**Production**: `https://proofound.io` or `https://your-project.vercel.app`

Test the URL:

```bash
curl https://your-domain.vercel.app
# Should return 200 OK
```

---

## Post-Deployment Checklist

### 1. Basic Functionality ✅

Test core features immediately after deployment:

#### Home Page & Navigation

- [ ] Home page loads without errors
- [ ] Navigation menu works
- [ ] All static pages load
- [ ] No console errors in browser

#### Authentication Flow

- [ ] Sign up page loads
- [ ] Can create new account
- [ ] Verification email sent (check Resend logs)
- [ ] Email verification link works
- [ ] Can log in
- [ ] Can log out
- [ ] Password reset flow works

#### Database Connection

- [ ] User profiles load
- [ ] Data persists after page refresh
- [ ] No "database connection" errors in logs

---

### 2. Email Functionality ✅

Test all email features:

#### Resend Dashboard

- [ ] Go to [Resend Logs](https://resend.com/logs)
- [ ] Verify emails are being sent
- [ ] Check delivery status (Delivered/Bounced)
- [ ] No API errors

#### Test Each Email Type

1. **Verification Email**:
   - [ ] Sign up with new account
   - [ ] Check inbox for verification email
   - [ ] Click verification link
   - [ ] Account verified successfully

2. **Password Reset**:
   - [ ] Click "Forgot Password"
   - [ ] Enter email
   - [ ] Receive reset email
   - [ ] Reset link works

3. **Organization Invite** (if applicable):
   - [ ] Create organization
   - [ ] Invite team member
   - [ ] Invitation email sent
   - [ ] Invite link works

---

### 3. Cron Jobs ✅ COMPLETED

All 3 cron jobs are configured and active in cron-job.org.

#### cron-job.org Dashboard - Verification

- [x] All 3 cron jobs created ✅
  - [x] Proofound - Send Deletion Reminders
  - [x] Proofound - Process Deletions
  - [x] Proofound - Refresh Matches
- [x] Correct URLs configured (`https://proofound.io/api/cron/*`) ✅
- [x] Authorization headers set ✅
- [x] Jobs enabled (not paused) ✅

**Status**: Next execution scheduled for tomorrow

#### Test Cron Endpoints

```bash
# Test each endpoint with curl (use your CRON_SECRET from Vercel):

# 1. Deletion Reminders
curl -X GET https://proofound.io/api/cron/send-deletion-reminders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected: {"success": true, ...}

# 2. Process Deletions
curl -X GET https://proofound.io/api/cron/process-deletions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected: {"success": true, ...}

# 3. Refresh Matches
curl -X GET https://proofound.io/api/cron/refresh-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Expected: {"success": true, ...}
```

**Recommended**: Use the "Execute now" button in cron-job.org dashboard to test each job.

#### Verify in Vercel Logs

- [ ] Go to Vercel → Logs
- [ ] Filter by `/api/cron/`
- [ ] Should see successful cron executions
- [ ] No 401 Unauthorized errors

---

### 4. File Uploads ✅

Test storage functionality:

#### Profile Avatar Upload

- [ ] Go to profile settings
- [ ] Upload avatar image
- [ ] Image appears immediately
- [ ] Image persists after page refresh
- [ ] Check Supabase Storage → `avatars` bucket

#### Document Upload (if applicable)

- [ ] Upload document/proof
- [ ] File stored in Supabase Storage
- [ ] File accessible with correct permissions

---

### 5. Feature-Specific Tests ✅

#### Matching System

- [ ] Complete profile information
- [ ] Run matching algorithm
- [ ] View match results
- [ ] Match scores displayed
- [ ] Can interact with matches

#### Messaging System

- [ ] Can send messages
- [ ] Messages appear in real-time
- [ ] Read receipts work
- [ ] Typing indicators show
- [ ] Connection status indicator works

#### Admin Dashboard (if admin)

- [ ] Can access admin panel
- [ ] User verification queue loads
- [ ] Can approve/reject verifications
- [ ] Moderation queue works
- [ ] Admin actions logged

---

### 6. Performance Monitoring ✅

#### Vercel Analytics

- [ ] Enable Vercel Analytics (if available)
- [ ] Monitor page load times
- [ ] Check Core Web Vitals
- [ ] Identify slow pages

#### Vercel Logs

- [ ] Monitor function execution times
- [ ] Check for timeout errors
- [ ] Look for database connection issues
- [ ] Monitor error rates

#### Supabase Monitoring

- [ ] Check database usage
- [ ] Monitor connection pool
- [ ] Check storage usage
- [ ] Review API request counts

---

### 7. Security Verification ✅

#### Environment Variables

- [ ] No secrets in client-side code
- [ ] No secrets in Git repository
- [ ] All `NEXT_PUBLIC_*` variables are intentionally public
- [ ] Service role key not exposed to browser

#### API Endpoints

- [ ] Authentication required where needed
- [ ] Cron endpoints protected with `CRON_SECRET`
- [ ] Admin endpoints require admin role
- [ ] Rate limiting working (if enabled)

#### Database Security

- [ ] RLS policies enabled on all tables
- [ ] Users can only access own data
- [ ] Admin queries use service role appropriately
- [ ] No direct database access from client

---

## Troubleshooting Common Issues

### Build Fails

**Symptom**: Deployment fails during build

**Check**:

1. Review build logs in Vercel
2. Look for TypeScript errors
3. Check for missing environment variables
4. Verify dependencies installed correctly

**Solution**:

```bash
# Test build locally first
npm run build

# Fix errors locally, commit, push
```

---

### "Internal Server Error" on Pages

**Symptom**: 500 errors when accessing pages

**Check**:

1. Vercel → Logs → Filter by error status
2. Look for specific error messages
3. Check database connection
4. Verify environment variables

**Common Causes**:

- Missing `DATABASE_URL`
- Invalid Supabase keys
- Database connection timeout
- Missing database tables/functions

---

### Emails Not Sending

**Symptom**: Users not receiving emails

**Check**:

1. Resend Dashboard → Logs
2. Look for failed sends
3. Check domain verification status
4. Verify `RESEND_API_KEY` is set

**Solution**: See [RESEND_SETUP.md](./RESEND_SETUP.md) troubleshooting section

---

### Cron Jobs Not Running

**Symptom**: Scheduled tasks not executing

**Check**:

1. cron-job.org dashboard → Job status
2. Verify jobs are enabled
3. Check Authorization header
4. Test endpoint manually with curl

**Solution**: See [CRON_SETUP.md](./CRON_SETUP.md) troubleshooting section

---

### Images/Files Not Loading

**Symptom**: Uploaded files return 404 or 403

**Check**:

1. Supabase Storage → Check bucket exists
2. Verify RLS policies applied
3. Check file permissions
4. Verify Supabase keys are correct

**Solution**:

```bash
# Run storage setup SQL
# In Supabase SQL Editor:
# Copy contents of supabase/storage-setup.sql
# Execute
```

---

## Rollback Plan

If deployment has critical issues:

### Option 1: Revert to Previous Deployment

1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click **"..."** → **"Promote to Production"**
4. Previous version becomes production

### Option 2: Fix Forward

1. Identify issue in logs
2. Fix locally
3. Commit and push
4. New deployment auto-starts

### Option 3: Pause Traffic

If critical security issue:

1. Vercel Dashboard → Settings → **Domains**
2. Temporarily remove domain
3. Fix issue
4. Re-add domain when fixed

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Check Vercel error logs
- [ ] Monitor Resend email delivery rate
- [ ] Verify cron jobs executed successfully

### Weekly Checks

- [ ] Review Supabase usage/quota
- [ ] Check Resend email quota
- [ ] Monitor Vercel function usage
- [ ] Review performance metrics

### Monthly Checks

- [ ] Review and rotate API keys (if security policy)
- [ ] Check for Next.js/dependency updates
- [ ] Review and optimize database queries
- [ ] Analyze user feedback and errors

---

## Success Criteria

Your deployment is successful when:

✅ Build completes without errors
✅ Application loads at production URL
✅ Users can sign up and log in
✅ Emails are being sent and delivered
✅ Database queries work correctly
✅ File uploads function properly
✅ Cron jobs execute on schedule
✅ No critical errors in logs
✅ Performance is acceptable (< 3s page loads)

---

## Post-Launch Tasks

After successful deployment:

### Immediate (First 24 Hours)

- [ ] Monitor error rates closely
- [ ] Test all critical user flows
- [ ] Check email deliverability
- [ ] Verify cron jobs ran successfully
- [ ] Review Vercel function logs

### Week 1

- [ ] Gather user feedback
- [ ] Fix any reported bugs
- [ ] Optimize slow queries
- [ ] Monitor resource usage
- [ ] Update documentation if needed

### Month 1

- [ ] Review analytics and usage patterns
- [ ] Optimize performance bottlenecks
- [ ] Consider scaling database/services
- [ ] Plan feature improvements
- [ ] Review security practices

---

## Resources

- [Environment Variables Guide](./ENV_VARIABLES.md)
- [Resend Setup Guide](./RESEND_SETUP.md)
- [Cron Job Setup Guide](./CRON_SETUP.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Support

If you encounter issues not covered in this guide:

1. Check Vercel deployment logs
2. Review service-specific guides (Resend, Supabase)
3. Search GitHub Issues
4. Contact support team

---

## Quick Command Reference

```bash
# Pre-deployment
npm install
npm run lint
npm run build
npm run prebuild  # Check env vars

# Deployment
git push origin main  # Auto-deploys on Vercel

# Or manual:
vercel --prod

# Testing
curl https://your-domain.vercel.app
curl https://your-domain.vercel.app/api/health  # Health check

# Cron endpoint testing
curl -X GET https://your-domain.vercel.app/api/cron/refresh-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

**Last Updated**: 2025-01-30

**Deployment Time Estimate**: 30-45 minutes (first time)

**Maintenance Time**: 1-2 hours/week
