import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';

const PLAIN_VOCABULARY = {
  pacLabel: 'Proof fit',
  pacTooltip: 'Proof fit reflects skills, evidence, freshness, verification, and constraints.',
  skillsLabel: 'skills',
  expertiseSystemLabel: 'Expertise Atlas',
  ttfqiLabel: 'Time to first good match',
  ttscLabel: 'Time to successful hire',
} as const;

const CANONICAL_VOCABULARY = {
  pacLabel: 'Proof fit',
  pacTooltip: 'Proof fit reflects skills, evidence, freshness, verification, and constraints.',
  skillsLabel: 'skills',
  expertiseSystemLabel: 'Expertise Atlas',
  ttfqiLabel: 'TTFQI',
  ttscLabel: 'TTSC',
} as const;

export const UI_VOCABULARY = CLIENT_FF_DEFAULTS.uiVocabPlain
  ? PLAIN_VOCABULARY
  : CANONICAL_VOCABULARY;

export function plainSkillDepthLabel(count: number): string {
  return `${count} skills`;
}
