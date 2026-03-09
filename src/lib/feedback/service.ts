import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendFeedbackRequestEmail } from '@/lib/email';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';

type Direction = 'candidate_to_org' | 'org_to_candidate';

const FEEDBACK_EXPIRY_DAYS = 7;

const addDays = (days: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt;
};

const getDefaultTemplateId = async (
  admin: ReturnType<typeof createAdminClient>,
  direction: Direction
) => {
  const { data, error } = await admin
    .from('feedback_templates')
    .select('id')
    .eq('direction', direction)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id as string | undefined;
};

const getUserEmail = async (
  admin: ReturnType<typeof createAdminClient>,
  userId?: string | null
) => {
  if (!userId) return undefined;
  try {
    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) return undefined;
    return data.user?.email || undefined;
  } catch {
    return undefined;
  }
};

const findReusableToken = async (
  admin: ReturnType<typeof createAdminClient>,
  interviewId: string,
  direction: Direction
) => {
  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from('feedback_tokens')
    .select('id, capability_token_id, token, template_id, expires_at')
    .eq('interview_id', interviewId)
    .eq('direction', direction)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  if (!data.token) return null;

  return data as {
    id: string;
    capability_token_id?: string | null;
    token: string;
    template_id: string;
    expires_at: string;
  };
};

const createToken = async (
  admin: ReturnType<typeof createAdminClient>,
  params: {
    interviewId: string;
    templateId: string;
    direction: Direction;
    recipientEmail?: string;
    createdBy?: string | null;
  }
) => {
  const expiresAt = addDays(FEEDBACK_EXPIRY_DAYS).toISOString();
  const feedbackTokenId = crypto.randomUUID();
  const issued = await issueCapabilityToken({
    tokenClass: CAPABILITY_TOKEN_CLASSES.FEEDBACK_RESPONSE,
    sourceTable: 'feedback_tokens',
    sourceId: feedbackTokenId,
    actionScope: 'feedback.submit',
    subjectType: 'interview_feedback',
    subjectId: params.interviewId,
    actorBinding: params.recipientEmail ? CAPABILITY_BINDINGS.EMAIL_HASH : CAPABILITY_BINDINGS.NONE,
    actorEmail: params.recipientEmail,
    actorProfileId: null,
    expiresAt: new Date(expiresAt),
    singleUse: true,
    maxUses: 1,
    metadata: {
      direction: params.direction,
      templateId: params.templateId,
    },
  });

  const { error } = await admin.from('feedback_tokens').insert({
    id: feedbackTokenId,
    token_hash: issued.tokenHash,
    interview_id: params.interviewId,
    template_id: params.templateId,
    direction: params.direction,
    recipient_email: params.recipientEmail,
    expires_at: expiresAt,
    created_by: params.createdBy ?? null,
    capability_token_id: issued.token.id,
  });

  if (error) throw error;
  return { token: issued.rawToken, expiresAt };
};

export const markTokenUsed = async (token: string, actor?: { email?: string | null }) => {
  const redeemed = await redeemCapabilityToken(token, {
    tokenClass: CAPABILITY_TOKEN_CLASSES.FEEDBACK_RESPONSE,
    actor: { email: actor?.email ?? null },
    consume: true,
    metadata: { surface: 'feedback_submit' },
  });

  if (!redeemed.ok) {
    return redeemed;
  }

  const admin = createAdminClient();
  await admin
    .from('feedback_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', redeemed.token.source_id);

  return redeemed;
};

export const issueFeedbackInvites = async (interviewId: string) => {
  const admin = createAdminClient();

  const { data: interview, error: interviewError } = await admin
    .from('interviews')
    .select('id, host_user_id, participant_user_ids, status, scheduled_at')
    .eq('id', interviewId)
    .maybeSingle();

  if (interviewError || !interview) {
    throw new Error('Interview not found for feedback tokens');
  }

  const candidateId =
    interview.participant_user_ids?.find((id: string) => id !== interview.host_user_id) ??
    interview.participant_user_ids?.[0] ??
    interview.host_user_id;

  const hostId = interview.host_user_id;

  const candidateTemplateId = await getDefaultTemplateId(admin, 'candidate_to_org');
  const orgTemplateId = await getDefaultTemplateId(admin, 'org_to_candidate');

  const tokens: {
    direction: Direction;
    token: string;
    expiresAt: string;
    recipientEmail?: string;
  }[] = [];

  if (candidateTemplateId) {
    const existing = await findReusableToken(admin, interviewId, 'candidate_to_org');
    const candidateEmail = await getUserEmail(admin, candidateId);
    const tokenData =
      existing ??
      (await createToken(admin, {
        interviewId,
        templateId: candidateTemplateId,
        direction: 'candidate_to_org',
        recipientEmail: candidateEmail,
        createdBy: hostId,
      }));
    tokens.push({
      direction: 'candidate_to_org',
      token: tokenData.token,
      expiresAt: 'expiresAt' in tokenData ? tokenData.expiresAt : tokenData.expires_at,
      recipientEmail: candidateEmail,
    });
  }

  if (orgTemplateId) {
    const existing = await findReusableToken(admin, interviewId, 'org_to_candidate');
    const orgEmail = await getUserEmail(admin, hostId);
    const tokenData =
      existing ??
      (await createToken(admin, {
        interviewId,
        templateId: orgTemplateId,
        direction: 'org_to_candidate',
        recipientEmail: orgEmail,
        createdBy: hostId,
      }));
    tokens.push({
      direction: 'org_to_candidate',
      token: tokenData.token,
      expiresAt: 'expiresAt' in tokenData ? tokenData.expiresAt : tokenData.expires_at,
      recipientEmail: orgEmail,
    });
  }

  // Send emails if we have addresses
  await Promise.all(
    tokens
      .filter((t) => t.recipientEmail)
      .map((t) =>
        sendFeedbackRequestEmail({
          to: t.recipientEmail as string,
          direction: t.direction,
          token: t.token,
          expiresAt: t.expiresAt,
          interviewTime: interview.scheduled_at,
        }).catch((err) => {
          console.error('Failed to send feedback email', err);
        })
      )
  );

  return tokens;
};
