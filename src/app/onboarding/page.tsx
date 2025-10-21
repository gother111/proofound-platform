import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath } from '@/lib/auth';
import { OnboardingClient } from '@/components/onboarding/OnboardingClient';

type Persona = 'individual' | 'organization' | null;

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

  if (homePath !== '/onboarding') {
    redirect(homePath);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('persona')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Failed to load profile persona for onboarding:', profileError);
  }

  const persona = (profile?.persona ?? 'unknown') as 'individual' | 'org_member' | 'unknown';

  const initialPersona: Persona =
    persona === 'individual' ? 'individual' : persona === 'org_member' ? 'organization' : null;

  return <OnboardingClient initialPersona={initialPersona} />;
}
