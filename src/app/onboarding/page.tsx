import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath } from '@/lib/auth';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('Failed to load authenticated user for onboarding:', userError);
  }

  if (!user) {
    redirect('/login');
  }

  const homePath = await resolveUserHomePath(supabase);

  redirect(homePath);
}
