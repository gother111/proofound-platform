import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import type {
  ProfileData,
  BasicInfo,
  PurposeLinks,
  ImpactStory,
  ImpactStoryVerificationRequestDispatchParams,
  ImpactStoryVerificationRequestDispatchResult,
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
  updateVision as updateVisionAction,
  replaceValues,
  replaceCauses,
  replaceSkills,
  createImpactStory,
  requestImpactStoryVerification as requestImpactStoryVerificationAction,
  updateImpactStory as updateImpactStoryAction,
  deleteImpactStory as deleteImpactStoryAction,
  createExperience,
  updateExperience as updateExperienceAction,
  deleteExperience as deleteExperienceAction,
  createEducation,
  updateEducation as updateEducationAction,
  deleteEducation as deleteEducationAction,
  createVolunteering,
  updateVolunteering as updateVolunteeringAction,
  deleteVolunteering as deleteVolunteeringAction,
  toggleRedactMode as toggleRedactModeAction,
} from '@/actions/profile';
import { calculateProfileCompletion } from '@/lib/profileStorage';
import { toast } from 'sonner';

interface PendingState {
  updatingBasicInfo: boolean;
  mission: boolean;
  vision: boolean;
  values: boolean;
  causes: boolean;
  skills: boolean;
  impactStory: boolean;
  impactStoryVerification: boolean;
  experience: boolean;
  education: boolean;
  volunteering: boolean;
  redactMode: boolean;
}

const initialPending: PendingState = {
  updatingBasicInfo: false,
  mission: false,
  vision: false,
  values: false,
  causes: false,
  skills: false,
  impactStory: false,
  impactStoryVerification: false,
  experience: false,
  education: false,
  volunteering: false,
  redactMode: false,
};

const PROFILE_LOAD_MAX_ATTEMPTS = 2;
const PROFILE_LOAD_RETRY_DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getNextDigest(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'digest' in error) {
    const digest = (error as { digest?: unknown }).digest;
    if (typeof digest === 'string') {
      return digest;
    }
  }
  return null;
}

function getRedirectTargetFromDigest(digest: string): string | null {
  const parts = digest.split(';');
  const redirectTarget = parts[2];
  if (!redirectTarget || redirectTarget === 'undefined') {
    return null;
  }
  return redirectTarget;
}

function isTransientProfileLoadError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return /failed to fetch|fetch failed|network/i.test(error.message);
  }
  if (error instanceof Error) {
    return /failed to fetch|network|load failed|abort/i.test(error.message);
  }
  return false;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function useProfileData(initialProfile: ProfileData | null = null) {
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialProfile);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pending, setPending] = useState<PendingState>(initialPending);
  const [isPending, startTransition] = useTransition();
  const profileCompletion = useMemo(
    () => (profile ? calculateProfileCompletion(profile) : 5),
    [profile]
  );

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    if (initialProfile && loadAttempt === 0) {
      setProfile(initialProfile);
      setIsLoading(false);
      setLoadError(null);
      return;
    }

    let active = true;
    let skipLoadingReset = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setLoadError(null);

      for (let attempt = 1; attempt <= PROFILE_LOAD_MAX_ATTEMPTS; attempt += 1) {
        try {
          const data = await getProfileData();
          if (!active) {
            return;
          }
          setProfile(data);
          return;
        } catch (error) {
          if (!active) {
            return;
          }

          const digest = getNextDigest(error);

          if (digest?.startsWith('NEXT_REDIRECT')) {
            const redirectTarget = getRedirectTargetFromDigest(digest);
            skipLoadingReset = true;
            if (redirectTarget) {
              window.location.assign(redirectTarget);
            } else {
              window.location.reload();
            }
            return;
          }

          if (digest?.startsWith('NEXT_NOT_FOUND')) {
            skipLoadingReset = true;
            window.location.assign('/404');
            return;
          }

          const shouldRetry =
            isTransientProfileLoadError(error) && attempt < PROFILE_LOAD_MAX_ATTEMPTS;
          if (shouldRetry) {
            await sleep(PROFILE_LOAD_RETRY_DELAY_MS * attempt);
            continue;
          }

          console.error('Failed to load profile data:', error);
          setProfile(null);
          setLoadError('Unable to load profile data. Please try again.');
          toast.error('Unable to load profile data. Please try again.');
          return;
        }
      }
    };

    loadProfile().finally(() => {
      if (active && !skipLoadingReset) {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [initialProfile, loadAttempt]);

  const runWithPending = useCallback(
    async <T>(key: keyof PendingState, fn: () => Promise<T>): Promise<T | undefined> => {
      setPending((prev) => ({ ...prev, [key]: true }));
      try {
        return await fn();
      } catch (error) {
        console.error('Profile action failed:', error);
        toast.error(getErrorMessage(error));
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
    (mission: string, links: PurposeLinks, visibility?: 'public' | 'network' | 'private') => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, mission, missionLinks: links } : prev));
      startTransition(() => {
        runWithPending('mission', () => updateMissionAction(mission, links, visibility)).catch(
          (error) => {
            toast.error(
              error instanceof Error && error.message ? error.message : 'Failed to update mission.'
            );
          }
        );
      });
    },
    [profile, runWithPending]
  );

  const updateVision = useCallback(
    (vision: string, links: PurposeLinks, visibility?: 'public' | 'network' | 'private') => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, vision, visionLinks: links } : prev));
      startTransition(() => {
        runWithPending('vision', () => updateVisionAction(vision, links, visibility)).catch(
          (error) => {
            toast.error(
              error instanceof Error && error.message ? error.message : 'Failed to update vision.'
            );
          }
        );
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
    async (story: Omit<ImpactStory, 'id'>) => {
      if (!profile) return;
      const optimisticStoryId = crypto.randomUUID();

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              impactStories: [...prev.impactStories, { ...story, id: optimisticStoryId }],
            }
          : prev
      );

      const inserted = await runWithPending('impactStory', () => createImpactStory(story));

      if (!inserted) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                impactStories: prev.impactStories.filter((item) => item.id !== optimisticStoryId),
              }
            : prev
        );
        throw new Error('Failed to save impact story. Please try again.');
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              impactStories: prev.impactStories.map((item) =>
                item.id === optimisticStoryId ? inserted : item
              ),
            }
          : prev
      );

      const verificationWarning = (inserted as { verificationWarning?: string | null })
        .verificationWarning;
      const saveWarning = (inserted as { saveWarning?: string | null }).saveWarning;
      const requestedVerification = Boolean(story.verificationRequest?.verifierEmail);

      if (saveWarning) {
        toast.warning(saveWarning);
      }

      if (requestedVerification) {
        if (verificationWarning) {
          toast.error(verificationWarning);
        } else {
          toast.success('Impact story saved. Verification request sent and is pending.');
        }
      } else {
        toast.success('Impact story saved.');
      }
    },
    [profile, runWithPending]
  );

  const sendImpactStoryVerificationRequest = useCallback(
    async (
      params: ImpactStoryVerificationRequestDispatchParams
    ): Promise<ImpactStoryVerificationRequestDispatchResult> => {
      if (!profile) {
        throw new Error('Profile data is not loaded yet.');
      }

      const result = await runWithPending('impactStoryVerification', () =>
        requestImpactStoryVerificationAction(params)
      );

      if (!result) {
        throw new Error('Failed to send impact story verification request.');
      }

      setProfile((prev) => {
        if (!prev) return prev;

        const mergedStory: ImpactStory = {
          ...result.story,
          verificationRequestStatus: result.verification.status,
          verificationRequestedAt: result.verification.createdAt,
          verificationVerifierEmail: result.verification.verifierEmail,
          verificationEmailSentAt: result.verification.emailSentAt || null,
          verificationEmailError: result.verification.emailError || null,
          verificationWarning: result.verification.warning || null,
        };

        const storyExists = prev.impactStories.some((item) => item.id === mergedStory.id);
        if (storyExists) {
          return {
            ...prev,
            impactStories: prev.impactStories.map((item) =>
              item.id === mergedStory.id ? mergedStory : item
            ),
          };
        }

        return {
          ...prev,
          impactStories: [...prev.impactStories, mergedStory],
        };
      });

      if (result.saveWarning) {
        toast.warning(result.saveWarning);
      }

      if (result.verification.warning) {
        toast.error(result.verification.warning);
      } else {
        toast.success('Verification request sent and is pending.');
      }

      return result;
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

  const updateImpactStory = useCallback(
    async (id: string, story: Omit<ImpactStory, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              impactStories: prev.impactStories.map((item) =>
                item.id === id ? { ...story, id: item.id } : item
              ),
            }
          : prev
      );

      const updated = await runWithPending('impactStory', () => updateImpactStoryAction(id, story));
      if (!updated) return;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              impactStories: prev.impactStories.map((item) => (item.id === id ? updated : item)),
            }
          : prev
      );
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

  const updateExperience = useCallback(
    async (id: string, experience: Omit<Experience, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              experiences: prev.experiences.map((item) =>
                item.id === id ? { ...experience, id: item.id } : item
              ),
            }
          : prev
      );

      const updated = await runWithPending('experience', () =>
        updateExperienceAction(id, experience)
      );
      if (!updated) return;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              experiences: prev.experiences.map((item) => (item.id === id ? updated : item)),
            }
          : prev
      );
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

  const updateEducation = useCallback(
    (id: string, education: Omit<Education, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              education: prev.education.map((item) =>
                item.id === id ? { ...education, id: item.id } : item
              ),
            }
          : prev
      );

      startTransition(() => {
        runWithPending('education', async () => {
          const updated = await updateEducationAction(id, education);
          if (!updated) return;
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  education: prev.education.map((item) => (item.id === id ? updated : item)),
                }
              : prev
          );
        });
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

  const updateVolunteering = useCallback(
    (id: string, volunteering: Omit<Volunteering, 'id'>) => {
      if (!profile) return;
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              volunteering: prev.volunteering.map((item) =>
                item.id === id ? { ...volunteering, id: item.id } : item
              ),
            }
          : prev
      );

      startTransition(() => {
        runWithPending('volunteering', async () => {
          const updated = await updateVolunteeringAction(id, volunteering);
          if (!updated) return;
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  volunteering: prev.volunteering.map((item) => (item.id === id ? updated : item)),
                }
              : prev
          );
        });
      });
    },
    [profile, runWithPending]
  );

  const toggleRedactMode = useCallback(
    (enabled: boolean) => {
      if (!profile) return;
      setProfile((prev) => (prev ? { ...prev, redactMode: enabled } : prev));
      startTransition(() => {
        runWithPending('redactMode', () => toggleRedactModeAction(enabled)).catch(() => {
          toast.error('Failed to update privacy setting.');
          // Revert on error
          setProfile((prev) => (prev ? { ...prev, redactMode: !enabled } : prev));
        });
      });
    },
    [profile, runWithPending]
  );

  return {
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
    replaceValues: onReplaceValues,
    replaceCauses: onReplaceCauses,
    replaceSkills: onReplaceSkills,
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
  };
}
