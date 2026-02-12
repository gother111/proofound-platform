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
import { POLICY_VERSIONS } from '@/lib/privacy/policy-version-config';

// Storage keys
export const CONSENT_KEY = 'proofound-cookie-consent';
export const PREFERENCES_KEY = 'proofound-cookie-preferences';
export const COOKIE_PREFERENCES_CHANGED_EVENT = 'proofound:cookie-preferences-changed';
export const CONSENT_VERSION = POLICY_VERSIONS.cookie;

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

function emitCookiePreferencesChanged(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(COOKIE_PREFERENCES_CHANGED_EVENT, {
      detail: preferences,
    })
  );
}

/**
 * Check if user has given any consent (either via banner or settings)
 * This determines whether to show the cookie banner
 */
export function hasGivenConsent(): boolean {
  if (typeof window === 'undefined') return false;

  const hasNewPreferences = localStorage.getItem(PREFERENCES_KEY) !== null;
  const hasLegacyConsent = localStorage.getItem(CONSENT_KEY) !== null;
  if (!hasNewPreferences && !hasLegacyConsent) {
    return false;
  }

  const currentPreferences = getCookiePreferences();
  return currentPreferences.version.startsWith(CONSENT_VERSION);
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

    // Migrate legacy single-value consent key if present
    const oldConsent = localStorage.getItem(CONSENT_KEY);
    if (oldConsent && oldConsent.startsWith(CONSENT_VERSION)) {
      const migratedPreferences: CookiePreferences = {
        version: CONSENT_VERSION,
        essential: true,
        analytics: !oldConsent.includes('-declined'),
        marketing: false,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(migratedPreferences));
      return migratedPreferences;
    }
  } catch (error) {
    logError('getCookiePreferences', error);
  }

  return DEFAULT_PREFERENCES;
}

export function hasAnalyticsConsent(): boolean {
  return getCookiePreferences().analytics;
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
  emitCookiePreferencesChanged(fullPreferences);

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
  // Call consent API
  const response = await fetch('/api/user/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consents: [
        {
          type: 'analytics_tracking',
          consented: preferences.analytics,
        },
        {
          type: 'marketing_emails',
          consented: preferences.marketing,
        },
      ],
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
  emitCookiePreferencesChanged(DEFAULT_PREFERENCES);
}
