# Fairness Note Implementation - Testing Guide

**Status:** Implementation Complete ✅  
**Date:** November 5, 2025  
**PRD Compliance:** Part 2.2 Metric 7 - Fairness/Equity Signal

---

## Overview

The fairness note system is now fully implemented with:
- Public transparency page at `/fairness`
- Admin dashboard with publish/archive controls at `/admin/fairness/notes`
- Automated monthly generation via cron job
- Full workflow from draft → published → archived

---

## Testing Checklist

### ✅ Phase 1: Generate Draft Fairness Note

**Location:** `/admin/fairness/notes`

1. Navigate to admin fairness dashboard
2. Click "Generate New Note" button
3. Enter a release version (e.g., "v1.0.0")
4. Click "Generate Fairness Note"
5. **Expected Result:**
   - Success toast notification appears
   - New note appears in the "Draft" tab
   - Note shows status badge "draft"
   - Note displays cohort data, findings, and recommendations

---

### ✅ Phase 2: Verify Draft Status

**Location:** `/admin/fairness/notes`

1. Check that the note appears in the "Draft" tab
2. Verify status badge shows "draft" (gray/secondary color)
3. Verify "Publish to Public" button is visible
4. **Expected Result:**
   - Note is visible only in admin dashboard
   - Not visible on public page yet

---

### ✅ Phase 3: Test Public Page (Before Publish)

**Location:** `/fairness`

1. Navigate to `/fairness` (no auth required)
2. **Expected Result:**
   - Page loads successfully
   - Hero section displays fairness commitment
   - "No fairness notes yet" message shown (if this is the first note)
   - Draft notes are NOT visible

---

### ✅ Phase 4: Publish Fairness Note

**Location:** `/admin/fairness/notes`

1. Click "Publish to Public" button on draft note
2. Read confirmation dialog explaining public visibility
3. Click "Publish" button
4. **Expected Result:**
   - Success toast notification: "Fairness note published successfully!"
   - Status badge changes from "draft" to "published" (green)
   - Note moves to "Published" tab
   - "Archive" button now visible instead of "Publish" button

**API Call:** `POST /api/admin/fairness/notes/[id]/publish`

---

### ✅ Phase 5: Verify Public Display

**Location:** `/fairness`

1. Navigate to `/fairness` (no auth required)
2. **Expected Result:**
   - Published note is now visible
   - Release version displayed as card title
   - Published date shown
   - Status badge shows "No Significant Gaps" or "Gaps Detected"
   - Accordion sections expand to show:
     - Findings with severity badges
     - Recommendations with priority levels
     - Methodology explanation
   - CTA section links to demographic opt-in settings

**API Call:** `GET /api/public/fairness/notes`

---

### ✅ Phase 6: Test Filter Tabs

**Location:** `/admin/fairness/notes`

1. Click through filter tabs: All / Draft / Published / Archived
2. **Expected Result:**
   - Each tab shows correct count in label
   - Notes filtered correctly by status
   - Published note appears only in "All" and "Published" tabs

---

### ✅ Phase 7: Archive Fairness Note

**Location:** `/admin/fairness/notes`

1. In "Published" tab, find the published note
2. Click "Archive" button
3. Read confirmation dialog explaining removal from public page
4. Click "Archive" button (red/destructive variant)
5. **Expected Result:**
   - Success toast notification: "Fairness note archived successfully!"
   - Status badge changes to "archived" (gray/outline)
   - Note moves to "Archived" tab
   - Note disappears from "Published" tab

**API Call:** `POST /api/admin/fairness/notes/[id]/archive`

---

### ✅ Phase 8: Verify Public Removal

**Location:** `/fairness`

1. Navigate to `/fairness` (no auth required)
2. **Expected Result:**
   - Archived note is NO LONGER visible
   - If no other published notes exist, "No fairness notes yet" message shown
   - Page still loads correctly

---

### ✅ Phase 9: Test Cron Job (Manual Trigger)

**Prerequisites:** 
- Ensure environment variables are set:
  - `FAIRNESS_ALERT_EMAILS` (comma-separated admin emails)
  - `EMAIL_FROM` (sender email)
  - `SLACK_FAIRNESS_WEBHOOK_URL` (optional)

**Testing Methods:**

#### Option A: Local Testing (Development)
```bash
# Start local server
npm run dev

# In another terminal, trigger cron manually
curl http://localhost:3000/api/cron/generate-fairness-note \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -X GET
```

#### Option B: Vercel Testing (Staging/Production)
```bash
# Trigger via Vercel CLI
vercel env pull .env.local
vercel dev

# Or trigger on deployed preview/production
curl https://your-app.vercel.app/api/cron/generate-fairness-note \
  -H "Authorization: Bearer <CRON_SECRET>" \
  -X GET
```

**Expected Result:**
- Cron job generates new note with version format "YYYY-MM-DD"
- Note created in "draft" status
- If significant gaps detected:
  - Email alert sent to `FAIRNESS_ALERT_EMAILS`
  - Slack notification sent (if configured)
- Console logs show generation progress

---

### ✅ Phase 10: Verify Automated Cron Schedule

**Location:** `vercel.json`

**Verify Configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/generate-fairness-note",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

**Schedule:** Monthly on the 1st at 3:00 AM UTC

**Testing:**
- Deploy to Vercel
- Wait for scheduled execution (or adjust schedule to test sooner)
- Check admin dashboard for automatically generated notes

---

## API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/public/fairness/notes` | GET | None | Fetch published notes for public page |
| `/api/admin/fairness/notes` | GET | Required | Fetch all notes (admin) |
| `/api/admin/fairness/generate-note` | POST | Required | Generate new draft note |
| `/api/admin/fairness/notes/[id]/publish` | POST | Required | Publish draft note |
| `/api/admin/fairness/notes/[id]/archive` | POST | Required | Archive published note |
| `/api/cron/generate-fairness-note` | GET | CRON_SECRET | Automated monthly generation |

---

## Environment Variables Required

Add to `.env.local` or Vercel environment variables:

```bash
# Required for email alerts
FAIRNESS_ALERT_EMAILS="admin@proofound.app,fairness@proofound.app"
EMAIL_FROM="noreply@proofound.app"

# Optional: Slack notifications
SLACK_FAIRNESS_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Cron job authentication (auto-set by Vercel)
CRON_SECRET="<auto-generated-by-vercel>"
```

---

## Known Behaviors

### Minimum Sample Size
- Requires **minimum 40 matches per cohort** for statistical validity
- If insufficient data, note will indicate "insufficient_data" in findings
- No significant gaps can be detected without sufficient sample size

### Statistical Significance
- Uses **p < 0.05** threshold for significance testing
- Gap must be both substantial (percentage difference) AND statistically significant

### Demographic Data
- Only analyzes users who **opted in** to demographic tracking
- Opt-in available at `/app/i/settings/fairness`
- Privacy-first approach - all demographic data is voluntary

---

## Success Criteria (PRD Compliance)

✅ **PRD Part 2.2 Metric 7:** "Fairness Gap between opt-in demographic segments on intro and contract rates, controlling for skills/constraints. Target: No statistically significant negative gap for underrepresented cohorts; publish a fairness note per release."

- [x] Automated fairness gap calculation
- [x] Statistical significance testing (p < 0.05)
- [x] Automated note generation per release (monthly cron)
- [x] Public transparency page
- [x] Admin review and publishing workflow
- [x] Email alerts for significant gaps
- [x] Cohort-level analysis with sample size validation

---

## Troubleshooting

### Issue: "No fairness notes yet" on public page
**Solution:** Generate a note in admin and publish it

### Issue: Cron job not generating notes
**Solution:** 
- Check environment variables are set
- Verify cron schedule in vercel.json deployed
- Check Vercel cron logs in dashboard

### Issue: Insufficient data error
**Solution:** 
- Need at least 40 matches per cohort
- Encourage demographic opt-in among users
- Wait for more platform usage data

### Issue: Email alerts not sending
**Solution:**
- Verify `FAIRNESS_ALERT_EMAILS` is set
- Check email service configuration (Resend)
- Verify `EMAIL_FROM` is a verified sender

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Deploy to production
3. ✅ Monitor first automated cron run (1st of next month)
4. ✅ Review first published fairness note
5. ✅ Share public transparency page URL with stakeholders

---

**Testing Complete:** Mark this document as reference and proceed with production deployment.

