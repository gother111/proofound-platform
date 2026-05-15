/**
 * Redaction utilities for privacy controls
 *
 * Determines which profile fields should be visible based on:
 * 1. Canonical field visibility settings
 * 2. Viewer context (public, link-holder, matched-org, self)
 */

import { db } from '@/db';
import { profileFieldVisibility } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  canAudienceAccessVisibility,
  normalizeEffectiveVisibility,
  type EffectiveVisibility,
} from './effective-visibility';

export type ViewerContext = 'public' | 'link_only' | 'matched_org' | 'self';
export type VisibilityLevel = EffectiveVisibility;

/**
 * Fetch visibility settings for a profile
 */
export async function getProfileVisibilitySettings(
  profileId: string
): Promise<Map<string, VisibilityLevel>> {
  const settings = await db
    .select()
    .from(profileFieldVisibility)
    .where(eq(profileFieldVisibility.profileId, profileId))
    .limit(1);

  const row = settings[0];
  if (!row) {
    return new Map();
  }

  // profile_field_visibility is a single row per profile with per-field columns.
  // This map normalizes those columns back into the profile object keys used by redaction.
  return new Map<string, VisibilityLevel>([
    ['display_name', normalizeEffectiveVisibility(row.displayName as string | null | undefined)],
    ['avatar_url', normalizeEffectiveVisibility(row.avatar as string | null | undefined)],
    ['headline', normalizeEffectiveVisibility(row.headline as string | null | undefined)],
    ['location', normalizeEffectiveVisibility(row.location as string | null | undefined)],
    ['mission', normalizeEffectiveVisibility(row.mission as string | null | undefined)],
    ['vision', normalizeEffectiveVisibility(row.vision as string | null | undefined)],
    ['values', normalizeEffectiveVisibility(row.values as string | null | undefined)],
    ['causes', normalizeEffectiveVisibility(row.causes as string | null | undefined)],
    ['experiences', normalizeEffectiveVisibility(row.experiences as string | null | undefined)],
    ['education', normalizeEffectiveVisibility(row.education as string | null | undefined)],
    ['volunteering', normalizeEffectiveVisibility(row.volunteering as string | null | undefined)],
    ['skills', normalizeEffectiveVisibility(row.skills as string | null | undefined)],
    [
      'impact_stories',
      normalizeEffectiveVisibility(row.impactStories as string | null | undefined),
    ],
  ]);
}

/**
 * Check if a field should be visible to the viewer
 */
export function isFieldVisible(
  fieldVisibility: VisibilityLevel,
  viewerContext: ViewerContext
): boolean {
  if (viewerContext === 'self') {
    return true;
  }

  return canAudienceAccessVisibility(
    normalizeEffectiveVisibility(fieldVisibility),
    viewerContext === 'link_only'
      ? 'link_holder'
      : viewerContext === 'matched_org'
        ? 'matched_org'
        : 'public'
  );
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

  // Matching profile
  location: 'matched_org',
  preferred_locations: 'matched_org',
  remote_preference: 'matched_org',
  desired_roles: 'matched_org',
  desired_industries: 'matched_org',
  min_salary: 'owner_only',
  max_salary: 'owner_only',

  // Skills & expertise
  skills: 'public',
  skill_proofs: 'matched_org',
  experiences: 'public',

  // Contact info
  email: 'owner_only',
  phone: 'owner_only',
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
    return 'matched_org';
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
