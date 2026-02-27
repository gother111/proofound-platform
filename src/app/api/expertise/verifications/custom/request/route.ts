import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/email/sender';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import {
  CUSTOM_VERIFICATION_ARTIFACT_TYPES,
  CUSTOM_VERIFICATION_RELATIONSHIPS,
  artifactTypeLabel,
  generateVerificationToken,
  hashVerificationToken,
  normalizeVerifierEmail,
  parseCustomSkillName,
  relationshipLabel,
} from '@/lib/verification/custom-verification';

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

    if (groupedArtifacts.skill.length > 0) {
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select(
          `
          id,
          skill_id,
          skill_code,
          name_i18n,
          taxonomy:skills_taxonomy!skills_skill_code_fkey (
            name_i18n
          )
        `
        )
        .eq('profile_id', user.id)
        .in('id', groupedArtifacts.skill);

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
      const loadedSkillIds = new Set(loadedSkills.map((skill) => skill.id));

      for (const skillId of groupedArtifacts.skill) {
        if (!loadedSkillIds.has(skillId)) {
          return NextResponse.json(
            { error: 'Some selected skills are invalid or do not belong to you' },
            { status: 400 }
          );
        }
      }

      const { data: acceptedSkillRequests, error: acceptedSkillRequestsError } = await supabase
        .from('skill_verification_requests')
        .select('skill_id')
        .eq('requester_profile_id', user.id)
        .eq('status', 'accepted')
        .in('skill_id', groupedArtifacts.skill);

      if (acceptedSkillRequestsError) {
        console.error(
          'Failed to validate accepted skill verification requests:',
          acceptedSkillRequestsError
        );
        return NextResponse.json(
          { error: 'Failed to validate selected artifacts' },
          { status: 500 }
        );
      }

      const alreadyVerifiedSkillIds = new Set(
        (acceptedSkillRequests || []).map((requestRow) => requestRow.skill_id)
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

    const token = generateVerificationToken();
    const tokenHash = hashVerificationToken(token);
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

    const { data: customRequest, error: customRequestError } = await supabase
      .from('custom_verification_requests')
      .insert({
        requester_profile_id: user.id,
        verifier_email: verifierEmail,
        verifier_profile_id: verifierProfileId,
        verifier_relationship: parsed.data.relationship,
        message: parsed.data.message?.trim() || null,
        token_hash: tokenHash,
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

    if (selectedSkillIds.length > 0) {
      const skillRequestRows = selectedSkillIds.map((skillId) => ({
        skill_id: skillId,
        requester_profile_id: user.id,
        verifier_email: verifierEmail,
        verifier_profile_id: verifierProfileId,
        verifier_source: parsed.data.relationship,
        message: parsed.data.message?.trim() || null,
        custom_request_id: customRequest.id,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      }));

      const { error: linkedSkillRowsError } = await supabase
        .from('skill_verification_requests')
        .insert(skillRequestRows);

      if (linkedSkillRowsError) {
        console.error('Failed to create linked skill verification requests:', linkedSkillRowsError);
        return NextResponse.json(
          { error: 'Failed to create linked skill verification requests' },
          { status: 500 }
        );
      }
    }

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
    const verifyUrl = `${baseUrl}/verify/custom/${token}`;

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
            <strong>${requesterName}</strong> listed you as ${relationshipDescription} and asked you to verify multiple profile artifacts.
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
      text: `Custom Verification Request\n\n${requesterName} listed you as ${relationshipDescription} and asked you to verify multiple artifacts:\n${artifactTextLines}\n\n${parsed.data.message ? `Message: ${parsed.data.message}\n\n` : ''}Review request: ${verifyUrl}\n\nThis link expires in 14 days.`,
    });

    if (!emailResult.success) {
      console.warn('Custom verification email failed to send:', emailResult.error);
    }

    return NextResponse.json(
      {
        request: {
          ...customRequest,
          artifact_count: selectedArtifacts.length,
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
