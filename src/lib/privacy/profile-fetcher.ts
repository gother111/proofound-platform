/**
 * Profile fetching utilities with automatic redaction
 *
 * Use these functions instead of direct database queries to ensure
 * privacy settings are automatically applied
 */

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
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
 * Check if viewer is matched with profile
 * Used to determine if viewer has match_only access
 */
export async function isViewerMatchedWithProfile(
  viewerId: string,
  profileId: string
): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT 1
    FROM public.matches m
    JOIN public.assignments a ON a.id = m.assignment_id
    JOIN public.organization_members om ON om.org_id = a.org_id
    WHERE m.profile_id = ${profileId}::uuid
      AND om.user_id = ${viewerId}::uuid
      AND om.state = 'active'
      AND a.status = 'active'
      AND m.lifecycle_state IN (
        'generated',
        'shortlisted',
        'passed',
        'intro_in_progress',
        'interview_in_progress'
      )
      AND (m.snoozed_until IS NULL OR m.snoozed_until < NOW())
    LIMIT 1
  `);

  return getRows(result as any).length > 0;
}
