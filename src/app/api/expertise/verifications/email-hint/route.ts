import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { normalizeVerifierEmail } from '@/lib/verification/custom-verification';

const EmailHintQuerySchema = z.object({
  email: z.string().email(),
});

/**
 * GET /api/expertise/verifications/email-hint?email=...
 *
 * Returns whether an email appears to belong to an existing Proofound account.
 */
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

    let isProofoundUser = false;

    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Email hint admin lookup failed:', error);
      }

      isProofoundUser = Boolean(data?.id);
    } catch (_adminError) {
      // Fallback path when service role credentials are unavailable.
      console.warn('Email hint admin client unavailable, using fallback lookup');
      const supabase = await createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      isProofoundUser = Boolean(data?.id);
    }

    return NextResponse.json({
      kind: isProofoundUser ? 'proofound_user' : 'external_verifier',
    });
  } catch (error) {
    console.error('Email hint GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
