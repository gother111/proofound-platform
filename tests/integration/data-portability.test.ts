/** @vitest-environment node */

/**
 * Integration-level data portability contract tests.
 *
 * These tests exercise the import normalizer that sits at the boundary between
 * exported account data and re-importable owner-full Proof Pack data.
 */

import { describe, expect, it } from 'vitest';

import { normalizeImportRequest } from '@/lib/contracts/data-portability';

const v4Payload = {
  version: '4.0.0',
  exportedAt: '2026-05-20T08:00:00.000Z',
  profile: {
    headline: 'Proof-first operator',
    bio: 'Builds evidence-backed launch systems.',
  },
  skills: [
    {
      skillCode: 'typescript',
      level: 4,
      lastUsed: '2026-05-01T00:00:00.000Z',
      notes: 'Used for launch-safe Proof Pack tooling.',
    },
  ],
  experiences: [
    {
      type: 'work',
      organization: 'Private client',
      role: 'Launch engineer',
      startDate: '2026-01-01',
      endDate: null,
      description: 'Built a proof-first review corridor.',
    },
  ],
  volunteering: [],
  proof: {
    scope: 'owner_full',
    schemaVersion: '4.0.0',
    packs: [],
    artifacts: [],
    packItems: [],
    submissions: [],
    submissionArtifacts: [],
    verificationReferences: [],
    verificationLogEntries: [],
  },
};

describe('data portability integration contract', () => {
  it('exports and imports structured owner-full account data through the v4 contract', () => {
    const normalized = normalizeImportRequest({
      data: v4Payload,
      mode: 'merge',
      consentAcknowledged: true,
    });

    expect(normalized.mode).toBe('merge');
    expect(normalized.consentAcknowledged).toBe(true);
    expect(normalized.data.version).toBe('4.0.0');
    expect(normalized.data.profile.headline).toBe('Proof-first operator');
    expect(normalized.data.skills).toHaveLength(1);
    expect(normalized.data.experiences).toHaveLength(1);
    expect(normalized.data.proof.scope).toBe('owner_full');
  });

  it('normalizes legacy exports into the active v4 import shape', () => {
    const normalized = normalizeImportRequest({
      exportVersion: '3.0.0',
      exportDate: '2026-05-19T12:00:00.000Z',
      profile: {
        individual: {
          headline: 'Legacy proof builder',
          bio: 'Older export shape',
        },
      },
      skills: {
        skills: [{ skillId: 'react', level: 5, lastUsedAt: '2026-04-01T00:00:00.000Z' }],
      },
      workHistory: {
        experiences: [{ organizationName: 'Legacy organization', title: 'Builder' }],
        volunteering: [{ organization: 'Community group', impact: 'Proof review' }],
      },
    });

    expect(normalized.mode).toBe('replace');
    expect(normalized.data.version).toBe('4.0.0');
    expect(normalized.data.profile.headline).toBe('Legacy proof builder');
    expect(normalized.data.skills[0]).toMatchObject({ skillCode: 'react', level: 5 });
    expect(normalized.data.experiences[0]).toMatchObject({
      organization: 'Legacy organization',
      role: 'Builder',
    });
    expect(normalized.data.proof.scope).toBe('owner_full');
  });

  it('requires explicit consent when the importing caller asks for it', () => {
    expect(() =>
      normalizeImportRequest(
        {
          data: v4Payload,
          mode: 'merge',
        },
        { requireConsent: true }
      )
    ).toThrow('CONSENT_REQUIRED');
  });

  it('rejects malformed data before import work can start', () => {
    expect(() =>
      normalizeImportRequest({
        data: {
          ...v4Payload,
          skills: [{ skillCode: '', level: 9 }],
        },
        consentAcknowledged: true,
      })
    ).toThrow();
  });
});
