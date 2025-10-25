import { redirect } from 'next/navigation';
import { resolveUserHomePath } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const path = await resolveUserHomePath(supabase);
  redirect(path);
}
