import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { resolveSiteUrlFromHeaders } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  artifactTypeLabel,
  mapCustomRelationshipToSkillVerifierSource,
  parseCustomSkillName,
  relationshipDisplayLabel,
  relationshipLabel,
  type CustomVerificationRelationship,
} from '@/lib/verification/custom-verification';
import { normalizeEmail, writeVerificationAuditLog } from '@/lib/verification/integrity';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import {
  createCanonicalSkillVerificationRequest,
  getCanonicalSkillVerificationRequestById,
  listCanonicalSkillVerificationRequestsForOwner,
  mapCanonicalSkillVerificationRequestRecord,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import {
  createCanonicalImpactVerificationRequest,
  getCanonicalImpactVerificationRequestById,
  mapCanonicalImpactVerificationRequestRecord,
  updateCanonicalImpactVerificationRequest,
} from '@/lib/verification/canonical-impact-requests';
import { upsertCanonicalVerificationRecord } from '@/lib/canonical/repository';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';

type RequestType = 'skill' | 'impact_story';
type DeleteEligibility = 'pending' | 'failed';
type SkillResendEligibility = 'pending' | 'declined' | 'expired';
type ImpactResendEligibility = 'pending' | 'failed' | 'declined' | 'expired';
type BundleResendEligibility = 'pending' | 'declined' | 'expired';

type SkillVerifierSource = 'peer' | 'manager' | 'external';

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

function buildSkillVerificationScopeKey(skillId: string, verifierEmail: string) {
  return `skill_verification:${skillId}:${normalizeEmail(verifierEmail) ?? 'unknown'}`;
}

function buildImpactVerificationScopeKey(impactStoryId: string, verifierEmail: string) {
  return `impact_verification:${impactStoryId}:${normalizeEmail(verifierEmail) ?? 'unknown'}`;
}

function buildCustomVerificationScopeKey(requestId: string, verifierEmail: string) {
  return `custom_verification:${requestId}:${normalizeEmail(verifierEmail) ?? 'unknown'}`;
}

function resolveCanonicalSkillVerificationKind(
  verifierSource: SkillVerifierSource,
  requestKind: string | null | undefined
) {
  if (requestKind === 'human_observed_attestation') {
    return verifierSource === 'manager' ? 'skill_attestation_manager' : 'skill_attestation_peer';
  }

  if (verifierSource === 'manager') {
    return 'skill_attestation_manager';
  }

  if (verifierSource === 'peer') {
    return 'skill_attestation_peer';
  }

  return 'platform_manual_review';
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

  let resendToken = '';
  let resentRequestId = customRequest.id;
  let reusedRecord = customRequest.status === 'pending';
  const linkedCanonicalSkillRows = (await listCanonicalSkillVerificationRequestsForOwner(userId))
    .map(mapCanonicalSkillVerificationRequestRecord)
    .filter((row) => row.custom_request_id === customRequest.id);
  const issued = await issueCapabilityToken({
    tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
    sourceTable: 'custom_verification_requests',
    sourceId: reusedRecord ? customRequest.id : randomUUID(),
    actionScope: 'custom_verification.respond',
    subjectType: 'custom_verification_request',
    subjectId: reusedRecord ? customRequest.id : null,
    actorBinding: customRequest.verifier_profile_id
      ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
      : CAPABILITY_BINDINGS.EMAIL_HASH,
    actorEmail: customRequest.verifier_email,
    actorProfileId: customRequest.verifier_profile_id,
    expiresAt: new Date(expiresAtIso),
    singleUse: true,
    maxUses: 1,
    scopeKey: buildCustomVerificationScopeKey(customRequest.id, customRequest.verifier_email),
    revokePriorActiveTokensForScope: true,
    metadata: {
      resend: true,
      requestId: customRequest.id,
      artifactCount: bundleItems.length,
    },
  });
  resendToken = issued.rawToken;

  if (reusedRecord) {
    const { error: updateBundleError } = await admin
      .from('custom_verification_requests')
      .update({
        token_hash: issued.tokenHash,
        capability_token_id: issued.token.id,
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

    await Promise.all(
      linkedCanonicalSkillRows
        .filter((row) => row.status === 'pending')
        .map((row) =>
          updateCanonicalSkillVerificationRequest({
            requestId: row.id,
            status: 'pending',
            customRequestId: customRequest.id,
            capabilityTokenId: issued.token.id,
            requestedAt: nowIso,
            expiresAt: expiresAtIso,
            emailSent: true,
            emailError: null,
          }).catch((error) => {
            console.warn(
              'Failed to refresh linked canonical skill request during bundle resend:',
              error
            );
            return null;
          })
        )
    );
  } else {
    resentRequestId = issued.token.source_id || randomUUID();

    const { error: insertBundleError } = await admin.from('custom_verification_requests').insert({
      id: resentRequestId,
      requester_profile_id: userId,
      verifier_email: customRequest.verifier_email,
      verifier_profile_id: customRequest.verifier_profile_id,
      verifier_relationship: customRequest.verifier_relationship,
      message: customRequest.message,
      token_hash: issued.tokenHash,
      capability_token_id: issued.token.id,
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

    if (linkedCanonicalSkillRows.length > 0) {
      await Promise.all(
        linkedCanonicalSkillRows.map((row) =>
          upsertCanonicalVerificationRecord({
            id: randomUUID(),
            ownerType: 'individual_profile',
            ownerId: userId,
            subjectType: 'skill',
            subjectId: row.skill_id,
            verificationKind: resolveCanonicalSkillVerificationKind(
              row.verifier_source,
              row.request_kind
            ),
            status: 'pending',
            verifierPrincipalType: row.verifier_profile_id ? 'user_account' : 'external_email',
            verifierProfileId: row.verifier_profile_id,
            verifierEmailHash: hashOpaqueToken(row.verifier_email),
            verifierDomainSnapshot: row.verifier_email.split('@')[1] || null,
            integrityStatus: row.integrity_status,
            integrityReason: row.integrity_reason,
            riskSignals: row.risk_signals || {},
            claimSnapshot: {
              requestTransport: 'skill_verification_request',
              skillId: row.skill_id,
              requestKind: row.request_kind,
              attestationRequest: row.attestation_request || null,
            },
            sourceRequestTable: 'custom_verification_requests',
            sourceRequestId: resentRequestId,
            requestedAt: new Date(nowIso),
            expiresAt: new Date(expiresAtIso),
            metadata: {
              requestTransport: 'skill_verification_request',
              requesterEmailSnapshot: row.requester_email_snapshot,
              verifierEmail: row.verifier_email,
              verifierSource: row.verifier_source,
              verifierRelationship: row.verifier_relationship,
              requestKind: row.request_kind,
              attestationRequest: row.attestation_request || null,
              message: customRequest.message,
              customRequestId: resentRequestId,
              capabilityTokenId: issued.token.id,
              emailSent: true,
              emailError: null,
              requiresAuthenticatedVerifier: row.requires_authenticated_verifier,
              integrityMeta: row.integrity_meta || {},
              integrityFlaggedAt: row.integrity_flagged_at,
            },
          }).catch((error) => {
            console.error(
              'Failed to clone linked canonical skill request for bundle resend:',
              error
            );
            throw error;
          })
        )
      ).catch(() => null);
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

  const canonicalRequest = await getCanonicalSkillVerificationRequestById(requestId).catch(
    () => null
  );
  if (!canonicalRequest) {
    return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  }

  const verificationRequest = mapCanonicalSkillVerificationRequestRecord(canonicalRequest);

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
  let resendToken = '';

  if (reusedRecord) {
    const expiresAtIso = computeExpiresAt(7);
    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE,
      sourceTable: 'verification_records',
      sourceId: verificationRequest.id,
      actionScope: 'skill_verification.respond',
      subjectType: 'skill_verification_request',
      subjectId: verificationRequest.id,
      actorBinding: verificationRequest.requires_authenticated_verifier
        ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
        : CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: verificationRequest.verifier_email,
      actorProfileId: verificationRequest.verifier_profile_id,
      expiresAt: new Date(expiresAtIso),
      singleUse: true,
      maxUses: 1,
      scopeKey: buildSkillVerificationScopeKey(
        verificationRequest.skill_id,
        verificationRequest.verifier_email
      ),
      revokePriorActiveTokensForScope: true,
      metadata: {
        verifierSource: verificationRequest.verifier_source,
        skillId: verificationRequest.skill_id,
        requestTransport: 'skill_verification_request',
        resend: true,
      },
    });
    resendToken = issued.rawToken;

    const updatedRequest = await updateCanonicalSkillVerificationRequest({
      requestId: verificationRequest.id,
      status: 'pending',
      capabilityTokenId: issued.token.id,
      expiresAt: expiresAtIso,
      requestedAt: new Date().toISOString(),
      emailSent: false,
      emailError: null,
    });

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Failed to resend verification request' }, { status: 500 });
    }
  } else {
    const createdRequest = await createCanonicalSkillVerificationRequest({
      ownerId: userId,
      skillId: verificationRequest.skill_id,
      skillName,
      requesterName,
      requesterEmailSnapshot: verificationRequest.requester_email_snapshot,
      verifierEmail: verificationRequest.verifier_email,
      verifierSource: verificationRequest.verifier_source,
      verifierRelationship: verificationRequest.verifier_relationship,
      verifierProfileId: verificationRequest.verifier_profile_id,
      requestKind: verificationRequest.request_kind || 'generic_verification',
      attestationRequest: verificationRequest.attestation_request,
      message: verificationRequest.message,
      integrityStatus: verificationRequest.integrity_status,
      integrityReason: verificationRequest.integrity_reason,
      riskSignals: verificationRequest.risk_signals,
      requiresAuthenticatedVerifier: verificationRequest.requires_authenticated_verifier,
    }).catch((error) => {
      console.error('Failed to clone canonical skill verification request for resend:', error);
      return null;
    });

    if (!createdRequest) {
      return NextResponse.json({ error: 'Failed to resend verification request' }, { status: 500 });
    }

    resentRequestId = createdRequest.record.id;
    resendToken = createdRequest.rawToken;
  }

  const emailResult = await sendSkillResendEmail({
    verifierEmail: verificationRequest.verifier_email,
    requesterName,
    relationshipDescription: describeSkillVerifierSource(verificationRequest.verifier_source),
    skillName,
    message: verificationRequest.message,
    verifyUrl: `${baseUrl}/verify/${resendToken}`,
  });

  if (!emailResult.success) {
    await updateCanonicalSkillVerificationRequest({
      requestId: resentRequestId,
      status: reusedRecord ? 'pending' : 'failed',
      emailSent: false,
      emailError: emailResult.error || 'Failed to send verification request email.',
    }).catch(() => null);

    return NextResponse.json(
      {
        error: emailResult.error || 'Failed to send verification request email.',
        resentRequestId,
        reusedRecord,
      },
      { status: 502 }
    );
  }

  await updateCanonicalSkillVerificationRequest({
    requestId: resentRequestId,
    status: 'pending',
    emailSent: true,
    emailError: null,
  }).catch(() => null);

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

  const canonicalRequest = await getCanonicalImpactVerificationRequestById(requestId).catch(
    () => null
  );

  if (!canonicalRequest) {
    return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  }

  const verificationRequest = mapCanonicalImpactVerificationRequestRecord(canonicalRequest);

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
  let resendToken = '';

  if (reusedRecord) {
    const expiresAtIso = computeExpiresAt(14);
    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE,
      sourceTable: 'verification_records',
      sourceId: verificationRequest.id,
      actionScope: 'impact_verification.respond',
      subjectType: 'impact_verification_request',
      subjectId: verificationRequest.id,
      actorBinding: verificationRequest.requires_authenticated_verifier
        ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
        : CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: verificationRequest.verifier_email,
      actorProfileId: verificationRequest.verifier_profile_id,
      expiresAt: new Date(expiresAtIso),
      singleUse: true,
      maxUses: 1,
      scopeKey: buildImpactVerificationScopeKey(
        verificationRequest.impact_story_id,
        verificationRequest.verifier_email
      ),
      revokePriorActiveTokensForScope: true,
      metadata: {
        impactStoryId: verificationRequest.impact_story_id,
        requestTransport: 'impact_verification_request',
        resend: true,
      },
    });
    resendToken = issued.rawToken;

    const updatedRequest = await updateCanonicalImpactVerificationRequest({
      requestId: verificationRequest.id,
      status: 'pending',
      capabilityTokenId: issued.token.id,
      expiresAt: expiresAtIso,
      requestedAt: new Date().toISOString(),
      emailSent: false,
      emailError: null,
    });

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Failed to resend verification request' }, { status: 500 });
    }
  } else {
    const createdRequest = await createCanonicalImpactVerificationRequest({
      ownerId: userId,
      impactStoryId: verificationRequest.impact_story_id,
      storyTitle,
      requesterName,
      requesterEmailSnapshot: verificationRequest.requester_email_snapshot,
      verifierEmail: verificationRequest.verifier_email,
      verifierName: verificationRequest.verifier_name,
      verifierRelationship: verificationRequest.verifier_relationship,
      verifierProfileId: verificationRequest.verifier_profile_id,
      message: verificationRequest.message,
      claimSnapshot: verificationRequest.claim_snapshot || {},
      integrityStatus: verificationRequest.integrity_status,
      integrityReason: verificationRequest.integrity_reason,
      riskSignals: verificationRequest.risk_signals,
      requiresAuthenticatedVerifier: verificationRequest.requires_authenticated_verifier,
    }).catch((error) => {
      console.error('Failed to clone canonical impact verification request for resend:', error);
      return null;
    });

    if (!createdRequest) {
      return NextResponse.json({ error: 'Failed to resend verification request' }, { status: 500 });
    }

    resentRequestId = createdRequest.record.id;
    resendToken = createdRequest.rawToken;
  }

  const emailResult = await sendImpactResendEmail({
    verifierEmail: verificationRequest.verifier_email,
    requesterName,
    storyTitle,
    message: verificationRequest.message,
    verifyUrl: `${baseUrl}/verify/${resendToken}`,
  });

  if (!emailResult.success) {
    await updateCanonicalImpactVerificationRequest({
      requestId: resentRequestId,
      status: reusedRecord ? 'pending' : 'failed',
      emailSent: false,
      emailError: emailResult.error || 'Failed to send verification request email.',
    }).catch(() => null);

    return NextResponse.json(
      {
        error: emailResult.error || 'Failed to send verification request email.',
        resentRequestId,
        reusedRecord,
      },
      { status: 502 }
    );
  }

  await updateCanonicalImpactVerificationRequest({
    requestId: resentRequestId,
    status: 'pending',
    emailSent: true,
    emailError: null,
  }).catch(() => null);

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
      const canonicalRequest = await getCanonicalSkillVerificationRequestById(requestId).catch(
        () => null
      );
      const verificationRequest = canonicalRequest
        ? mapCanonicalSkillVerificationRequestRecord(canonicalRequest)
        : null;
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

      const cancelledRequest = await updateCanonicalSkillVerificationRequest({
        requestId,
        status: 'cancelled',
        respondedAt: new Date().toISOString(),
      }).catch((error) => {
        console.error('Failed to cancel skill verification request:', error);
        return null;
      });

      if (!cancelledRequest) {
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

    const canonicalRequest = await getCanonicalImpactVerificationRequestById(requestId).catch(
      () => null
    );
    const verificationRequest = canonicalRequest
      ? mapCanonicalImpactVerificationRequestRecord(canonicalRequest)
      : null;
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

    const cancelledRequest = await updateCanonicalImpactVerificationRequest({
      requestId,
      status: 'cancelled',
      respondedAt: new Date().toISOString(),
    }).catch((error) => {
      console.error('Failed to cancel impact verification request:', error);
      return null;
    });

    if (!cancelledRequest) {
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
