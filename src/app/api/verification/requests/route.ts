import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { normalizeEmail } from '@/lib/verification/integrity';
import { loadVerificationRequestFeed } from '@/lib/verification/request-feed';

export async function GET(_request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, supabase } = authContext;
    const { data: authUser } = await supabase.auth.getUser();
    const userEmail = normalizeEmail(authUser.user?.email || null) || '';
    const hasVerifiedEmail = Boolean(authUser.user?.email_confirmed_at);

    const feed = await loadVerificationRequestFeed({
      userId: user.id,
      userEmail,
      hasVerifiedEmail,
      supabase,
    });

    return NextResponse.json(feed);
  } catch (error) {
    console.error('Verification requests route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
