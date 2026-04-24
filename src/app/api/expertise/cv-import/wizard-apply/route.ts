import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { applyWizardSelections } from '@/lib/expertise/cv-import-wizard-apply';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const result = await applyWizardSelections(authContext.user.id, payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to apply approved CV import entries',
        message: error instanceof Error ? error.message : 'Unknown CV import error.',
      },
      { status: 400 }
    );
  }
}
