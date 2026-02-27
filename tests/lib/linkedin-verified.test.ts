import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchLinkedInIdentityMe,
  fetchLinkedInVerificationReport,
  resolveHasLinkedInIdentityVerification,
  resolveHasLinkedInWorkplaceVerification,
} from '@/lib/linkedin-verified';

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
};

const fetchMock = vi.fn<(...args: unknown[]) => Promise<MockResponse>>();

function okJson(payload: unknown): MockResponse {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  };
}

describe('linkedin-verified helpers', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    delete process.env.LINKEDIN_API_VERSION;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('treats GOVERNMENT_ID labels as identity verification', () => {
    const result = resolveHasLinkedInIdentityVerification({
      apiReport: {
        verifications: ['WORKPLACE', 'GOVERNMENT_ID'],
      },
    });

    expect(result).toBe(true);
  });

  it('does not treat WORKPLACE-only verification as identity verification', () => {
    const result = resolveHasLinkedInIdentityVerification({
      apiReport: {
        verifications: ['WORKPLACE'],
      },
    });

    expect(result).toBe(false);
  });

  it('detects WORKPLACE labels as workplace verification', () => {
    const result = resolveHasLinkedInWorkplaceVerification({
      apiReport: {
        verifications: ['WORKPLACE'],
      },
    });

    expect(result).toBe(true);
  });

  it('extracts profile URL from identityMe.basicInfo', async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({
        id: 'member-1',
        basicInfo: {
          profileUrl: 'https://www.linkedin.com/profile-thirdparty-redirect/abc',
          publicIdentifier: 'yurii-bakurov',
        },
      })
    );

    const result = await fetchLinkedInIdentityMe('token');

    expect(result.profileUrl).toBe('https://www.linkedin.com/profile-thirdparty-redirect/abc');
    expect(result.publicIdentifier).toBe('yurii-bakurov');
    expect(result.memberUrn).toBe('member-1');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.linkedin.com/rest/identityMe',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          'LinkedIn-Version': '202510',
        }),
      })
    );
  });

  it('detects identity signal from verification report labels', async () => {
    fetchMock.mockResolvedValueOnce(
      okJson({
        verifications: ['IDENTITY'],
      })
    );

    const result = await fetchLinkedInVerificationReport('token');

    expect(result.verifications).toEqual(['IDENTITY']);
    expect(result.hasIdentityVerification).toBe(true);
    expect(result.hasWorkplaceVerification).toBe(false);
  });
});
