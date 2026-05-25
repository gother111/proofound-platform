import { describe, expect, it } from 'vitest';

import { buildOrganizationTextPack, buildTextPack } from '@/lib/portfolio/text-pack';

describe('buildTextPack', () => {
  it('uses organization trust-page fallback language when domain verification is absent', () => {
    const text = buildOrganizationTextPack({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/org/acme',
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        verifiedDomainPath: null,
        mission: null,
        whyWorkMatters: null,
        operatingContext: null,
        website: null,
      },
      assignments: [],
    });

    expect(text).toContain('Trust page published without domain verification');
    expect(text).not.toContain('Public profile');
  });

  it('leads with proof-backed summary details before proof-linked skills', () => {
    const text = buildTextPack({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Impact builder',
        bio: 'Legacy bio that should not lead when proof packs exist.',
      },
      publication: {
        requestedState: 'public_link_only',
        effectiveState: 'public_link_only',
        searchIndexingEnabled: false,
      },
      signals: {
        identity: { verified: false },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'unverified', hasIdentityVerification: false },
        proofs: { count: 2 },
        verifications: { count: 1 },
        badges: [{ key: 'manual_review', label: 'Manual review complete', state: 'verified' }],
        activeIssues: [],
      },
      skills: [
        { id: 'skill-1', name: 'Product Strategy', level: 4 },
        { id: 'skill-2', name: 'Delivery', level: 4 },
      ],
      proofPacks: [
        {
          id: 'pack-1',
          scope: 'public_safe',
          status: 'published',
          title: 'Proof Pack: Product Strategy',
          summary: 'Led a launch-critical product strategy cycle.',
          ownershipStatement: 'Owned the product strategy contribution for this launch.',
          evidenceSummary: 'Cross-checked against a public launch memo.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this Proof Pack.',
          freshnessState: 'fresh',
          proofQualityScore: 0.8,
          schemaVersion: 'proof_pack/v2',
          artifactCount: 1,
          contextLabel: 'Product Strategy',
          selectedEvidence: [
            {
              title: 'Launch memo',
              href: 'https://example.com/launch-memo',
              artifactKind: 'link',
              issuedAt: '2026-02-20',
              description: 'Public launch memo',
              semanticsNote: 'Supporting evidence only, not full verification.',
            },
          ],
        },
      ],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: false,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: false,
      },
    });

    expect(text).toContain('Proof-backed summary:');
    expect(text).toContain('- Proof Pack: Product Strategy: Shipped the MVP in two weeks.');
    expect(text).toContain('Selected proof packs:');
    expect(text).toContain('Context: Product Strategy');
    expect(text).toContain('Verification: Verified evidence');
    expect(text).toContain('Freshness: Fresh');
    expect(text).toContain('Ownership: Owned the product strategy contribution for this launch.');
    expect(text).toContain('Verification summary: Scoped verification supports this Proof Pack.');
    expect(text).toContain('Skills evidenced in selected proof:');
    expect(text).toContain('Product Strategy, Delivery');
    expect(text).toContain(
      'Launch memo (https://example.com/launch-memo) [Supporting evidence only, not full verification.]'
    );
    expect(text).toContain('Portfolio: https://proofound.io/portfolio/jane');
    expect(text.indexOf('Proof-backed summary:')).toBeLessThan(
      text.indexOf('Skills evidenced in selected proof:')
    );
  });

  it('does not fall back to raw top-skill percentages when no proof packs are selected', () => {
    const text = buildTextPack({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Impact builder',
        bio: 'Profile context only.',
      },
      publication: {
        requestedState: 'public_link_only',
        effectiveState: 'public_link_only',
        searchIndexingEnabled: false,
      },
      signals: {
        identity: { verified: false },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'unverified', hasIdentityVerification: false },
        proofs: { count: 0 },
        verifications: { count: 0 },
        badges: [],
        activeIssues: [],
      },
      skills: [{ id: 'skill-1', name: 'Strategy', level: 5 }],
      proofPacks: [],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: false,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: false,
      },
    });

    expect(text).toContain('Selected proof packs:');
    expect(text).toContain('- No public proof packs are selected yet.');
    expect(text).not.toContain('Strategy: 100%');
    expect(text).not.toContain('Skills evidenced in selected proof:');
  });
});
