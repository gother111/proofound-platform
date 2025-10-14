# Proofound - Deployment Guide

## 🚀 Deploy to proofound.io

### Prerequisites Checklist

Before deploying, you need:

- ✅ GitHub repository (code is ready)
- ⏳ Supabase project (will set up)
- ⏳ Resend account (will set up)
- ✅ Cloudflare domain: `proofound.io`
- ⏳ Vercel account (will deploy)

---

## Step 1: Set Up Supabase Database (10 minutes)

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: `Proofound Production`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `eu-west-1` for Europe)
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### 1.2 Get API Keys

Once project is ready:

1. Go to **Settings → API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGc...
   service_role key: eyJhbGc... (keep secret!)
   ```

### 1.3 Get Database URL

1. Go to **Settings → Database**
2. Scroll to **Connection string**
3. Select **URI** mode
4. Copy the connection string:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password

### 1.4 Run Database Migrations

1. In **SQL Editor** (left sidebar), click **"New query"**

2. **Paste and run** `src/db/policies.sql`:

   ```sql
   -- Copy entire contents of src/db/policies.sql
   ```

3. Create another query and **paste/run** `src/db/triggers.sql`:

   ```sql
   -- Copy entire contents of src/db/triggers.sql
   ```

4. Run Drizzle migrations (we'll do this locally first):
   ```bash
   # In your terminal
   npm run db:migrate
   ```

### 1.5 Enable Email Auth

1. Go to **Authentication → Providers**
2. Make sure **Email** is enabled
3. Configure email templates:
   - Go to **Authentication → Email Templates**
   - Customize if needed (or use defaults for now)

---

## Step 2: Set Up Resend for Emails (5 minutes)

### 2.1 Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email

### 2.2 Add Your Domain

1. Go to **Domains** in Resend dashboard
2. Click **"Add Domain"**
3. Enter: `proofound.io`
4. Resend will show DNS records you need to add

### 2.3 Configure DNS in Cloudflare

1. Go to your Cloudflare dashboard
2. Select `proofound.io` domain
3. Go to **DNS → Records**
4. Add the records Resend provides (typically):
   - **TXT** record for domain verification
   - **CNAME** records for email sending
   - **DKIM** records for authentication

Example records (your values will differ):

```
Type: TXT
Name: @
Content: resend-domain-verification=xxxxx

Type: CNAME
Name: resend._domainkey
Content: resend._domainkey.resend.com
```

5. Wait 5-10 minutes for DNS propagation
6. Go back to Resend and click **"Verify Domain"**

### 2.4 Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **"Create API Key"**
3. Name it: `Proofound Production`
4. Copy the key (starts with `re_...`)
5. **Save it** - you won't see it again!

---

## Step 3: Deploy to Vercel (10 minutes)

### 3.1 Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit - Proofound MVP"

# Create GitHub repo and push
gh repo create proofound-platform --private --source=. --remote=origin --push
# OR manually create repo on github.com and:
git remote add origin https://github.com/YOUR_USERNAME/proofound-platform.git
git push -u origin main
```

### 3.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New... → Project"**
3. Import your GitHub repository: `proofound-platform`
4. Configure:
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

### 3.3 Set Environment Variables

Click **"Environment Variables"** and add:

```env
# Site
NEXT_PUBLIC_SITE_URL=https://proofound.io
NEXT_PUBLIC_APP_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres.xxxxx:...

# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=Proofound <no-reply@proofound.io>
```

**Important**: Apply to **Production**, **Preview**, and **Development** environments

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://proofound-platform.vercel.app`

### 3.5 Test Vercel URL

1. Visit your Vercel URL
2. You should see the landing page
3. Try signing up → should work!

---

## Step 4: Connect Custom Domain (5 minutes)

### 4.1 Add Domain in Vercel

1. In Vercel project, go to **Settings → Domains**
2. Click **"Add"**
3. Enter: `proofound.io`
4. Click **"Add"**
5. Vercel will show you DNS records to add

### 4.2 Configure DNS in Cloudflare

1. Go to Cloudflare dashboard → `proofound.io` → **DNS**
2. Add/update these records:

**For apex domain (proofound.io):**

```
Type: A
Name: @
Content: 76.76.21.21 (Vercel IP)
Proxy: DNS only (gray cloud)
```

**For www subdomain:**

```
Type: CNAME
Name: www
Content: cname.vercel-dns.com
Proxy: DNS only (gray cloud)
```

**Important**: Turn OFF Cloudflare proxy (gray cloud, not orange) initially for easier setup.

3. Save records

### 4.3 Verify Domain

1. Go back to Vercel → **Domains**
2. Wait 1-2 minutes for DNS propagation
3. Vercel will automatically verify and issue SSL certificate
4. You'll see ✅ next to `proofound.io`

### 4.4 Redirect www to root (Optional)

In Vercel:

1. Go to **Settings → Domains**
2. Set `proofound.io` as primary
3. Enable redirect from `www.proofound.io` → `proofound.io`

---

## Step 5: Configure Supabase Redirects

### 5.1 Update Auth URLs

1. In Supabase project, go to **Authentication → URL Configuration**
2. Set:
   - **Site URL**: `https://proofound.io`
   - **Redirect URLs**: Add:
     - `https://proofound.io/auth/callback`
     - `https://proofound.io/reset-password/confirm`
     - `https://proofound.io/verify-email`

This ensures email links redirect to your domain.

---

## Step 6: Test Everything! 🎉

### 6.1 Test Landing Page

1. Visit: `https://proofound.io`
2. Should see landing page
3. Should load quickly with no errors

### 6.2 Test Signup Flow

1. Click **"Sign up"**
2. Enter email and password
3. Check inbox for verification email
4. Click link → should redirect to onboarding
5. Complete onboarding → should land in app

### 6.3 Test Password Reset

1. Go to login page
2. Click **"Forgot password?"**
3. Enter email
4. Check inbox for reset link
5. Click link → set new password
6. Should redirect to login

### 6.4 Test Organization Flow

1. Sign up as new user
2. Choose **"Organization"** in onboarding
3. Create organization
4. Invite a team member
5. Check invitee's email
6. Accept invitation → should join org

---

## Troubleshooting

### Build Fails on Vercel

**Error**: `DATABASE_URL not set`

- ✅ Already fixed! Build works without DB at build time

**Error**: ESLint warnings

```bash
# Locally, fix any warnings:
npm run lint
# Commit and push
```

### Domain Not Working

**Error**: `ERR_NAME_NOT_RESOLVED`

- Wait 5-10 minutes for DNS propagation
- Check DNS records are correct in Cloudflare
- Try `dig proofound.io` or use [dnschecker.org](https://dnschecker.org)

**Error**: SSL certificate issues

- Vercel auto-issues certificates via Let's Encrypt
- Can take up to 10 minutes
- If stuck, remove and re-add domain in Vercel

### Email Not Sending

**Error**: Emails not arriving

- Check Resend dashboard for delivery logs
- Verify domain is verified in Resend
- Check spam folder
- Make sure `EMAIL_FROM` uses verified domain

**Error**: Domain verification failed

- DNS records must propagate (5-10 minutes)
- TXT record must be exact match
- CNAME records must point to Resend

### Auth Not Working

**Error**: Redirect loop or "Session expired"

- Check `NEXT_PUBLIC_SITE_URL` matches actual domain
- Update Supabase redirect URLs
- Clear browser cookies

---

## Post-Deployment Checklist

After successful deployment:

- [ ] Landing page loads on `https://proofound.io`
- [ ] SSL certificate is active (🔒 in browser)
- [ ] Can sign up new account
- [ ] Receive verification email
- [ ] Can complete onboarding
- [ ] Can log in/log out
- [ ] Can reset password
- [ ] Can create organization
- [ ] Can invite team members
- [ ] Emails arrive with `@proofound.io` sender
- [ ] Mobile responsive (test on phone)
- [ ] No console errors in browser

---

## Optional: Enable Cloudflare Proxy

After everything works:

1. Go to Cloudflare → DNS
2. Click on A record for `@`
3. Enable proxy (orange cloud ☁️)
4. Benefits:
   - DDoS protection
   - CDN caching
   - Analytics

**Note**: Test thoroughly after enabling!

---

## Quick Commands Reference

```bash
# Local development
npm run dev

# Run migrations
npm run db:migrate

# Open database viewer
npm run db:studio

# Build for production
npm run build

# Check for errors
npm run lint
npm run typecheck

# Test locally
npm run test
```

---

## Environment Variables Summary

### Required for Production

```env
NEXT_PUBLIC_SITE_URL=https://proofound.io
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
RESEND_API_KEY=
EMAIL_FROM=Proofound <no-reply@proofound.io>
```

### Optional

```env
VERCEL_URL=                    # Auto-populated by Vercel
NEXT_PUBLIC_VERCEL_ENV=        # Auto-populated
```

---

## Support Links

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs
- **Cloudflare DNS**: https://dash.cloudflare.com

---

## Estimated Timeline

- **Supabase setup**: 10 minutes
- **Resend setup**: 10 minutes (inc. DNS)
- **Vercel deployment**: 5 minutes
- **Domain connection**: 5 minutes
- **Testing**: 10 minutes

**Total**: ~40 minutes to live! 🚀

---

## What's Live

Once deployed, users can:

✅ Visit landing page
✅ Sign up with email/password
✅ Verify email
✅ Complete onboarding (Individual or Organization)
✅ Edit their profile
✅ Create organizations
✅ Invite team members
✅ Accept invitations
✅ Manage organization members
✅ View audit logs
✅ Reset forgotten passwords
✅ Access error pages (404, etc.)

---

## Next Steps After Deployment

1. **Monitor**: Check Vercel Analytics for traffic
2. **Test**: Try all flows on production
3. **Iterate**: Polish landing page content
4. **Share**: Send link to early users! 🎉

---

**Need help?** The build is solid and ready to deploy! 🚀

## Required environment variables
- `NEXT_PUBLIC_SUPABASE_URL` **or** `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` **or** `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` *(or `SITE_URL` if you prefer a private env var)*
- `DATABASE_URL`
- (Optional) `SUPABASE_SERVICE_ROLE_KEY` for background jobs

## Supabase Auth URL configuration
- **Site URL**: set to `NEXT_PUBLIC_SITE_URL` (e.g., `https://your-domain.tld`)
- **Redirect URLs**: add  
  `/auth/callback`,  
  `/reset-password/confirm`,  
  `/verify-email`

## Notes
- Auth, onboarding, and OAuth flows depend on correct Site/Redirect URLs.
- Database-backed features require a valid `DATABASE_URL` on every environment.
