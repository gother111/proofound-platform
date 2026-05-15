'use client';

import { useState } from 'react';

export function useProfileViewState() {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isImpactStoryFormOpen, setIsImpactStoryFormOpen] = useState(false);
  const [isExperienceFormOpen, setIsExperienceFormOpen] = useState(false);
  const [isEducationFormOpen, setIsEducationFormOpen] = useState(false);
  const [isVolunteerFormOpen, setIsVolunteerFormOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return {
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
  };
}
