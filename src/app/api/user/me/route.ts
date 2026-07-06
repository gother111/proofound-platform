/**
 * Current User API
 *
 * GET /api/user/me - Get current authenticated user's basic info
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    log.error('user.me.get_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
