import { ProfileData } from '@/types/profile';

const STORAGE_KEY = 'proofound_profile_data';

export function getEmptyProfile(): ProfileData {
  return {
    basicInfo: {
      name: 'Your Name',
      tagline: null,
      location: null,
      joinedDate: new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      avatar: null,
      coverImage: null,
    },
    mission: null,
    values: [],
    causes: [],
    skills: [],
    impactStories: [],
    experiences: [],
    education: [],
    volunteering: [],
  };
}

export function loadProfile(): ProfileData {
  // Check if localStorage is available
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage is not available');
    return getEmptyProfile();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with empty profile to ensure all fields exist (for migration)
      return { ...getEmptyProfile(), ...parsed };
    }
  } catch (error) {
    console.error('Error loading profile from localStorage:', error);
    // Return empty profile if data is corrupted
  }
  return getEmptyProfile();
}

export function saveProfile(profile: ProfileData): void {
  // Check if localStorage is available
  if (typeof window === 'undefined' || !window.localStorage) {
    console.warn('localStorage is not available - profile not saved');
    return;
  }

  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error(
          'localStorage quota exceeded. Please reduce profile data size (especially images).'
        );
        // You might want to show a toast notification to the user here
      } else {
        console.error('Error saving profile to localStorage:', error);
      }
    }
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing profile from localStorage:', error);
  }
}

export function calculateProfileCompletion(profile: ProfileData): number {
  let totalFields = 0;
  let completedFields = 0;

  // Basic info (40% weight)
  totalFields += 5;
  if (profile.basicInfo.avatar) completedFields += 1;
  if (profile.basicInfo.coverImage) completedFields += 0.5; // Half weight
  if (profile.basicInfo.tagline) completedFields += 1;
  if (profile.basicInfo.location) completedFields += 0.5; // Half weight
  if (profile.basicInfo.name !== 'Your Name') completedFields += 1;

  // Mission (10% weight)
  totalFields += 2;
  if (profile.mission) completedFields += 2;

  // Values (10% weight)
  totalFields += 2;
  if (profile.values.length > 0) completedFields += 2;

  // Causes (5% weight)
  totalFields += 1;
  if (profile.causes.length > 0) completedFields += 1;

  // Skills (5% weight)
  totalFields += 1;
  if (profile.skills.length > 0) completedFields += 1;

  // Impact Stories (15% weight)
  totalFields += 3;
  if (profile.impactStories.length > 0) completedFields += 3;

  // Experiences (10% weight)
  totalFields += 2;
  if (profile.experiences.length > 0) completedFields += 2;

  // Education (5% weight)
  totalFields += 1;
  if (profile.education.length > 0) completedFields += 1;

  // Volunteering (5% weight)
  totalFields += 1;
  if (profile.volunteering.length > 0) completedFields += 1;

  const percentage = Math.round((completedFields / totalFields) * 100);
  return Math.min(100, Math.max(5, percentage)); // Minimum 5%, maximum 100%
}
