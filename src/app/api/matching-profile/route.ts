/**
 * Matching Profile API
 * GET/PUT /api/matching-profile
 *
 * Implements PRD Gap 5: Manage user matching preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const MatchingProfileSchema = z.object({
  profileId: z.string().uuid(),
  desiredRoles: z.array(z.string()),
  desiredIndustries: z.array(z.string()),
  orgTypes: z.array(z.string()),
  weights: z.object({
    mission: z.number().min(0).max(100),
    expertise: z.number().min(0).max(100),
    tools: z.number().min(0).max(100),
    logistics: z.number().min(0).max(100),
    recency: z.number().min(0).max(100),
  }),
  workMode: z.enum(['remote', 'hybrid', 'onsite']),
  preferredLocations: z.array(z.string()),
  minSalary: z.number().min(0),
  maxSalary: z.number().min(0),
  currency: z.string(),
  hoursMin: z.number().min(0),
  hoursMax: z.number().min(0).max(168),
  availabilityEarliest: z.string(),
  availabilityLatest: z.string(),
  visibility: z
    .object({
      showExactSalary: z.boolean(),
      showExactLocation: z.boolean(),
      allowNameRedaction: z.boolean(),
      showFullSkillLevels: z.boolean(),
    })
    .optional(),
});

/**
 * GET matching profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId') || user.id;

    // Fetch matching profile from database
    const { data: matchingProfile, error } = await supabase
      .from('matching_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching profile yet
        return NextResponse.json(null);
      }
      throw error;
    }

    return NextResponse.json(matchingProfile);
  } catch (error: any) {
    console.error('Failed to fetch matching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch matching profile' }, { status: 500 });
  }
}

/**
 * PUT matching profile (update or create)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = MatchingProfileSchema.parse(body);

    // Validate weights sum to 100
    const totalWeight = Object.values(data.weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight !== 100) {
      return NextResponse.json({ error: 'Weights must sum to 100%' }, { status: 400 });
    }

    // Verify user owns this profile
    if (data.profileId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.profileId)
        .single();

      if (!profile || profile.id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Upsert matching profile
    const { data: savedProfile, error } = await supabase
      .from('matching_profiles')
      .upsert(
        {
          profile_id: data.profileId,
          desired_roles: data.desiredRoles,
          desired_industries: data.desiredIndustries,
          org_types: data.orgTypes,
          weights: data.weights,
          work_mode: data.workMode,
          preferred_locations: data.preferredLocations,
          min_salary: data.minSalary,
          max_salary: data.maxSalary,
          currency: data.currency,
          hours_min: data.hoursMin,
          hours_max: data.hoursMax,
          availability_earliest: data.availabilityEarliest,
          availability_latest: data.availabilityLatest,
          visibility: data.visibility,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      profile: savedProfile,
    });
  } catch (error: any) {
    console.error('Failed to save matching profile:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to save matching profile' }, { status: 500 });
  }
}
