#!/usr/bin/env tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import {
  identityMethodFromTierSource,
  resolveCanonicalVerificationTier,
  type LinkedInVerificationLevel,
  type VerificationTier,
} from '../src/lib/verification/tier';
import { resolveWorkEmailValidity } from '../src/lib/verification/work-email-validity';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Row = {
  user_id: string;
  verified: boolean | null;
  verified_at: string | null;
  verification_method: 'veriff' | 'work_email' | 'linkedin' | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  verification_tier: 'unverified' | 'workplace_verified' | 'identity_verified' | null;
  verification_tier_source:
    | 'linkedin_identity'
    | 'linkedin_workplace'
    | 'work_email'
    | 'veriff'
    | 'unknown'
    | null;
  work_email_verified: boolean | null;
  work_email_verified_at: string | null;
  work_email_reverify_due_at: string | null;
  linkedin_verification_status: 'unverified' | 'pending' | 'verified' | 'failed' | null;
  linkedin_verification_level:
    | 'unverified'
    | 'pending'
    | 'workplace'
    | 'identity'
    | 'failed'
    | null;
  linkedin_verified_at: string | null;
  linkedin_verification_data: unknown;
};

type UpdatePayload = {
  verification_tier: VerificationTier;
  verification_tier_source:
    | 'linkedin_identity'
    | 'linkedin_workplace'
    | 'work_email'
    | 'veriff'
    | 'unknown';
  linkedin_verification_level: LinkedInVerificationLevel;
  linkedin_verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  linkedin_verified_at: string | null;
  verified: boolean;
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed';
  verification_method: 'veriff' | 'work_email' | 'linkedin' | null;
  verified_at: string | null;
};

function toLinkedInStatus(
  level: LinkedInVerificationLevel
): 'unverified' | 'pending' | 'verified' | 'failed' {
  if (level === 'identity' || level === 'workplace') return 'verified';
  if (level === 'pending') return 'pending';
  if (level === 'failed') return 'failed';
  return 'unverified';
}

function computeUpdate(row: Row): UpdatePayload {
  const nowIso = new Date().toISOString();
  const workEmailValidity = resolveWorkEmailValidity({
    work_email_verified: row.work_email_verified,
    work_email_verified_at: row.work_email_verified_at,
    work_email_reverify_due_at: row.work_email_reverify_due_at,
    verified_at: row.verified_at,
  });

  const canonical = resolveCanonicalVerificationTier({
    currentTier: row.verification_tier,
    currentTierSource: row.verification_tier_source,
    verificationMethod: row.verification_method,
    verificationStatus: row.verification_status,
    verified: row.verified,
    linkedinVerificationStatus: row.linkedin_verification_status,
    linkedinVerificationData: row.linkedin_verification_data,
    workEmailCurrentlyVerified: workEmailValidity.isCurrentlyVerified,
  });

  const linkedinStatus = toLinkedInStatus(canonical.linkedinVerificationLevel);
  const linkedinVerifiedAt =
    linkedinStatus === 'verified' ? row.linkedin_verified_at || nowIso : row.linkedin_verified_at;

  if (canonical.verificationTier === 'identity_verified') {
    return {
      verification_tier: canonical.verificationTier,
      verification_tier_source: canonical.verificationTierSource,
      linkedin_verification_level: canonical.linkedinVerificationLevel,
      linkedin_verification_status: linkedinStatus,
      linkedin_verified_at: linkedinVerifiedAt,
      verified: true,
      verification_status: 'verified',
      verification_method: identityMethodFromTierSource(canonical.verificationTierSource),
      verified_at: row.verified_at || nowIso,
    };
  }

  const hasPending =
    linkedinStatus === 'pending' ||
    row.verification_status === 'pending' ||
    (Boolean(row.work_email_reverify_due_at) && row.verification_method === 'work_email');

  return {
    verification_tier: canonical.verificationTier,
    verification_tier_source: canonical.verificationTierSource,
    linkedin_verification_level: canonical.linkedinVerificationLevel,
    linkedin_verification_status: linkedinStatus,
    linkedin_verified_at: linkedinStatus === 'verified' ? linkedinVerifiedAt : null,
    verified: false,
    verification_status: hasPending
      ? 'pending'
      : row.verification_status === 'failed'
        ? 'failed'
        : 'unverified',
    verification_method: hasPending
      ? row.verification_method === 'work_email'
        ? 'work_email'
        : 'linkedin'
      : canonical.verificationTierSource === 'work_email'
        ? 'work_email'
        : null,
    verified_at: null,
  };
}

function differs(row: Row, update: UpdatePayload): boolean {
  return (
    row.verification_tier !== update.verification_tier ||
    row.verification_tier_source !== update.verification_tier_source ||
    row.linkedin_verification_level !== update.linkedin_verification_level ||
    row.linkedin_verification_status !== update.linkedin_verification_status ||
    row.linkedin_verified_at !== update.linkedin_verified_at ||
    Boolean(row.verified) !== update.verified ||
    row.verification_status !== update.verification_status ||
    row.verification_method !== update.verification_method ||
    row.verified_at !== update.verified_at
  );
}

async function fetchAllRows(): Promise<Row[]> {
  const pageSize = 1000;
  let from = 0;
  const rows: Row[] = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from('individual_profiles')
      .select(
        'user_id, verified, verified_at, verification_method, verification_status, verification_tier, verification_tier_source, work_email_verified, work_email_verified_at, work_email_reverify_due_at, linkedin_verification_status, linkedin_verification_level, linkedin_verified_at, linkedin_verification_data'
      )
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch individual_profiles (${from}-${to}): ${error.message}`);
    }

    const page = (data || []) as Row[];
    if (page.length === 0) break;
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const dryRun = !apply || process.argv.includes('--dry-run');

  const rows = await fetchAllRows();

  const updates: Array<{ userId: string; update: UpdatePayload }> = [];

  for (const row of rows) {
    const update = computeUpdate(row);
    if (differs(row, update)) {
      updates.push({ userId: row.user_id, update });
    }
  }

  const summary = {
    mode: apply ? 'apply' : 'dry-run',
    scanned: rows.length,
    updatesNeeded: updates.length,
    identityTierUsers: updates.filter((u) => u.update.verification_tier === 'identity_verified')
      .length,
    workplaceTierUsers: updates.filter((u) => u.update.verification_tier === 'workplace_verified')
      .length,
    unverifiedUsers: updates.filter((u) => u.update.verification_tier === 'unverified').length,
    sample: updates.slice(0, 20).map((u) => ({ userId: u.userId, ...u.update })),
  };

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  let updated = 0;
  const failures: Array<{ userId: string; error: string }> = [];

  for (const { userId, update } of updates) {
    const { error } = await supabase
      .from('individual_profiles')
      .update(update)
      .eq('user_id', userId);
    if (error) {
      failures.push({ userId, error: error.message });
      continue;
    }
    updated += 1;
  }

  console.log(
    JSON.stringify(
      {
        ...summary,
        updated,
        failed: failures.length,
        failures,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
