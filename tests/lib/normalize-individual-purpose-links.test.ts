import { describe, expect, it } from 'vitest';

import {
  normalizeIndividualPurposeLinks,
  normalizeIndividualValues,
  parseJsonStringSafely,
} from '@/lib/profile/normalizePurposeLinks';

describe('normalize individual profile purpose helpers', () => {
  it('normalizes JSON string encoded value objects', () => {
    const input = JSON.stringify([
      { id: 'v1', icon: 'Shield', label: ' Integrity ', verified: true },
      { id: '', icon: '', label: 'Integrity', verified: false },
      { label: ' Transparency ' },
      { label: 'Accountability', verified: 'yes' },
      { bad: true },
    ]);

    expect(normalizeIndividualValues(input)).toEqual([
      { id: 'v1', icon: 'Shield', label: 'Integrity', verified: true },
      { id: 'legacy-2-transparency', icon: 'Heart', label: 'Transparency', verified: false },
      {
        id: 'legacy-3-accountability',
        icon: 'Heart',
        label: 'Accountability',
        verified: false,
      },
    ]);
  });

  it('normalizes JSON string encoded plain labels', () => {
    const input = JSON.stringify([' Integrity ', '', 'Integrity', 'Trust', 3]);

    expect(normalizeIndividualValues(input)).toEqual([
      { id: 'legacy-0-integrity', icon: 'Heart', label: 'Integrity', verified: false },
      { id: 'legacy-3-trust', icon: 'Heart', label: 'Trust', verified: false },
    ]);
  });

  it('returns empty values for invalid JSON payload strings', () => {
    expect(normalizeIndividualValues('{not-json')).toEqual([]);
    expect(normalizeIndividualValues('  ')).toEqual([]);
  });

  it('normalizes purpose links from JSON string object payloads', () => {
    const input = JSON.stringify({
      values: ['Integrity', '', 'Integrity', 'Trust'],
      causes: ['Climate Justice', null, 'Climate Justice'],
    });

    expect(normalizeIndividualPurposeLinks(input)).toEqual({
      values: ['Integrity', 'Trust'],
      causes: ['Climate Justice'],
    });
  });

  it('falls back to empty purpose links for invalid payloads', () => {
    expect(normalizeIndividualPurposeLinks('{not-json')).toEqual({ values: [], causes: [] });
    expect(normalizeIndividualPurposeLinks(null)).toEqual({ values: [], causes: [] });
  });

  it('parseJsonStringSafely parses valid strings and preserves non-strings', () => {
    expect(parseJsonStringSafely('{"a":1}')).toEqual({ a: 1 });

    const sameObject = { a: 1 };
    expect(parseJsonStringSafely(sameObject)).toBe(sameObject);
  });
});
