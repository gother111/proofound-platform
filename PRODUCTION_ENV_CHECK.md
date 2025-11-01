# 🔍 Production Environment Variables Check

## What You Need to Do Right Now

**🪄 DO THIS MANUALLY:** Check your Vercel environment variables to ensure your production deployment can connect to the database.

### Step 1: Open Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your **Proofound** project
3. Click on **Settings** (top navigation)
4. Click on **Environment Variables** (left sidebar)

### Step 2: Verify Required Variables

Check that **ALL** of these variables exist and are set for **Production**:

#### ✅ Required Variables

| Variable Name | What It's For | Where to Get It |
|--------------|---------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Supabase Dashboard → Settings → API → Project API keys → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Supabase Dashboard → Settings → API → Project API keys → service_role (⚠️ Keep secret!) |
| `DATABASE_URL` | **CRITICAL** Database connection | Supabase Dashboard → Settings → Database → Connection pooling → Connection string |
| `NEXT_PUBLIC_SITE_URL` | Your production domain | Your Vercel deployment URL (e.g., `https://proofound.vercel.app`) |
| `SITE_URL` | Same as above (server-side) | Same value as NEXT_PUBLIC_SITE_URL |

#### 📧 Optional (for email features)

| Variable Name | What It's For |
|--------------|---------------|
| `RESEND_API_KEY` | Sending verification emails |
| `EMAIL_FROM` | Email sender address |

### Step 3: Special Check for DATABASE_URL

**This is the most common issue!**

The `DATABASE_URL` should look like this:
```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
```

**🪄 How to get it:**
1. Go to Supabase Dashboard
2. Click your project
3. Go to **Settings** → **Database**
4. Find **Connection pooling** section
5. Copy the **Connection string**
6. Make sure it uses **port 6543** (pooled connection, not direct 5432)

### Step 4: Add Missing Variables

If any variables are missing:

1. Click **Add New** button in Vercel
2. Enter the **Variable Name** exactly as shown above
3. Paste the **Value**
4. Select **Production** (and optionally Preview/Development)
5. Click **Save**

### Step 5: Redeploy

After adding/updating variables:

1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### Step 6: Test Connection

After redeployment, visit:
```
https://your-domain.vercel.app/api/health
```

You should see:
```json
{
  "status": "healthy",
  "database": true,
  "env": {
    "hasSupabaseUrl": true,
    "hasDatabaseUrl": true,
    "hasSiteUrl": true
  }
}
```

## ⚠️ What If DATABASE_URL Is Missing?

If `DATABASE_URL` is missing, your app will:
- ❌ Fail to save any data
- ❌ Show "Failed to save matching profile" errors
- ❌ Make buttons appear broken
- ❌ Fall back to mock database (data doesn't persist)

This is likely the cause of your current production issues!

## 💡 Troubleshooting

### "Still seeing errors after adding variables"

- Wait 2-3 minutes after redeployment
- Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel logs for any new errors

### "Database connection failed" in /api/health

- Verify DATABASE_URL is exactly correct (no extra spaces)
- Make sure you're using the **pooled** connection (port 6543)
- Check that your Supabase project is active (not paused)

### "Variables keep disappearing"

- Make sure you clicked **Save** after adding each one
- Verify the environment is set to **Production**

## Next Steps

After confirming all variables are set:
1. ✅ Mark this task as complete
2. 🚀 Continue with the other fixes in the implementation plan
3. 🧪 Test the production site thoroughly

