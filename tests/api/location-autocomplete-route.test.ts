import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/location/autocomplete/route';

describe('GET /api/location/autocomplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid query params', async () => {
    const request = new NextRequest('http://localhost/api/location/autocomplete?type=city&q=s');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid query parameters');
  });

  it('returns normalized country options', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [
        { name: { common: 'Sweden' }, cca2: 'SE' },
        { name: { common: 'Switzerland' }, cca2: 'CH' },
        { name: { common: 'Finland' }, cca2: 'FI' },
      ],
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const request = new NextRequest(
      'http://localhost/api/location/autocomplete?type=country&q=swe&limit=5'
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Sweden',
          code: 'SE',
          label: 'Sweden (SE)',
        }),
      ])
    );
  });

  it('returns normalized city options and narrows by country code', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => ({
      ok: true,
      json: async () => ({
        results: [
          {
            name: 'Stockholm',
            country: 'Sweden',
            country_code: 'SE',
            admin1: 'Stockholm',
            population: 1515017,
          },
          {
            name: 'Stockholm',
            country: 'United States',
            country_code: 'US',
            admin1: 'Maine',
            population: 282,
          },
        ],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const request = new NextRequest(
      'http://localhost/api/location/autocomplete?type=city&q=stock&countryCode=SE&limit=5'
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(String(fetchMock.mock.calls[0][0])).toContain('countryCode=SE');
    expect(body.items).toEqual([
      expect.objectContaining({
        city: 'Stockholm',
        country: 'Sweden',
        countryCode: 'SE',
        label: 'Stockholm, Sweden',
      }),
    ]);
  });

  it('returns empty items when provider fails', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('upstream failed');
    });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const request = new NextRequest(
      'http://localhost/api/location/autocomplete?type=country&q=sweden'
    );
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
  });
});
