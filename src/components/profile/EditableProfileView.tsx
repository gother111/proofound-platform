'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { EmptyProfileStateView } from './EmptyProfileStateView';
import { ProfileSkeleton } from './ProfileSkeleton';
import { useProfileViewState } from './editable-profile/useProfileViewState';
import { ProfileCompletionBanner } from './editable-profile/ProfileCompletionBanner';
import { ProfileDialogs } from './editable-profile/ProfileDialogs';
import { ProfileHeroSection } from './editable-profile/ProfileHeroSection';
import { ProfileSidebar } from './editable-profile/ProfileSidebar';
import { ProfileTabsSection } from './editable-profile/ProfileTabsSection';
import { useProfileData } from '@/hooks/useProfileData';
import { MobileProfileHeader } from '@/components/profile/MobileProfileHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function EditableProfileView() {
  const router = useRouter();
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
    deleteImpactStory,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addVolunteering,
    deleteVolunteering,
    toggleRedactMode,
  } = useProfileData();

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

  const isEmptyProfile = useMemo(() => {
    if (!profile) {
      return true;
    }

    const {
      basicInfo,
      mission,
      values,
      causes,
      skills,
      impactStories,
      experiences,
      education,
      volunteering,
    } = profile;

    const hasAvatar = Boolean(basicInfo.avatar);
    const hasTagline = Boolean(basicInfo.tagline?.trim());
    const hasMission = Boolean(mission?.trim());
    const hasValues = values.length > 0;
    const hasCauses = causes.length > 0;
    const hasSkills = skills.length > 0;
    const hasAnyEntries =
      impactStories.length > 0 ||
      experiences.length > 0 ||
      education.length > 0 ||
      volunteering.length > 0;

    return (
      !hasAvatar &&
      !hasTagline &&
      !hasMission &&
      !hasValues &&
      !hasCauses &&
      !hasSkills &&
      !hasAnyEntries
    );
  }, [profile]);

  const openPurposeEditor = useCallback(
    (field: 'mission' | 'vision') => {
      if (!profile) {
        return;
      }

      const hasValues = profile.values.length > 0;
      const hasCauses = profile.causes.length > 0;

      if (!hasValues) {
        setIsValuesEditorOpen(true);
        toast.info(
          `Add at least one value before editing your ${field}. Values and causes must be completed first.`
        );
        return;
      }

      if (!hasCauses) {
        setIsCausesEditorOpen(true);
        toast.info(
          `Add at least one cause before editing your ${field}. Values and causes must be completed first.`
        );
        return;
      }

      if (field === 'mission') {
        setIsMissionEditorOpen(true);
      } else {
        setIsVisionEditorOpen(true);
      }
    },
    [
      profile,
      setIsCausesEditorOpen,
      setIsMissionEditorOpen,
      setIsValuesEditorOpen,
      setIsVisionEditorOpen,
    ]
  );

  const openMissionEditor = useCallback(() => {
    openPurposeEditor('mission');
  }, [openPurposeEditor]);

  const openVisionEditor = useCallback(() => {
    openPurposeEditor('vision');
  }, [openPurposeEditor]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (loadError || !profile) {
    return (
      <div className="min-h-screen bg-proofound-parchment dark:bg-background">
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

  if (isEmptyProfile) {
    return (
      <EmptyProfileStateView
        basicInfo={profile.basicInfo}
        profileCompletion={profileCompletion}
        isPending={isPending}
        pending={pending}
        onEditProfile={() => setIsEditProfileOpen(true)}
        onOpenMission={openMissionEditor}
        onOpenValues={() => setIsValuesEditorOpen(true)}
        onOpenCauses={() => setIsCausesEditorOpen(true)}
        onOpenSkills={() => router.push('/app/i/expertise')}
        onAddImpactStory={() => setIsImpactStoryFormOpen(true)}
        onAddExperience={() => setIsExperienceFormOpen(true)}
        onAddEducation={() => setIsEducationFormOpen(true)}
        onAddVolunteering={() => setIsVolunteerFormOpen(true)}
        onUpdateBasicInfo={updateBasicInfo}
      />
    );
  }

  return (
    <div
      className="min-h-screen bg-proofound-parchment dark:bg-background"
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
              isPending={isPending}
              impactPending={pending.impactStory}
              onAddImpactStory={() => setIsImpactStoryFormOpen(true)}
              onDeleteImpactStory={deleteImpactStory}
              onAddExperience={() => setIsExperienceFormOpen(true)}
              onDeleteExperience={deleteExperience}
              onAddEducation={() => setIsEducationFormOpen(true)}
              onDeleteEducation={deleteEducation}
              onAddVolunteering={() => setIsVolunteerFormOpen(true)}
              onDeleteVolunteering={deleteVolunteering}
            />
          </div>
        </div>
      </div>

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
        setIsImpactStoryFormOpen={setIsImpactStoryFormOpen}
        isExperienceFormOpen={isExperienceFormOpen}
        setIsExperienceFormOpen={setIsExperienceFormOpen}
        isEducationFormOpen={isEducationFormOpen}
        setIsEducationFormOpen={setIsEducationFormOpen}
        isVolunteerFormOpen={isVolunteerFormOpen}
        setIsVolunteerFormOpen={setIsVolunteerFormOpen}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        onUpdateBasicInfo={updateBasicInfo}
        onUpdateMission={updateMission}
        onUpdateVision={updateVision}
        onReplaceValues={replaceValues}
        onReplaceCauses={replaceCauses}
        onAddImpactStory={addImpactStory}
        onAddExperience={addExperience}
        onAddEducation={addEducation}
        onAddVolunteering={addVolunteering}
      />
    </div>
  );
}
