'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { getProfileShellData } from '@/actions/profile-shell';
import { evaluateIndividualProfileCompletion } from '@/lib/profile/completion-flow';
import type { ProfileData } from '@/types/profile';
import type { EditableProfileViewProps } from './EditableProfileView';

function ProfileReadinessPreview({ profile }: { profile: ProfileData }) {
  const completionState = evaluateIndividualProfileCompletion({
    displayName: profile.basicInfo.name,
    handle: profile.guidedSetup.handle,
    headline: profile.guidedSetup.headline,
    location: profile.basicInfo.location,
    timezone: profile.guidedSetup.timezone,
    desiredRolesCount: profile.guidedSetup.desiredRoles.length,
    workPreference: profile.guidedSetup.workMode,
    engagementType: profile.guidedSetup.engagementType,
    contextCount:
      profile.experiences.length + profile.education.length + profile.volunteering.length,
    skillsCount: profile.skills.length,
    proofCount: profile.anchoredProofPackCount ?? profile.proofArtifactCount ?? 0,
    proofArtifactCount: profile.proofArtifactCount ?? 0,
    anchoredProofPackCount: profile.anchoredProofPackCount ?? 0,
    acceptedVerificationCount: profile.acceptedVerificationCount ?? 0,
    publicProofCount: profile.publicProofCount ?? 0,
    publishedPortfolio: profile.publishedPortfolio ?? false,
  });

  const checklist = [
    {
      id: 'safe_shell',
      label: 'Safe shell is complete',
      passed: completionState.checks.hasSafeShell,
    },
    {
      id: 'context',
      label: 'One real context is anchored',
      passed: completionState.checks.hasRealContext,
    },
    {
      id: 'proof',
      label: 'One real proof is added and structured',
      passed: completionState.checks.hasFirstProof && completionState.checks.hasStructuredProofPack,
    },
    {
      id: 'verification',
      label: 'One non-self verification is accepted',
      passed: completionState.checks.hasRequiredVerification,
    },
  ];
  const completedCount = checklist.filter((item) => item.passed).length;

  return (
    <div
      className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6"
      data-testid="profile-shell-preview"
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="rounded-2xl border border-proofound-stone/60 bg-white/75 p-4 shadow-sm sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-sm font-semibold text-white">
                  {completedCount}/{checklist.length}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-proofound-charcoal">
                    Public Page readiness
                  </h2>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Complete one clear proof path before publishing.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-proofound-stone/70 bg-white/65 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-proofound-charcoal">
                  Next
                </p>
                <p className="mt-1 text-sm text-proofound-charcoal">
                  {completionState.portfolioLockReason ?? 'Public Page is ready to review'}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-proofound-stone/60 bg-white/55 px-3 py-2 text-sm"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      item.passed ? 'bg-emerald-600' : 'bg-muted-foreground/50'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={item.passed ? 'text-proofound-charcoal' : 'text-muted-foreground'}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-proofound-stone/60 bg-white/70 p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h1 className="font-display text-2xl text-proofound-charcoal">
                Start with proof, not profile polish
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Build only the parts that make the first proof credible: safe shell, one real
                context, one structured Proof Pack, then decide what trust signal comes next.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl border border-proofound-stone/50 bg-white/65"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeferredEditableProfileView(props: EditableProfileViewProps) {
  const [ProfileView, setProfileView] = useState<ComponentType<EditableProfileViewProps> | null>(
    null
  );
  const [initialProfile, setInitialProfile] = useState<ProfileData | null>(
    props.initialProfile ?? null
  );
  const [profileLoadSettled, setProfileLoadSettled] = useState(Boolean(props.initialProfile));
  const [initialProfileIsPartial, setInitialProfileIsPartial] = useState(
    Boolean(props.initialProfile && props.refreshInitialProfile)
  );

  useEffect(() => {
    let cancelled = false;

    void import('./EditableProfileView').then((module) => {
      if (!cancelled) {
        setProfileView(() => module.EditableProfileView);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (props.initialProfile) {
      setInitialProfile(props.initialProfile);
      setInitialProfileIsPartial(Boolean(props.refreshInitialProfile));
      setProfileLoadSettled(true);
      return;
    }

    let cancelled = false;
    const searchParams = new URLSearchParams(window.location.search);
    const shouldLoadFullProfileFirst = searchParams.get('profileView') === 'full';
    const profilePromise = shouldLoadFullProfileFirst
      ? import('@/actions/profile').then((module) => module.getProfileData())
      : getProfileShellData();

    void profilePromise
      .then((profile) => {
        if (!cancelled) {
          setInitialProfile(profile);
          setInitialProfileIsPartial(!shouldLoadFullProfileFirst);
        }
      })
      .catch(() => {
        // Let EditableProfileView's existing retry/error path handle transient load failures.
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoadSettled(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [props.initialProfile, props.refreshInitialProfile]);

  if (!profileLoadSettled) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-white/70" />
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="h-72 animate-pulse rounded-2xl bg-white/70" />
            <div className="h-96 animate-pulse rounded-2xl bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  if (!ProfileView && initialProfile) {
    return <ProfileReadinessPreview profile={initialProfile} />;
  }

  if (!ProfileView) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-proofound-parchment p-4 md:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="h-40 animate-pulse rounded-2xl bg-white/70" />
          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div className="h-72 animate-pulse rounded-2xl bg-white/70" />
            <div className="h-96 animate-pulse rounded-2xl bg-white/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProfileView
      {...props}
      initialProfile={initialProfile}
      refreshInitialProfile={initialProfileIsPartial}
    />
  );
}
