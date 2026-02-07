# Environment Variables Reference

Complete guide to all environment variables used in Proofound, including which features require which variables and how to configure them.

> **📍 PRODUCTION DOMAIN**
>
> Current production domain: **`https://proofound.io`**
>
> Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables to match your actual domain.
> Examples in this guide may use `proofound.com` for illustration purposes.

## Quick Reference

```env
# ============================================================================
# CRITICAL - Required for app to function
# ============================================================================
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_SITE_URL=https://proofound.io

# ============================================================================
# IMPORTANT - Required for specific features
# ============================================================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Proofound <no-reply@proofound.com>"
CRON_SECRET=your_secure_random_token_here
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_REDIRECT_URI=https://yourdomain.com/api/integrations/zoom/callback
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/integrations/google/callback
DIRECT_URL=postgresql://user:pass@host:5432/db  # Optional; Drizzle uses this, otherwise falls back to DATABASE_URL

# ============================================================================
# OPTIONAL - Enhance functionality
# ============================================================================
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production
MATCHING_FEATURE_ENABLED=true
NEXT_PUBLIC_WIREFRAME_MODE=false
RATE_LIMIT_WINDOW_SECONDS=60
RATE_LIMIT_MAX=30
```

---

## Critical Variables (🔴 Required)

These variables are **essential** - the application will not work properly without them.

### DATABASE_URL

**Purpose**: PostgreSQL database connection string

**Format**:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

**Used By**:

- Drizzle ORM for database queries
- All data persistence operations
- Schema migrations
- Drizzle migrations also accept `DIRECT_URL`; if set, it is preferred, otherwise `DATABASE_URL` is used.

**Where to Get It**:

- **Supabase**: Project Settings → Database → Connection string (URI)
- **Vercel Postgres**: Vercel Dashboard → Storage → Copy connection string
- **Other PostgreSQL**: Provided by your hosting service

**Validation**:

```typescript
// Check in src/db/index.ts
if (!DATABASE_URL && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production');
}
```

**Common Issues**:

- ❌ Missing `?sslmode=require` for SSL connections
- ❌ Wrong credentials (user/password)
- ❌ Incorrect port (should be 5432 for PostgreSQL)
- ❌ Network access not configured in database provider

---

### NEXT_PUBLIC_SUPABASE_URL

**Purpose**: Supabase project URL for client-side access

**Format**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

**Used By**:

- Supabase client initialization
- Authentication flows
- Real-time subscriptions
- Storage access

**Where to Get It**:

- Supabase Dashboard → Project Settings → API → Project URL

**Important**:

- ⚠️ Prefix `NEXT_PUBLIC_` makes it accessible in browser
- ✅ Safe to expose (designed to be public)

---

### NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose**: Supabase anonymous/public API key

**Format**:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Used By**:

- Client-side Supabase operations
- Authentication
- Row-level security enforcement
- Public data access

**Where to Get It**:

- Supabase Dashboard → Project Settings → API → `anon public` key

**Important**:

- ✅ Safe to expose (respects RLS policies)
- ✅ Has limited permissions by default
- ❌ Do NOT confuse with service role key

---

### SUPABASE_SERVICE_ROLE_KEY

**Purpose**: Supabase service role key for server-side admin operations

**Format**:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Used By**:

- Server-side API routes
- Admin operations
- Bypassing RLS policies
- Cron jobs

**Where to Get It**:

- Supabase Dashboard → Project Settings → API → `service_role` key

**Security**:

- ⚠️ **NEVER expose to client/browser**
- ⚠️ **Full database access** - bypasses all security
- ⚠️ Store in server environment variables only
- ⚠️ Rotate if compromised

---

### NEXT_PUBLIC_SITE_URL

**Purpose**: Your application's production URL

**Format**:

```env
NEXT_PUBLIC_SITE_URL=https://proofound.com
```

**Used By**:

- Email link generation
- OAuth redirects
- Cron job callbacks
- API endpoint construction

**Examples**:

- Production: `https://proofound.com`
- Staging: `https://staging.proofound.com`
- Vercel Preview: `https://proofound-git-branch.vercel.app`
- Local: `http://localhost:3000`

**Important**:

- ❌ No trailing slash: `https://proofound.com` ✅
- ❌ No trailing slash: `https://proofound.com/` ❌
- ✅ Include protocol (http/https)

---

## Important Variables (🟡 Required for Features)

These variables are needed for specific features to work properly.

### RESEND_API_KEY

**Purpose**: Resend transactional email service API key

**Format**:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Used By**:

- Email verification
- Password reset emails
- Organization invitations
- Skill verification requests
- Match notifications
- Account deletion notifications

**Where to Get It**:

1. Sign up at [resend.com](https://resend.com)
2. Create API key in dashboard
3. See [RESEND_SETUP.md](./RESEND_SETUP.md) for detailed guide

**Without This**:

- ❌ Users can't verify email addresses
- ❌ Password reset won't work
- ❌ No email notifications sent
- ⚠️ App still functions, but email features break

**Cost**: FREE (3,000 emails/month)

---

### EMAIL_FROM

**Purpose**: Sender email address for all outgoing emails

**Format**:

```env
EMAIL_FROM="Proofound <no-reply@proofound.com>"
```

**Format Rules**:

- Display Name + Email: `"Proofound <no-reply@domain.com>"` ✅
- Email only: `no-reply@domain.com` ✅
- Must be verified domain in Resend

**Default Value**:

```typescript
const fromEmail = process.env.EMAIL_FROM || 'Proofound <no-reply@proofound.com>';
```

**Important**:

- ✅ Use professional domain (not gmail/yahoo)
- ✅ Verify domain in Resend dashboard
- ✅ Configure SPF/DKIM records for deliverability

---

### CRON_SECRET

**Purpose**: Authentication token for scheduled task endpoints

**Format**:

```env
CRON_SECRET=K7x9mP2nQ4vL8wR6yT3zC5bN1aM0hF
```

**Used By**:

- `/api/cron/send-deletion-reminders`
- `/api/cron/process-deletions`
- `/api/cron/refresh-matches`

**How to Generate**:

```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# https://1password.com/password-generator/
```

**Without This**:

- ⚠️ Cron endpoints are **publicly accessible**
- ⚠️ Anyone can trigger expensive operations
- ⚠️ Security vulnerability - DOS risk

**Setup Guide**: See [CRON_SETUP.md](./CRON_SETUP.md)

---

### Zoom & Video OAuth

**Purpose**: Enable interview scheduling via Zoom (and Google as an alternative).

**Required Vars**:

- `ZOOM_CLIENT_ID` and `ZOOM_CLIENT_SECRET` — Zoom OAuth app credentials.
- `ZOOM_REDIRECT_URI` — Must match the redirect URL in your Zoom app (recommended: `https://yourdomain.com/api/integrations/zoom/callback`).
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` — Required if you enable the Google Meet branch.
- `GOOGLE_REDIRECT_URI` — Must match the redirect URL in your Google OAuth client (recommended: `https://yourdomain.com/api/integrations/google/callback`).
- `NEXT_PUBLIC_URL` (optional) — Base URL override used to build redirect URIs. If unset, routes fall back to the request origin.

**Used By**:

- `src/app/api/integrations/zoom/connect/route.ts`, `src/app/api/integrations/zoom/callback/route.ts`
- `src/app/api/integrations/google/connect/route.ts`, `src/app/api/integrations/google/callback/route.ts`
- `src/app/api/integrations/video/[provider]/auth/route.ts` (returns connect URLs)
- `src/lib/integrations/zoom.ts`, `src/lib/integrations/google-meet.ts`

**Without These**:

- ❌ OAuth URL generation fails for Zoom/Google.
- ❌ Users cannot connect their video provider for interviews.

**Setup**:

1. Create a Zoom OAuth app and copy the client ID/secret.
2. Set `ZOOM_REDIRECT_URI` to the callback route above and add the same URL in Zoom app settings.
3. (Optional) Set `NEXT_PUBLIC_URL` if your deployment needs an explicit base URL override.
4. (Optional) Set Google OAuth vars if you plan to enable Google Meet.

---

## Optional Variables (🟢 Enhance Functionality)

These variables are optional but recommended for production.

### NODE_ENV

**Purpose**: Specify runtime environment

**Format**:

```env
NODE_ENV=production
```

**Values**:

- `production` - Production deployment
- `development` - Local development
- `test` - Testing environment

**Used By**:

- Database connection validation
- Error handling behavior
- Logging levels
- Build optimizations

**Default**: Automatically set by hosting providers

---

### NEXT_PUBLIC_APP_ENV

**Purpose**: Application environment identifier

**Format**:

```env
NEXT_PUBLIC_APP_ENV=production
```

**Values**:

- `local` - Local development
- `development` - Development server
- `staging` - Staging environment
- `production` - Production

**Used By**:

- Feature flags
- Analytics tracking
- Debug mode toggles

---

### MATCHING_FEATURE_ENABLED

**Purpose**: Toggle matching system on/off

**Format**:

```env
MATCHING_FEATURE_ENABLED=true
```

**Values**:

- `true` - Matching system enabled
- `false` - Matching system disabled

**Used By**:

- Matching algorithm endpoints
- Profile matching UI
- Match notifications

**Default**: `true`

---

### NEXT_PUBLIC_WIREFRAME_MODE

**Purpose**: Enable wireframe/design mode

**Format**:

```env
NEXT_PUBLIC_WIREFRAME_MODE=false
```

**Values**:

- `true` - Show wireframe borders for development
- `false` - Normal production styling

**Default**: `false`

---

### RATE_LIMIT_WINDOW_SECONDS

**Purpose**: Rate limiting time window

**Format**:

```env
RATE_LIMIT_WINDOW_SECONDS=60
```

**Used By**:

- API rate limiting middleware
- Authentication endpoints
- Public API routes

**Default**: `60` (1 minute)

---

### RATE_LIMIT_MAX

**Purpose**: Maximum requests per time window

**Format**:

```env
RATE_LIMIT_MAX=30
```

**Used By**:

- API rate limiting middleware
- Prevents abuse

**Default**: `30` requests per minute

---

## How to Set Environment Variables

### Vercel (Production/Staging)

1. Go to Vercel Dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **"Add Variable"**
5. Enter name and value
6. Select environments (Production, Preview, Development)
7. Click **"Save"**
8. **Redeploy** for changes to take effect

**Tips**:

- Use different values for different environments
- Sensitive keys: Only set in Production
- Public keys: Set in all environments

---

### Local Development

**File**: `.env.local` (create in project root)

```env
# Copy from .env.example
# Add your local values

DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_...
EMAIL_FROM="Proofound <no-reply@proofound.com>"
CRON_SECRET=your_local_secret
```

**Important**:

- ✅ `.env.local` is git-ignored (never commit)
- ✅ Use `.env.example` as template
- ✅ Copy `.env.example` to `.env.local` to start

---

### GitHub Actions / CI

Add secrets in repository settings:

1. Go to repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add each environment variable
4. Reference in workflows: `${{ secrets.DATABASE_URL }}`

---

## Validation & Testing

### Check if Variables are Set

**Script**: `scripts/check-deploy-readiness.mjs`

```bash
npm run prebuild
```

**Output**:

```
✅ Deploy readiness: all required env vars present.
```

Or:

```
❌ Missing required environment variables:
   - DATABASE_URL
   - NEXT_PUBLIC_SUPABASE_URL
```

### Test Locally

```bash
# Start development server
npm run dev

# Check if variables are loaded
# In browser console:
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

# Server-side check (in API route):
console.log(process.env.DATABASE_URL);
```

### Verify in Deployment

1. Deploy to Vercel
2. Check **Deployment Logs**
3. Look for environment variable references
4. Test features that depend on specific variables

---

## Security Best Practices

### Never Commit Secrets

❌ **Never commit these to Git**:

```env
# Bad - in .env file committed to repo
DATABASE_URL=postgresql://user:password@host/db
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RESEND_API_KEY=re_xxx...
CRON_SECRET=secret123
```

✅ **Use .env.local (git-ignored)**:

```env
# Good - in .env.local (not committed)
DATABASE_URL=postgresql://...
```

---

### Public vs Private Variables

**Public (safe to expose)**:

- `NEXT_PUBLIC_*` prefix variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

**Private (server-only)**:

- `DATABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET`

---

### Rotate Keys Regularly

**Schedule**:

- Database passwords: Every 90 days
- API keys: Every 180 days
- CRON_SECRET: Every 180 days

**How to Rotate**:

1. Generate new key/password
2. Update in Vercel environment variables
3. Redeploy application
4. Remove old key from services
5. Update external services (cron-job.org)

---

## Troubleshooting

### "Missing required environment variables"

**Problem**: Build fails with missing variable error

**Solution**:

1. Check variable is set in Vercel
2. Check spelling matches exactly (case-sensitive)
3. Redeploy after adding variables
4. Verify in correct environment (Production/Preview)

---

### "Invalid API key"

**Problem**: Supabase/Resend API key errors

**Solution**:

1. Verify key is copied completely (no spaces)
2. Check key is not expired/revoked
3. Regenerate key in service dashboard
4. Update in Vercel environment variables

---

### "Cannot connect to database"

**Problem**: DATABASE_URL connection fails

**Solution**:

1. Verify connection string format
2. Check SSL mode: `?sslmode=require`
3. Verify IP allowlist in database provider
4. Test connection locally first
5. Check database is running/accessible

---

### Variables Not Loading

**Problem**: Environment variables undefined in code

**Solution**:

**Server-side variables**:

```typescript
// ✅ Works in API routes, server components
const dbUrl = process.env.DATABASE_URL;
```

**Client-side variables**:

```typescript
// ❌ Doesn't work (server-only variable)
const dbUrl = process.env.DATABASE_URL; // undefined

// ✅ Works (NEXT_PUBLIC prefix)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
```

---

## Feature → Variable Matrix

| Feature                 | Required Variables                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **Database**            | `DATABASE_URL`                                                                           |
| **Authentication**      | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Email Sending**       | `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_SITE_URL`                                   |
| **Cron Jobs**           | `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_SERVICE_ROLE_KEY`                       |
| **File Uploads**        | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                              |
| **Matching System**     | `DATABASE_URL`, `MATCHING_FEATURE_ENABLED` (optional)                                    |
| **Real-time Messaging** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`                              |

---

## Environment Variable Checklist

Use this checklist when setting up a new environment:

### Core Infrastructure

- [ ] `DATABASE_URL` - PostgreSQL connection
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Admin API key
- [ ] `NEXT_PUBLIC_SITE_URL` - Your domain URL

### Email & Notifications

- [ ] `RESEND_API_KEY` - Resend API key
- [ ] `EMAIL_FROM` - Sender email address
- [ ] Domain verified in Resend
- [ ] DNS records configured (SPF, DKIM)

### Scheduled Tasks

- [ ] `CRON_SECRET` - Cron authentication token
- [ ] Cron jobs configured in cron-job.org
- [ ] Cron endpoints tested

### Optional Configuration

- [ ] `NODE_ENV` - Environment identifier
- [ ] `NEXT_PUBLIC_APP_ENV` - App environment
- [ ] `MATCHING_FEATURE_ENABLED` - Toggle matching
- [ ] `RATE_LIMIT_WINDOW_SECONDS` - Rate limit window
- [ ] `RATE_LIMIT_MAX` - Rate limit max requests

---

## Additional Resources

- [Resend Setup Guide](./RESEND_SETUP.md)
- [Cron Job Setup Guide](./CRON_SETUP.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Support

If you need help with environment variables:

1. Check `.env.example` for reference
2. Review service-specific setup guides
3. Test locally before deploying
4. Check Vercel deployment logs
5. Contact support if issues persist
