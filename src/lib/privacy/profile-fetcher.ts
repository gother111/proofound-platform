/**
 * Profile fetching utilities with automatic redaction
 *
 * Use these functions instead of direct database queries to ensure
 * privacy settings are automatically applied
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';
import { sql } from 'drizzle-orm';
import {
  getProfileVisibilitySettings,
  redactProfile,
  determineViewerContext,
  ViewerContext,
} from './redaction';

interface FetchProfileOptions {
  viewerId?: string;
  isMatchedOrg?: boolean;
  hasProfileLink?: boolean;
}

/**
 * Fetch a single profile with redaction applied
 */
export async function fetchRedactedProfile(
  profileId: string,
  options: FetchProfileOptions = {}
): Promise<any> {
  const supabase = await createClient();
  const { viewerId, isMatchedOrg, hasProfileLink } = options;

  // Fetch profile data
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Determine viewer context
  const context = determineViewerContext({
    isOwner: viewerId === profileId,
    hasProfileLink,
    isMatchedOrg,
  });

  // If self, return full profile
  if (context === 'self') {
    return profile;
  }

  // Fetch visibility settings
  const settings = await getProfileVisibilitySettings(profileId);

  // Apply redaction
  return redactProfile(profile, settings, context);
}

/**
 * Fetch individual profile with redaction
 */
export async function fetchRedactedIndividualProfile(
  profileId: string,
  options: FetchProfileOptions = {}
): Promise<any> {
  const supabase = await createClient();
  const { viewerId, isMatchedOrg, hasProfileLink } = options;

  // Fetch individual profile data
  const { data: profile, error } = await supabase
    .from('individual_profiles')
    .select('*')
    .eq('user_id', profileId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Determine viewer context
  const context = determineViewerContext({
    isOwner: viewerId === profileId,
    hasProfileLink,
    isMatchedOrg,
  });

  // If self, return full profile
  if (context === 'self') {
    return profile;
  }

  // Fetch visibility settings
  const settings = await getProfileVisibilitySettings(profileId);

  // Apply redaction
  return redactProfile(profile, settings, context);
}

/**
 * Fetch matching profile with redaction
 */
export async function fetchRedactedMatchingProfile(
  profileId: string,
  options: FetchProfileOptions = {}
): Promise<any> {
  const supabase = await createClient();
  const { viewerId, isMatchedOrg, hasProfileLink } = options;

  // Fetch matching profile data
  const { data: profile, error } = await supabase
    .from('matching_profiles')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (error || !profile) {
    return null;
  }

  // Determine viewer context
  const context = determineViewerContext({
    isOwner: viewerId === profileId,
    hasProfileLink,
    isMatchedOrg,
  });

  // If self, return full profile
  if (context === 'self') {
    return profile;
  }

  // Fetch visibility settings
  const settings = await getProfileVisibilitySettings(profileId);

  // Apply redaction
  return redactProfile(profile, settings, context);
}

/**
 * Fetch complete profile (profiles + individual_profiles + matching_profiles)
 * with redaction applied
 */
export async function fetchCompleteRedactedProfile(
  profileId: string,
  options: FetchProfileOptions = {}
) {
  const { viewerId, isMatchedOrg, hasProfileLink } = options;

  // Determine viewer context
  const context = determineViewerContext({
    isOwner: viewerId === profileId,
    hasProfileLink,
    isMatchedOrg,
  });

  // If self, return full profile without redaction
  if (context === 'self') {
    const supabase = await createClient();

    const [{ data: baseProfile }, { data: individualProfile }, { data: matchingProfile }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', profileId).single(),
        supabase.from('individual_profiles').select('*').eq('user_id', profileId).single(),
        supabase.from('matching_profiles').select('*').eq('profile_id', profileId).single(),
      ]);

    return {
      ...baseProfile,
      individual: individualProfile,
      matching: matchingProfile,
    };
  }

  // Fetch all profile data and visibility settings in parallel
  const [baseProfile, individualProfile, matchingProfile, settings] = await Promise.all([
    fetchRedactedProfile(profileId, options),
    fetchRedactedIndividualProfile(profileId, options),
    fetchRedactedMatchingProfile(profileId, options),
    getProfileVisibilitySettings(profileId),
  ]);

  return {
    ...baseProfile,
    individual: individualProfile,
    matching: matchingProfile,
  };
}

/**
 * Check if a profile link token is valid
 * This would be used when someone accesses a profile via /profile/:handle?token=xxx
 */
export async function validateProfileLinkToken(profileId: string, token: string): Promise<boolean> {
  const safeToken = token.trim();
  if (!safeToken) {
    return false;
  }

  const inspected = await inspectCapabilityToken(safeToken, {
    tokenClass: CAPABILITY_TOKEN_CLASSES.PROFILE_SNIPPET_SHARE,
    metadata: { surface: 'profile_fetcher.validateProfileLinkToken' },
  });

  if (!inspected.ok) {
    return false;
  }

  const result = await db.execute(sql`
    SELECT 1
    FROM profile_snippets
    WHERE capability_token_id = ${inspected.token.id}::uuid
      AND user_id = ${profileId}::uuid
      AND deleted_at IS NULL
      AND revoked_at IS NULL
      AND public_surface_disabled_at IS NULL
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `);

  return getRows(result as any).length > 0;
}

/**
 * Check if viewer is matched with profile
 * Used to determine if viewer has match_only access
 */
export async function isViewerMatchedWithProfile(
  viewerId: string,
  profileId: string
): Promise<boolean> {
  const supabase = await createClient();

  // Check if there's an active match between viewer's org and the profile
  const { data: matches } = await supabase
    .from('matching_results')
    .select('id')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .limit(1);

  return (matches?.length ?? 0) > 0;
}
