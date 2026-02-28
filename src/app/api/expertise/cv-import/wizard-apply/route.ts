import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { applyWizardSelections } from '@/lib/expertise/cv-import-wizard-apply';
import {
  CvImportWizardApplyRequestSchema,
  type CvImportWizardApplyRequest,
} from '@/lib/expertise/cv-import-wizard-types';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = CvImportWizardApplyRequestSchema.parse(
      (await request.json()) as CvImportWizardApplyRequest
    );

    const response = await applyWizardSelections(user.id, payload);

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to apply CV wizard selections',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
