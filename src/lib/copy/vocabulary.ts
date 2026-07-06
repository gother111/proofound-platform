import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';

const PLAIN_VOCABULARY = {
  pacLabel: 'Proof fit',
  pacTooltip: 'Proof fit reflects skills, evidence, freshness, verification, and constraints.',
  skillsLabel: 'skills',
  expertiseSystemLabel: 'Expertise Atlas',
  ttfqiLabel: 'Time to first good match',
  ttscLabel: 'Time to successful hire',
  proofRecordLabel: 'proof record',
  proofRecordLabelPlural: 'proof records',
  proofRecordTitle: 'Proof record',
  proofRecordTitlePlural: 'Proof records',
  hiringFlowLabel: 'hiring flow',
  trustedConfirmationLabel: 'trusted confirmation',
  visibleToMatchingLabel: 'Visible to matching',
  readyForIntroductionsLabel: 'Ready for introductions',
  readinessHints: {
    portfolioReady: 'Your public proof page has enough structured proof to review and share.',
    visibleToMatching:
      'Your profile can appear in matching without opening direct introductions yet.',
    readyForIntroductions:
      'You have enough trusted confirmation and preferences for identity-bearing introductions.',
  },
} as const;

const CANONICAL_VOCABULARY = {
  pacLabel: 'Proof fit',
  pacTooltip: 'Proof fit reflects skills, evidence, freshness, verification, and constraints.',
  skillsLabel: 'skills',
  expertiseSystemLabel: 'Expertise Atlas',
  ttfqiLabel: 'TTFQI',
  ttscLabel: 'TTSC',
  proofRecordLabel: 'proof record',
  proofRecordLabelPlural: 'proof records',
  proofRecordTitle: 'Proof record',
  proofRecordTitlePlural: 'Proof records',
  hiringFlowLabel: 'hiring flow',
  trustedConfirmationLabel: 'trusted confirmation',
  visibleToMatchingLabel: 'Visible to matching',
  readyForIntroductionsLabel: 'Ready for introductions',
  readinessHints: {
    portfolioReady: 'Your public proof page has enough structured proof to review and share.',
    visibleToMatching:
      'Your profile can appear in matching without opening direct introductions yet.',
    readyForIntroductions:
      'You have enough trusted confirmation and preferences for identity-bearing introductions.',
  },
} as const;

export const UI_VOCABULARY = CLIENT_FF_DEFAULTS.uiVocabPlain
  ? PLAIN_VOCABULARY
  : CANONICAL_VOCABULARY;

export function plainSkillDepthLabel(count: number): string {
  return `${count} skills`;
}
