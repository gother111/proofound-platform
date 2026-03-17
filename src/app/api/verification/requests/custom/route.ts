import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import { buildBlindSafeVerificationRequestEmail } from '@/lib/email/privacy';
import { sendEmail } from '@/lib/email/sender';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  createCanonicalVerificationBundle,
  updateCanonicalBundleDeliveryState,
} from '@/lib/verification/canonical-bundles';
import {
  CUSTOM_VERIFICATION_ARTIFACT_TYPES,
  CUSTOM_VERIFICATION_RELATIONSHIPS,
  normalizeVerifierEmail,
  parseCustomSkillName,
} from '@/lib/verification/custom-verification';
import { deriveAttestationRequestMode } from '@/lib/verification/human-attestations';
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

function skillLabel(skill: SelectedSkillRow): string {
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

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    const requesterName = requesterProfile?.display_name || 'A Proofound user';

    const bundle = await createCanonicalVerificationBundle({
      ownerId: user.id,
      requesterName,
      requesterEmailSnapshot: requesterEmail,
      verifierEmail,
      verifierProfileId,
      verifierRelationship: parsed.data.relationship,
      verifierSource:
        parsed.data.relationship === 'manager' ||
        parsed.data.relationship === 'skip_level_manager' ||
        parsed.data.relationship === 'direct_report'
          ? 'manager'
          : parsed.data.relationship === 'external' || parsed.data.relationship === 'client'
            ? 'external'
            : 'peer',
      requestKind: attestationRequestMode.requestKind,
      attestationRequest: attestationRequestMode.requestPayload,
      message: parsed.data.message?.trim() || null,
      artifacts: selectedArtifacts,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify/custom/${bundle.rawToken}`;

    const emailCopy = buildBlindSafeVerificationRequestEmail({
      verifyUrl,
      expiresInDays: 14,
      ctaLabel: 'Review Request',
      requestKind: attestationRequestMode.requestKind,
    });

    const emailResult = await sendEmail({
      to: verifierEmail,
      subject: emailCopy.subject,
      html: emailCopy.html,
      text: emailCopy.text,
    });

    await updateCanonicalBundleDeliveryState(bundle.bundleId, {
      emailSent: emailResult.success,
      emailError: emailResult.success ? null : emailResult.error || 'unknown_email_delivery_error',
    }).catch((error) => {
      console.error('Failed to persist bundle email delivery state:', error);
    });

    if (!emailResult.success) {
      console.warn('Custom verification email failed to send:', emailResult.error);
    }

    return NextResponse.json(
      {
        request: {
          id: bundle.bundleId,
          status: 'pending',
          verifier_email: verifierEmail,
          verifier_relationship: parsed.data.relationship,
          created_at: new Date().toISOString(),
          expires_at: bundle.expiresAt.toISOString(),
          artifact_count: selectedArtifacts.length,
          canonical_record_ids: bundle.records.map((record) => record.id),
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
