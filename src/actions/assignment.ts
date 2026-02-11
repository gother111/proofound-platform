'use server';

import { requireAuth, assertOrgRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { assignments } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

export async function createAssignment(orgId: string, data: AssignmentData) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin', 'member']);

  const result = AssignmentSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid assignment data', details: result.error.flatten() };
  }

  try {
    const supabase = await createClient();

    // Prepare data for insertion
    const insertData = {
      orgId,
      role: result.data.role,
      description: result.data.description,
      status: result.data.status,
      businessValue: result.data.businessValue,
      expectedImpact: result.data.expectedImpact,
      valuesRequired: result.data.valuesRequired,
      causeTags: result.data.causeTags,
      outcomes: result.data.outcomes,
      mustHaveSkills: result.data.mustHaveSkills,
      niceToHaveSkills: result.data.niceToHaveSkills,
      verificationGates: result.data.verificationGates,
      minLanguage: result.data.minLanguage,
      weights: result.data.weights,
      locationMode: result.data.locationMode,
      radiusKm: result.data.radiusKm,
      country: result.data.country,
      city: result.data.city,
      compMin: result.data.compMin,
      compMax: result.data.compMax,
      currency: result.data.currency,
      hoursMin: result.data.hoursMin,
      hoursMax: result.data.hoursMax,
      startEarliest: result.data.startEarliest,
      startLatest: result.data.startLatest,
    };

    const { data: newAssignment, error } = await supabase
      .from('assignments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create assignment:', error);
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
    console.error('Unexpected error creating assignment:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateAssignment(
  assignmentId: string,
  orgId: string,
  data: Partial<AssignmentData>
) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin', 'member']);

  // We use partial schema for updates
  const result = AssignmentSchema.partial().safeParse(data);
  if (!result.success) {
    return { error: 'Invalid assignment data', details: result.error.flatten() };
  }

  try {
    const supabase = await createClient();

    // Snake_case conversion happens automatically by Supabase client if configured,
    // but Drizzle schema uses camelCase.
    // Since we are using Supabase client directly here (not Drizzle), we might need to be careful.
    // However, the `createAssignment` above used camelCase keys which Supabase client usually maps if setup correctly,
    // OR we should map them manually to snake_case if the Supabase client is "raw".
    // Looking at `src/actions/org.ts`, it uses `display_name` (snake_case) in `.update()`.
    // So I should probably map to snake_case here to be safe, or check if there's a mapper.
    // The `createAssignment` above used camelCase keys in `insertData`.
    // If the Supabase client is typed with Drizzle schema or similar, it might expect snake_case in the DB.
    // Let's check `src/db/schema.ts` again. The columns are defined as `role: text('role')`, `businessValue: text('business_value')`.
    // The Supabase client `from('assignments')` interacts with the DB columns directly.
    // So I MUST use snake_case keys for the Supabase query.

    // Let's fix `createAssignment` and `updateAssignment` to use snake_case keys.

    const dbData = {
      role: result.data.role,
      description: result.data.description,
      status: result.data.status,
      business_value: result.data.businessValue,
      expected_impact: result.data.expectedImpact,
      values_required: result.data.valuesRequired,
      cause_tags: result.data.causeTags,
      outcomes: result.data.outcomes,
      must_have_skills: result.data.mustHaveSkills,
      nice_to_have_skills: result.data.niceToHaveSkills,
      verification_gates: result.data.verificationGates,
      min_language: result.data.minLanguage,
      weights: result.data.weights,
      location_mode: result.data.locationMode,
      radius_km: result.data.radiusKm,
      country: result.data.country,
      city: result.data.city,
      comp_min: result.data.compMin,
      comp_max: result.data.compMax,
      currency: result.data.currency,
      hours_min: result.data.hoursMin,
      hours_max: result.data.hoursMax,
      start_earliest: result.data.startEarliest,
      start_latest: result.data.startLatest,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(dbData).forEach(
      (key) => (dbData as any)[key] === undefined && delete (dbData as any)[key]
    );

    const { error } = await supabase
      .from('assignments')
      .update(dbData)
      .eq('id', assignmentId)
      .eq('org_id', orgId); // Security check

    if (error) {
      console.error('Failed to update assignment:', error);
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
    console.error('Unexpected error updating assignment:', error);
    return { error: 'An unexpected error occurred' };
  }
}
