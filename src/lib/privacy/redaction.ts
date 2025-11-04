/**
 * Redaction utilities for privacy controls
 *
 * Determines which profile fields should be visible based on:
 * 1. Field visibility settings (public, link_only, match_only, private)
 * 2. Viewer context (public, link-holder, matched-org, self)
 */

import { db } from '@/db';
import { profileFieldVisibility } from '@/db/schema';
import { eq } from 'drizzle-orm';

export type ViewerContext = 'public' | 'link_only' | 'match_only' | 'self';
export type VisibilityLevel = 'public' | 'link_only' | 'match_only' | 'private';

interface FieldVisibility {
  fieldName: string;
  visibilityLevel: VisibilityLevel;
}

/**
 * Fetch visibility settings for a profile
 */
export async function getProfileVisibilitySettings(
  profileId: string
): Promise<Map<string, VisibilityLevel>> {
  const settings = await db
    .select()
    .from(profileFieldVisibility)
    .where(eq(profileFieldVisibility.profileId, profileId));

  return new Map(settings.map((s) => [s.fieldName, s.visibilityLevel as VisibilityLevel]));
}

/**
 * Check if a field should be visible to the viewer
 */
export function isFieldVisible(
  fieldVisibility: VisibilityLevel,
  viewerContext: ViewerContext
): boolean {
  // Self can always see everything
  if (viewerContext === 'self') {
    return true;
  }

  // Private fields are never visible to others
  if (fieldVisibility === 'private') {
    return false;
  }

  // Match-only fields are visible to matched orgs and self
  if (fieldVisibility === 'match_only') {
    return viewerContext === 'match_only' || viewerContext === 'self';
  }

  // Link-only fields are visible to link-holders, matched orgs, and self
  if (fieldVisibility === 'link_only') {
    return (
      viewerContext === 'link_only' ||
      viewerContext === 'match_only' ||
      viewerContext === 'self'
    );
  }

  // Public fields are visible to everyone
  if (fieldVisibility === 'public') {
    return true;
  }

  return false;
}

/**
 * Default visibility levels for fields (if not explicitly set)
 */
export const DEFAULT_FIELD_VISIBILITY: Record<string, VisibilityLevel> = {
  // Basic info
  display_name: 'public',
  avatar_url: 'public',
  handle: 'public',

  // Individual profile
  headline: 'public',
  bio: 'public',
  mission: 'public',

  // Matching profile
  location: 'match_only',
  preferred_locations: 'match_only',
  remote_preference: 'match_only',
  desired_roles: 'match_only',
  desired_industries: 'match_only',
  min_salary: 'private',
  max_salary: 'private',

  // Skills & expertise
  skills: 'public',
  skill_proofs: 'match_only',
  experiences: 'public',

  // Contact info
  email: 'private',
  phone: 'private',
  linkedin_url: 'link_only',
  github_url: 'link_only',
  website_url: 'link_only',
};

/**
 * Get the visibility level for a field
 */
export function getFieldVisibility(
  fieldName: string,
  visibilitySettings: Map<string, VisibilityLevel>
): VisibilityLevel {
  return visibilitySettings.get(fieldName) || DEFAULT_FIELD_VISIBILITY[fieldName] || 'public';
}

/**
 * Redact a profile object based on viewer context
 * Returns a copy of the profile with hidden fields removed or redacted
 */
export function redactProfile<T extends Record<string, any>>(
  profile: T,
  visibilitySettings: Map<string, VisibilityLevel>,
  viewerContext: ViewerContext
): Partial<T> {
  const redacted: Partial<T> = {};

  for (const [key, value] of Object.entries(profile)) {
    const visibility = getFieldVisibility(key, visibilitySettings);
    if (isFieldVisible(visibility, viewerContext)) {
      redacted[key as keyof T] = value;
    }
  }

  return redacted;
}

/**
 * Redact an array of profiles
 */
export function redactProfiles<T extends Record<string, any>>(
  profiles: T[],
  visibilitySettingsMap: Map<string, Map<string, VisibilityLevel>>,
  viewerContext: ViewerContext
): Partial<T>[] {
  return profiles.map((profile) => {
    const profileId = profile.id || profile.profile_id;
    const settings = visibilitySettingsMap.get(profileId) || new Map();
    return redactProfile(profile, settings, viewerContext);
  });
}

/**
 * Determine viewer context based on request parameters
 */
export function determineViewerContext(params: {
  isOwner: boolean;
  hasProfileLink?: boolean;
  isMatchedOrg?: boolean;
}): ViewerContext {
  if (params.isOwner) {
    return 'self';
  }

  if (params.isMatchedOrg) {
    return 'match_only';
  }

  if (params.hasProfileLink) {
    return 'link_only';
  }

  return 'public';
}

/**
 * Redact sensitive text with asterisks
 * Used for partial reveals (e.g., "john.doe@gmail.com" → "j*****@gmail.com")
 */
export function redactText(text: string, revealFirst: number = 1, revealLast: number = 0): string {
  if (text.length <= revealFirst + revealLast) {
    return '*'.repeat(text.length);
  }

  const first = text.slice(0, revealFirst);
  const last = revealLast > 0 ? text.slice(-revealLast) : '';
  const middle = '*'.repeat(Math.max(5, text.length - revealFirst - revealLast));

  return first + middle + last;
}

/**
 * Redact email address
 * "john.doe@example.com" → "j*****@example.com"
 */
export function redactEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (!username || !domain) return '***@***';

  const redactedUsername = redactText(username, 1, 0);
  return `${redactedUsername}@${domain}`;
}

/**
 * Redact phone number
 * "+1234567890" → "+1******890"
 */
export function redactPhone(phone: string): string {
  if (phone.length < 4) return '***';
  return phone.slice(0, 2) + '*'.repeat(Math.max(5, phone.length - 5)) + phone.slice(-3);
}

/**
 * Check if user has permission to view another profile's field
 */
export async function canViewField(params: {
  fieldName: string;
  profileId: string;
  viewerId?: string;
  isMatchedOrg?: boolean;
  hasProfileLink?: boolean;
}): Promise<boolean> {
  const { fieldName, profileId, viewerId, isMatchedOrg, hasProfileLink } = params;

  // Owner can always see their own fields
  if (viewerId === profileId) {
    return true;
  }

  // Fetch visibility settings
  const settings = await getProfileVisibilitySettings(profileId);
  const visibility = getFieldVisibility(fieldName, settings);

  // Determine viewer context
  const context = determineViewerContext({
    isOwner: viewerId === profileId,
    hasProfileLink,
    isMatchedOrg,
  });

  return isFieldVisible(visibility, context);
}
