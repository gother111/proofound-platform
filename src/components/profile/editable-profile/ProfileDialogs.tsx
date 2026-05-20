import type { Dispatch, SetStateAction } from 'react';

import { EducationForm } from '@/components/profile/forms/EducationForm';
import { ExperienceForm } from '@/components/profile/forms/ExperienceForm';
import { ImpactStoryForm } from '@/components/profile/forms/ImpactStoryForm';
import { VolunteerForm } from '@/components/profile/forms/VolunteerForm';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { ShareProfileDialog } from '@/components/profile/ShareProfileDialog';
import type {
  Education,
  Experience,
  ImpactStory,
  ImpactStoryVerificationRequestDispatchParams,
  ImpactStoryVerificationRequestDispatchResult,
  ProfileData,
  Volunteering,
} from '@/types/profile';

type ProfileDialogsProps = {
  profile: ProfileData;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: Dispatch<SetStateAction<boolean>>;
  isImpactStoryFormOpen: boolean;
  setIsImpactStoryFormOpen: (open: boolean) => void;
  isExperienceFormOpen: boolean;
  setIsExperienceFormOpen: (open: boolean) => void;
  isEducationFormOpen: boolean;
  setIsEducationFormOpen: (open: boolean) => void;
  isVolunteerFormOpen: boolean;
  setIsVolunteerFormOpen: (open: boolean) => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: Dispatch<SetStateAction<boolean>>;
  editingImpactStory: ImpactStory | null;
  editingExperience: Experience | null;
  editingEducation: Education | null;
  editingVolunteering: Volunteering | null;
  availableSkillNames: string[];
  onUpdateBasicInfo: (updates: Partial<ProfileData['basicInfo']>) => void;
  onAddImpactStory: (story: Omit<ImpactStory, 'id'>) => Promise<void> | void;
  onRequestImpactStoryVerification: (
    params: ImpactStoryVerificationRequestDispatchParams
  ) =>
    | Promise<ImpactStoryVerificationRequestDispatchResult>
    | ImpactStoryVerificationRequestDispatchResult;
  onUpdateImpactStory: (id: string, story: Omit<ImpactStory, 'id'>) => Promise<void> | void;
  onAddExperience: (experience: Omit<Experience, 'id'>) => void;
  onUpdateExperience: (id: string, experience: Omit<Experience, 'id'>) => Promise<void> | void;
  onAddEducation: (education: Omit<Education, 'id'>) => void;
  onUpdateEducation: (id: string, education: Omit<Education, 'id'>) => void;
  onAddVolunteering: (volunteering: Omit<Volunteering, 'id'>) => void;
  onUpdateVolunteering: (id: string, volunteering: Omit<Volunteering, 'id'>) => void;
};

export function ProfileDialogs({
  profile,
  isEditProfileOpen,
  setIsEditProfileOpen,
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
  editingImpactStory,
  editingExperience,
  editingEducation,
  editingVolunteering,
  availableSkillNames,
  onUpdateBasicInfo,
  onAddImpactStory,
  onRequestImpactStoryVerification,
  onUpdateImpactStory,
  onAddExperience,
  onUpdateExperience,
  onAddEducation,
  onUpdateEducation,
  onAddVolunteering,
  onUpdateVolunteering,
}: ProfileDialogsProps) {
  const proofPackOptions =
    profile.proofPacks?.map((pack) => ({
      id: pack.id,
      title: pack.title,
    })) ?? [];

  return (
    <>
      <EditProfileModal
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        basicInfo={profile.basicInfo}
        onSave={onUpdateBasicInfo}
      />
      <ImpactStoryForm
        open={isImpactStoryFormOpen}
        onOpenChange={setIsImpactStoryFormOpen}
        story={editingImpactStory}
        onSave={onAddImpactStory}
        onSaveExisting={(storyId, story) => {
          const resolvedVerifiedValue = editingImpactStory?.verified ?? false;
          return onUpdateImpactStory(storyId, {
            ...story,
            verified: resolvedVerifiedValue,
          });
        }}
        onSendVerificationRequest={onRequestImpactStoryVerification}
      />
      <ExperienceForm
        open={isExperienceFormOpen}
        onOpenChange={setIsExperienceFormOpen}
        experience={editingExperience}
        availableSkills={availableSkillNames}
        proofPackOptions={proofPackOptions}
        onSave={(experience) => {
          if (editingExperience) {
            onUpdateExperience(editingExperience.id, {
              ...experience,
              verified: editingExperience.verified ?? false,
            });
            return;
          }
          onAddExperience(experience);
        }}
      />
      <EducationForm
        open={isEducationFormOpen}
        onOpenChange={setIsEducationFormOpen}
        education={editingEducation}
        availableSkills={availableSkillNames}
        proofPackOptions={proofPackOptions}
        onSave={(education) => {
          if (editingEducation) {
            onUpdateEducation(editingEducation.id, education);
            return;
          }
          onAddEducation(education);
        }}
      />
      <VolunteerForm
        open={isVolunteerFormOpen}
        onOpenChange={setIsVolunteerFormOpen}
        volunteering={editingVolunteering}
        availableSkills={availableSkillNames}
        proofPackOptions={proofPackOptions}
        onSave={(volunteering) => {
          if (editingVolunteering) {
            onUpdateVolunteering(editingVolunteering.id, volunteering);
            return;
          }
          onAddVolunteering(volunteering);
        }}
      />
      <ShareProfileDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        userName={profile.basicInfo.name}
        userHeadline={profile.basicInfo.tagline || undefined}
        publicPagePath={
          profile.guidedSetup.handle
            ? `/portfolio/${encodeURIComponent(profile.guidedSetup.handle)}`
            : undefined
        }
      />
    </>
  );
}
