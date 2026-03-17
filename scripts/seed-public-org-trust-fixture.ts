import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { SEEDED_PUBLIC_ORG_TRUST_FIXTURE } from '../src/lib/launch/public-org-trust-fixture';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath, override: false });
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function main() {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();
  const { organization, assignment, visibility } = SEEDED_PUBLIC_ORG_TRUST_FIXTURE;

  const { data: existingOrganization, error: existingOrganizationError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', organization.slug)
    .maybeSingle();

  if (existingOrganizationError) {
    throw new Error(
      `Failed to read existing organization fixture state: ${existingOrganizationError.message}`
    );
  }

  const organizationId = existingOrganization?.id ?? SEEDED_PUBLIC_ORG_TRUST_FIXTURE.orgId;

  const { error: orgError } = await supabase.from('organizations').upsert(
    {
      id: organizationId,
      slug: organization.slug,
      display_name: organization.displayName,
      type: organization.type,
      website: organization.website,
      tagline: organization.tagline,
      mission: organization.mission,
      working_context: organization.workingContext,
      hiring_process_summary: organization.hiringProcessSummary,
      operating_region: organization.operatingRegion,
      public_portfolio_state: organization.publicPortfolioState,
      trust_status: organization.trustStatus,
      org_trust_tier: organization.orgTrustTier,
      trust_status_updated_at: nowIso,
      org_trust_tier_updated_at: nowIso,
      website_verified_at: nowIso,
      verified: true,
      updated_at: nowIso,
    },
    { onConflict: 'id' }
  );

  if (orgError) {
    throw new Error(`Failed to upsert public org trust fixture organization: ${orgError.message}`);
  }

  const { error: visibilityError } = await supabase.from('organization_field_visibility').upsert(
    {
      org_id: organizationId,
      ...visibility,
      updated_at: nowIso,
    },
    { onConflict: 'org_id' }
  );

  if (visibilityError) {
    throw new Error(`Failed to upsert organization visibility fixture: ${visibilityError.message}`);
  }

  const { error: publicationError } = await supabase.from('portfolio_publication_states').upsert(
    {
      subject_type: 'organization',
      subject_id: organizationId,
      requested_state: organization.publicPortfolioState,
      effective_state: organization.publicPortfolioState,
      publication_state: organization.publicPortfolioState,
      indexing_state: 'noindex',
      robots_state: 'noindex_nofollow',
      sitemap_state: 'excluded',
      reason_codes: [],
      metadata: {
        imported_from: 'seed_public_org_trust_fixture',
      },
      last_computed_at: nowIso,
      updated_at: nowIso,
    },
    { onConflict: 'subject_type,subject_id' }
  );

  if (publicationError) {
    throw new Error(
      `Failed to upsert portfolio publication fixture state: ${publicationError.message}`
    );
  }

  const { error: assignmentError } = await supabase.from('assignments').upsert(
    {
      id: SEEDED_PUBLIC_ORG_TRUST_FIXTURE.assignmentId,
      org_id: organizationId,
      role: assignment.role,
      description: assignment.businessValue,
      status: 'active',
      creation_status: 'published',
      business_value: assignment.businessValue,
      values_required: [],
      cause_tags: [],
      must_have_skills: [],
      nice_to_have_skills: [],
      location_mode: assignment.locationMode,
      verification_gates: [],
      updated_at: nowIso,
    },
    { onConflict: 'id' }
  );

  if (assignmentError) {
    throw new Error(
      `Failed to upsert public org trust fixture assignment: ${assignmentError.message}`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        slug: organization.slug,
        path: `/portfolio/org/${organization.slug}`,
        publicationState: organization.publicPortfolioState,
        seededAt: nowIso,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    'Failed to seed public org trust fixture:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
