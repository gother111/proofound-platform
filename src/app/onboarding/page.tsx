import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath, getPersona, getUserOrganizations, getCurrentUser } from '@/lib/auth';
import { OnboardingClient } from '@/components/onboarding/OnboardingClient';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';

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

  // Resolve the persona-specific first-run path. Individuals enter first-proof onboarding, not a
  // broad profile-completion setup.
  const persona = await getPersona(user.id);

  // For organization members: check if they have an organization
  if (persona === 'org_member') {
    const orgs = await getUserOrganizations(user.id);
    if (orgs.length === 0) {
      // Show organization onboarding
      return <OnboardingClient initialPersona="organization" />;
    }
  } else if (persona === 'individual') {
    const completionState = await getIndividualProfileCompletionState(user.id);
    if (!completionState.checks.hasStructuredProofPack) {
      // Show individual first-proof onboarding until one context-anchored Proof Pack exists.
      return <OnboardingClient initialPersona="individual" />;
    }
  } else if (persona === 'unknown') {
    // Check if they have an existing organization (legacy users)
    const orgs = await getUserOrganizations(user.id);
    if (orgs.length > 0) {
      // They have an org - update persona and redirect to org home
      await supabase
        .from('profiles')
        .update({ persona: 'org_member', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const slug = orgs[0].org.slug;
      redirect(`/app/o/${slug}/home`);
    }

    // Check if they have an individual profile
    const profile = await getCurrentUser();
    if (profile?.handle) {
      // They have a profile shell. Keep empty/no-proof users in first-proof onboarding.
      await supabase
        .from('profiles')
        .update({ persona: 'individual', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const completionState = await getIndividualProfileCompletionState(user.id);
      if (!completionState.checks.hasStructuredProofPack) {
        return <OnboardingClient initialPersona="individual" />;
      }

      redirect('/app/i/home');
    }

    // Truly new user - show persona choice
    return <OnboardingClient initialPersona={null} />;
  }

  // Profile is complete, redirect to their home page
  const homePath = await resolveUserHomePath(supabase);
  redirect(homePath);
}
