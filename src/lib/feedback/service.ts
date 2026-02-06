import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendFeedbackRequestEmail } from '@/lib/email';

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
    .select('token, template_id, expires_at')
    .eq('interview_id', interviewId)
    .eq('direction', direction)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return data as {
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
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = addDays(FEEDBACK_EXPIRY_DAYS).toISOString();

  const { error } = await admin.from('feedback_tokens').insert({
    token,
    interview_id: params.interviewId,
    template_id: params.templateId,
    direction: params.direction,
    recipient_email: params.recipientEmail,
    expires_at: expiresAt,
    created_by: params.createdBy ?? null,
  });

  if (error) throw error;
  return { token, expiresAt };
};

export const markTokenUsed = async (token: string) => {
  const admin = createAdminClient();
  await admin
    .from('feedback_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token);
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
