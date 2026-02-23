import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';

const PLAIN_VOCABULARY = {
  pacLabel: 'Purpose fit',
  pacTooltip:
    'Purpose fit reflects how well your selected values and causes align with an organization.',
  skillsLabel: 'skills',
  expertiseSystemLabel: 'Expertise Atlas',
  ttfqiLabel: 'Time to first good match',
  ttscLabel: 'Time to successful hire',
} as const;

const CANONICAL_VOCABULARY = {
  pacLabel: 'PAC',
  pacTooltip: 'PAC (Purpose-Alignment Contribution) quantifies values and causes alignment.',
  skillsLabel: 'L4 skills',
  expertiseSystemLabel: 'L1-L4 Atlas',
  ttfqiLabel: 'TTFQI',
  ttscLabel: 'TTSC',
} as const;

export const UI_VOCABULARY = CLIENT_FF_DEFAULTS.uiVocabPlain
  ? PLAIN_VOCABULARY
  : CANONICAL_VOCABULARY;

export function plainSkillDepthLabel(count: number): string {
  return `${count} skills`;
}
