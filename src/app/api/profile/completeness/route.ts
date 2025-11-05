import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { profiles, skills, skillProofs, skillVerificationRequests, experiences } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface NextBestAction {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'profile' | 'expertise' | 'verification' | 'matching';
  actionUrl: string;
  completed: boolean;
}

/**
 * GET /api/profile/completeness
 *
 * Calculate profile completeness and return next best actions
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Fetch profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: individualProfile } = await supabase
      .from('individual_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: matchingProfile } = await supabase
      .from('matching_profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    // Count skills, proofs, verifications, experiences
    const [skillCount] = await db
      .select({ count: count() })
      .from(skills)
      .where(eq(skills.profileId, user.id));

    const [proofCount] = await db
      .select({ count: count() })
      .from(skillProofs)
      .where(eq(skillProofs.profileId, user.id));

    const [verificationCount] = await db
      .select({ count: count() })
      .from(skillVerificationRequests)
      .where(
        and(
          eq(skillVerificationRequests.requesterProfileId, user.id),
          eq(skillVerificationRequests.status, 'accepted')
        )
      );

    const [experienceCount] = await db
      .select({ count: count() })
      .from(experiences)
      .where(eq(experiences.userId, user.id));

    // Calculate completeness
    const checks = {
      hasDisplayName: !!profile?.display_name,
      hasAvatar: !!profile?.avatar_url,
      hasHeadline: !!individualProfile?.headline,
      hasBio: !!individualProfile?.bio,
      hasMission: !!individualProfile?.mission,
      hasLocation: !!matchingProfile?.location,
      hasSkills: (skillCount?.count || 0) >= 5,
      hasProofs: (proofCount?.count || 0) > 0,
      hasVerifications: (verificationCount?.count || 0) > 0,
      hasExperiences: (experienceCount?.count || 0) > 0,
    };

    const totalChecks = Object.keys(checks).length;
    const completedChecks = Object.values(checks).filter(Boolean).length;
    const percentage = Math.round((completedChecks / totalChecks) * 100);

    // Generate next best actions
    const actions: NextBestAction[] = [];

    if (!checks.hasDisplayName) {
      actions.push({
        id: 'add-name',
        title: 'Add your display name',
        description: 'Let others know who you are',
        priority: 'high',
        category: 'profile',
        actionUrl: '/app/i/settings',
        completed: false,
      });
    }

    if (!checks.hasAvatar) {
      actions.push({
        id: 'upload-photo',
        title: 'Upload a profile photo',
        description: 'Profiles with photos get 40% more views',
        priority: 'high',
        category: 'profile',
        actionUrl: '/app/i/settings',
        completed: false,
      });
    }

    if (!checks.hasHeadline) {
      actions.push({
        id: 'add-headline',
        title: 'Write a professional headline',
        description: 'Describe what you do in one sentence',
        priority: 'high',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    }

    if (!checks.hasMission) {
      actions.push({
        id: 'define-mission',
        title: 'Define your personal mission',
        description: 'Help us find purpose-aligned opportunities',
        priority: 'medium',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    }

    if (!checks.hasSkills) {
      actions.push({
        id: 'add-skills',
        title: 'Add at least 5 skills',
        description: 'Build your Expertise Atlas to get matched',
        priority: 'high',
        category: 'expertise',
        actionUrl: '/app/i/expertise',
        completed: false,
      });
    }

    if (checks.hasSkills && !checks.hasProofs) {
      actions.push({
        id: 'upload-proofs',
        title: 'Upload proof of your skills',
        description: 'Add artifacts, certifications, or project links',
        priority: 'medium',
        category: 'expertise',
        actionUrl: '/app/i/expertise',
        completed: false,
      });
    }

    if (checks.hasProofs && !checks.hasVerifications) {
      actions.push({
        id: 'request-verification',
        title: 'Request skill verifications',
        description: 'Ask peers or managers to verify your skills',
        priority: 'medium',
        category: 'verification',
        actionUrl: '/app/i/expertise',
        completed: false,
      });
    }

    if (!checks.hasExperiences) {
      actions.push({
        id: 'add-experience',
        title: 'Add your work experience',
        description: 'Help employers understand your background',
        priority: 'medium',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    }

    if (!checks.hasLocation) {
      actions.push({
        id: 'set-location',
        title: 'Set your location preferences',
        description: 'Get matched with opportunities near you',
        priority: 'medium',
        category: 'matching',
        actionUrl: '/app/i/matching',
        completed: false,
      });
    }

    if (!checks.hasBio) {
      actions.push({
        id: 'write-bio',
        title: 'Write your bio',
        description: 'Tell your story and what drives you',
        priority: 'low',
        category: 'profile',
        actionUrl: '/app/i/profile',
        completed: false,
      });
    }

    // Sort by priority: high > medium > low
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({
      percentage,
      missing: Object.entries(checks)
        .filter(([_, value]) => !value)
        .map(([key]) => key),
      actions,
    });
  } catch (error) {
    console.error('Error calculating profile completeness:', error);
    return NextResponse.json(
      { error: 'Failed to calculate profile completeness' },
      { status: 500 }
    );
  }
}
