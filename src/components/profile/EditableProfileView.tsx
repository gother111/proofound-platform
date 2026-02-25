'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import type { Education, Volunteering } from '@/types/profile';

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
    updateEducation,
    addVolunteering,
    deleteVolunteering,
    updateVolunteering,
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
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [editingVolunteering, setEditingVolunteering] = useState<Volunteering | null>(null);

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

  const availableSkillNames = useMemo(
    () => profile?.skills.map((skill) => skill.name).filter(Boolean) ?? [],
    [profile?.skills]
  );

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
        onOpenMission={() => setIsMissionEditorOpen(true)}
        onOpenValues={() => setIsValuesEditorOpen(true)}
        onOpenCauses={() => setIsCausesEditorOpen(true)}
        onOpenSkills={() => router.push('/app/i/expertise')}
        onAddImpactStory={() => setIsImpactStoryFormOpen(true)}
        onAddExperience={() => setIsExperienceFormOpen(true)}
        onAddEducation={openAddEducation}
        onAddVolunteering={openAddVolunteering}
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
              onAddEducation={openAddEducation}
              onEditEducation={openEditEducation}
              onDeleteEducation={deleteEducation}
              onAddVolunteering={openAddVolunteering}
              onEditVolunteering={openEditVolunteering}
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
        setIsEducationFormOpen={handleEducationFormOpenChange}
        isVolunteerFormOpen={isVolunteerFormOpen}
        setIsVolunteerFormOpen={handleVolunteeringFormOpenChange}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        editingEducation={editingEducation}
        editingVolunteering={editingVolunteering}
        availableSkillNames={availableSkillNames}
        onUpdateBasicInfo={updateBasicInfo}
        onUpdateMission={updateMission}
        onUpdateVision={updateVision}
        onReplaceValues={replaceValues}
        onReplaceCauses={replaceCauses}
        onAddImpactStory={addImpactStory}
        onAddExperience={addExperience}
        onAddEducation={addEducation}
        onUpdateEducation={updateEducation}
        onAddVolunteering={addVolunteering}
        onUpdateVolunteering={updateVolunteering}
      />
    </div>
  );
}
