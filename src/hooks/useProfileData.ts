import { useState, useEffect, useCallback, useTransition } from 'react';
import type {
  ProfileData,
  BasicInfo,
  ImpactStory,
  Experience,
  Education,
  Volunteering,
  Value,
  Skill,
} from '@/types/profile';
import {
  getProfileData,
  updateBasicInfo as updateBasicInfoAction,
  updateMission as updateMissionAction,
  replaceValues,
  replaceCauses,
  replaceSkills,
  createImpactStory,
  deleteImpactStory as deleteImpactStoryAction,
  createExperience,
  deleteExperience as deleteExperienceAction,
  createEducation,
  deleteEducation as deleteEducationAction,
  createVolunteering,
  deleteVolunteering as deleteVolunteeringAction,
} from '@/actions/profile';
import { calculateProfileCompletion } from '@/lib/profileStorage';
import { toast } from 'sonner';

interface PendingState {
  updatingBasicInfo: boolean;
  mission: boolean;
  values: boolean;
  causes: boolean;
  skills: boolean;
  impactStory: boolean;
  experience: boolean;
  education: boolean;
  volunteering: boolean;
}

const initialPending: PendingState = {
  updatingBasicInfo: false,
  mission: false,
  values: false,
  causes: false,
  skills: false,
  impactStory: false,
  experience: false,
  education: false,
  volunteering: false,
};

export function useProfileData() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(5);
  const [pending, setPending] = useState<PendingState>(initialPending);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    getProfileData()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        setProfileCompletion(calculateProfileCompletion(data));
      })
      .catch((error) => {
        console.error('Failed to load profile data:', error);
        toast.error('Unable to load profile data. Please try again.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (profile) {
      setProfileCompletion(calculateProfileCompletion(profile));
    }
  }, [profile]);

  const runWithPending = useCallback(
    async <T>(key: keyof PendingState, fn: () => Promise<T>): Promise<T | undefined> => {
      setPending((prev) => ({ ...prev, [key]: true }));
      try {
        return await fn();
      } catch (error) {
        console.error('Profile action failed:', error);
        toast.error('Something went wrong. Please try again.');
        return undefined;
      } finally {
        setPending((prev) => ({ ...prev, [key]: false }));
      }
    },
    []
  );

  const updateBasicInfo = useCallback(
    (updates: Partial<BasicInfo>) => {
      if (!profile) return;

      setProfile((prev) =>
        prev ? { ...prev, basicInfo: { ...prev.basicInfo, ...updates } } : prev
      );

      startTransition(() => {
        runWithPending('updatingBasicInfo', () => updateBasicInfoAction(updates)).catch(() => {
          toast.error('Failed to update profile details.');
        });
      });
    },
    [profile, runWithPending]
  );

  const updateMission = useCallback(
    (mission: string) => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, mission } : prev));
      startTransition(() => {
        runWithPending('mission', () => updateMissionAction(mission)).catch(() => {
          toast.error('Failed to update mission.');
        });
      });
    },
    [profile, runWithPending]
  );

  const onReplaceValues = useCallback(
    (values: Value[]) => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, values } : prev));
      startTransition(() => {
        runWithPending('values', () => replaceValues(values)).catch(() => {
          toast.error('Failed to update values.');
        });
      });
    },
    [profile, runWithPending]
  );

  const onReplaceCauses = useCallback(
    (causes: string[]) => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, causes } : prev));
      startTransition(() => {
        runWithPending('causes', () => replaceCauses(causes)).catch(() => {
          toast.error('Failed to update causes.');
        });
      });
    },
    [profile, runWithPending]
  );

  const onReplaceSkills = useCallback(
    (skills: Skill[]) => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, skills } : prev));
      startTransition(() => {
        runWithPending('skills', () => replaceSkills(skills)).catch(() => {
          toast.error('Failed to update skills.');
        });
      });
    },
    [profile, runWithPending]
  );

  const addImpactStory = useCallback(
    (story: Omit<ImpactStory, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              impactStories: [...prev.impactStories, { ...story, id: crypto.randomUUID() }],
            }
          : prev
      );

      startTransition(() => {
        runWithPending('impactStory', async () => {
          const inserted = await createImpactStory(story);
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  impactStories: prev.impactStories.map((item) =>
                    item.title === story.title && item.timeline === story.timeline ? inserted : item
                  ),
                }
              : prev
          );
        });
      });
    },
    [profile, runWithPending]
  );

  const deleteImpactStory = useCallback(
    (id: string) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? { ...prev, impactStories: prev.impactStories.filter((story) => story.id !== id) }
          : prev
      );
      startTransition(() => {
        runWithPending('impactStory', () => deleteImpactStoryAction(id));
      });
    },
    [profile, runWithPending]
  );

  const addExperience = useCallback(
    (experience: Omit<Experience, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              experiences: [...prev.experiences, { ...experience, id: crypto.randomUUID() }],
            }
          : prev
      );

      startTransition(() => {
        runWithPending('experience', async () => {
          const inserted = await createExperience(experience);
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  experiences: prev.experiences.map((item) =>
                    item.title === experience.title && item.duration === experience.duration
                      ? inserted
                      : item
                  ),
                }
              : prev
          );
        });
      });
    },
    [profile, runWithPending]
  );

  const deleteExperience = useCallback(
    (id: string) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? { ...prev, experiences: prev.experiences.filter((experience) => experience.id !== id) }
          : prev
      );
      startTransition(() => {
        runWithPending('experience', () => deleteExperienceAction(id));
      });
    },
    [profile, runWithPending]
  );

  const addEducation = useCallback(
    (education: Omit<Education, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              education: [...prev.education, { ...education, id: crypto.randomUUID() }],
            }
          : prev
      );

      startTransition(() => {
        runWithPending('education', async () => {
          const inserted = await createEducation(education);
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  education: prev.education.map((item) =>
                    item.degree === education.degree && item.duration === education.duration
                      ? inserted
                      : item
                  ),
                }
              : prev
          );
        });
      });
    },
    [profile, runWithPending]
  );

  const deleteEducation = useCallback(
    (id: string) => {
      if (!profile) return;
      setProfile((prev) =>
        prev ? { ...prev, education: prev.education.filter((item) => item.id !== id) } : prev
      );
      startTransition(() => {
        runWithPending('education', () => deleteEducationAction(id));
      });
    },
    [profile, runWithPending]
  );

  const addVolunteering = useCallback(
    (volunteering: Omit<Volunteering, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              volunteering: [...prev.volunteering, { ...volunteering, id: crypto.randomUUID() }],
            }
          : prev
      );

      startTransition(() => {
        runWithPending('volunteering', async () => {
          const inserted = await createVolunteering(volunteering);
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  volunteering: prev.volunteering.map((item) =>
                    item.title === volunteering.title && item.duration === volunteering.duration
                      ? inserted
                      : item
                  ),
                }
              : prev
          );
        });
      });
    },
    [profile, runWithPending]
  );

  const deleteVolunteering = useCallback(
    (id: string) => {
      if (!profile) return;
      setProfile((prev) =>
        prev ? { ...prev, volunteering: prev.volunteering.filter((item) => item.id !== id) } : prev
      );
      startTransition(() => {
        runWithPending('volunteering', () => deleteVolunteeringAction(id));
      });
    },
    [profile, runWithPending]
  );

  return {
    profile,
    isLoading,
    isPending,
    pending,
    profileCompletion,
    updateBasicInfo,
    updateMission,
    replaceValues: onReplaceValues,
    replaceCauses: onReplaceCauses,
    replaceSkills: onReplaceSkills,
    addImpactStory,
    deleteImpactStory,
    addExperience,
    deleteExperience,
    addEducation,
    deleteEducation,
    addVolunteering,
    deleteVolunteering,
  };
}
