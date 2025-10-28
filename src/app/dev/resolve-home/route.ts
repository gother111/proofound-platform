import { NextResponse } from 'next/server';
import { resolveUserHomePath } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const supabase = await createClient({ allowCookieWrite: true });
  const path = await resolveUserHomePath(supabase);

  return NextResponse.json({ path });
}
