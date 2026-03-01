import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 8;
const COUNTRY_REVALIDATE_SECONDS = 60 * 60 * 24;

const QuerySchema = z
  .object({
    type: z.enum(['country', 'city']),
    q: z.string().trim().min(1).max(120),
    countryCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/)
      .optional(),
    limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'city' && value.q.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'City search requires at least 2 characters',
        path: ['q'],
      });
    }
  });

interface CountryItem {
  name: string;
  code: string;
  label: string;
}

interface CityItem {
  city: string;
  country: string;
  countryCode: string;
  admin1: string | null;
  population: number;
  label: string;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function scoreByQuery(value: string, query: string) {
  const normalizedValue = normalizeText(value);
  const normalizedQuery = normalizeText(query);

  if (!normalizedValue || !normalizedQuery) return 0;
  if (normalizedValue === normalizedQuery) return 300;
  if (normalizedValue.startsWith(normalizedQuery)) return 200;
  if (normalizedValue.includes(normalizedQuery)) return 100;
  return 0;
}

async function fetchCountryItems(query: string, limit: number): Promise<CountryItem[]> {
  const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2', {
    next: { revalidate: COUNTRY_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Country provider failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    name?: { common?: string };
    cca2?: string;
  }>;

  const items = payload
    .map((row) => ({
      name: row.name?.common?.trim() || '',
      code: row.cca2?.trim().toUpperCase() || '',
    }))
    .filter((row) => row.name.length > 0 && row.code.length === 2)
    .map((row) => ({
      ...row,
      score: Math.max(scoreByQuery(row.name, query), scoreByQuery(row.code, query)),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name, 'en');
    })
    .slice(0, limit)
    .map((row) => ({
      name: row.name,
      code: row.code,
      label: `${row.name} (${row.code})`,
    }));

  return items;
}

async function fetchCityItems(
  query: string,
  countryCode: string | undefined,
  limit: number
): Promise<CityItem[]> {
  const params = new URLSearchParams({
    name: query,
    count: String(Math.min(limit * 5, 50)),
    language: 'en',
    format: 'json',
  });

  if (countryCode) {
    params.set('countryCode', countryCode.toUpperCase());
  }

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`City provider failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: Array<{
      name?: string;
      country?: string;
      country_code?: string;
      admin1?: string;
      population?: number;
      feature_code?: string;
    }>;
  };

  const dedupedByKey = new Map<string, CityItem>();
  const results = Array.isArray(payload.results) ? payload.results : [];

  for (const result of results) {
    const city = result.name?.trim() || '';
    const country = result.country?.trim() || '';
    const code = result.country_code?.trim().toUpperCase() || '';

    if (!city || !country || code.length !== 2) {
      continue;
    }

    if (countryCode && code !== countryCode.toUpperCase()) {
      continue;
    }

    const key = `${city.toLowerCase()}::${code}`;
    const nextItem: CityItem = {
      city,
      country,
      countryCode: code,
      admin1: result.admin1?.trim() || null,
      population: Number(result.population) || 0,
      label: `${city}, ${country}`,
    };

    const existing = dedupedByKey.get(key);
    if (!existing || existing.population < nextItem.population) {
      dedupedByKey.set(key, nextItem);
    }
  }

  return Array.from(dedupedByKey.values())
    .sort((a, b) => {
      if (b.population !== a.population) return b.population - a.population;
      if (a.country !== b.country) return a.country.localeCompare(b.country, 'en');
      return a.city.localeCompare(b.city, 'en');
    })
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    type: request.nextUrl.searchParams.get('type'),
    q: request.nextUrl.searchParams.get('q') ?? '',
    countryCode: request.nextUrl.searchParams.get('countryCode') ?? undefined,
    limit: request.nextUrl.searchParams.get('limit') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { type, q, countryCode, limit } = parsed.data;

  try {
    if (type === 'country') {
      const items = await fetchCountryItems(q, limit);
      return NextResponse.json({ items });
    }

    const items = await fetchCityItems(q, countryCode, limit);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
