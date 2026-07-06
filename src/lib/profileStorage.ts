import { ProfileData } from '@/types/profile';

const STORAGE_KEY = 'proofound_profile_data';

function dispatchProfileStorageDiagnostic(reason: string, detail: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent('proofound:client-diagnostic', {
        detail: {
          reason,
          ...detail,
        },
      })
    );
  } catch {
    // Diagnostics must never affect profile fallback behavior.
  }
}

function getStorageErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'unknown';
}

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
    vision: null,
    values: [],
    causes: [],
    skills: [],
    impactStories: [],
    experiences: [],
    education: [],
    volunteering: [],
    fieldVisibility: {
      skills: 'public',
      experiences: 'private',
      education: 'private',
      volunteering: 'private',
      impactStories: 'public',
    },
    redactMode: false,
    guidedSetup: {
      handle: null,
      headline: null,
      timezone: null,
      desiredRoles: [],
      workMode: null,
      engagementType: null,
    },
  };
}

export function loadProfile(): ProfileData {
  // Check if localStorage is available
  if (typeof window === 'undefined' || !window.localStorage) {
    dispatchProfileStorageDiagnostic('profile_storage.local_storage_unavailable');
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
    dispatchProfileStorageDiagnostic('profile_storage.load_failed', {
      error: getStorageErrorMessage(error),
    });
    // Return empty profile if data is corrupted
  }
  return getEmptyProfile();
}

export function saveProfile(profile: ProfileData): void {
  // Check if localStorage is available
  if (typeof window === 'undefined' || !window.localStorage) {
    dispatchProfileStorageDiagnostic('profile_storage.save_unavailable');
    return;
  }

  try {
    const serialized = JSON.stringify(profile);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        dispatchProfileStorageDiagnostic('profile_storage.quota_exceeded');
        // You might want to show a toast notification to the user here
      } else {
        dispatchProfileStorageDiagnostic('profile_storage.save_failed', {
          error: getStorageErrorMessage(error),
        });
      }
    }
  }
}

export function clearProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    dispatchProfileStorageDiagnostic('profile_storage.clear_failed', {
      error: getStorageErrorMessage(error),
    });
  }
}
