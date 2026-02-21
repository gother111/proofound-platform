'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { EmptyProfileStateView } from './EmptyProfileStateView';
import { useProfileViewState } from './editable-profile/useProfileViewState';
import { ProfileCompletionBanner } from './editable-profile/ProfileCompletionBanner';
import { ProfileDialogs } from './editable-profile/ProfileDialogs';
import { ProfileHeroSection } from './editable-profile/ProfileHeroSection';
import { ProfileSidebar } from './editable-profile/ProfileSidebar';
import { ProfileTabsSection } from './editable-profile/ProfileTabsSection';
import { useProfileData } from '@/hooks/useProfileData';
import { MobileProfileHeader } from '@/components/profile/MobileProfileHeader';

export function EditableProfileView() {
  const router = useRouter();
  const {
    profile,
    isLoading,
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

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-proofound-parchment dark:bg-background flex items-center justify-center">
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">Loading profile...</p>
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
        onOpenMission={() => setIsMissionEditorOpen(true)}
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
    <div className="min-h-screen bg-proofound-parchment dark:bg-background">
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
              onOpenMission={() => setIsMissionEditorOpen(true)}
              onOpenVision={() => setIsVisionEditorOpen(true)}
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
