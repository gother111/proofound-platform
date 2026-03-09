import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { getUploadedFileStatus } from '@/lib/uploads/lifecycle';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileId } = await params;
  const status = await getUploadedFileStatus(fileId, user.id);

  if (!status) {
    return NextResponse.json({ error: 'Upload not found' }, { status: 404 });
  }

  return NextResponse.json({ upload: status });
}
