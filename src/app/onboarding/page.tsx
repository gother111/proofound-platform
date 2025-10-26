import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath, getPersona, getUserOrganizations, getCurrentUser } from '@/lib/auth';
import { OnboardingClient } from '@/components/onboarding/OnboardingClient';

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

  // Check if user profile is complete based on their persona
  const persona = await getPersona(user.id);

  // For organization members: check if they have an organization
  if (persona === 'org_member') {
    const orgs = await getUserOrganizations(user.id);
    if (orgs.length === 0) {
      // Show organization onboarding
      return <OnboardingClient initialPersona="organization" />;
    }
  } else if (persona === 'individual') {
    // Check if profile is complete (has handle)
    const profile = await getCurrentUser();
    if (!profile?.handle) {
      // Show individual onboarding
      return <OnboardingClient initialPersona="individual" />;
    }
  } else if (persona === 'unknown') {
    // Show persona choice
    return <OnboardingClient initialPersona={null} />;
  }

  // Profile is complete, redirect to their home page
  const homePath = await resolveUserHomePath(supabase);
  redirect(homePath);
}
