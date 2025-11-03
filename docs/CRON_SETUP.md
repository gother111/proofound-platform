# Free Cron Job Setup Guide

> **✅ STATUS: CRON JOBS CONFIGURED**
>
> All 3 cron jobs are currently active in cron-job.org:
>
> - ✅ Send Deletion Reminders (Daily at 1:00 AM UTC)
> - ✅ Process Deletions (Daily at 2:00 AM UTC)
> - ✅ Refresh Matches (Daily at 2:00 AM UTC)
>
> This guide is for reference and troubleshooting. Skip to [Monitoring & Maintenance](#monitoring--maintenance) if jobs are already set up.

---

This guide shows you how to set up scheduled tasks (cron jobs) for Proofound using **free external services** instead of paid Vercel Pro cron features.

## Why Cron Jobs?

Proofound needs scheduled tasks to run automatically:

1. **Send Deletion Reminders** - Notify users 7 days before account deletion
2. **Process Account Deletions** - Anonymize accounts after 30-day grace period
3. **Refresh Matches** - Update matching recommendations for users

## Cost Comparison

| Service                        | Cost         | Pros                                   | Cons                 |
| ------------------------------ | ------------ | -------------------------------------- | -------------------- |
| **cron-job.org** (Recommended) | **FREE**     | No account needed, simple UI, reliable | Basic features       |
| Vercel Cron                    | $20/month    | Native integration, auto-auth          | Requires Pro plan    |
| EasyCron                       | FREE (1 job) | Simple                                 | Limited free jobs    |
| GitHub Actions                 | FREE         | CI/CD integration                      | Requires repo access |

**We'll use cron-job.org** - it's completely free, reliable, and easy to set up.

---

## Prerequisites

Before setting up cron jobs, you need:

1. ✅ Deployed Proofound application (on Vercel or similar)
2. ✅ Production URL (e.g., `https://proofound.vercel.app`)
3. ✅ `CRON_SECRET` environment variable configured

---

## Step 1: Generate CRON_SECRET

The `CRON_SECRET` is a random token that authenticates cron requests to prevent unauthorized access.

### Generate Secure Token

**Option 1: Using OpenSSL (Mac/Linux)**

```bash
openssl rand -base64 32
```

**Option 2: Using Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: Online Generator**

- Go to https://1password.com/password-generator/
- Generate a 32-character random string
- Use letters, numbers, and symbols

**Example output:**

```
K7x9mP2nQ4vL8wR6yT3zC5bN1aM0hF
```

⚠️ **Important**: Save this token securely - you'll need it for both Vercel and cron-job.org setup.

---

## Step 2: Add CRON_SECRET to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Click **"Add Variable"**

**Configuration:**

- **Name**: `CRON_SECRET`
- **Value**: `your_generated_token_here`
- **Environment**: Select **Production**, **Preview**, and **Development**

4. Click **"Save"**
5. **Redeploy** your application for changes to take effect

### Verify It's Set

After deployment, check the environment variable:

```bash
# In your Vercel deployment logs, you should NOT see:
# "CRON_SECRET not set - cron endpoints are publicly accessible"
```

---

## Step 3: Set Up cron-job.org

### Create Account (Optional)

While not required, creating an account gives you:

- Dashboard to monitor all jobs
- Email notifications on failures
- Job execution history

1. Go to [https://cron-job.org/en/signup/](https://cron-job.org/en/signup/)
2. Enter email and create password (or skip for anonymous use)
3. Verify your email if you signed up

---

## Step 4: Create Cron Jobs

You need to create **3 cron jobs**. Here's how:

### Job 1: Send Deletion Reminders

This job sends reminder emails 7 days before account deletion.

**Configuration:**

1. Go to https://cron-job.org/en/members/jobs/add/
2. Fill in the form:

| Field               | Value                                                             |
| ------------------- | ----------------------------------------------------------------- |
| **Title**           | `Proofound - Send Deletion Reminders`                             |
| **URL**             | `https://your-domain.vercel.app/api/cron/send-deletion-reminders` |
| **Schedule**        | Every day at **1:00 AM UTC**                                      |
| **Request Method**  | `GET`                                                             |
| **Request Timeout** | `30 seconds`                                                      |

3. Click **"Add HTTP Header"**
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer your_cron_secret_here`

4. **Optional Settings:**
   - Enable notifications on failure
   - Set up email alerts

5. Click **"Create"**

**Schedule Configuration:**

```
Minute: 0
Hour: 1
Day: *
Month: *
Weekday: *
```

This runs at 1:00 AM UTC every day.

---

### Job 2: Process Account Deletions

This job anonymizes accounts after 30-day grace period.

**Configuration:**

1. Create new cron job
2. Fill in:

| Field               | Value                                                       |
| ------------------- | ----------------------------------------------------------- |
| **Title**           | `Proofound - Process Deletions`                             |
| **URL**             | `https://your-domain.vercel.app/api/cron/process-deletions` |
| **Schedule**        | Every day at **2:00 AM UTC**                                |
| **Request Method**  | `GET`                                                       |
| **Request Timeout** | `60 seconds`                                                |

3. Add HTTP Header:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer your_cron_secret_here`

4. Click **"Create"**

**Schedule Configuration:**

```
Minute: 0
Hour: 2
Day: *
Month: *
Weekday: *
```

Runs at 2:00 AM UTC (1 hour after deletion reminders).

---

### Job 3: Refresh Matches

This job updates matching recommendations for users.

**Configuration:**

1. Create new cron job
2. Fill in:

| Field               | Value                                                     |
| ------------------- | --------------------------------------------------------- |
| **Title**           | `Proofound - Refresh Matches`                             |
| **URL**             | `https://your-domain.vercel.app/api/cron/refresh-matches` |
| **Schedule**        | Every day at **2:00 AM UTC**                              |
| **Request Method**  | `GET`                                                     |
| **Request Timeout** | `300 seconds` (5 minutes)                                 |

3. Add HTTP Header:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer your_cron_secret_here`

4. Click **"Create"**

**Schedule Configuration:**

```
Minute: 0
Hour: 2
Day: *
Month: *
Weekday: *
```

⚠️ **Note**: This job processes 100 profiles per run and may take 1-5 minutes.

---

## Step 5: Test Your Cron Jobs

### Test Locally First

Before testing in production, verify endpoints work locally:

```bash
# Start your development server
npm run dev

# In another terminal, test each endpoint:

# Test 1: Deletion Reminders
curl -X GET http://localhost:3000/api/cron/send-deletion-reminders \
  -H "Authorization: Bearer your_cron_secret_here"

# Test 2: Process Deletions
curl -X GET http://localhost:3000/api/cron/process-deletions \
  -H "Authorization: Bearer your_cron_secret_here"

# Test 3: Refresh Matches
curl -X GET http://localhost:3000/api/cron/refresh-matches \
  -H "Authorization: Bearer your_cron_secret_here"
```

**Expected Response (Success):**

```json
{
  "success": true,
  "processed": 5,
  "message": "..."
}
```

**Expected Response (Unauthorized):**

```json
{
  "error": "Unauthorized"
}
```

If you get this, your CRON_SECRET is incorrect.

### Test in Production

After creating cron jobs in cron-job.org:

1. Go to cron-job.org dashboard
2. Find your job
3. Click **"Execute now"** to run manually
4. Check execution log for status
5. Verify response is successful

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Filter by the cron endpoint (e.g., `/api/cron/refresh-matches`)
3. Look for successful execution logs
4. Check for any error messages

---

## Monitoring & Maintenance

### cron-job.org Dashboard

**Monitor Job Status:**

1. Login to cron-job.org
2. Go to **"Jobs"** page
3. See last execution time, status, response time

**View Execution History:**

1. Click on a job name
2. See **"Execution history"** tab
3. View response codes, response time, errors

**Set Up Notifications:**

1. Job settings → **"Notifications"**
2. Enable **"Notify on error"**
3. Add email addresses for alerts
4. Get notified if job fails

### Vercel Function Logs

Monitor cron job execution in real-time:

1. Vercel Dashboard → **Logs**
2. Filter by function: `/api/cron/*`
3. See execution logs, errors, timing
4. Set up log alerts in Vercel

### Expected Behavior

**Deletion Reminders (1:00 AM UTC daily):**

- Queries users with `deletion_scheduled_at` in 7 days
- Sends reminder emails via Resend
- Logs events to `analytics_events` table
- Typical response time: 5-30 seconds

**Process Deletions (2:00 AM UTC daily):**

- Queries users past 30-day grace period
- Calls `anonymize_user_account()` database function
- Sends completion emails
- Typical response time: 10-60 seconds

**Refresh Matches (2:00 AM UTC daily):**

- Processes 100 matching profiles
- Calls internal matching API for each profile
- Updates `matches` table with fresh recommendations
- Typical response time: 1-5 minutes (max timeout: 5 minutes)

---

## Troubleshooting

### Job Returns 401 Unauthorized

**Cause**: CRON_SECRET mismatch

**Solution:**

1. Verify `CRON_SECRET` is set in Vercel environment variables
2. Check Authorization header in cron-job.org:
   - Format must be: `Bearer your_secret`
   - No extra spaces
   - Secret matches exactly
3. Redeploy application after changing environment variables

**Test Authorization:**

```bash
# This should fail (no auth):
curl https://your-domain.vercel.app/api/cron/refresh-matches

# This should succeed:
curl https://your-domain.vercel.app/api/cron/refresh-matches \
  -H "Authorization: Bearer your_cron_secret"
```

### Job Times Out

**Cause**: Function execution exceeds timeout

**Solution:**

1. **Increase timeout in cron-job.org**:
   - Edit job → Set timeout to 300 seconds (5 minutes)

2. **Check Vercel function limits**:
   - Free tier: 10 seconds max
   - Hobby tier: 10 seconds max
   - Pro tier: 60 seconds max
   - Enterprise: Custom limits

3. **Optimize the endpoint**:
   - Refresh Matches processes 100 profiles - may need Pro tier
   - Consider reducing batch size or upgrading Vercel plan

### Job Fails Intermittently

**Cause**: Database connection issues, rate limits, or external API failures

**Solution:**

1. **Check Vercel logs** for error details
2. **Check Supabase status**: https://status.supabase.com/
3. **Verify database connection**:
   - Ensure `DATABASE_URL` is set correctly
   - Check connection pool limits
4. **Check Resend status** (for deletion reminder emails)
5. **Add retry logic** if needed (contact support)

### Email Notifications Not Sending

**Cause**: Resend API key not set or domain not verified

**Solution:**

1. Verify `RESEND_API_KEY` is set in Vercel
2. Check Resend dashboard for delivery errors
3. Ensure domain is verified in Resend
4. See [RESEND_SETUP.md](./RESEND_SETUP.md) for details

### Cron Job Not Running on Schedule

**Cause**: cron-job.org service issues or job disabled

**Solution:**

1. Check job is **enabled** in cron-job.org dashboard
2. Verify schedule configuration is correct
3. Check cron-job.org service status
4. Test manual execution to verify endpoint works
5. Check email notifications for failure alerts

---

## Security Best Practices

### Protect Your CRON_SECRET

- ✅ Never commit to Git or share publicly
- ✅ Use strong random token (32+ characters)
- ✅ Rotate periodically (every 6 months)
- ✅ Use different secrets for staging/production
- ❌ Don't use simple words or patterns

### Endpoint Security

- ✅ All cron endpoints check Authorization header
- ✅ Return 401 for invalid/missing tokens
- ✅ Log unauthorized access attempts
- ✅ Rate limit if needed (Vercel Edge Config)

### Monitoring

- ✅ Enable failure notifications in cron-job.org
- ✅ Monitor Vercel logs for suspicious activity
- ✅ Set up alerts for repeated failures
- ✅ Review execution logs weekly

---

## Alternative: Vercel Native Cron Jobs

Your `vercel.json` already has cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-deletion-reminders",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/cron/process-deletions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**To use Vercel cron instead of cron-job.org:**

1. Upgrade to Vercel Pro ($20/month)
2. Vercel automatically runs these jobs
3. No external service needed
4. Automatic authentication (no CRON_SECRET needed for Vercel cron)

**Note**: You'd still need to add the `refresh-matches` cron to `vercel.json`.

---

## Cost Analysis

### Free Option (Current Setup)

**cron-job.org:**

- ✅ **FREE** forever
- ✅ Unlimited jobs
- ✅ Reliable service
- ✅ Email notifications
- ❌ Basic monitoring

**Total Monthly Cost**: **$0**

### Paid Option (Vercel Pro)

**Vercel Pro Plan:**

- ❌ **$20/month**
- ✅ Native integration
- ✅ Auto-authentication
- ✅ Advanced monitoring
- ✅ Priority support

**Total Monthly Cost**: **$20**

**Recommendation**: Start with free cron-job.org, upgrade to Vercel Pro later if needed.

---

## FAQ

### Q: Can I use a different schedule?

**A**: Yes! Adjust the cron schedule in cron-job.org dashboard. For example:

- Every 6 hours: `0 */6 * * *`
- Twice daily: `0 2,14 * * *` (2 AM and 2 PM)
- Weekly: `0 2 * * 0` (Sundays at 2 AM)

### Q: How do I pause a cron job?

**A**: In cron-job.org dashboard:

1. Find the job
2. Click **"Disable"**
3. Job won't run until re-enabled

### Q: What happens if a job fails?

**A**:

- cron-job.org will retry based on your settings
- You'll get email notification (if configured)
- Check Vercel logs for error details
- Job will run again on next schedule

### Q: Can I run jobs more frequently?

**A**:

- cron-job.org minimum interval: **1 minute**
- Be careful with frequent runs (database load)
- Current daily schedule is recommended

### Q: How do I test without affecting production?

**A**:

1. Deploy to staging environment
2. Create separate cron jobs pointing to staging URL
3. Use different CRON_SECRET for staging
4. Test thoroughly before updating production

---

## Support Resources

### cron-job.org

- [Documentation](https://cron-job.org/en/documentation/)
- [FAQ](https://cron-job.org/en/faq/)
- Email: support@cron-job.org

### Vercel Cron

- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)
- [Pricing](https://vercel.com/pricing)

### Proofound Cron Endpoints

- See code: `src/app/api/cron/` directory
- Check logs: Vercel Dashboard → Logs
- Report issues: GitHub Issues

---

## Verify Your Cron Jobs (Already Configured)

Since your cron jobs are already set up in cron-job.org, verify they're working:

### Check cron-job.org Dashboard

1. Login to [cron-job.org](https://console.cron-job.org)
2. Go to **"Cronjobs"**
3. Verify all 3 jobs are listed and enabled:
   - ✅ Proofound - Send Deletion Reminders
   - ✅ Proofound - Process Deletions
   - ✅ Proofound - Refresh Matches

### Test Manually

Click **"Execute now"** for each job to test:

- Should return 200 OK status
- Check **"History"** tab for execution logs
- Verify no 401 Unauthorized errors

### Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com) → Your Project → **Logs**
2. Filter by `/api/cron/`
3. Look for successful executions after manual test
4. Verify no errors in response

### Production URLs

Your cron jobs are configured to hit:

- `https://proofound.io/api/cron/send-deletion-reminders`
- `https://proofound.io/api/cron/process-deletions`
- `https://proofound.io/api/cron/refresh-matches`

---

## Next Steps

After verifying cron jobs work:

1. ✅ Monitor first few scheduled executions in dashboard
2. ✅ Verify emails are being sent (check Resend logs)
3. ✅ Review Vercel function logs for errors
4. ✅ Set up failure notifications
5. ✅ Complete [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## Quick Reference

```bash
# Generate CRON_SECRET
openssl rand -base64 32

# Test endpoint locally
curl -X GET http://localhost:3000/api/cron/refresh-matches \
  -H "Authorization: Bearer YOUR_SECRET"

# Test endpoint in production
curl -X GET https://your-domain.vercel.app/api/cron/refresh-matches \
  -H "Authorization: Bearer YOUR_SECRET"
```

**Cron Job URLs:**

- Deletion Reminders: `https://your-domain.vercel.app/api/cron/send-deletion-reminders`
- Process Deletions: `https://your-domain.vercel.app/api/cron/process-deletions`
- Refresh Matches: `https://your-domain.vercel.app/api/cron/refresh-matches`

**Authorization Header:**

```
Authorization: Bearer your_cron_secret_here
```

**Total Setup Time:** ~15 minutes

**Cost:** FREE ✨
