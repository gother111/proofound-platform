import { NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { deleteZenData, recordZenAuditEvent } from '@/lib/zen/service';

export async function DELETE() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_delete_requested',
      routeSource: '/api/wellbeing/data',
    });

    await deleteZenData(user.id);

    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_delete_completed',
      routeSource: '/api/wellbeing/data',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('wellbeing.data.delete.failed', error);
    return NextResponse.json({ error: 'Failed to delete Zen data' }, { status: 500 });
  }
}
