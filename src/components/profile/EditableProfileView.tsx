'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { GuidedProfileSetupView } from './GuidedProfileSetupView';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useProfileViewState } from './editable-profile/useProfileViewState';
import { PortfolioReadinessChecklist } from './editable-profile/PortfolioReadinessChecklist';
import { ProfileCompletionBanner } from './editable-profile/ProfileCompletionBanner';
import { ProfileDialogs } from './editable-profile/ProfileDialogs';
import { ProfileHeroSection } from './editable-profile/ProfileHeroSection';
import { ProfileSidebar } from './editable-profile/ProfileSidebar';
import { ProfileTabsSection } from './editable-profile/ProfileTabsSection';
import { useProfileData } from '@/hooks/useProfileData';
import { MobileProfileHeader } from '@/components/profile/MobileProfileHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FirstProofDialog,
  type FirstProofAnchorOption,
  type FirstProofSkillOption,
} from '@/components/proofs/FirstProofDialog';
import { evaluateIndividualProfileCompletion } from '@/lib/profile/completion-flow';
import type {
  Education,
  Experience,
  ImpactStory,
  ProfileData,
  Volunteering,
} from '@/types/profile';

function resolvePortfolioGateMessage(lockReason: string | null): string {
  switch (lockReason) {
    case 'safe_shell':
      return 'Public portfolio is locked until your safe shell is complete.';
    case 'context':
      return 'Public portfolio is locked until you add one real context.';
    case 'proof':
      return 'Public portfolio is locked until you add and structure your first proof from the profile Proof Packs tab.';
    case 'verification':
      return 'Public portfolio is locked until one accepted non-self verification is tied to anchored proof.';
    case 'publish':
      return 'Public portfolio is locked until you choose one proof-backed signal to publish from the profile Visibility / Portfolio tab.';
    default:
      return 'Complete the required profile steps to unlock your public portfolio.';
  }
}

type EditableProfileViewProps = {
  initialProfile?: ProfileData | null;
};

export function EditableProfileView({ initialProfile = null }: EditableProfileViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    profile,
    isLoading,
    loadError,
    retryLoad,
    isPending,
    pending,
    profileCompletion,
    updateBasicInfo,
    updateMission,
    updateVision,
    replaceValues,
    replaceCauses,
    addImpactStory,
    sendImpactStoryVerificationRequest,
    deleteImpactStory,
    updateImpactStory,
    addExperience,
    deleteExperience,
    updateExperience,
    addEducation,
    deleteEducation,
    updateEducation,
    addVolunteering,
    deleteVolunteering,
    updateVolunteering,
    toggleRedactMode,
  } = useProfileData(initialProfile);

  const {
    isEditProfileOpen,
    setIsEditProfileOpen,
    isMissionEditorOpen,
    setIsMissionEditorOpen,
    isVisionEditorOpen,
    setIsVisionEditorOpen,
    isValuesEditorOpen,
    setIsValuesEditorOpen,
    isCausesEditorOpen,
    setIsCausesEditorOpen,
    isImpactStoryFormOpen,
    setIsImpactStoryFormOpen,
    isExperienceFormOpen,
    setIsExperienceFormOpen,
    isEducationFormOpen,
    setIsEducationFormOpen,
    isVolunteerFormOpen,
    setIsVolunteerFormOpen,
    isShareDialogOpen,
    setIsShareDialogOpen,
  } = useProfileViewState();
  const [editingImpactStory, setEditingImpactStory] = useState<ImpactStory | null>(null);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingVolunteering, setEditingVolunteering] = useState<Volunteering | null>(null);
  const [forceFullProfileView, setForceFullProfileView] = useState(false);
  const [isFirstProofDialogOpen, setIsFirstProofDialogOpen] = useState(false);

  const completionState = useMemo(
    () =>
      evaluateIndividualProfileCompletion({
        displayName: profile?.basicInfo.name,
        handle: profile?.guidedSetup.handle,
        headline: profile?.guidedSetup.headline,
        location: profile?.basicInfo.location,
        timezone: profile?.guidedSetup.timezone,
        desiredRolesCount: profile?.guidedSetup.desiredRoles.length ?? 0,
        workPreference: profile?.guidedSetup.workMode,
        engagementType: profile?.guidedSetup.engagementType,
        contextCount:
          (profile?.experiences.length ?? 0) +
          (profile?.education.length ?? 0) +
          (profile?.volunteering.length ?? 0),
        valuesCount: profile?.values.length ?? 0,
        causesCount: profile?.causes.length ?? 0,
        skillsCount: profile?.skills.length ?? 0,
        proofCount: profile?.anchoredProofPackCount ?? profile?.proofArtifactCount ?? 0,
        proofArtifactCount: profile?.proofArtifactCount ?? 0,
        anchoredProofPackCount: profile?.anchoredProofPackCount ?? 0,
        acceptedVerificationCount: profile?.acceptedVerificationCount ?? 0,
        publicProofCount: profile?.publicProofCount ?? 0,
        publishedPortfolio: profile?.publishedPortfolio ?? false,
      }),
    [profile]
  );

  const openPurposeEditor = useCallback(
    (field: 'mission' | 'vision') => {
      if (field === 'mission') {
        setIsMissionEditorOpen(true);
      } else {
        setIsVisionEditorOpen(true);
      }
    },
    [setIsMissionEditorOpen, setIsVisionEditorOpen]
  );

  const openMissionEditor = useCallback(() => {
    openPurposeEditor('mission');
  }, [openPurposeEditor]);

  const openVisionEditor = useCallback(() => {
    openPurposeEditor('vision');
  }, [openPurposeEditor]);

  const showPortfolioGateNotice = searchParams.get('portfolioLocked') === '1';
  const lockReasonFromRoute = searchParams.get('lockReason');
  const fullProfileOverride = searchParams.get('profileView') === 'full';
  const shouldOpenFirstProof = searchParams.get('proof') === 'first';
  const requestedProfileTab = searchParams.get('tab');
  const profileTab =
    requestedProfileTab === 'proof_packs' ||
    requestedProfileTab === 'verification' ||
    requestedProfileTab === 'visibility' ||
    requestedProfileTab === 'context'
      ? requestedProfileTab
      : undefined;

  useEffect(() => {
    if (fullProfileOverride) {
      setForceFullProfileView(true);
    }
  }, [fullProfileOverride]);

  useEffect(() => {
    if (shouldOpenFirstProof) {
      setForceFullProfileView(true);
      setIsFirstProofDialogOpen(true);
    }
  }, [shouldOpenFirstProof]);

  const portfolioGateNotice = showPortfolioGateNotice ? (
    <Card className="mb-6 p-4 border-amber-300 bg-amber-50/70 text-amber-900">
      <p className="text-sm">{resolvePortfolioGateMessage(lockReasonFromRoute)}</p>
    </Card>
  ) : null;

  const availableSkillNames = useMemo(
    () => profile?.skills.map((skill) => skill.name).filter(Boolean) ?? [],
    [profile?.skills]
  );
  const firstProofSkills: FirstProofSkillOption[] = useMemo(
    () =>
      profile?.skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
      })) ?? [],
    [profile?.skills]
  );
  const firstProofAnchors: FirstProofAnchorOption[] = useMemo(
    () =>
      profile
        ? [
            ...profile.experiences.map((experience) => ({
              id: experience.id,
              type: 'experience' as const,
              label: experience.title,
              detail: [experience.organizationName, experience.duration]
                .filter(Boolean)
                .join(' · '),
            })),
            ...profile.education.map((education) => ({
              id: education.id,
              type: 'education' as const,
              label: education.degree,
              detail: [education.institution, education.duration].filter(Boolean).join(' · '),
            })),
            ...profile.volunteering.map((volunteering) => ({
              id: volunteering.id,
              type: 'volunteering' as const,
              label: volunteering.title,
              detail: [volunteering.cause, volunteering.duration].filter(Boolean).join(' · '),
            })),
          ]
        : [],
    [profile]
  );
  const valuesCount = profile?.values.length ?? 0;
  const causesCount = profile?.causes.length ?? 0;

  const openFullProfileView = useCallback(() => {
    setForceFullProfileView(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('profileView', 'full');

    const query = params.toString();
    const nextUrl = query
      ? `${pathname ?? '/app/i/profile'}?${query}`
      : (pathname ?? '/app/i/profile');
    router.replace(nextUrl);

    void fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'profile_guided_open_full',
        event_data: {
          stage: completionState.stage,
          valuesCount,
          causesCount,
        },
      }),
    }).catch(() => undefined);
  }, [causesCount, completionState.stage, pathname, router, searchParams, valuesCount]);

  const openProfileTab = useCallback(
    (tab: 'proof_packs' | 'verification' | 'visibility') => {
      setForceFullProfileView(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set('profileView', 'full');
      params.set('tab', tab);

      const query = params.toString();
      router.replace(`${pathname ?? '/app/i/profile'}${query ? `?${query}` : ''}`);
    },
    [pathname, router, searchParams]
  );

  const openAddImpactStory = () => {
    setEditingImpactStory(null);
    setIsImpactStoryFormOpen(true);
  };

  const openEditImpactStory = (story: ImpactStory) => {
    setEditingImpactStory(story);
    setIsImpactStoryFormOpen(true);
  };

  const handleImpactStoryFormOpenChange = (open: boolean) => {
    setIsImpactStoryFormOpen(open);
    if (!open) {
      setEditingImpactStory(null);
    }
  };

  const openAddExperience = () => {
    setEditingExperience(null);
    setIsExperienceFormOpen(true);
  };

  const openEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setIsExperienceFormOpen(true);
  };

  const handleExperienceFormOpenChange = (open: boolean) => {
    setIsExperienceFormOpen(open);
    if (!open) {
      setEditingExperience(null);
    }
  };

  const openAddEducation = () => {
    setEditingEducation(null);
    setIsEducationFormOpen(true);
  };

  const openEditEducation = (item: Education) => {
    setEditingEducation(item);
    setIsEducationFormOpen(true);
  };

  const handleEducationFormOpenChange = (open: boolean) => {
    setIsEducationFormOpen(open);
    if (!open) {
      setEditingEducation(null);
    }
  };

  const openAddVolunteering = () => {
    setEditingVolunteering(null);
    setIsVolunteerFormOpen(true);
  };

  const openEditVolunteering = (item: Volunteering) => {
    setEditingVolunteering(item);
    setIsVolunteerFormOpen(true);
  };

  const handleVolunteeringFormOpenChange = (open: boolean) => {
    setIsVolunteerFormOpen(open);
    if (!open) {
      setEditingVolunteering(null);
    }
  };

  const profileDialogs = profile ? (
    <ProfileDialogs
      profile={profile}
      isEditProfileOpen={isEditProfileOpen}
      setIsEditProfileOpen={setIsEditProfileOpen}
      isMissionEditorOpen={isMissionEditorOpen}
      setIsMissionEditorOpen={setIsMissionEditorOpen}
      isVisionEditorOpen={isVisionEditorOpen}
      setIsVisionEditorOpen={setIsVisionEditorOpen}
      isValuesEditorOpen={isValuesEditorOpen}
      setIsValuesEditorOpen={setIsValuesEditorOpen}
      isCausesEditorOpen={isCausesEditorOpen}
      setIsCausesEditorOpen={setIsCausesEditorOpen}
      isImpactStoryFormOpen={isImpactStoryFormOpen}
      setIsImpactStoryFormOpen={handleImpactStoryFormOpenChange}
      isExperienceFormOpen={isExperienceFormOpen}
      setIsExperienceFormOpen={handleExperienceFormOpenChange}
      isEducationFormOpen={isEducationFormOpen}
      setIsEducationFormOpen={handleEducationFormOpenChange}
      isVolunteerFormOpen={isVolunteerFormOpen}
      setIsVolunteerFormOpen={handleVolunteeringFormOpenChange}
      isShareDialogOpen={isShareDialogOpen}
      setIsShareDialogOpen={setIsShareDialogOpen}
      editingImpactStory={editingImpactStory}
      editingExperience={editingExperience}
      editingEducation={editingEducation}
      editingVolunteering={editingVolunteering}
      availableSkillNames={availableSkillNames}
      onUpdateBasicInfo={updateBasicInfo}
      onUpdateMission={updateMission}
      onUpdateVision={updateVision}
      onReplaceValues={replaceValues}
      onReplaceCauses={replaceCauses}
      onAddImpactStory={addImpactStory}
      onRequestImpactStoryVerification={sendImpactStoryVerificationRequest}
      onUpdateImpactStory={updateImpactStory}
      onAddExperience={addExperience}
      onUpdateExperience={updateExperience}
      onAddEducation={addEducation}
      onUpdateEducation={updateEducation}
      onAddVolunteering={addVolunteering}
      onUpdateVolunteering={updateVolunteering}
    />
  ) : null;

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  const isV2 = process.env.NEXT_PUBLIC_UI_REFACTOR_V2 === 'true';
  const bgClass = isV2 ? 'bg-transparent' : 'bg-proofound-parchment dark:bg-background';

  if (loadError || !profile) {
    return (
      <div className={`min-h-[calc(100vh-3.5rem)] ${bgClass}`}>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Card className="p-8 text-center space-y-4" data-testid="profile-load-error">
            <h1 className="text-2xl font-display">Unable to load your profile</h1>
            <p className="text-sm text-muted-foreground">
              The profile page did not load successfully. Try again or return to your dashboard.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button onClick={retryLoad}>Try again</Button>
              <Button variant="outline" onClick={() => router.push('/app/i/home')}>
                Back to dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const showCompletionBanner = profileCompletion < 80;
  const showGuidedFlow =
    !completionState.isPortfolioReady && !(fullProfileOverride || forceFullProfileView);

  if (showGuidedFlow) {
    return (
      <>
        <div className={`min-h-[calc(100vh-3.5rem)] ${bgClass}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {portfolioGateNotice}
            <PortfolioReadinessChecklist completionState={completionState} />
          </div>
          <GuidedProfileSetupView
            completionState={completionState}
            onEditProfile={() => setIsEditProfileOpen(true)}
            onOpenFullProfile={openFullProfileView}
            onAddExperience={openAddExperience}
            onAddEducation={openAddEducation}
            onAddVolunteering={openAddVolunteering}
            onOpenProofs={() => setIsFirstProofDialogOpen(true)}
            onOpenVerification={() => router.push('/app/i/verifications')}
            onOpenPortfolio={() => openProfileTab('visibility')}
            onOpenMatchingPreferences={() => router.push('/app/i/matching/preferences')}
          />
        </div>
        {profileDialogs}
        <FirstProofDialog
          open={isFirstProofDialogOpen}
          onOpenChange={setIsFirstProofDialogOpen}
          skills={firstProofSkills}
          anchors={firstProofAnchors}
          onProofAdded={retryLoad}
        />
      </>
    );
  }

  return (
    <div
      className={`min-h-[calc(100vh-3.5rem)] pb-12 ${bgClass}`}
      data-testid="individual-profile-root"
    >
      {showCompletionBanner && <ProfileCompletionBanner profileCompletion={profileCompletion} />}

      <MobileProfileHeader
        name={profile.basicInfo.name}
        avatarUrl={profile.basicInfo.avatar}
        tagline={profile.basicInfo.tagline}
      />

      <ProfileHeroSection
        profile={profile}
        isPending={isPending}
        pending={{
          updatingBasicInfo: pending.updatingBasicInfo,
          redactMode: pending.redactMode,
        }}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onToggleRedact={toggleRedactMode}
        onShare={() => setIsShareDialogOpen(true)}
        onUpdateBasicInfo={updateBasicInfo}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {portfolioGateNotice}
        {!completionState.isPortfolioReady && (
          <div className="mb-6">
            <PortfolioReadinessChecklist completionState={completionState} />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 relative items-start">
          <div className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <ProfileSidebar
              profile={profile}
              onOpenMission={openMissionEditor}
              onOpenVision={openVisionEditor}
              onOpenValues={() => setIsValuesEditorOpen(true)}
              onOpenCauses={() => setIsCausesEditorOpen(true)}
            />
          </div>

          <div className="lg:col-span-2">
            <ProfileTabsSection
              impactStories={profile.impactStories}
              experiences={profile.experiences}
              education={profile.education}
              volunteering={profile.volunteering}
              completionState={completionState}
              initialTab={profileTab}
              proofArtifactCount={profile.proofArtifactCount ?? 0}
              acceptedVerificationCount={profile.acceptedVerificationCount ?? 0}
              isPending={isPending}
              impactPending={pending.impactStory}
              onAddImpactStory={openAddImpactStory}
              onEditImpactStory={openEditImpactStory}
              onDeleteImpactStory={deleteImpactStory}
              onAddExperience={openAddExperience}
              onEditExperience={openEditExperience}
              onDeleteExperience={deleteExperience}
              onAddEducation={openAddEducation}
              onEditEducation={openEditEducation}
              onDeleteEducation={deleteEducation}
              onAddVolunteering={openAddVolunteering}
              onEditVolunteering={openEditVolunteering}
              onDeleteVolunteering={deleteVolunteering}
              onImportContextComplete={retryLoad}
              onAddFirstProof={() => setIsFirstProofDialogOpen(true)}
              onCompleteSafeShell={() => setIsEditProfileOpen(true)}
            />
          </div>
        </div>
      </div>

      {profileDialogs}
      <FirstProofDialog
        open={isFirstProofDialogOpen}
        onOpenChange={setIsFirstProofDialogOpen}
        skills={firstProofSkills}
        anchors={firstProofAnchors}
        onProofAdded={retryLoad}
      />
    </div>
  );
}
