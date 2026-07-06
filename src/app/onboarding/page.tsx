import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { resolveUserHomePath, getPersona, getUserOrganizations, getCurrentUser } from '@/lib/auth';
import { OnboardingClient } from '@/components/onboarding/OnboardingClient';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';

type OnboardingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function normalizeInternalNextPath(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const nextPath = rawValue?.trim();

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return undefined;
  }

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(nextPath)) {
    return undefined;
  }

  return nextPath.slice(0, 2000);
}

function isExpectedMissingAuthSession(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AuthSessionMissingError' || error.message === 'Auth session missing!')
  );
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const individualCompletionPath = normalizeInternalNextPath(resolvedSearchParams.next);
  const startFromCvScaffoldingSurface = START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError && !isExpectedMissingAuthSession(userError)) {
    console.error('Failed to load authenticated user for onboarding:', userError);
  }

  if (!user) {
    redirect('/login');
  }

  // Resolve the persona-specific first-run path. Individuals enter first-proof onboarding.
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
      return (
        <OnboardingClient
          initialPersona="individual"
          individualCompletionPath={individualCompletionPath}
          startFromCvScaffoldingSurface={startFromCvScaffoldingSurface}
        />
      );
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
      redirect(`/app/o/${encodeURIComponent(slug)}/home`);
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
        return (
          <OnboardingClient
            initialPersona="individual"
            individualCompletionPath={individualCompletionPath}
            startFromCvScaffoldingSurface={startFromCvScaffoldingSurface}
          />
        );
      }

      redirect('/app/i/home');
    }

    // Truly new user - show persona choice
    return (
      <OnboardingClient
        initialPersona={null}
        individualCompletionPath={individualCompletionPath}
        startFromCvScaffoldingSurface={startFromCvScaffoldingSurface}
      />
    );
  }

  // Profile is complete, redirect to their home page
  const homePath = await resolveUserHomePath(supabase);
  redirect(homePath);
}
