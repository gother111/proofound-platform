import { NextRequest, NextResponse } from 'next/server';

import { adminListGuard } from '@/app/api/admin/_utils';
import { listInternalOpsQueueItems } from '@/lib/internal-ops/queue';
import { log } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) {
      return guardResult;
    }

    const queues = await listInternalOpsQueueItems();

    return NextResponse.json({
      success: true,
      queues,
      stats: {
        total: queues.reduce((sum, queue) => sum + queue.items.length, 0),
        open: queues.reduce((sum, queue) => sum + queue.openCount, 0),
      },
    });
  } catch (error) {
    log.error('admin.internal_ops_queues.list_failed', {
      errorName: error instanceof Error ? error.name : typeof error,
    });
    return NextResponse.json(
      {
        error: 'Failed to fetch operations queues',
      },
      { status: 500 }
    );
  }
}
