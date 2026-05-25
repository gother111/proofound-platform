'use server';

import { requireAuth, assertOrgRole } from '@/lib/auth';
import { log } from '@/lib/log';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Validation schemas
const SkillRequirementSchema = z.object({
  id: z.string(),
  level: z.number().min(0).max(5),
  label: z.string().optional(),
  catId: z.number().optional(),
  subcatId: z.number().optional(),
  l3Id: z.number().optional(),
  l1Label: z.string().optional(),
  l2Label: z.string().optional(),
  l3Label: z.string().optional(),
  linkedToBV: z.boolean().optional(),
  linkedToTO: z.boolean().optional(),
});

const LanguageRequirementSchema = z.object({
  code: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

export const AssignmentSchema = z.object({
  role: z.string().min(3, 'Role title must be at least 3 characters'),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).default('draft'),
  businessValue: z.string().min(10, 'Business value must be at least 10 characters'),
  expectedImpact: z.string().optional(),
  // Arrays
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  outcomes: z
    .array(
      z.object({
        metric: z.string(),
        target: z.string(),
        timeframe: z.string(),
      })
    )
    .optional(),
  mustHaveSkills: z.array(SkillRequirementSchema).optional(),
  niceToHaveSkills: z.array(SkillRequirementSchema).optional(),
  verificationGates: z.array(z.string()).optional(),
  // Objects
  minLanguage: LanguageRequirementSchema.optional(),
  weights: z.record(z.number()).optional(),
  // Location
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  // Compensation
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().default('USD'),
  // Hours
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  // Dates
  startEarliest: z.string().optional(), // ISO date string
  startLatest: z.string().optional(),
});

export type AssignmentData = z.infer<typeof AssignmentSchema>;

function mapAssignmentDataToDb(data: Partial<AssignmentData>, orgId?: string) {
  const dbData = {
    ...(orgId ? { org_id: orgId } : {}),
    role: data.role,
    description: data.description,
    status: data.status,
    business_value: data.businessValue,
    expected_impact: data.expectedImpact,
    values_required: data.valuesRequired,
    cause_tags: data.causeTags,
    outcomes: data.outcomes,
    must_have_skills: data.mustHaveSkills,
    nice_to_have_skills: data.niceToHaveSkills,
    verification_gates: data.verificationGates,
    min_language: data.minLanguage,
    weights: data.weights,
    location_mode: data.locationMode,
    radius_km: data.radiusKm,
    country: data.country,
    city: data.city,
    comp_min: data.compMin,
    comp_max: data.compMax,
    currency: data.currency,
    hours_min: data.hoursMin,
    hours_max: data.hoursMax,
    start_earliest: data.startEarliest,
    start_latest: data.startLatest,
  };

  Object.keys(dbData).forEach((key) => {
    if ((dbData as Record<string, unknown>)[key] === undefined) {
      delete (dbData as Record<string, unknown>)[key];
    }
  });

  return dbData;
}

export async function createAssignment(orgId: string, data: AssignmentData) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['org_owner', 'org_manager', 'org_reviewer']);

  const result = AssignmentSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid assignment data', details: result.error.flatten() };
  }

  try {
    const supabase = await createClient();
    const insertData = mapAssignmentDataToDb(result.data, orgId);

    const { data: newAssignment, error } = await supabase
      .from('assignments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      log.error('assignment.action.create_failed', { orgId, error });
      return { error: 'Failed to create assignment' };
    }

    // Get org slug for revalidation/redirect
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single();

    if (org) {
      revalidatePath(`/app/o/${org.slug}/assignments`);
    }

    return { success: true, assignmentId: newAssignment.id };
  } catch (error) {
    log.error('assignment.action.create_unexpected_failed', { orgId, error });
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateAssignment(
  assignmentId: string,
  orgId: string,
  data: Partial<AssignmentData>
) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['org_owner', 'org_manager', 'org_reviewer']);

  // We use partial schema for updates
  const result = AssignmentSchema.partial().safeParse(data);
  if (!result.success) {
    return { error: 'Invalid assignment data', details: result.error.flatten() };
  }

  try {
    const supabase = await createClient();
    const dbData = {
      ...mapAssignmentDataToDb(result.data),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('assignments')
      .update(dbData)
      .eq('id', assignmentId)
      .eq('org_id', orgId); // Security check

    if (error) {
      log.error('assignment.action.update_failed', { assignmentId, orgId, error });
      return { error: 'Failed to update assignment' };
    }

    // Get org slug for revalidation
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single();

    if (org) {
      revalidatePath(`/app/o/${org.slug}/assignments`);
    }

    return { success: true };
  } catch (error) {
    log.error('assignment.action.update_unexpected_failed', { assignmentId, orgId, error });
    return { error: 'An unexpected error occurred' };
  }
}
