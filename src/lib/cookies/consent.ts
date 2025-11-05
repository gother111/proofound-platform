/**
 * Cookie Consent Management Utilities
 *
 * Handles granular cookie preferences for GDPR compliance
 * Stores preferences in localStorage and syncs with database
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md
 *
 * Note: This is a utility module, not a React component.
 * Functions that access localStorage include window checks for SSR safety.
 */

import { logError } from '@/lib/error-handler';

// Storage keys
const CONSENT_KEY = 'proofound-cookie-consent';
const PREFERENCES_KEY = 'proofound-cookie-preferences';
export const CONSENT_VERSION = 'v1.0.2025-11-06';

// Cookie category types
export type CookieCategory = 'essential' | 'analytics' | 'marketing';

// Cookie preferences structure
export interface CookiePreferences {
  version: string;
  essential: boolean; // Always true (required for site to work)
  analytics: boolean; // Optional: usage tracking, performance monitoring
  marketing: boolean; // Optional: ad targeting, campaign tracking
  timestamp: string; // When preferences were set
}

// Default preferences (only essential cookies enabled)
export const DEFAULT_PREFERENCES: CookiePreferences = {
  version: CONSENT_VERSION,
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

/**
 * Check if user has given any consent (either via banner or settings)
 * This determines whether to show the cookie banner
 */
export function hasGivenConsent(): boolean {
  if (typeof window === 'undefined') return false;

  // Check new granular preferences
  const preferences = localStorage.getItem(PREFERENCES_KEY);
  if (preferences) {
    try {
      const parsed = JSON.parse(preferences) as CookiePreferences;
      return parsed.version.startsWith(CONSENT_VERSION);
    } catch {
      return false;
    }
  }

  // Check old simple consent (for backwards compatibility)
  const oldConsent = localStorage.getItem(CONSENT_KEY);
  if (oldConsent && oldConsent.startsWith(CONSENT_VERSION)) {
    // Migrate to new structure
    const wasAccepted = !oldConsent.includes('-declined');
    const migratedPreferences: CookiePreferences = {
      version: CONSENT_VERSION,
      essential: true,
      analytics: wasAccepted,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(migratedPreferences));
    return true;
  }

  return false;
}

/**
 * Get current cookie preferences
 * Returns default preferences if none have been set
 */
export function getCookiePreferences(): CookiePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as CookiePreferences;
      // Validate version
      if (parsed.version.startsWith(CONSENT_VERSION)) {
        return parsed;
      }
    }
  } catch (error) {
    logError('getCookiePreferences', error);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save cookie preferences to localStorage and optionally sync to database
 * @param preferences - Cookie preferences to save
 * @param syncToDatabase - Whether to sync with database (for authenticated users)
 * @returns Promise that resolves when save is complete
 */
export async function saveCookiePreferences(
  preferences: Omit<CookiePreferences, 'version' | 'timestamp'>,
  syncToDatabase = true
): Promise<void> {
  if (typeof window === 'undefined') return;

  // Create full preferences object with version and timestamp
  const fullPreferences: CookiePreferences = {
    ...preferences,
    essential: true, // Always true
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
  };

  // Save to localStorage
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(fullPreferences));

  // Also update old consent key for backwards compatibility
  const consentValue = fullPreferences.analytics ? CONSENT_VERSION : `${CONSENT_VERSION}-declined`;
  localStorage.setItem(CONSENT_KEY, consentValue);

  // Sync to database if requested
  if (syncToDatabase) {
    try {
      await syncPreferencesToDatabase(fullPreferences);
    } catch (error) {
      // Silently fail if not authenticated or database sync fails
      logError('saveCookiePreferences', error);
    }
  }
}

/**
 * Sync cookie preferences to database for authenticated users
 * Stores in user_consents table with audit trail
 */
async function syncPreferencesToDatabase(preferences: CookiePreferences): Promise<void> {
  // Build consent records array
  const consents = [];

  if (preferences.analytics) {
    consents.push({
      type: 'analytics_tracking',
      consented: true,
    });
  }

  // Note: Marketing consent not yet implemented in schema, but ready for future

  if (consents.length === 0) return; // Nothing to sync

  // Call consent API
  const response = await fetch('/api/user/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consentType: 'analytics_tracking',
      consented: preferences.analytics,
      version: preferences.version,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync preferences to database');
  }
}

/**
 * Check if a specific cookie category is enabled
 * @param category - Cookie category to check
 */
export function isCategoryEnabled(category: CookieCategory): boolean {
  const preferences = getCookiePreferences();
  return preferences[category];
}

/**
 * Clear all cookie preferences (for testing or reset purposes)
 */
export function clearCookiePreferences(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFERENCES_KEY);
  localStorage.removeItem(CONSENT_KEY);
}
