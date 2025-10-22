import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { ensureOrgContextForUser } from '@/lib/orgs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  const supabase = await createServerClient({ cookies });

  if (code) {
    const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeErr) {
      console.error('[auth/callback] exchangeCodeForSession failed', exchangeErr);
      return NextResponse.redirect(new URL('/auth/error', url.origin));
    }
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    console.warn('[auth/callback] no user after exchange', { hasError: !!userErr });
    return NextResponse.redirect(new URL('/auth/error', url.origin));
  }

  const slug = await ensureOrgContextForUser(user.id, { email: user.email ?? undefined });

  return NextResponse.redirect(new URL(`/o/${slug}/home`, url.origin));
}
