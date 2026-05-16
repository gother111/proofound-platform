import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import { createClient } from '@/lib/supabase/server';

async function handleLogout(request: NextRequest) {
  const supabase = await createClient({ allowCookieWrite: true });
  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  return NextResponse.redirect(new URL('/', request.url));
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

export async function POST(request: NextRequest) {
  return handleLogout(request);
}
