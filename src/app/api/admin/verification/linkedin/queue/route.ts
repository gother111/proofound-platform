import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { listInternalOpsQueueItems } from '@/lib/internal-ops/queue';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .single();

    if (
      !profile?.platform_role ||
      !['platform_admin', 'super_admin'].includes(profile.platform_role)
    ) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
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
    console.error('Error fetching internal ops queue:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch verification queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
