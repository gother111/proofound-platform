import type { Dispatch, SetStateAction } from 'react';

import { EducationForm } from '@/components/profile/forms/EducationForm';
import { ExperienceForm } from '@/components/profile/forms/ExperienceForm';
import { ImpactStoryForm } from '@/components/profile/forms/ImpactStoryForm';
import { VolunteerForm } from '@/components/profile/forms/VolunteerForm';
import { CausesEditor } from '@/components/profile/CausesEditor';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { MissionEditor } from '@/components/profile/MissionEditor';
import { ShareProfileDialog } from '@/components/profile/ShareProfileDialog';
import { ValuesEditor } from '@/components/profile/ValuesEditor';
import { VisionEditor } from '@/components/profile/VisionEditor';
import type {
  Education,
  Experience,
  ImpactStory,
  ProfileData,
  Value,
  Volunteering,
} from '@/types/profile';

type ProfileDialogsProps = {
  profile: ProfileData;
  isEditProfileOpen: boolean;
  setIsEditProfileOpen: Dispatch<SetStateAction<boolean>>;
  isMissionEditorOpen: boolean;
  setIsMissionEditorOpen: Dispatch<SetStateAction<boolean>>;
  isVisionEditorOpen: boolean;
  setIsVisionEditorOpen: Dispatch<SetStateAction<boolean>>;
  isValuesEditorOpen: boolean;
  setIsValuesEditorOpen: Dispatch<SetStateAction<boolean>>;
  isCausesEditorOpen: boolean;
  setIsCausesEditorOpen: Dispatch<SetStateAction<boolean>>;
  isImpactStoryFormOpen: boolean;
  setIsImpactStoryFormOpen: Dispatch<SetStateAction<boolean>>;
  isExperienceFormOpen: boolean;
  setIsExperienceFormOpen: Dispatch<SetStateAction<boolean>>;
  isEducationFormOpen: boolean;
  setIsEducationFormOpen: (open: boolean) => void;
  isVolunteerFormOpen: boolean;
  setIsVolunteerFormOpen: (open: boolean) => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: Dispatch<SetStateAction<boolean>>;
  editingEducation: Education | null;
  editingVolunteering: Volunteering | null;
  availableSkillNames: string[];
  onUpdateBasicInfo: (updates: Partial<ProfileData['basicInfo']>) => void;
  onUpdateMission: (mission: string, visibility?: 'public' | 'network' | 'private') => void;
  onUpdateVision: (vision: string, visibility?: 'public' | 'network' | 'private') => void;
  onReplaceValues: (values: Value[]) => void;
  onReplaceCauses: (causes: string[]) => void;
  onAddImpactStory: (story: Omit<ImpactStory, 'id'>) => void;
  onAddExperience: (experience: Omit<Experience, 'id'>) => void;
  onAddEducation: (education: Omit<Education, 'id'>) => void;
  onUpdateEducation: (id: string, education: Omit<Education, 'id'>) => void;
  onAddVolunteering: (volunteering: Omit<Volunteering, 'id'>) => void;
  onUpdateVolunteering: (id: string, volunteering: Omit<Volunteering, 'id'>) => void;
};

export function ProfileDialogs({
  profile,
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
  editingEducation,
  editingVolunteering,
  availableSkillNames,
  onUpdateBasicInfo,
  onUpdateMission,
  onUpdateVision,
  onReplaceValues,
  onReplaceCauses,
  onAddImpactStory,
  onAddExperience,
  onAddEducation,
  onUpdateEducation,
  onAddVolunteering,
  onUpdateVolunteering,
}: ProfileDialogsProps) {
  return (
    <>
      <EditProfileModal
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        basicInfo={profile.basicInfo}
        onSave={onUpdateBasicInfo}
      />
      <MissionEditor
        open={isMissionEditorOpen}
        onOpenChange={setIsMissionEditorOpen}
        mission={profile.mission}
        visibility={
          (profile.fieldVisibility?.mission as 'public' | 'network' | 'private') || 'public'
        }
        onSave={onUpdateMission}
      />
      <VisionEditor
        open={isVisionEditorOpen}
        onOpenChange={setIsVisionEditorOpen}
        vision={profile.vision}
        visibility={
          (profile.fieldVisibility?.vision as 'public' | 'network' | 'private') || 'network'
        }
        onSave={onUpdateVision}
      />
      <ValuesEditor
        open={isValuesEditorOpen}
        onOpenChange={setIsValuesEditorOpen}
        values={profile.values}
        onSave={onReplaceValues}
      />
      <CausesEditor
        open={isCausesEditorOpen}
        onOpenChange={setIsCausesEditorOpen}
        causes={profile.causes}
        onSave={onReplaceCauses}
      />
      <ImpactStoryForm
        open={isImpactStoryFormOpen}
        onOpenChange={setIsImpactStoryFormOpen}
        onSave={onAddImpactStory}
      />
      <ExperienceForm
        open={isExperienceFormOpen}
        onOpenChange={setIsExperienceFormOpen}
        onSave={onAddExperience}
      />
      <EducationForm
        open={isEducationFormOpen}
        onOpenChange={setIsEducationFormOpen}
        education={editingEducation}
        availableSkills={availableSkillNames}
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
      />
    </>
  );
}
