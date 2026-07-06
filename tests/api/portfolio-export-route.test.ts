/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/export-data', () => ({
  fetchTrustExportData: vi.fn(),
}));

vi.mock('@/lib/portfolio/pdf', () => ({
  generateTrustPdf: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitPortfolioPdfExportSucceeded: vi.fn(),
}));

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    flow: 'export',
    requestId: 'trace-1',
    actorId: null,
    actorType: 'anonymous',
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/portfolio/export/route';
import { createClient } from '@/lib/supabase/server';
import { fetchTrustExportData } from '@/lib/portfolio/export-data';
import { generateTrustPdf } from '@/lib/portfolio/pdf';
import { emitPortfolioPdfExportSucceeded } from '@/lib/analytics/events';
import { emitLaunchTrace } from '@/lib/launch/trace';
import { log } from '@/lib/log';

function mockSupabaseUser(user: { id: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  });
}

describe('/api/portfolio/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockSupabaseUser(null);

    const response = await GET(new Request('http://localhost/api/portfolio/export'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 404 when profile export data is unavailable', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/portfolio/export'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Profile not found');
    expect(generateTrustPdf).not.toHaveBeenCalled();
  });

  it('returns a non-empty PDF response with expected headers', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Builder',
        bio: 'Bio',
        contactEmail: 'jane@example.com',
      },
      signals: {
        identity: { verified: true, method: 'veriff', verifiedAt: '2026-01-01' },
        workEmail: { verified: true },
        linkedin: { confidence: 91, hasVerificationBadge: true },
        proofs: { count: 2 },
        verifications: { count: 1 },
        badges: [],
        activeIssues: [],
      },
      skills: [{ id: 'skill-1', name: 'Next.js', level: 5 }],
      proofPacks: [
        {
          id: 'pack-1',
          scope: 'owner_full',
          title: 'Launch delivery proof record',
          summary: 'Delivered a launch-critical workflow.',
          ownershipStatement: 'Owned the launch workflow.',
          evidenceSummary: 'Reviewed against a launch runbook.',
          outcomesSummary: 'Shipped a proof-first MVP launch flow.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this proof record.',
          freshnessState: 'fresh',
          proofQualityScore: 0.8,
          schemaVersion: 'proof_pack/v2',
          artifactCount: 1,
          contextLabel: 'Launch delivery',
          selectedEvidence: [],
        },
      ],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: true,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: true,
      },
    });
    (generateTrustPdf as any).mockResolvedValue(Buffer.from('%PDF-1.4 test-pdf-content'));
    (emitPortfolioPdfExportSucceeded as any).mockResolvedValue(undefined);

    const response = await GET(new Request('http://localhost/api/portfolio/export'));
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('proofound-trust.pdf');
    expect(Number(response.headers.get('content-length'))).toBeGreaterThan(0);
    expect(bytes.length).toBeGreaterThan(0);
    expect(emitPortfolioPdfExportSucceeded).toHaveBeenCalledWith('user-1', {
      source: 'portfolio_export_route',
      handle: 'jane',
    });
  });

  it('still returns PDF when analytics emission fails', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Builder',
      },
      signals: {
        identity: { verified: true, method: 'veriff', verifiedAt: '2026-01-01' },
        workEmail: { verified: true },
        linkedin: { confidence: 91, hasVerificationBadge: true },
        proofs: { count: 2 },
        verifications: { count: 1 },
        badges: [],
        activeIssues: [],
      },
      skills: [],
      proofPacks: [
        {
          id: 'pack-1',
          scope: 'owner_full',
          title: 'Launch delivery proof record',
          summary: 'Delivered a launch-critical workflow.',
          ownershipStatement: 'Owned the launch workflow.',
          evidenceSummary: 'Reviewed against a launch runbook.',
          outcomesSummary: 'Shipped a proof-first MVP launch flow.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this proof record.',
          freshnessState: 'fresh',
          proofQualityScore: 0.8,
          schemaVersion: 'proof_pack/v2',
          artifactCount: 1,
          contextLabel: 'Launch delivery',
          selectedEvidence: [],
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
    (generateTrustPdf as any).mockResolvedValue(Buffer.from('%PDF-1.4 test-pdf-content'));
    (emitPortfolioPdfExportSucceeded as any).mockRejectedValue(new Error('analytics down'));

    const response = await GET(new Request('http://localhost/api/portfolio/export'));
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(bytes.length).toBeGreaterThan(0);

    await Promise.resolve();
    expect(log.error).toHaveBeenCalledWith('portfolio.export.analytics_failed', {
      error: expect.any(Error),
    });
  });

  it('returns canonical JSON when format=json is requested', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Builder',
      },
      publication: {
        requestedState: 'public_link_only',
        effectiveState: 'public_link_only',
        searchIndexingEnabled: false,
      },
      signals: {
        identity: { verified: true },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'verified' },
        proofs: { count: 1 },
        verifications: { count: 1 },
        badges: [],
        activeIssues: [],
      },
      skills: [],
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

    const response = await GET(new Request('http://localhost/api/portfolio/export?format=json'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      profile: { handle: 'jane' },
    });
    expect(generateTrustPdf).not.toHaveBeenCalled();
  });

  it('returns text export when format=text is requested', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Builder',
      },
      publication: {
        requestedState: 'public_link_only',
        effectiveState: 'public_link_only',
        searchIndexingEnabled: false,
      },
      signals: {
        identity: { verified: true },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'verified' },
        proofs: { count: 1 },
        verifications: { count: 1 },
        badges: [],
        activeIssues: [],
      },
      skills: [],
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

    const response = await GET(new Request('http://localhost/api/portfolio/export?format=text'));

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toContain('Selected proof records:');
    expect(generateTrustPdf).not.toHaveBeenCalled();
  });

  it('returns a format-neutral error when text export generation fails', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Builder',
      },
      signals: {
        identity: { verified: true },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'verified' },
        proofs: { count: 1 },
        verifications: { count: 1 },
        badges: [],
        activeIssues: [],
      },
      skills: [],
      proofPacks: [],
      visibility: undefined,
    });

    const response = await GET(new Request('http://localhost/api/portfolio/export?format=text'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to generate export' });
    expect(generateTrustPdf).not.toHaveBeenCalled();
    expect(emitLaunchTrace).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: 'success',
        state: 'portfolio_export_ready',
      })
    );
    expect(emitLaunchTrace).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: 'failure',
        state: 'portfolio_export_failed',
      })
    );
    expect(log.error).toHaveBeenCalledWith('portfolio.export.failed', {
      error: expect.any(Error),
    });
  });
});
