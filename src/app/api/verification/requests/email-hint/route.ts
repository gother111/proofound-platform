import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { normalizeVerifierEmail } from '@/lib/verification/custom-verification';

const EmailHintQuerySchema = z.object({
  email: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const validation = EmailHintQuerySchema.safeParse({
      email: searchParams.get('email') || '',
    });

    if (!validation.success) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const email = normalizeVerifierEmail(validation.data.email);
    if (!email) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    return NextResponse.json({
      kind: 'verifier_email_ready',
    });
  } catch (error) {
    log.error('verification.email_hint.get_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
