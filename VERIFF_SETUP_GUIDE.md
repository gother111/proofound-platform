# Veriff Integration Setup Guide

## 📋 What You Need from Veriff

### 1. Create Veriff Account

**🪄 DO THIS MANUALLY:**
1. Go to https://www.veriff.com
2. Click "Sign Up" or "Get Started"
3. Choose your plan (Sandbox is free for testing)
4. Complete account setup

---

### 2. Get API Credentials

**🪄 DO THIS MANUALLY:**

1. **Log into Veriff Dashboard** at https://station.veriff.com

2. **Navigate to API Settings:**
   - Go to **Settings** → **API Credentials** (or **Developer Settings**)
   - Or look for **"Integration"** or **"API Keys"** section

3. **Find these credentials:**
   - **API Key** (also called "Client ID" or "API Key")
     - Format: Usually looks like `12345678-1234-1234-1234-123456789abc`
   - **API Secret** (also called "Client Secret" or "API Secret")
     - Format: Long string, keep it secret!
   - **Webhook Secret** (may be same as API Secret or separate)
     - Used to verify webhook signatures

4. **Copy all three values** (you'll need them in step 3)

---

### 3. Configure Webhook URL

**🪄 DO THIS MANUALLY:**

1. **In Veriff Dashboard**, go to **Settings** → **Webhooks**

2. **Add a new webhook** (or edit existing):
   - **Webhook URL:** `https://yourdomain.com/api/verification/veriff/webhook`
     - Replace `yourdomain.com` with your actual domain
     - Example: `https://proofound.io/api/verification/veriff/webhook`
   
3. **Enable webhook events:**
   - ✅ Verification completed
   - ✅ Verification status changed
   - Make sure your production URL is publicly accessible

4. **Save the webhook configuration**

---

### 4. Add Environment Variables

**🪄 DO THIS MANUALLY:**

Add these to your `.env.local` file (and production environment):

```bash
# Veriff API Credentials
VERIFF_API_KEY=your_api_key_here
VERIFF_API_SECRET=your_api_secret_here
VERIFF_BASE_URL=https://stationapi.veriff.com

# Webhook Secret (for verifying webhook signatures)
# This may be the same as VERIFF_API_SECRET or separate
VERIFF_WEBHOOK_SECRET=your_webhook_secret_here

# Your site URL (should already be set)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

**Important Notes:**
- Replace `your_api_key_here`, `your_api_secret_here`, etc. with actual values from Veriff
- Keep these secrets secure! Never commit them to git
- The `VERIFF_BASE_URL` is usually `https://stationapi.veriff.com` (default)
- For testing, Veriff may provide a sandbox URL

---

### 5. Test the Integration

**🪄 DO THIS MANUALLY:**

1. **Restart your development server** after adding environment variables:
   ```bash
   npm run dev
   ```

2. **Test the flow:**
   - Log in as an individual user
   - Go to **Settings** → **Account** → **Identity Verification**
   - Click **"Verify with ID"**
   - The Veriff SDK should load
   - Follow the verification prompts

3. **Check webhook:**
   - After completing verification, check your server logs
   - Veriff should send a webhook to `/api/verification/veriff/webhook`
   - Your profile should update automatically

---

## 🔍 Troubleshooting

### Issue: "Verification service not configured"
**Solution:** Make sure `VERIFF_API_KEY` and `VERIFF_API_SECRET` are set in `.env.local`

### Issue: "Failed to create verification session"
**Solutions:**
- Check if API credentials are correct
- Verify `VERIFF_BASE_URL` is correct (usually `https://stationapi.veriff.com`)
- Check Veriff dashboard for API usage limits

### Issue: Webhook not receiving updates
**Solutions:**
- Verify webhook URL is publicly accessible (not localhost)
- Check webhook secret matches in Veriff dashboard
- Check server logs for webhook errors
- Verify webhook is enabled in Veriff dashboard

### Issue: "Invalid webhook signature"
**Solution:** Make sure `VERIFF_WEBHOOK_SECRET` matches the secret in Veriff dashboard

---

## 📚 Veriff Documentation

- **API Documentation:** https://developers.veriff.com/
- **Webhook Guide:** https://developers.veriff.com/#webhooks
- **Status Codes:** https://developers.veriff.com/#verification-status-codes

---

## ✅ Quick Checklist

- [ ] Created Veriff account
- [ ] Got API Key from Veriff dashboard
- [ ] Got API Secret from Veriff dashboard
- [ ] Got Webhook Secret from Veriff dashboard
- [ ] Configured webhook URL in Veriff dashboard
- [ ] Added all environment variables to `.env.local`
- [ ] Restarted development server
- [ ] Tested verification flow

---

## 🎯 What Happens Next

Once configured:
1. Users click "Verify with ID" in settings
2. Veriff SDK loads and guides them through ID verification
3. User takes photos of their ID and selfie
4. Veriff processes the verification
5. Webhook sends result to your server
6. Profile automatically updates with verified status
7. Verified badge appears on user's profile! ✨

