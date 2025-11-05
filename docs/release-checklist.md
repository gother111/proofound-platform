# Release Checklist

This checklist ensures all critical steps are completed before releasing a new version to production.

## Pre-Release (1-2 weeks before)

### Code Quality

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests passing for critical flows
- [ ] Code coverage ≥80% for new features
- [ ] No linter errors or warnings
- [ ] Security scan completed (no high/critical vulnerabilities)
- [ ] Performance benchmarks meet targets

### Testing

- [ ] Manual QA on staging environment
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verified
- [ ] Accessibility audit completed (WCAG 2.1 AA)
- [ ] User acceptance testing (UAT) completed
- [ ] Load testing completed for high-traffic endpoints
- [ ] Database migration tested on staging

### Documentation

- [ ] CHANGELOG.md updated with all changes
- [ ] API documentation updated
- [ ] User-facing documentation updated
- [ ] Migration guide written (if breaking changes)
- [ ] README updated (if needed)

## Release Day

### Fairness Note Generation ⚠️ CRITICAL

**This step is mandatory before every production release.**

1. **Generate Fairness Note**

   ```bash
   # Via API (recommended)
   curl -X POST https://proofound.app/api/admin/fairness/generate-note \
     -H "Authorization: Bearer $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"releaseVersion": "v1.x.x"}'

   # Or via admin dashboard
   # Navigate to: /admin/fairness/notes
   # Click "Generate New Note"
   # Enter release version
   ```

2. **Review Fairness Note**
   - Navigate to `/admin/fairness/notes`
   - Review all cohort analyses
   - Check for significant gaps (p < 0.05)
   - Read all findings and recommendations

3. **Action Required If Gaps Detected**
   - **CRITICAL GAPS (≥15pp difference)**: STOP RELEASE
     - Investigate matching algorithm immediately
     - Identify bias sources
     - Fix issues before proceeding
     - Re-run fairness note generation
   - **MODERATE GAPS (10-15pp difference)**: PROCEED WITH CAUTION
     - Document gaps in release notes
     - Create GitHub issues for investigation
     - Add to post-release sprint backlog
     - Set monitoring alerts
   - **LOW GAPS (5-10pp difference)**: PROCEED
     - Document gaps in internal tracking
     - Monitor in next release

4. **Publish Fairness Note**
   - Once reviewed and approved, publish the note
   - Archive previous version's note

5. **Send Notification**
   - Email fairness note summary to leadership
   - Include link to full report
   - Highlight any action items

### Automated Cron Job (Optional but Recommended)

For automated fairness note generation, set up a cron job:

```typescript
// /src/app/api/cron/generate-fairness-note/route.ts
// Runs: Weekly on Mondays at 2 AM UTC

import { NextRequest, NextResponse } from 'next/server';
import { generateFairnessNote } from '@/lib/analytics/fairness-note-generator';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate note with current date as version
  const version = `auto-${new Date().toISOString().split('T')[0]}`;

  try {
    const noteId = await generateFairnessNote(version);

    // Send email notification if gaps detected
    // (Implementation depends on email service)

    return NextResponse.json({ success: true, noteId });
  } catch (error) {
    console.error('Cron fairness note generation failed:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
```

Configure in Vercel:

1. Go to project settings → Cron Jobs
2. Add: `0 2 * * 1` (Mondays at 2 AM UTC)
3. Path: `/api/cron/generate-fairness-note`
4. Add `CRON_SECRET` to environment variables

### Deployment

- [ ] Merge to main branch
- [ ] Tag release: `git tag v1.x.x`
- [ ] Push tags: `git push --tags`
- [ ] Trigger production deployment
- [ ] Verify deployment successful
- [ ] Run smoke tests on production
- [ ] Check error monitoring (Sentry)
- [ ] Monitor performance metrics (first 30 minutes)

### Database

- [ ] Backup production database
- [ ] Run migrations (if any)
- [ ] Verify migration success
- [ ] Check data integrity

### Monitoring

- [ ] Verify all monitoring dashboards operational
- [ ] Check alert rules are active
- [ ] Confirm error tracking working (Sentry)
- [ ] Performance metrics collecting
- [ ] Fairness metrics tracking

### Communication

- [ ] Post release announcement
- [ ] Update status page (if applicable)
- [ ] Notify stakeholders
- [ ] Share release notes with team
- [ ] Email fairness note summary to leadership

## Post-Release (24 hours after)

### Monitoring

- [ ] Review error rates (should be < 0.5%)
- [ ] Check performance SLAs met
  - Page load P95 ≤2.5s (desktop)
  - Page load P95 ≤3.5s (mobile)
  - API P95 ≤1.5s
  - Dashboard P75 ≤2.0s
- [ ] Review user feedback/support tickets
- [ ] Check analytics for anomalies

### Fairness

- [ ] Review fairness note findings
- [ ] Create action items for any gaps
- [ ] Schedule follow-up for high-priority recommendations
- [ ] Update fairness tracking dashboard

### Rollback Plan

If critical issues detected:

1. **Immediate Actions**
   - Revert to previous version
   - Notify team and stakeholders
   - Post incident status update

2. **Investigation**
   - Review logs and errors
   - Identify root cause
   - Document findings

3. **Resolution**
   - Fix issues
   - Re-run full testing suite
   - Schedule new release

## Post-Release (1 week after)

- [ ] Review all metrics vs. targets
- [ ] Analyze user adoption of new features
- [ ] Review fairness metrics trend
- [ ] Conduct release retrospective
- [ ] Update release process if needed

## Notes

- **Fairness Note**: This is the most critical pre-release step. Do not skip.
- **Sample Size**: Fairness notes require minimum 40 matches per cohort. If insufficient, document in release notes.
- **Statistical Significance**: p-value < 0.05 indicates significant gap requiring action.
- **Trend Tracking**: Compare fairness notes across releases to identify trends.

## Contact

- **Fairness Issues**: Contact platform team immediately
- **Technical Issues**: On-call engineer
- **Emergency**: [Emergency contact info]
