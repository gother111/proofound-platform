"use client";

/**
 * EditableIndividualProfile Component
 *
 * Adapter component that bridges useProfileData hook with IndividualProfileView.
 * Handles:
 * - Data fetching and transformation
 * - Modal/form state management
 * - CRUD operations
 * - Loading states
 * - File uploads (avatar, cover)
 *
 * This component uses your existing forms/modals and data hooks while
 * rendering with the new design system components.
 */

import { useState } from "react";
import { IndividualProfileView } from "./IndividualProfileView";
import { transformToComponentData } from "@/lib/profile-data-transformer";
import type { HookProfileData } from "@/lib/profile-data-transformer";

// Placeholder interfaces - replace with your actual types
interface UseProfileDataReturn {
  profile: any;
  impactStories: any[];
  experiences: any[];
  education: any[];
  volunteering: any[];
  profileCompletion: number;
  isLoading: boolean;
  isPending: boolean;
  pending: {
    updatingBasicInfo?: boolean;
    impactStory?: boolean;
    [key: string]: boolean | undefined;
  };
  updateBasicInfo: (data: any) => Promise<void> | void;
  updateMission: (mission: string) => Promise<void> | void;
  replaceValues: (values: any[]) => Promise<void> | void;
  replaceCauses: (causes: string[]) => Promise<void> | void;
  replaceSkills: (skills: any[]) => Promise<void> | void;
  addImpactStory: (story: any) => Promise<void> | void;
  deleteImpactStory: (id: string) => Promise<void> | void;
  addExperience: (exp: any) => Promise<void> | void;
  deleteExperience: (id: string) => Promise<void> | void;
  addEducation: (edu: any) => Promise<void> | void;
  deleteEducation: (id: string) => Promise<void> | void;
  addVolunteering: (vol: any) => Promise<void> | void;
  deleteVolunteering: (id: string) => Promise<void> | void;
}

interface EditableIndividualProfileProps {
  // useProfileData hook return value
  profileData: UseProfileDataReturn;
}

export function EditableIndividualProfile({
  profileData,
}: EditableIndividualProfileProps) {
  const {
    profile,
    impactStories,
    experiences,
    education,
    volunteering,
    profileCompletion,
    isLoading,
    isPending,
    pending,
    updateBasicInfo,
    updateMission,
    replaceValues,
    replaceCauses,
    replaceSkills,
    addImpactStory,
    deleteImpactStory,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addVolunteering,
    deleteVolunteering,
  } = profileData;

  // Modal/Form states
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isMissionEditorOpen, setIsMissionEditorOpen] = useState(false);
  const [isValuesEditorOpen, setIsValuesEditorOpen] = useState(false);
  const [isCausesEditorOpen, setIsCausesEditorOpen] = useState(false);
  const [isSkillsEditorOpen, setIsSkillsEditorOpen] = useState(false);
  const [isImpactStoryFormOpen, setIsImpactStoryFormOpen] = useState(false);
  const [isExperienceFormOpen, setIsExperienceFormOpen] = useState(false);
  const [isEducationFormOpen, setIsEducationFormOpen] = useState(false);
  const [isVolunteerFormOpen, setIsVolunteerFormOpen] = useState(false);

  // Loading state
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F3EE' }}>
        <p className="text-sm" style={{ color: 'rgba(44, 42, 39, 0.7)' }}>
          Loading profile...
        </p>
      </div>
    );
  }

  // Transform data from hook format to component format
  const hookData: HookProfileData = {
    profile,
    impactStories,
    experiences,
    education,
    volunteering,
    profileCompletion,
  };

  const componentData = transformToComponentData(hookData);

  // File upload handlers
  const handleAvatarUpload = async (file: File) => {
    // Convert to base64 or upload to storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateBasicInfo({ avatar: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = async (file: File) => {
    // Convert to base64 or upload to storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateBasicInfo({ coverImage: base64String });
    };
    reader.readAsDataURL(file);
  };

  const handleTaglineSave = (tagline: string) => {
    updateBasicInfo({ tagline });
  };

  // Impact story handlers
  const handleImpactStoryAdd = () => {
    setIsImpactStoryFormOpen(true);
  };

  const handleImpactStoryDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this impact story?')) {
      deleteImpactStory(id);
    }
  };

  // Experience handlers
  const handleExperienceAdd = () => {
    setIsExperienceFormOpen(true);
  };

  const handleExperienceDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this experience?')) {
      deleteExperience(id);
    }
  };

  // Education handlers
  const handleEducationAdd = () => {
    setIsEducationFormOpen(true);
  };

  const handleEducationDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      deleteEducation(id);
    }
  };

  // Volunteering handlers
  const handleVolunteeringAdd = () => {
    setIsVolunteerFormOpen(true);
  };

  const handleVolunteeringDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this volunteer work?')) {
      deleteVolunteering(id);
    }
  };

  // Network handler
  const handleNetworkVisualize = () => {
    // TODO: Implement network visualization
    console.log('Visualize network');
  };

  return (
    <>
      <IndividualProfileView
        profileData={componentData}
        editable={true}
        onAvatarUpload={handleAvatarUpload}
        onCoverUpload={handleCoverUpload}
        onTaglineSave={handleTaglineSave}
        onEditBasicInfo={() => setIsEditProfileOpen(true)}
        onMissionSave={(mission) => updateMission(mission)}
        onValuesAdd={() => setIsValuesEditorOpen(true)}
        onValuesEdit={() => setIsValuesEditorOpen(true)}
        onCausesAdd={() => setIsCausesEditorOpen(true)}
        onCausesEdit={() => setIsCausesEditorOpen(true)}
        onSkillsAdd={() => setIsSkillsEditorOpen(true)}
        onSkillsEdit={() => setIsSkillsEditorOpen(true)}
        onImpactStoryAdd={handleImpactStoryAdd}
        onImpactStoryDelete={handleImpactStoryDelete}
        onExperienceAdd={handleExperienceAdd}
        onExperienceDelete={handleExperienceDelete}
        onEducationAdd={handleEducationAdd}
        onEducationDelete={handleEducationDelete}
        onVolunteeringAdd={handleVolunteeringAdd}
        onVolunteeringDelete={handleVolunteeringDelete}
        onNetworkVisualize={handleNetworkVisualize}
      />

      {/*
        TODO: Import and render your existing modals/forms here:

        <EditProfileModal
          open={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          basicInfo={profile.basicInfo}
          onSave={updateBasicInfo}
        />

        <MissionEditor
          open={isMissionEditorOpen}
          onOpenChange={setIsMissionEditorOpen}
          mission={profile.mission}
          onSave={updateMission}
        />

        <ValuesEditor
          open={isValuesEditorOpen}
          onOpenChange={setIsValuesEditorOpen}
          values={profile.values}
          onSave={replaceValues}
        />

        <CausesEditor
          open={isCausesEditorOpen}
          onOpenChange={setIsCausesEditorOpen}
          causes={profile.causes}
          onSave={replaceCauses}
        />

        <SkillsEditor
          open={isSkillsEditorOpen}
          onOpenChange={setIsSkillsEditorOpen}
          skills={profile.skills}
          onSave={replaceSkills}
        />

        <ImpactStoryForm
          open={isImpactStoryFormOpen}
          onOpenChange={setIsImpactStoryFormOpen}
          onSave={(story) => {
            addImpactStory(story);
            setIsImpactStoryFormOpen(false);
          }}
        />

        <ExperienceForm
          open={isExperienceFormOpen}
          onOpenChange={setIsExperienceFormOpen}
          onSave={(exp) => {
            addExperience(exp);
            setIsExperienceFormOpen(false);
          }}
        />

        <EducationForm
          open={isEducationFormOpen}
          onOpenChange={setIsEducationFormOpen}
          onSave={(edu) => {
            addEducation(edu);
            setIsEducationFormOpen(false);
          }}
        />

        <VolunteerForm
          open={isVolunteerFormOpen}
          onOpenChange={setIsVolunteerFormOpen}
          onSave={(vol) => {
            addVolunteering(vol);
            setIsVolunteerFormOpen(false);
          }}
        />
      */}
    </>
  );
}
