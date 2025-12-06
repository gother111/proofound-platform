'use server';

import { requireAuth, assertOrgRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const templateStepEnum = z.enum([
  'business_value',
  'target_outcomes',
  'weight_matrix',
  'practicals',
  'expertise',
]);
export type TemplateStep = z.infer<typeof templateStepEnum>;

export const AssignmentTemplateInputSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  roleFamily: z.string().min(2, 'Role family is required'),
  description: z.string().optional(),
  appliesToSteps: z.array(templateStepEnum).min(1, 'Select at least one step to prefill'),
  presetPayload: z.record(z.any()).default({}),
  isGlobal: z.boolean().optional(),
});

export type AssignmentTemplateInput = z.infer<typeof AssignmentTemplateInputSchema>;

export type AssignmentTemplate = {
  id: string;
  orgId: string | null;
  name: string;
  roleFamily: string;
  description: string | null;
  appliesToSteps: TemplateStep[];
  presetPayload: Record<string, unknown>;
  isGlobal: boolean;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

function mapTemplate(row: Record<string, any>): AssignmentTemplate {
  return {
    id: row.id,
    orgId: row.org_id ?? null,
    name: row.name,
    roleFamily: row.role_family,
    description: row.description ?? null,
    appliesToSteps: (row.applies_to_steps ?? []) as TemplateStep[],
    presetPayload: (row.preset_payload ?? {}) as Record<string, unknown>,
    isGlobal: Boolean(row.is_global),
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export async function listTemplates(orgId: string) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin', 'member', 'viewer']);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignment_templates')
    .select('*')
    .or(`is_global.eq.true,org_id.eq.${orgId}`)
    .order('role_family')
    .order('name');

  if (error) {
    console.error('Failed to list assignment templates:', error);
    return { error: 'Unable to load templates' };
  }

  return { templates: (data ?? []).map(mapTemplate) };
}

export async function getTemplate(templateId: string, orgId: string) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin', 'member', 'viewer']);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignment_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load assignment template:', error);
    return { error: 'Unable to load template' };
  }

  if (!data) {
    return { error: 'Template not found' };
  }

  // Enforce org visibility unless global
  if (!data.is_global && data.org_id !== orgId) {
    return { error: 'Template not found or not accessible' };
  }

  return { template: mapTemplate(data) };
}

export async function createTemplate(orgId: string, payload: AssignmentTemplateInput) {
  const user = await requireAuth();
  await assertOrgRole(orgId, user.id, ['owner', 'admin']);

  const parsed = AssignmentTemplateInputSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: 'Invalid template data', details: parsed.error.flatten() };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignment_templates')
    .insert({
      org_id: orgId,
      name: parsed.data.name,
      role_family: parsed.data.roleFamily,
      description: parsed.data.description,
      applies_to_steps: parsed.data.appliesToSteps,
      preset_payload: parsed.data.presetPayload,
      is_global: false,
      created_by: user.id,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Failed to create assignment template:', error);
    return { error: 'Unable to create template' };
  }

  if (!data) {
    return { error: 'Unable to create template' };
  }

  return { template: mapTemplate(data) };
}
