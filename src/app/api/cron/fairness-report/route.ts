/**
 * Fairness Report Cron Job
 * GET /api/cron/fairness-report
 *
 * Implements PRD Gap 3: Weekly automated fairness note generation
 * Scheduled to run every Monday at midnight (vercel.json)
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateFairnessNote } from '@/lib/reporting/fairness-note';
import { sendEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current version (use commit SHA or version tag)
    const currentVersion =
      process.env.VERCEL_GIT_COMMIT_SHA || process.env.npm_package_version || 'dev';

    console.log(`Generating fairness report for version: ${currentVersion}`);

    // Generate report
    const report = await generateFairnessNote(currentVersion);

    // Send report to admins via email
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];

    for (const email of adminEmails) {
      await sendEmail({
        to: email.trim(),
        subject: `Fairness Report - ${currentVersion}`,
        text: report,
        html: `<pre>${report}</pre>`,
      });
    }

    console.log(`Fairness report generated and sent to ${adminEmails.length} admins`);

    return NextResponse.json({
      success: true,
      version: currentVersion,
      reportLength: report.length,
      recipientsNotified: adminEmails.length,
    });
  } catch (error: any) {
    console.error('Fairness report cron error:', error);
    return NextResponse.json(
      { error: 'Failed to generate fairness report', message: error.message },
      { status: 500 }
    );
  }
}
