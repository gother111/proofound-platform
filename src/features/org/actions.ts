'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';

const nullableUrl = z.string().url().nullable().optional();
const nullableString = z.string().nullable().optional();

const OrgPatch = z.object({
  logo_url: nullableUrl,
  tagline: z.string().max(160).nullable().optional(),
  size: nullableString,
  industry: nullableString,
  founded_date: nullableString,
  legal_form: nullableString,
  locations: z.any().optional(),
  mission: nullableString,
  vision: nullableString,
  core_values: z.array(z.string()).optional(),
  causes: z.array(z.string()).optional(),
  verifications: z.any().optional(),
  impact_pipeline: z.any().optional(),
  commitments: z.any().optional(),
  website_url: nullableUrl,
  social_urls: z.any().optional(),
});

export async function patchOrganization(orgId: string, input: unknown) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthorized');

  const body = OrgPatch.parse(input);
  const { error } = await supabase.from('organizations').update(body).eq('id', orgId);
  if (error) throw error;
}
