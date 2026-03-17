import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { resolveSiteUrlFromHeaders } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  artifactTypeLabel,
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
  mapCanonicalSkillVerificationRequestRecord,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import {
  createCanonicalImpactVerificationRequest,
  getCanonicalImpactVerificationRequestById,
  mapCanonicalImpactVerificationRequestRecord,
  updateCanonicalImpactVerificationRequest,
} from '@/lib/verification/canonical-impact-requests';
import {
  getCanonicalBundleById,
  resendCanonicalBundle,
  updateCanonicalBundleDeliveryState,
} from '@/lib/verification/canonical-bundles';

type RequestType = 'skill' | 'impact_story';
type BundleArtifactType =
  | 'skill'
  | 'experience'
  | 'education'
  | 'impact_story'
  | 'project'
  | 'volunteering';
type DeleteEligibility = 'pending' | 'failed';
type SkillResendEligibility = 'pending' | 'declined' | 'expired';
type ImpactResendEligibility = 'pending' | 'failed' | 'declined' | 'expired';
type BundleResendEligibility = 'pending' | 'declined' | 'expired';
type SkillVerifierSource = 'peer' | 'manager' | 'external';

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

  return (data as { display_name?: string | null } | null)?.display_name || 'A Proofound user';
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

  const row = data as {
    skill_id?: string | null;
    name_i18n?: Record<string, unknown> | null;
    taxonomy?: { name_i18n?: Record<string, unknown> | null } | null;
  };

  const directName = typeof row.name_i18n?.en === 'string' ? row.name_i18n.en.trim() : '';
  if (directName) {
    return directName;
  }

  const taxonomyName =
    typeof row.taxonomy?.name_i18n?.en === 'string' ? row.taxonomy.name_i18n.en.trim() : '';
  if (taxonomyName) {
    return taxonomyName;
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

async function sendSkillResendEmail(args: {
  verifierEmail: string;
  requesterName: string;
  relationshipDescription: string;
  skillName: string;
  message: string | null;
  verifyUrl: string;
}) {
  return sendEmail({
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
}

async function sendImpactResendEmail(args: {
  verifierEmail: string;
  requesterName: string;
  storyTitle: string;
  message: string | null;
  verifyUrl: string;
}) {
  return sendEmail({
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
}

async function sendBundleResendEmail(args: {
  verifierEmail: string;
  requesterName: string;
  relationship: CustomVerificationRelationship;
  message: string | null;
  verifyUrl: string;
  artifacts: Array<{ artifact_type: BundleArtifactType; display_label: string }>;
}) {
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

async function resendBundleRequest(
  admin: ReturnType<typeof createAdminClient>,
  request: NextRequest,
  userId: string,
  bundleId: string,
  requestType: RequestType,
  triggeredByRequestId?: string | null
) {
  const bundle = await getCanonicalBundleById(bundleId);
  if (!bundle) {
    return NextResponse.json({ error: 'Bundled verification request not found' }, { status: 404 });
  }

  if (bundle.requester_profile_id !== userId) {
    return NextResponse.json(
      { error: 'Not authorized to resend this bundled request' },
      { status: 403 }
    );
  }

  if (!isBundleResendAllowedStatus(bundle.status)) {
    return NextResponse.json(
      { error: 'Only pending, declined, or expired bundled requests can be resent.' },
      { status: 400 }
    );
  }

  const resentBundle = await resendCanonicalBundle(bundleId, userId);
  if (!resentBundle) {
    return NextResponse.json(
      { error: 'Failed to resend bundled verification request' },
      { status: 500 }
    );
  }

  const requesterName = await fetchRequesterDisplayName(admin, userId);
  const verifyUrl = `${buildBaseUrl(request)}/verify/custom/${resentBundle.rawToken}`;
  const emailResult = await sendBundleResendEmail({
    verifierEmail: bundle.verifier_email,
    requesterName,
    relationship: (bundle.verifier_relationship || 'external') as CustomVerificationRelationship,
    message: bundle.message,
    verifyUrl,
    artifacts: resentBundle.records.map((record) => ({
      artifact_type: record.subjectType as BundleArtifactType,
      display_label:
        typeof (record.metadata as Record<string, unknown> | null)?.displayLabel === 'string'
          ? String((record.metadata as Record<string, unknown>).displayLabel)
          : record.subjectId,
    })),
  });

  if (!emailResult.success) {
    await updateCanonicalBundleDeliveryState(resentBundle.bundleId, {
      emailSent: false,
      emailError: emailResult.error || 'Failed to send bundled verification resend email.',
    });

    return NextResponse.json(
      {
        error: emailResult.error || 'Failed to send bundled verification resend email.',
        resentRequestId: resentBundle.bundleId,
        reusedRecord: false,
      },
      { status: 502 }
    );
  }

  await updateCanonicalBundleDeliveryState(resentBundle.bundleId, {
    emailSent: true,
    emailError: null,
  });

  await writeVerificationAuditLog({
    actorId: userId,
    action: 'verification.request.resent',
    targetType: 'custom_verification_request',
    targetId: resentBundle.bundleId,
    meta: {
      request_type: requestType,
      source_request_id: bundle.id,
      triggered_by_request_id: triggeredByRequestId || null,
      source_status: bundle.status,
      reused_record: false,
      resent_request_id: resentBundle.bundleId,
      verifier_email: bundle.verifier_email,
      relationship: relationshipDisplayLabel(
        (bundle.verifier_relationship || 'external') as CustomVerificationRelationship
      ),
      source: 'sent_request_resend_api',
    },
  });

  return NextResponse.json({
    success: true,
    requestType,
    requestId: triggeredByRequestId || bundle.id,
    resentRequestId: resentBundle.bundleId,
    reusedRecord: false,
    bundled: true,
  });
}

export async function resendSkillVerificationRequest(
  request: NextRequest,
  requestId: string
): Promise<NextResponse> {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = authContext;
  const admin = createAdminClient();
  const canonicalRequest = await getCanonicalSkillVerificationRequestById(requestId).catch(
    () => null
  );
  if (!canonicalRequest) {
    return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  }

  const verificationRequest = mapCanonicalSkillVerificationRequestRecord(canonicalRequest);
  if (verificationRequest.requester_profile_id !== user.id) {
    return NextResponse.json(
      { error: 'Not authorized to resend this verification request' },
      { status: 403 }
    );
  }

  if (verificationRequest.custom_request_id) {
    return resendBundleRequest(
      admin,
      request,
      user.id,
      verificationRequest.custom_request_id,
      'skill',
      requestId
    );
  }

  if (!isSkillResendAllowedStatus(verificationRequest.status)) {
    return NextResponse.json(
      { error: 'Only pending, declined, or expired requests can be resent.' },
      { status: 400 }
    );
  }

  const requesterName = await fetchRequesterDisplayName(admin, user.id);
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
      ownerId: user.id,
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
    actorId: user.id,
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

export async function deleteSkillVerificationRequest(requestId: string): Promise<NextResponse> {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = authContext;
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

  if (!isDeleteAllowedStatus('skill', verificationRequest.status)) {
    return NextResponse.json({ error: 'Only pending requests can be deleted.' }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to delete verification request' }, { status: 500 });
  }

  await writeVerificationAuditLog({
    actorId: user.id,
    action: 'verification.request.deleted',
    targetType: 'skill_verification_request',
    targetId: requestId,
    meta: {
      request_type: 'skill',
      request_status: verificationRequest.status,
      skill_id: verificationRequest.skill_id,
      verifier_email: verificationRequest.verifier_email,
      source: 'sent_request_delete_api',
    },
  });

  return NextResponse.json({
    success: true,
    requestType: 'skill',
    requestId,
  });
}

export async function resendImpactVerificationRequest(
  request: NextRequest,
  requestId: string
): Promise<NextResponse> {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = authContext;
  const admin = createAdminClient();
  const canonicalRequest = await getCanonicalImpactVerificationRequestById(requestId).catch(
    () => null
  );

  if (!canonicalRequest) {
    return NextResponse.json({ error: 'Verification request not found' }, { status: 404 });
  }

  const verificationRequest = mapCanonicalImpactVerificationRequestRecord(canonicalRequest);
  if (verificationRequest.requester_profile_id !== user.id) {
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

  const requesterName = await fetchRequesterDisplayName(admin, user.id);
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
      ownerId: user.id,
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
    actorId: user.id,
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

export async function deleteImpactVerificationRequest(requestId: string): Promise<NextResponse> {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user } = authContext;
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

  if (!isDeleteAllowedStatus('impact_story', verificationRequest.status)) {
    return NextResponse.json(
      { error: 'Only pending or failed requests can be deleted.' },
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
      request_type: 'impact_story',
      request_status: verificationRequest.status,
      impact_story_id: verificationRequest.impact_story_id,
      verifier_email: verificationRequest.verifier_email,
      source: 'sent_request_delete_api',
    },
  });

  return NextResponse.json({
    success: true,
    requestType: 'impact_story',
    requestId,
  });
}
