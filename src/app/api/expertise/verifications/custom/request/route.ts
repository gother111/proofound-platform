import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  CUSTOM_VERIFICATION_ARTIFACT_TYPES,
  CUSTOM_VERIFICATION_RELATIONSHIPS,
  artifactTypeLabel,
  hashVerificationToken,
  mapCustomRelationshipToSkillVerifierSource,
  normalizeVerifierEmail,
  parseCustomSkillName,
  relationshipLabel,
} from '@/lib/verification/custom-verification';
import { deriveAttestationRequestMode } from '@/lib/verification/human-attestations';
import {
  CANONICAL_PROOFS_WRITE_ENABLED,
  upsertCanonicalVerificationRecord,
} from '@/lib/canonical/repository';
import {
  listCanonicalSkillVerificationRequestsForOwner,
  mapCanonicalSkillVerificationRequestRecord,
} from '@/lib/verification/canonical-requests';

const RequestArtifactSchema = z.object({
  type: z.enum(CUSTOM_VERIFICATION_ARTIFACT_TYPES),
  id: z.string().uuid(),
});

const CreateCustomVerificationRequestSchema = z.object({
  verifierEmail: z.string().email('Valid email is required'),
  relationship: z.enum(CUSTOM_VERIFICATION_RELATIONSHIPS),
  message: z.string().max(2000).optional(),
  artifacts: z.array(RequestArtifactSchema).min(1, 'Select at least one artifact').max(50),
});

type ArtifactSelection = z.infer<typeof RequestArtifactSchema>;

type SelectedArtifactRecord = {
  type: ArtifactSelection['type'];
  id: string;
  label: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type SelectedSkillRow = {
  id: string;
  skill_id: string | null;
  skill_code: string | null;
  name_i18n?: unknown;
  taxonomy?: {
    name_i18n?: unknown;
  } | null;
};

type SkillTaxonomyRow = {
  code: string;
  name_i18n?: unknown;
};

type SelectedSkillsLoadResult = {
  data: SelectedSkillRow[] | null;
  error: unknown | null;
};

function uniqueNonEmptySkillCodes(skills: Array<{ skill_code: string | null }>): string[] {
  return [
    ...new Set(skills.map((skill) => skill.skill_code).filter((code): code is string => !!code)),
  ];
}

async function loadSelectedSkills(
  supabase: SupabaseServerClient,
  profileId: string,
  selectedSkillIds: string[]
): Promise<SelectedSkillsLoadResult> {
  if (selectedSkillIds.length === 0) {
    return {
      data: [],
      error: null,
    };
  }

  const primarySkillSelect = `
    id,
    skill_id,
    skill_code,
    name_i18n,
    taxonomy:skills_taxonomy!skills_skill_code_fkey (
      name_i18n
    )
  `;
  const fallbackSkillSelect = 'id, skill_id, skill_code, name_i18n';

  const primaryResult = await supabase
    .from('skills')
    .select(primarySkillSelect)
    .eq('profile_id', profileId)
    .in('id', selectedSkillIds);

  if (!primaryResult.error) {
    return {
      data: (primaryResult.data as SelectedSkillRow[] | null) || [],
      error: null,
    };
  }

  console.warn(
    'Falling back to manual taxonomy lookup for selected skills in custom verification request:',
    primaryResult.error
  );

  const fallbackSkillsResult = await supabase
    .from('skills')
    .select(fallbackSkillSelect)
    .eq('profile_id', profileId)
    .in('id', selectedSkillIds);

  if (fallbackSkillsResult.error) {
    return {
      data: null,
      error: fallbackSkillsResult.error,
    };
  }

  const fallbackSkills =
    ((fallbackSkillsResult.data as SelectedSkillRow[] | null) || []).map((skill) => ({
      ...skill,
      taxonomy: null,
    })) || [];

  const skillCodes = uniqueNonEmptySkillCodes(fallbackSkills);
  if (skillCodes.length === 0) {
    return {
      data: fallbackSkills,
      error: null,
    };
  }

  const taxonomyResult = await supabase
    .from('skills_taxonomy')
    .select('code, name_i18n')
    .in('code', skillCodes);

  if (taxonomyResult.error) {
    return {
      data: null,
      error: taxonomyResult.error,
    };
  }

  const taxonomyByCode = new Map<string, { name_i18n?: unknown }>();
  for (const taxonomy of (taxonomyResult.data as SkillTaxonomyRow[] | null) || []) {
    taxonomyByCode.set(taxonomy.code, {
      name_i18n: taxonomy.name_i18n,
    });
  }

  const stitchedSkills = fallbackSkills.map((skill) => ({
    ...skill,
    taxonomy: skill.skill_code ? taxonomyByCode.get(skill.skill_code) || null : null,
  }));

  return {
    data: stitchedSkills,
    error: null,
  };
}

function readI18nEnglish(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'en' in value) {
    const english = (value as { en?: unknown }).en;
    if (typeof english === 'string' && english.trim().length > 0) {
      return english;
    }
  }

  return null;
}

function skillLabel(skill: any): string {
  const directName = readI18nEnglish(skill?.name_i18n);
  if (directName) {
    return directName;
  }

  const taxonomyName = readI18nEnglish(skill?.taxonomy?.name_i18n);
  if (taxonomyName) {
    return taxonomyName;
  }

  const parsed = parseCustomSkillName(skill?.skill_id);
  if (parsed) {
    return parsed;
  }

  return 'Untitled skill';
}

function dedupeArtifactSelection(artifacts: ArtifactSelection[]): ArtifactSelection[] {
  const unique = new Map<string, ArtifactSelection>();

  for (const artifact of artifacts) {
    unique.set(`${artifact.type}:${artifact.id}`, artifact);
  }

  return [...unique.values()];
}

function toArtifactGroup(
  artifacts: ArtifactSelection[]
): Record<ArtifactSelection['type'], string[]> {
  return artifacts.reduce(
    (acc, artifact) => {
      acc[artifact.type].push(artifact.id);
      return acc;
    },
    {
      skill: [] as string[],
      experience: [] as string[],
      education: [] as string[],
      impact_story: [] as string[],
      project: [] as string[],
      volunteering: [] as string[],
    }
  );
}

/**
 * POST /api/expertise/verifications/custom/request
 *
 * Creates a bundled verification request that can cover multiple artifacts.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const body = await request.json();
    const parsed = CreateCustomVerificationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const verifierEmail = normalizeVerifierEmail(parsed.data.verifierEmail);
    const dedupedArtifacts = dedupeArtifactSelection(parsed.data.artifacts);

    if (dedupedArtifacts.length === 0) {
      return NextResponse.json({ error: 'Select at least one artifact' }, { status: 400 });
    }

    const { data: authUser } = await supabase.auth.getUser();
    const requesterEmail = normalizeVerifierEmail(authUser.user?.email || '');

    if (requesterEmail && requesterEmail === verifierEmail) {
      return NextResponse.json(
        { error: 'You cannot send a verification request to your own email' },
        { status: 400 }
      );
    }

    const groupedArtifacts = toArtifactGroup(dedupedArtifacts);

    const selectedArtifacts: SelectedArtifactRecord[] = [];
    const selectedSkillIds: string[] = [];
    let selectedSkillRows: SelectedSkillRow[] = [];

    if (groupedArtifacts.skill.length > 0) {
      const { data: skills, error: skillsError } = await loadSelectedSkills(
        supabase,
        user.id,
        groupedArtifacts.skill
      );

      if (skillsError) {
        console.error(
          'Failed to load selected skills for custom verification request:',
          skillsError
        );
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      const loadedSkills = skills || [];
      selectedSkillRows = loadedSkills;
      const loadedSkillIds = new Set(loadedSkills.map((skill) => skill.id));

      for (const skillId of groupedArtifacts.skill) {
        if (!loadedSkillIds.has(skillId)) {
          return NextResponse.json(
            { error: 'Some selected skills are invalid or do not belong to you' },
            { status: 400 }
          );
        }
      }

      const acceptedSkillRequests = (
        await listCanonicalSkillVerificationRequestsForOwner(user.id).catch((error) => {
          console.error(
            'Failed to validate accepted canonical skill verification requests:',
            error
          );
          return [];
        })
      ).map(mapCanonicalSkillVerificationRequestRecord);

      const alreadyVerifiedSkillIds = new Set(
        acceptedSkillRequests
          .filter(
            (requestRow) =>
              requestRow.status === 'accepted' &&
              requestRow.integrity_status === 'clear' &&
              groupedArtifacts.skill.includes(requestRow.skill_id)
          )
          .map((requestRow) => requestRow.skill_id)
      );

      if (alreadyVerifiedSkillIds.size > 0) {
        return NextResponse.json(
          { error: 'Some selected skills are already verified' },
          { status: 400 }
        );
      }

      for (const skill of loadedSkills) {
        selectedArtifacts.push({
          type: 'skill',
          id: skill.id,
          label: skillLabel(skill),
        });
      }

      selectedSkillIds.push(...loadedSkills.map((skill) => skill.id));
    }

    if (groupedArtifacts.experience.length > 0) {
      const { data, error } = await supabase
        .from('experiences')
        .select('id, title, verified')
        .eq('user_id', user.id)
        .in('id', groupedArtifacts.experience)
        .eq('verified', false);

      if (error) {
        console.error('Failed to validate experiences for custom verification request:', error);
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      if ((data || []).length !== groupedArtifacts.experience.length) {
        return NextResponse.json(
          { error: 'Some selected experiences are already verified or invalid' },
          { status: 400 }
        );
      }

      for (const item of data || []) {
        selectedArtifacts.push({ type: 'experience', id: item.id, label: item.title });
      }
    }

    if (groupedArtifacts.education.length > 0) {
      const { data, error } = await supabase
        .from('education')
        .select('id, institution, degree, verified')
        .eq('user_id', user.id)
        .in('id', groupedArtifacts.education)
        .eq('verified', false);

      if (error) {
        console.error('Failed to validate education for custom verification request:', error);
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      if ((data || []).length !== groupedArtifacts.education.length) {
        return NextResponse.json(
          { error: 'Some selected education items are already verified or invalid' },
          { status: 400 }
        );
      }

      for (const item of data || []) {
        selectedArtifacts.push({
          type: 'education',
          id: item.id,
          label: `${item.degree} at ${item.institution}`,
        });
      }
    }

    if (groupedArtifacts.impact_story.length > 0) {
      const { data, error } = await supabase
        .from('impact_stories')
        .select('id, title, verified')
        .eq('user_id', user.id)
        .in('id', groupedArtifacts.impact_story)
        .eq('verified', false);

      if (error) {
        console.error('Failed to validate impact stories for custom verification request:', error);
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      if ((data || []).length !== groupedArtifacts.impact_story.length) {
        return NextResponse.json(
          { error: 'Some selected impact stories are already verified or invalid' },
          { status: 400 }
        );
      }

      for (const item of data || []) {
        selectedArtifacts.push({ type: 'impact_story', id: item.id, label: item.title });
      }
    }

    if (groupedArtifacts.project.length > 0) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, verified')
        .eq('user_id', user.id)
        .in('id', groupedArtifacts.project)
        .eq('verified', false);

      if (error) {
        console.error('Failed to validate projects for custom verification request:', error);
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      if ((data || []).length !== groupedArtifacts.project.length) {
        return NextResponse.json(
          { error: 'Some selected projects are already verified or invalid' },
          { status: 400 }
        );
      }

      for (const item of data || []) {
        selectedArtifacts.push({ type: 'project', id: item.id, label: item.title });
      }
    }

    if (groupedArtifacts.volunteering.length > 0) {
      const { data, error } = await supabase
        .from('volunteering')
        .select('id, title, verified')
        .eq('user_id', user.id)
        .in('id', groupedArtifacts.volunteering)
        .eq('verified', false);

      if (error) {
        console.error('Failed to validate volunteering for custom verification request:', error);
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      if ((data || []).length !== groupedArtifacts.volunteering.length) {
        return NextResponse.json(
          { error: 'Some selected volunteering entries are already verified or invalid' },
          { status: 400 }
        );
      }

      for (const item of data || []) {
        selectedArtifacts.push({ type: 'volunteering', id: item.id, label: item.title });
      }
    }

    const attestationRequestMode = deriveAttestationRequestMode({
      skills: selectedArtifacts
        .filter((artifact) => artifact.type === 'skill')
        .map((artifact) => {
          const skill = selectedSkillRows.find((row) => row.id === artifact.id);
          return {
            id: artifact.id,
            label: artifact.label,
            skillCode: skill?.skill_code,
            skillId: skill?.skill_id,
          };
        }),
      totalArtifacts: dedupedArtifacts.length,
    });

    if ('error' in attestationRequestMode && attestationRequestMode.error) {
      return NextResponse.json({ error: attestationRequestMode.error }, { status: 400 });
    }

    if (selectedSkillIds.length > 0) {
      const existingSkillRequests = (
        await listCanonicalSkillVerificationRequestsForOwner(user.id).catch((error) => {
          console.error('Failed to validate active canonical skill verification requests:', error);
          return [];
        })
      ).map(mapCanonicalSkillVerificationRequestRecord);

      const hasActiveDuplicate = existingSkillRequests.some(
        (requestRow) =>
          selectedSkillIds.includes(requestRow.skill_id) &&
          normalizeVerifierEmail(requestRow.verifier_email) === verifierEmail &&
          (requestRow.status === 'pending' || requestRow.status === 'accepted')
      );

      if (hasActiveDuplicate) {
        return NextResponse.json(
          {
            error:
              'An active verification request already exists for at least one selected skill and verifier.',
            code: 'DUPLICATE_VERIFICATION_REQUEST',
          },
          { status: 409 }
        );
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    let verifierProfileId: string | null = null;
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from('profiles')
        .select('id')
        .eq('email', verifierEmail)
        .maybeSingle();
      verifierProfileId = data?.id || null;
    } catch (_error) {
      console.warn('Could not resolve verifier profile via admin client');
    }

    const requestId = crypto.randomUUID();
    const issued = await issueCapabilityToken({
      tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
      sourceTable: 'custom_verification_requests',
      sourceId: requestId,
      actionScope: 'custom_verification.respond',
      subjectType: 'custom_verification_request',
      subjectId: requestId,
      actorBinding: verifierProfileId
        ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
        : CAPABILITY_BINDINGS.EMAIL_HASH,
      actorEmail: verifierEmail,
      actorProfileId: verifierProfileId,
      expiresAt,
      singleUse: true,
      maxUses: 1,
      scopeKey: `custom_verification:${user.id}:${verifierEmail}`,
      revokePriorActiveTokensForScope: true,
      metadata: {
        relationship: parsed.data.relationship,
        artifactCount: selectedArtifacts.length,
        requestKind: attestationRequestMode.requestKind,
      },
    });

    const { data: customRequest, error: customRequestError } = await supabase
      .from('custom_verification_requests')
      .insert({
        id: requestId,
        requester_profile_id: user.id,
        verifier_email: verifierEmail,
        verifier_profile_id: verifierProfileId,
        verifier_relationship: parsed.data.relationship,
        request_kind: attestationRequestMode.requestKind,
        attestation_request: attestationRequestMode.requestPayload,
        message: parsed.data.message?.trim() || null,
        token_hash: issued.tokenHash,
        capability_token_id: issued.token.id,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select('id, status, verifier_email, verifier_relationship, created_at, expires_at')
      .single();

    if (customRequestError || !customRequest) {
      console.error('Failed to create custom verification request:', customRequestError);
      return NextResponse.json({ error: 'Failed to create verification request' }, { status: 500 });
    }

    const itemPayload = selectedArtifacts.map((artifact) => ({
      request_id: customRequest.id,
      artifact_type: artifact.type,
      artifact_id: artifact.id,
      display_label: artifact.label,
      status: 'pending',
    }));

    const { error: insertItemsError } = await supabase
      .from('custom_verification_request_items')
      .insert(itemPayload);

    if (insertItemsError) {
      console.error('Failed to create custom verification request items:', insertItemsError);
      return NextResponse.json(
        { error: 'Failed to create verification request items' },
        { status: 500 }
      );
    }

    const canonicalRecords = CANONICAL_PROOFS_WRITE_ENABLED
      ? await Promise.all(
          selectedArtifacts.map((artifact) =>
            upsertCanonicalVerificationRecord({
              ownerType: 'individual_profile',
              ownerId: user.id,
              subjectType: artifact.type,
              subjectId: artifact.id,
              verificationKind:
                attestationRequestMode.requestKind === 'human_observed_attestation' &&
                artifact.type === 'skill'
                  ? parsed.data.relationship === 'manager' ||
                    parsed.data.relationship === 'skip_level_manager' ||
                    parsed.data.relationship === 'direct_report'
                    ? 'skill_attestation_manager'
                    : 'skill_attestation_peer'
                  : 'platform_manual_review',
              status: 'pending',
              verifierPrincipalType: verifierProfileId ? 'user_account' : 'external_email',
              verifierProfileId,
              verifierEmailHash: hashVerificationToken(verifierEmail),
              verifierDomainSnapshot: verifierEmail.split('@')[1] || null,
              integrityStatus: 'unknown',
              claimSnapshot: {
                displayLabel: artifact.label,
                artifactType: artifact.type,
              },
              sourceRequestTable: 'custom_verification_requests',
              sourceRequestId: customRequest.id,
              metadata: {
                requestTransport: artifact.type === 'skill' ? 'skill_verification_request' : null,
                requesterEmailSnapshot: null,
                verifierEmail: verifierEmail,
                verifierSource:
                  artifact.type === 'skill'
                    ? mapCustomRelationshipToSkillVerifierSource(parsed.data.relationship)
                    : null,
                verifierRelationship: parsed.data.relationship,
                customRequestId: customRequest.id,
                capabilityTokenId: issued.token.id,
                relationship: parsed.data.relationship,
                message: parsed.data.message?.trim() || null,
                requestKind: attestationRequestMode.requestKind,
                attestation: attestationRequestMode.requestPayload,
                evidenceClass:
                  attestationRequestMode.requestKind === 'human_observed_attestation'
                    ? 'human_observed'
                    : 'generic',
              },
            })
          )
        )
      : [];

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const requesterName = requesterProfile?.display_name || 'A Proofound user';
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify/custom/${issued.rawToken}`;

    const artifactLines = selectedArtifacts
      .slice(0, 12)
      .map(
        (artifact) =>
          `<li><strong>${artifactTypeLabel(artifact.type)}:</strong> ${artifact.label}</li>`
      )
      .join('');

    const artifactTextLines = selectedArtifacts
      .slice(0, 12)
      .map((artifact) => `- ${artifactTypeLabel(artifact.type)}: ${artifact.label}`)
      .join('\n');

    const relationshipDescription = relationshipLabel(parsed.data.relationship);

    const emailResult = await sendEmail({
      to: verifierEmail,
      subject: `${requesterName} requested your verification on Proofound`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px; color: #2D3330;">
          <h2 style="margin-top: 0;">Custom Verification Request</h2>
          <p>
            <strong>${requesterName}</strong> listed you as ${relationshipDescription} and asked you to ${
              attestationRequestMode.requestKind === 'human_observed_attestation'
                ? 'record bounded observed-in-practice skill attestations'
                : 'verify multiple profile artifacts'
            }.
          </p>
          <ul>
            ${artifactLines}
          </ul>
          ${parsed.data.message ? `<p><strong>Message:</strong> ${parsed.data.message}</p>` : ''}
          <p>Use this link to accept or decline the request:</p>
          <p>
            <a href="${verifyUrl}" style="display: inline-block; background: #1C4D3A; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 8px;">Review Request</a>
          </p>
          <p style="font-size: 12px; color: #6B7470;">This link expires in 14 days.</p>
        </div>
      `,
      text: `Custom Verification Request\n\n${requesterName} listed you as ${relationshipDescription} and asked you to ${
        attestationRequestMode.requestKind === 'human_observed_attestation'
          ? 'record bounded observed-in-practice skill attestations'
          : 'verify multiple artifacts'
      }:\n${artifactTextLines}\n\n${parsed.data.message ? `Message: ${parsed.data.message}\n\n` : ''}Review request: ${verifyUrl}\n\nThis link expires in 14 days.`,
    });

    if (!emailResult.success) {
      console.warn('Custom verification email failed to send:', emailResult.error);
    }

    return NextResponse.json(
      {
        request: {
          ...customRequest,
          artifact_count: selectedArtifacts.length,
          canonical_record_ids: canonicalRecords.map((record) => record.id),
        },
        email_sent: emailResult.success,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Custom verification request POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
