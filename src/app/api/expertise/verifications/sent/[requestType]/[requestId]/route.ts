import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { resolveSiteUrlFromHeaders } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  artifactTypeLabel,
  hashVerificationToken,
  mapCustomRelationshipToSkillVerifierSource,
  parseCustomSkillName,
  relationshipDisplayLabel,
  relationshipLabel,
  type CustomVerificationRelationship,
} from '@/lib/verification/custom-verification';
import { normalizeEmail, writeVerificationAuditLog } from '@/lib/verification/integrity';

type RequestType = 'skill' | 'impact_story';
type DeleteEligibility = 'pending' | 'failed';
type SkillResendEligibility = 'pending' | 'declined' | 'expired';
type ImpactResendEligibility = 'pending' | 'failed' | 'declined' | 'expired';
type BundleResendEligibility = 'pending' | 'declined' | 'expired';

type SkillVerifierSource = 'peer' | 'manager' | 'external';

type SkillVerificationRequestRow = {
  id: string;
  skill_id: string;
  requester_profile_id: string;
  requester_email_snapshot: string | null;
  requester_domain_snapshot: string | null;
  verification_token?: string | null;
  verifier_email: string;
  verifier_domain_snapshot: string | null;
  verifier_profile_id: string | null;
  verifier_source: SkillVerifierSource;
  message: string | null;
  risk_signals: Record<string, unknown> | null;
  requires_authenticated_verifier: boolean | null;
  integrity_status: 'clear' | 'flagged' | null;
  integrity_reason: string | null;
  integrity_meta: Record<string, unknown> | null;
  integrity_flagged_at: string | null;
  requester_ip_hash: string | null;
  requester_user_agent_hash: string | null;
  custom_request_id: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  responded_at: string | null;
  response_message: string | null;
  responder_ip_hash: string | null;
  responder_user_agent_hash: string | null;
  response_auth_method: 'token' | 'authenticated' | null;
  response_actor_email: string | null;
  created_at: string;
  expires_at: string | null;
};

type ImpactVerificationRequestRow = {
  id: string;
  impact_story_id: string;
  requester_profile_id: string;
  requester_email_snapshot: string | null;
  requester_domain_snapshot: string | null;
  verifier_email: string;
  verifier_domain_snapshot: string | null;
  verifier_profile_id: string | null;
  verifier_name: string | null;
  verifier_relationship: string | null;
  message: string | null;
  token: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'failed';
  risk_signals: Record<string, unknown> | null;
  requires_authenticated_verifier: boolean | null;
  integrity_status: 'clear' | 'flagged' | null;
  integrity_reason: string | null;
  integrity_meta: Record<string, unknown> | null;
  integrity_flagged_at: string | null;
  requester_ip_hash: string | null;
  requester_user_agent_hash: string | null;
  expires_at: string;
  claim_snapshot: Record<string, unknown> | null;
  response_message: string | null;
  responded_at: string | null;
  responder_ip_hash: string | null;
  responder_user_agent_hash: string | null;
  response_auth_method: 'token' | 'authenticated' | null;
  response_actor_email: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  created_at: string;
  updated_at: string;
};

type CustomVerificationRequestRow = {
  id: string;
  requester_profile_id: string;
  verifier_email: string;
  verifier_profile_id: string | null;
  verifier_relationship: CustomVerificationRelationship;
  message: string | null;
  token_hash: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  responded_at: string | null;
  response_message: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

type CustomVerificationRequestItemRow = {
  id: string;
  request_id: string;
  artifact_type: 'skill' | 'experience' | 'education' | 'impact_story' | 'project' | 'volunteering';
  artifact_id: string;
  display_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
};

type RequesterProfileRow = {
  display_name: string | null;
};

type SkillTaxonomyRow = {
  name_i18n?: unknown;
};

type SkillLabelLookupRow = {
  skill_id?: string | null;
  name_i18n?: unknown;
  taxonomy?: SkillTaxonomyRow | null;
};

type InsertSkillResult = {
  error: unknown | null;
  tokenPersisted: boolean;
};

type ResendContext = {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  request: NextRequest;
};

type BundleResendResult = {
  resentRequestId: string;
  reusedRecord: boolean;
  emailSent: boolean;
};

function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

function normalizeBaseUrl(value: string | null | undefined): string {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return 'http://localhost:3000';
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function computeExpiresAt(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function isRequestType(value: string): value is RequestType {
  return value === 'skill' || value === 'impact_story';
}

function isDeleteAllowedStatus(
  requestType: RequestType,
  status: string
): status is DeleteEligibility {
  if (requestType === 'skill') {
    return status === 'pending';
  }

  return status === 'pending' || status === 'failed';
}

function isSkillResendAllowedStatus(status: string): status is SkillResendEligibility {
  return status === 'pending' || status === 'declined' || status === 'expired';
}

function isImpactResendAllowedStatus(status: string): status is ImpactResendEligibility {
  return (
    status === 'pending' || status === 'failed' || status === 'declined' || status === 'expired'
  );
}

function isBundleResendAllowedStatus(status: string): status is BundleResendEligibility {
  return status === 'pending' || status === 'declined' || status === 'expired';
}

function isMissingVerificationTokenColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const errorText = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();

  return (e.code === 'PGRST204' || e.code === '42703') && errorText.includes('verification_token');
}

function isUniqueViolationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string };
  return e.code === '23505';
}

function isDuplicateSkillVerificationConstraintError(error: unknown): boolean {
  if (!isUniqueViolationError(error)) {
    return false;
  }

  const e = error as { message?: string; details?: string; hint?: string; constraint?: string };
  const errorText =
    `${e.constraint || ''} ${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();

  return (
    errorText.includes('idx_skill_verification_active_unique_verifier') ||
    (errorText.includes('skill_verification_requests') &&
      errorText.includes('requester_profile_id') &&
      errorText.includes('skill_id'))
  );
}

function describeSkillVerifierSource(source: SkillVerifierSource): string {
  if (source === 'manager') {
    return 'a manager';
  }

  if (source === 'external') {
    return 'a client or external contact';
  }

  return 'a peer or colleague';
}

async function fetchRequesterDisplayName(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string> {
  const { data, error } = await admin
    .from('profiles')
    .select('display_name')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch requester display name for resend:', error);
    return 'A Proofound user';
  }

  const typedData = data as RequesterProfileRow | null;
  return typedData?.display_name || 'A Proofound user';
}

async function fetchSkillName(
  admin: ReturnType<typeof createAdminClient>,
  skillId: string
): Promise<string> {
  const { data, error } = await admin
    .from('skills')
    .select(
      `
      skill_id,
      name_i18n,
      taxonomy:skills_taxonomy!skills_skill_code_fkey (
        name_i18n
      )
    `
    )
    .eq('id', skillId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      console.warn('Failed to fetch skill name for resend:', error);
    }
    return 'a skill';
  }

  const row = data as SkillLabelLookupRow;

  if (row.name_i18n && typeof row.name_i18n === 'object' && 'en' in row.name_i18n) {
    const englishName = (row.name_i18n as Record<string, unknown>).en;
    if (typeof englishName === 'string' && englishName.trim()) {
      return englishName.trim();
    }
  }

  if (row.taxonomy?.name_i18n && typeof row.taxonomy.name_i18n === 'object') {
    const englishTaxonomyName = (row.taxonomy.name_i18n as Record<string, unknown>).en;
    if (typeof englishTaxonomyName === 'string' && englishTaxonomyName.trim()) {
      return englishTaxonomyName.trim();
    }
  }

  const parsedCustomName = parseCustomSkillName(row.skill_id || null);
  if (parsedCustomName) {
    return parsedCustomName;
  }

  return 'a skill';
}

function buildBaseUrl(request: NextRequest): string {
  const fromHeaders = resolveSiteUrlFromHeaders(request.headers);
  return normalizeBaseUrl(
    fromHeaders || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  );
}

async function insertSkillRowsWithOptionalToken(
  admin: ReturnType<typeof createAdminClient>,
  rows: Array<Record<string, unknown>>
): Promise<InsertSkillResult> {
  const { error: createWithTokenError } = await admin
    .from('skill_verification_requests')
    .insert(rows);

  if (!createWithTokenError) {
    return { error: null, tokenPersisted: true };
  }

  if (!isMissingVerificationTokenColumnError(createWithTokenError)) {
    return { error: createWithTokenError, tokenPersisted: true };
  }

  const legacyRows = rows.map((row) => {
    const { verification_token: _ignored, ...rest } = row;
    return rest;
  });

  const { error: createLegacyError } = await admin
    .from('skill_verification_requests')
    .insert(legacyRows);

  return {
    error: createLegacyError,
    tokenPersisted: false,
  };
}

async function sendSkillResendEmail(args: {
  verifierEmail: string;
  requesterName: string;
  relationshipDescription: string;
  skillName: string;
  message: string | null;
  verifyUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const emailResult = await sendEmail({
    to: args.verifierEmail,
    subject: `${args.requesterName} requested your verification on Proofound`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #2D3330;">
        <h2 style="margin-top: 0;">Skill Verification Request</h2>
        <p><strong>${args.requesterName}</strong> listed you as ${args.relationshipDescription}.</p>
        <p>They are requesting verification for:</p>
        <p><strong>${args.skillName}</strong></p>
        ${args.message ? `<p><strong>Message:</strong> ${args.message}</p>` : ''}
        <p>
          <a href="${args.verifyUrl}" style="display: inline-block; background: #1C4D3A; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px;">Review Request</a>
        </p>
      </div>
    `,
    text: `${args.requesterName} listed you as ${args.relationshipDescription} and requested verification for ${args.skillName}. Review request: ${args.verifyUrl}`,
  });

  return emailResult;
}

async function sendImpactResendEmail(args: {
  verifierEmail: string;
  requesterName: string;
  storyTitle: string;
  message: string | null;
  verifyUrl: string;
}): Promise<{ success: boolean; error?: string }> {
  const emailResult = await sendEmail({
    to: args.verifierEmail,
    subject: `${args.storyTitle} verification request on Proofound`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #2D3330;">
        <h2 style="margin-top: 0;">Impact Story Verification Request</h2>
        <p><strong>${args.requesterName}</strong> asked you to verify their impact story.</p>
        <p><strong>${args.storyTitle}</strong></p>
        ${args.message ? `<p><strong>Message:</strong> ${args.message}</p>` : ''}
        <p>
          <a href="${args.verifyUrl}" style="display: inline-block; background: #1C4D3A; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px;">Review Request</a>
        </p>
      </div>
    `,
    text: `${args.requesterName} requested verification for "${args.storyTitle}". Review request: ${args.verifyUrl}`,
  });

  return emailResult;
}

async function sendBundleResendEmail(args: {
  verifierEmail: string;
  requesterName: string;
  relationship: CustomVerificationRelationship;
  message: string | null;
  verifyUrl: string;
  artifacts: CustomVerificationRequestItemRow[];
}): Promise<{ success: boolean; error?: string }> {
  const artifactsHtml = args.artifacts
    .slice(0, 12)
    .map(
      (item) =>
        `<li><strong>${artifactTypeLabel(item.artifact_type)}:</strong> ${item.display_label}</li>`
    )
    .join('');

  const artifactsText = args.artifacts
    .slice(0, 12)
    .map((item) => `- ${artifactTypeLabel(item.artifact_type)}: ${item.display_label}`)
    .join('\n');

  const relationshipDescription = relationshipLabel(args.relationship);

  return sendEmail({
    to: args.verifierEmail,
    subject: `${args.requesterName} requested your verification on Proofound`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #2D3330;">
        <h2 style="margin-top: 0;">Custom Verification Request</h2>
        <p>
          <strong>${args.requesterName}</strong> listed you as ${relationshipDescription} and asked you to verify multiple profile artifacts.
        </p>
        <ul>${artifactsHtml}</ul>
        ${args.message ? `<p><strong>Message:</strong> ${args.message}</p>` : ''}
        <p>
          <a href="${args.verifyUrl}" style="display: inline-block; background: #1C4D3A; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px;">Review Request</a>
        </p>
      </div>
    `,
    text: `${args.requesterName} listed you as ${relationshipDescription} and asked you to verify multiple artifacts:\n${artifactsText}\n\nReview request: ${args.verifyUrl}`,
  });
}

async function resendCustomBundleRequest(
  context: ResendContext,
  customRequestId: string,
  options: {
    triggeredBySkillRequestId?: string | null;
  } = {}
): Promise<NextResponse> {
  const { admin, userId, request } = context;

  const { data: customRequestData, error: customRequestError } = await admin
    .from('custom_verification_requests')
    .select('*')
    .eq('id', customRequestId)
    .maybeSingle();

  if (customRequestError) {
    console.error('Failed to fetch custom verification request for resend:', customRequestError);
    return NextResponse.json(
      { error: 'Failed to load bundled verification request' },
      { status: 500 }
    );
  }

  if (!customRequestData) {
    return NextResponse.json({ error: 'Bundled verification request not found' }, { status: 404 });
  }

  const customRequest = customRequestData as CustomVerificationRequestRow;

  if (customRequest.requester_profile_id !== userId) {
    return NextResponse.json(
      { error: 'Not authorized to resend this bundled request' },
      { status: 403 }
    );
  }

  if (!isBundleResendAllowedStatus(customRequest.status)) {
    return NextResponse.json(
      { error: 'Only pending, declined, or expired bundled requests can be resent.' },
      { status: 400 }
    );
  }

  const { data: itemData, error: itemError } = await admin
    .from('custom_verification_request_items')
    .select('id, request_id, artifact_type, artifact_id, display_label, status')
    .eq('request_id', customRequest.id)
    .order('created_at', { ascending: true });

  if (itemError) {
    console.error('Failed to fetch custom verification request items for resend:', itemError);
    return NextResponse.json({ error: 'Failed to load bundled request items' }, { status: 500 });
  }

  const bundleItems = (itemData || []) as CustomVerificationRequestItemRow[];

  const requesterName = await fetchRequesterDisplayName(admin, userId);
  const baseUrl = buildBaseUrl(request);
  const nowIso = new Date().toISOString();
  const expiresAtIso = computeExpiresAt(14);

  let resendToken = generateSecureToken();
  let resentRequestId = customRequest.id;
  let reusedRecord = customRequest.status === 'pending';
  let insertedLinkedSkillRequestIds: string[] = [];

  if (reusedRecord) {
    const { error: updateBundleError } = await admin
      .from('custom_verification_requests')
      .update({
        token_hash: hashVerificationToken(resendToken),
        expires_at: expiresAtIso,
        updated_at: nowIso,
      })
      .eq('id', customRequest.id)
      .eq('requester_profile_id', userId)
      .eq('status', 'pending');

    if (updateBundleError) {
      console.error('Failed to rotate bundled verification token for resend:', updateBundleError);
      return NextResponse.json(
        { error: 'Failed to resend bundled verification request' },
        { status: 500 }
      );
    }

    const { error: updateLinkedSkillExpiryError } = await admin
      .from('skill_verification_requests')
      .update({
        expires_at: expiresAtIso,
      })
      .eq('custom_request_id', customRequest.id)
      .eq('requester_profile_id', userId)
      .eq('status', 'pending');

    if (updateLinkedSkillExpiryError) {
      console.warn(
        'Failed to refresh linked skill request expiry while resending bundle:',
        updateLinkedSkillExpiryError
      );
    }
  } else {
    resentRequestId = randomUUID();

    const { error: insertBundleError } = await admin.from('custom_verification_requests').insert({
      id: resentRequestId,
      requester_profile_id: userId,
      verifier_email: customRequest.verifier_email,
      verifier_profile_id: customRequest.verifier_profile_id,
      verifier_relationship: customRequest.verifier_relationship,
      message: customRequest.message,
      token_hash: hashVerificationToken(resendToken),
      status: 'pending',
      expires_at: expiresAtIso,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (insertBundleError) {
      console.error('Failed to clone bundled verification request for resend:', insertBundleError);
      return NextResponse.json(
        { error: 'Failed to resend bundled verification request' },
        { status: 500 }
      );
    }

    if (bundleItems.length > 0) {
      const clonedItems = bundleItems.map((item) => ({
        request_id: resentRequestId,
        artifact_type: item.artifact_type,
        artifact_id: item.artifact_id,
        display_label: item.display_label,
        status: 'pending',
        created_at: nowIso,
        updated_at: nowIso,
      }));

      const { error: insertItemsError } = await admin
        .from('custom_verification_request_items')
        .insert(clonedItems);

      if (insertItemsError) {
        console.error('Failed to clone bundled verification request items:', insertItemsError);
        return NextResponse.json(
          { error: 'Failed to clone bundled request items' },
          { status: 500 }
        );
      }
    }

    const { data: linkedSkillData, error: linkedSkillError } = await admin
      .from('skill_verification_requests')
      .select('*')
      .eq('custom_request_id', customRequest.id)
      .eq('requester_profile_id', userId)
      .order('created_at', { ascending: true });

    if (linkedSkillError) {
      console.error('Failed to load linked skill requests for bundle resend:', linkedSkillError);
      return NextResponse.json({ error: 'Failed to clone linked skill requests' }, { status: 500 });
    }

    const linkedSkillRows = (linkedSkillData || []) as SkillVerificationRequestRow[];

    if (linkedSkillRows.length > 0) {
      const mappedSource = mapCustomRelationshipToSkillVerifierSource(
        customRequest.verifier_relationship
      );
      const rowsToInsert = linkedSkillRows.map((row) => {
        const generatedId = randomUUID();
        insertedLinkedSkillRequestIds.push(generatedId);
        return {
          id: generatedId,
          skill_id: row.skill_id,
          requester_profile_id: userId,
          requester_email_snapshot: row.requester_email_snapshot,
          requester_domain_snapshot: row.requester_domain_snapshot,
          verification_token: generateSecureToken(),
          verifier_email: row.verifier_email,
          verifier_domain_snapshot: row.verifier_domain_snapshot,
          verifier_profile_id: row.verifier_profile_id,
          verifier_source: mappedSource,
          message: customRequest.message,
          risk_signals: row.risk_signals || {},
          requires_authenticated_verifier: row.requires_authenticated_verifier || false,
          integrity_status: row.integrity_status || 'clear',
          integrity_reason: row.integrity_reason,
          integrity_meta: row.integrity_meta || {},
          integrity_flagged_at: row.integrity_flagged_at,
          requester_ip_hash: row.requester_ip_hash,
          requester_user_agent_hash: row.requester_user_agent_hash,
          custom_request_id: resentRequestId,
          status: 'pending',
          responded_at: null,
          response_message: null,
          responder_ip_hash: null,
          responder_user_agent_hash: null,
          response_auth_method: null,
          response_actor_email: null,
          created_at: nowIso,
          expires_at: expiresAtIso,
        };
      });

      const insertSkillResult = await insertSkillRowsWithOptionalToken(admin, rowsToInsert);

      if (insertSkillResult.error) {
        if (isDuplicateSkillVerificationConstraintError(insertSkillResult.error)) {
          return NextResponse.json(
            {
              error:
                'An active verification request already exists for at least one linked skill and verifier.',
              code: 'DUPLICATE_VERIFICATION_REQUEST',
            },
            { status: 409 }
          );
        }

        console.error(
          'Failed to clone linked skill requests for bundle resend:',
          insertSkillResult.error
        );
        return NextResponse.json(
          { error: 'Failed to clone linked skill requests' },
          { status: 500 }
        );
      }
    }
  }

  const verifyUrl = `${baseUrl}/verify/custom/${resendToken}`;
  const emailResult = await sendBundleResendEmail({
    verifierEmail: customRequest.verifier_email,
    requesterName,
    relationship: customRequest.verifier_relationship,
    message: customRequest.message,
    verifyUrl,
    artifacts: bundleItems,
  });

  if (!emailResult.success && !reusedRecord) {
    if (insertedLinkedSkillRequestIds.length > 0) {
      await admin
        .from('skill_verification_requests')
        .delete()
        .in('id', insertedLinkedSkillRequestIds)
        .eq('requester_profile_id', userId)
        .eq('custom_request_id', resentRequestId);
    }

    await admin
      .from('custom_verification_requests')
      .delete()
      .eq('id', resentRequestId)
      .eq('requester_profile_id', userId);
  }

  if (!emailResult.success) {
    return NextResponse.json(
      {
        error: emailResult.error || 'Failed to send bundled verification resend email.',
        resentRequestId,
        reusedRecord,
      },
      { status: 502 }
    );
  }

  await writeVerificationAuditLog({
    actorId: userId,
    action: 'verification.request.resent',
    targetType: 'custom_verification_request',
    targetId: resentRequestId,
    meta: {
      request_type: 'skill',
      source_request_id: customRequest.id,
      triggered_by_skill_request_id: options.triggeredBySkillRequestId || null,
      source_status: customRequest.status,
      reused_record: reusedRecord,
      resent_request_id: resentRequestId,
      verifier_email: customRequest.verifier_email,
      relationship: relationshipDisplayLabel(customRequest.verifier_relationship),
      source: 'sent_request_resend_api',
    },
  });

  const result: BundleResendResult = {
    resentRequestId,
    reusedRecord,
    emailSent: true,
  };

  return NextResponse.json({
    success: true,
    requestType: 'skill',
    requestId: options.triggeredBySkillRequestId || customRequest.id,
    bundled: true,
    ...result,
  });
}

async function handleSkillResend(context: ResendContext, requestId: string): Promise<NextResponse> {
  const { admin, userId, request } = context;

  const { data: verificationRequestData, error: fetchError } = await admin
    .from('skill_verification_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch skill verification request for resend:', fetchError);
    return NextResponse.json({ error: 'Failed to load verification request' }, { status: 500 });
  }

  if (!verificationRequestData) {
    return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  }

  const verificationRequest = verificationRequestData as SkillVerificationRequestRow;

  if (verificationRequest.requester_profile_id !== userId) {
    return NextResponse.json(
      { error: 'Not authorized to resend this verification request' },
      { status: 403 }
    );
  }

  if (verificationRequest.custom_request_id) {
    return resendCustomBundleRequest(context, verificationRequest.custom_request_id, {
      triggeredBySkillRequestId: requestId,
    });
  }

  if (!isSkillResendAllowedStatus(verificationRequest.status)) {
    return NextResponse.json(
      { error: 'Only pending, declined, or expired requests can be resent.' },
      { status: 400 }
    );
  }

  const requesterName = await fetchRequesterDisplayName(admin, userId);
  const skillName = await fetchSkillName(admin, verificationRequest.skill_id);
  const baseUrl = buildBaseUrl(request);

  const reusedRecord = verificationRequest.status === 'pending';
  let resentRequestId = verificationRequest.id;
  let resendToken = verificationRequest.verification_token || verificationRequest.id;

  if (!reusedRecord) {
    resentRequestId = randomUUID();
    resendToken = generateSecureToken();
    const nowIso = new Date().toISOString();
    const expiresAtIso = computeExpiresAt(7);

    const insertRows = [
      {
        id: resentRequestId,
        skill_id: verificationRequest.skill_id,
        requester_profile_id: userId,
        requester_email_snapshot: verificationRequest.requester_email_snapshot,
        requester_domain_snapshot: verificationRequest.requester_domain_snapshot,
        verification_token: resendToken,
        verifier_email: verificationRequest.verifier_email,
        verifier_domain_snapshot: verificationRequest.verifier_domain_snapshot,
        verifier_profile_id: verificationRequest.verifier_profile_id,
        verifier_source: verificationRequest.verifier_source,
        message: verificationRequest.message,
        risk_signals: verificationRequest.risk_signals || {},
        requires_authenticated_verifier:
          verificationRequest.requires_authenticated_verifier || false,
        integrity_status: verificationRequest.integrity_status || 'clear',
        integrity_reason: verificationRequest.integrity_reason,
        integrity_meta: verificationRequest.integrity_meta || {},
        integrity_flagged_at: verificationRequest.integrity_flagged_at,
        requester_ip_hash: verificationRequest.requester_ip_hash,
        requester_user_agent_hash: verificationRequest.requester_user_agent_hash,
        custom_request_id: null,
        status: 'pending',
        responded_at: null,
        response_message: null,
        responder_ip_hash: null,
        responder_user_agent_hash: null,
        response_auth_method: null,
        response_actor_email: null,
        created_at: nowIso,
        expires_at: expiresAtIso,
      },
    ];

    const insertResult = await insertSkillRowsWithOptionalToken(admin, insertRows);

    if (insertResult.error) {
      if (isDuplicateSkillVerificationConstraintError(insertResult.error)) {
        return NextResponse.json(
          {
            error: 'An active verification request already exists for this skill and verifier.',
            code: 'DUPLICATE_VERIFICATION_REQUEST',
          },
          { status: 409 }
        );
      }

      console.error('Failed to clone skill verification request for resend:', insertResult.error);
      return NextResponse.json({ error: 'Failed to resend verification request' }, { status: 500 });
    }

    if (!insertResult.tokenPersisted) {
      resendToken = resentRequestId;
    }
  }

  const emailResult = await sendSkillResendEmail({
    verifierEmail: verificationRequest.verifier_email,
    requesterName,
    relationshipDescription: describeSkillVerifierSource(verificationRequest.verifier_source),
    skillName,
    message: verificationRequest.message,
    verifyUrl: `${baseUrl}/verify/${resendToken}`,
  });

  if (!emailResult.success && !reusedRecord) {
    await admin
      .from('skill_verification_requests')
      .delete()
      .eq('id', resentRequestId)
      .eq('requester_profile_id', userId)
      .is('custom_request_id', null);
  }

  if (!emailResult.success) {
    return NextResponse.json(
      {
        error: emailResult.error || 'Failed to send verification request email.',
        resentRequestId,
        reusedRecord,
      },
      { status: 502 }
    );
  }

  await writeVerificationAuditLog({
    actorId: userId,
    action: 'verification.request.resent',
    targetType: 'skill_verification_request',
    targetId: resentRequestId,
    meta: {
      request_type: 'skill',
      source_request_id: verificationRequest.id,
      source_status: verificationRequest.status,
      reused_record: reusedRecord,
      resent_request_id: resentRequestId,
      skill_id: verificationRequest.skill_id,
      verifier_email: normalizeEmail(verificationRequest.verifier_email),
      source: 'sent_request_resend_api',
    },
  });

  return NextResponse.json({
    success: true,
    requestType: 'skill',
    requestId,
    resentRequestId,
    reusedRecord,
    bundled: false,
  });
}

async function handleImpactResend(
  context: ResendContext,
  requestId: string
): Promise<NextResponse> {
  const { admin, userId, request } = context;

  const { data: verificationRequestData, error: fetchError } = await admin
    .from('impact_story_verification_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to fetch impact verification request for resend:', fetchError);
    return NextResponse.json({ error: 'Failed to load verification request' }, { status: 500 });
  }

  if (!verificationRequestData) {
    return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  }

  const verificationRequest = verificationRequestData as ImpactVerificationRequestRow;

  if (verificationRequest.requester_profile_id !== userId) {
    return NextResponse.json(
      { error: 'Not authorized to resend this verification request' },
      { status: 403 }
    );
  }

  if (!isImpactResendAllowedStatus(verificationRequest.status)) {
    return NextResponse.json(
      { error: 'Only pending, failed, declined, or expired requests can be resent.' },
      { status: 400 }
    );
  }

  const requesterName = await fetchRequesterDisplayName(admin, userId);
  const baseUrl = buildBaseUrl(request);

  const { data: storyTitleData } = await admin
    .from('impact_stories')
    .select('title')
    .eq('id', verificationRequest.impact_story_id)
    .maybeSingle();

  const storyTitle =
    storyTitleData && typeof storyTitleData === 'object' && 'title' in storyTitleData
      ? String((storyTitleData as { title?: unknown }).title || 'Impact Story')
      : 'Impact Story';

  const reusedRecord = verificationRequest.status === 'pending';
  let resentRequestId = verificationRequest.id;
  let resendToken = verificationRequest.token;

  if (!reusedRecord) {
    resentRequestId = randomUUID();
    resendToken = generateSecureToken();
    const nowIso = new Date().toISOString();

    const { error: insertError } = await admin.from('impact_story_verification_requests').insert({
      id: resentRequestId,
      impact_story_id: verificationRequest.impact_story_id,
      requester_profile_id: userId,
      requester_email_snapshot: verificationRequest.requester_email_snapshot,
      requester_domain_snapshot: verificationRequest.requester_domain_snapshot,
      verifier_email: verificationRequest.verifier_email,
      verifier_domain_snapshot: verificationRequest.verifier_domain_snapshot,
      verifier_profile_id: verificationRequest.verifier_profile_id,
      verifier_name: verificationRequest.verifier_name,
      verifier_relationship: verificationRequest.verifier_relationship,
      message: verificationRequest.message,
      token: resendToken,
      status: 'pending',
      risk_signals: verificationRequest.risk_signals || {},
      requires_authenticated_verifier: verificationRequest.requires_authenticated_verifier || false,
      integrity_status: verificationRequest.integrity_status || 'clear',
      integrity_reason: verificationRequest.integrity_reason,
      integrity_meta: verificationRequest.integrity_meta || {},
      integrity_flagged_at: verificationRequest.integrity_flagged_at,
      requester_ip_hash: verificationRequest.requester_ip_hash,
      requester_user_agent_hash: verificationRequest.requester_user_agent_hash,
      expires_at: computeExpiresAt(14),
      claim_snapshot: verificationRequest.claim_snapshot || {},
      response_message: null,
      responded_at: null,
      responder_ip_hash: null,
      responder_user_agent_hash: null,
      response_auth_method: null,
      response_actor_email: null,
      email_sent_at: null,
      email_error: null,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (insertError) {
      console.error('Failed to clone impact verification request for resend:', insertError);
      return NextResponse.json({ error: 'Failed to resend verification request' }, { status: 500 });
    }
  }

  const emailResult = await sendImpactResendEmail({
    verifierEmail: verificationRequest.verifier_email,
    requesterName,
    storyTitle,
    message: verificationRequest.message,
    verifyUrl: `${baseUrl}/verify/${resendToken}`,
  });

  if (!emailResult.success) {
    if (reusedRecord) {
      await admin
        .from('impact_story_verification_requests')
        .update({
          email_error: emailResult.error || 'Failed to send verification request email.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', resentRequestId)
        .eq('requester_profile_id', userId);
    } else {
      await admin
        .from('impact_story_verification_requests')
        .update({
          status: 'failed',
          email_error: emailResult.error || 'Failed to send verification request email.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', resentRequestId)
        .eq('requester_profile_id', userId);
    }

    return NextResponse.json(
      {
        error: emailResult.error || 'Failed to send verification request email.',
        resentRequestId,
        reusedRecord,
      },
      { status: 502 }
    );
  }

  await admin
    .from('impact_story_verification_requests')
    .update({
      email_sent_at: new Date().toISOString(),
      email_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resentRequestId)
    .eq('requester_profile_id', userId);

  await writeVerificationAuditLog({
    actorId: userId,
    action: 'verification.request.resent',
    targetType: 'impact_story_verification_request',
    targetId: resentRequestId,
    meta: {
      request_type: 'impact_story',
      source_request_id: verificationRequest.id,
      source_status: verificationRequest.status,
      reused_record: reusedRecord,
      resent_request_id: resentRequestId,
      impact_story_id: verificationRequest.impact_story_id,
      verifier_email: normalizeEmail(verificationRequest.verifier_email),
      source: 'sent_request_resend_api',
    },
  });

  return NextResponse.json({
    success: true,
    requestType: 'impact_story',
    requestId,
    resentRequestId,
    reusedRecord,
  });
}

/**
 * POST /api/expertise/verifications/sent/[requestType]/[requestId]
 *
 * Resends a sent verification request owned by the authenticated requester.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestType: string; requestId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    const admin = createAdminClient();
    const { requestType: rawRequestType, requestId } = await params;

    if (!isRequestType(rawRequestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    const context: ResendContext = {
      admin,
      userId: user.id,
      request,
    };

    if (rawRequestType === 'skill') {
      return handleSkillResend(context, requestId);
    }

    return handleImpactResend(context, requestId);
  } catch (error) {
    console.error('Sent verification POST resend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/expertise/verifications/sent/[requestType]/[requestId]
 *
 * Removes a sent verification request owned by the authenticated requester.
 * For bundled skill requests, caller must use custom bundle cancellation flow.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ requestType: string; requestId: string }> }
) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const admin = createAdminClient();
    const { requestType: rawRequestType, requestId } = await params;

    if (!isRequestType(rawRequestType)) {
      return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
    }

    const requestType = rawRequestType;

    if (requestType === 'skill') {
      const { data: verificationRequest, error: fetchError } = await admin
        .from('skill_verification_requests')
        .select('id, requester_profile_id, status, custom_request_id, skill_id, verifier_email')
        .eq('id', requestId)
        .maybeSingle();

      if (fetchError) {
        console.error('Failed to fetch skill verification request for deletion:', fetchError);
        return NextResponse.json({ error: 'Failed to load verification request' }, { status: 500 });
      }

      if (!verificationRequest) {
        return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
      }

      if (verificationRequest.requester_profile_id !== user.id) {
        return NextResponse.json(
          { error: 'Not authorized to delete this verification request' },
          { status: 403 }
        );
      }

      if (verificationRequest.custom_request_id) {
        return NextResponse.json(
          {
            error:
              'This verification request belongs to a bundled request. Manage it from bundle controls.',
            code: 'BUNDLED_REQUEST',
            customRequestId: verificationRequest.custom_request_id,
          },
          { status: 409 }
        );
      }

      if (!isDeleteAllowedStatus(requestType, verificationRequest.status)) {
        return NextResponse.json(
          {
            error: `Only ${requestType === 'skill' ? 'pending' : 'pending or failed'} requests can be deleted.`,
          },
          { status: 400 }
        );
      }

      const { error: deleteError } = await admin
        .from('skill_verification_requests')
        .delete()
        .eq('id', requestId)
        .eq('requester_profile_id', user.id);

      if (deleteError) {
        console.error('Failed to delete skill verification request:', deleteError);
        return NextResponse.json(
          { error: 'Failed to delete verification request' },
          { status: 500 }
        );
      }

      await writeVerificationAuditLog({
        actorId: user.id,
        action: 'verification.request.deleted',
        targetType: 'skill_verification_request',
        targetId: requestId,
        meta: {
          request_type: requestType,
          request_status: verificationRequest.status,
          skill_id: verificationRequest.skill_id,
          verifier_email: verificationRequest.verifier_email,
          source: 'sent_request_delete_api',
        },
      });

      return NextResponse.json({
        success: true,
        requestType,
        requestId,
      });
    }

    const { data: verificationRequest, error: fetchError } = await admin
      .from('impact_story_verification_requests')
      .select('id, requester_profile_id, status, impact_story_id, verifier_email')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch impact verification request for deletion:', fetchError);
      return NextResponse.json({ error: 'Failed to load verification request' }, { status: 500 });
    }

    if (!verificationRequest) {
      return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
    }

    if (verificationRequest.requester_profile_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this verification request' },
        { status: 403 }
      );
    }

    if (!isDeleteAllowedStatus(requestType, verificationRequest.status)) {
      return NextResponse.json(
        {
          error: 'Only pending or failed requests can be deleted.',
        },
        { status: 400 }
      );
    }

    const { error: deleteError } = await admin
      .from('impact_story_verification_requests')
      .delete()
      .eq('id', requestId)
      .eq('requester_profile_id', user.id);

    if (deleteError) {
      console.error('Failed to delete impact verification request:', deleteError);
      return NextResponse.json({ error: 'Failed to delete verification request' }, { status: 500 });
    }

    await writeVerificationAuditLog({
      actorId: user.id,
      action: 'verification.request.deleted',
      targetType: 'impact_story_verification_request',
      targetId: requestId,
      meta: {
        request_type: requestType,
        request_status: verificationRequest.status,
        impact_story_id: verificationRequest.impact_story_id,
        verifier_email: verificationRequest.verifier_email,
        source: 'sent_request_delete_api',
      },
    });

    return NextResponse.json({
      success: true,
      requestType,
      requestId,
    });
  } catch (error) {
    console.error('Sent verification DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
