import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { resolveUserHomePath } from '@/lib/auth';

export default async function RootPage() {
  const supabase = await createServerClient({ cookies });
  const target = await resolveUserHomePath(supabase);

  redirect(target);
}
