import fs from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import {
  SEEDED_PUBLIC_ORG_TRUST_FIXTURE,
  SEEDED_PUBLIC_ORG_TRUST_PATH,
} from '../src/lib/launch/public-org-trust-fixture';

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isLocalHostname(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  );
}

function parseUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function resolveLiveFixtureVerificationUrl() {
  const override = parseUrl(process.env.PUBLIC_ORG_TRUST_FIXTURE_VERIFY_URL?.trim());
  if (override) {
    return new URL(SEEDED_PUBLIC_ORG_TRUST_PATH, override);
  }

  const baseUrl = parseUrl(process.env.BASE_URL?.trim());
  if (!baseUrl || isLocalHostname(baseUrl.hostname)) {
    return null;
  }

  return new URL(SEEDED_PUBLIC_ORG_TRUST_PATH, baseUrl);
}

async function verifyLiveFixtureAvailability(url: URL) {
  const timeoutMs = Number.parseInt(process.env.PUBLIC_ORG_TRUST_VERIFY_TIMEOUT_MS || '90000', 10);
  const intervalMs = Number.parseInt(process.env.PUBLIC_ORG_TRUST_VERIFY_INTERVAL_MS || '3000', 10);
  const deadline = Date.now() + Math.max(timeoutMs, 1000);
  let lastFailureReason = 'unknown';

  while (Date.now() <= deadline) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
      });
      const body = await response.text();

      if (
        response.status === 200 &&
        body.includes(SEEDED_PUBLIC_ORG_TRUST_FIXTURE.organization.displayName) &&
        /public organization trust card/i.test(body) &&
        !/organization portfolio unavailable/i.test(body)
      ) {
        return {
          ok: true,
          status: response.status,
          verifiedAt: new Date().toISOString(),
        } as const;
      }

      lastFailureReason = `status=${response.status}, unavailable=${/organization portfolio unavailable/i.test(
        body
      )}`;
    } catch (error) {
      lastFailureReason = error instanceof Error ? error.message : String(error);
    }

    await sleep(Math.max(intervalMs, 250));
  }

  throw new Error(
    `Timed out waiting for seeded public org trust page at ${url.toString()} (${lastFailureReason})`
  );
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
  const nowIso = new Date().toISOString();
  const liveVerificationUrl = resolveLiveFixtureVerificationUrl();
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const { organization, assignment, visibility } = SEEDED_PUBLIC_ORG_TRUST_FIXTURE;

  if (!hasServiceRoleKey) {
    if (!liveVerificationUrl) {
      throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
    }

    const verification = await verifyLiveFixtureAvailability(liveVerificationUrl);
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'verify_only',
          slug: organization.slug,
          path: SEEDED_PUBLIC_ORG_TRUST_PATH,
          verificationUrl: liveVerificationUrl.toString(),
          verifiedAt: verification.verifiedAt,
          httpStatus: verification.status,
        },
        null,
        2
      )
    );
    return;
  }

  const supabase = createAdminClient();

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
      creation_status: 'review_ready',
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

  let verification: Awaited<ReturnType<typeof verifyLiveFixtureAvailability>> | null = null;
  if (liveVerificationUrl) {
    verification = await verifyLiveFixtureAvailability(liveVerificationUrl);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: 'seeded',
        slug: organization.slug,
        path: SEEDED_PUBLIC_ORG_TRUST_PATH,
        publicationState: organization.publicPortfolioState,
        seededAt: nowIso,
        verificationUrl: liveVerificationUrl?.toString() ?? null,
        verifiedAt: verification?.verifiedAt ?? null,
        httpStatus: verification?.status ?? null,
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
