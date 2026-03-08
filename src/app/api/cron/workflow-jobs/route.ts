import { NextRequest, NextResponse } from 'next/server';
import { processWorkflowAsyncJobs } from '@/lib/workflow/processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is missing' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processWorkflowAsyncJobs(100);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process workflow jobs' }, { status: 500 });
  }
}
