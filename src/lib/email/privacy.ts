type BlindSafeVerificationEmailInput = {
  verifyUrl: string;
  expiresInDays: number;
  ctaLabel: string;
  requestKind: 'generic_verification' | 'human_observed_attestation';
};

export type WorkflowEmailPrivacyStage = 'masked' | 'revealed';

export type WorkflowEmailPrivacyOptions = {
  stage?: WorkflowEmailPrivacyStage;
  neutralSubject?: string;
  organizationVisible?: boolean;
  schoolVisible?: boolean;
  identityVisible?: boolean;
  artifactVisible?: boolean;
};

export type WorkflowEmailPrivacyPayload = {
  subject: string;
  organizationName?: string | null;
  schoolName?: string | null;
  candidateName?: string | null;
  revealedName?: string | null;
  artifactDisplayName?: string | null;
};

const MASKED_WORKFLOW_PLACEHOLDERS = {
  organizationName: 'the organization',
  schoolName: 'the institution',
  candidateName: 'your match',
  revealedName: 'your match',
  artifactDisplayName: 'the shared document',
} as const;

function verificationRequestDescription(
  requestKind: BlindSafeVerificationEmailInput['requestKind']
) {
  if (requestKind === 'human_observed_attestation') {
    return 'This request asks for a bounded observation about work or learning you directly observed.';
  }

  return 'This request asks for a scoped review of proof shared inside Proofound.';
}

export function buildBlindSafeVerificationRequestEmail(input: BlindSafeVerificationEmailInput) {
  const description = verificationRequestDescription(input.requestKind);
  const subject = 'Proofound verification request';
  const heading =
    input.requestKind === 'human_observed_attestation'
      ? 'Verification observation request'
      : 'Verification request';

  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2D3330; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1C4D3A 0%, #2D5F4A 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${heading}</h1>
        </div>
        <div style="background: #F7F6F1; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #E5E3DA; border-top: none;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Someone on Proofound asked you to review a verification request.
          </p>
          <p style="font-size: 16px; margin-bottom: 25px;">
            ${description}
          </p>
          <p style="font-size: 16px; margin-bottom: 25px;">
            To protect privacy, request details stay inside the secure review flow.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${input.verifyUrl}"
              style="display: inline-block; background: #1C4D3A; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              ${input.ctaLabel}
            </a>
          </div>
          <p style="font-size: 14px; color: #6B6760; margin-top: 25px;">
            This link expires in ${input.expiresInDays} days. If you do not recognize this request, you can ignore this email.
          </p>
        </div>
      </body>
      </html>
    `.trim(),
    text: `
${heading}

Hi there,

Someone on Proofound asked you to review a verification request.

${description}

To protect privacy, request details stay inside the secure review flow.

Review request: ${input.verifyUrl}

This link expires in ${input.expiresInDays} days.
    `.trim(),
  };
}

export function applyWorkflowEmailPrivacy(
  payload: WorkflowEmailPrivacyPayload,
  options: WorkflowEmailPrivacyOptions
) {
  const stage = options.stage ?? 'revealed';

  if (stage !== 'masked') {
    return payload;
  }

  return {
    subject: options.neutralSubject ?? payload.subject,
    organizationName:
      options.organizationVisible === false
        ? MASKED_WORKFLOW_PLACEHOLDERS.organizationName
        : (payload.organizationName ?? null),
    schoolName:
      options.schoolVisible === false
        ? MASKED_WORKFLOW_PLACEHOLDERS.schoolName
        : (payload.schoolName ?? null),
    candidateName:
      options.identityVisible === false
        ? MASKED_WORKFLOW_PLACEHOLDERS.candidateName
        : (payload.candidateName ?? null),
    revealedName:
      options.identityVisible === false
        ? MASKED_WORKFLOW_PLACEHOLDERS.revealedName
        : (payload.revealedName ?? null),
    artifactDisplayName:
      options.artifactVisible === false
        ? MASKED_WORKFLOW_PLACEHOLDERS.artifactDisplayName
        : (payload.artifactDisplayName ?? null),
  };
}
