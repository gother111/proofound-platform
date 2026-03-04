import { describe, expect, it } from 'vitest';

import { extractSkillPhrases } from '@/lib/ai/nlp-extractor';

describe('nlp skill extractor', () => {
  it('prioritizes explicit skills sections and canonical variants', () => {
    const result = extractSkillPhrases(
      [
        'Skills',
        'React.js, TypeScript, Node.js, CI/CD',
        '',
        'Experience',
        'Built customer-facing apps.',
      ].join('\n')
    );

    const texts = new Set(result.phrases.map((phrase) => phrase.text.toLowerCase()));
    expect(texts.has('react')).toBe(true);
    expect(texts.has('typescript')).toBe(true);
    expect(texts.has('nodejs')).toBe(true);
    expect(texts.has('ci/cd')).toBe(true);
  });

  it('filters obvious noise phrases from narrative lines', () => {
    const result = extractSkillPhrases(
      'Worked with stakeholders and was responsible for delivery at Acme in Stockholm.'
    );

    const texts = result.phrases.map((phrase) => phrase.text.toLowerCase());
    expect(texts.some((entry) => entry.includes('stakeholders'))).toBe(false);
    expect(texts.some((entry) => entry.includes('responsible'))).toBe(false);
  });
});
