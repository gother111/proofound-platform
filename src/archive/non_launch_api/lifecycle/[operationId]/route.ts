import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { getLifecycleOperation } from '@/lib/lifecycle/reconciliation';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ operationId: string }> }
) {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { operationId } = await params;
  const operation = await getLifecycleOperation(operationId);

  if (!operation) {
    return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
  }

  if (
    operation.operation.subject_id !== authContext.user.id &&
    operation.operation.requested_by !== authContext.user.id
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    operation: operation.operation,
    targets: operation.targets,
  });
}
