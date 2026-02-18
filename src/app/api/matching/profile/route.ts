/**
 * Legacy matching profile API adapter.
 *
 * Canonical endpoint: /api/core/matching/matching-profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GET as getCanonicalMatchingProfile,
  PUT as putCanonicalMatchingProfile,
} from '@/app/api/core/matching/matching-profile/route';
import { addDeprecationHeaders } from '@/lib/api/deprecation';

const CanonicalPath = '/api/core/matching/matching-profile';

const LegacyCreateSchema = z.object({
  name: z.string().min(1).optional(),
  weights: z.record(z.number()).default({}),
  constraints: z.record(z.any()).default({}),
});

const LegacyUpdateSchema = LegacyCreateSchema.extend({
  id: z.string().optional(),
});

function toLegacyProfile(profile: any) {
  if (!profile) {
    return null;
  }

  const verified = (profile.verified || {}) as Record<string, boolean>;

  return {
    id: profile.profileId,
    name: 'Default Profile',
    weights: profile.weights || {},
    constraints: {
      requireEmailVerified: !!verified.email,
      requirePhoneVerified: !!verified.phone,
      requireProfileComplete: !!verified.profileComplete,
    },
    isActive: true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function buildCanonicalPayload(input: z.infer<typeof LegacyCreateSchema>) {
  const verified = Object.fromEntries(
    Object.entries({
      email: input.constraints?.requireEmailVerified,
      phone: input.constraints?.requirePhoneVerified,
      profileComplete: input.constraints?.requireProfileComplete,
    }).filter(([, value]) => typeof value === 'boolean')
  ) as Record<string, boolean>;

  return {
    weights: input.weights,
    verified,
  };
}

export async function GET() {
  const canonicalResponse = await getCanonicalMatchingProfile();
  const payload = await canonicalResponse.json().catch(() => null);

  if (!canonicalResponse.ok) {
    return addDeprecationHeaders(
      NextResponse.json(payload || { error: 'Failed to fetch matching profiles' }, {
        status: canonicalResponse.status,
      }),
      CanonicalPath
    );
  }

  const profile = toLegacyProfile((payload as any)?.profile);

  return addDeprecationHeaders(
    NextResponse.json({
      success: true,
      profiles: profile ? [profile] : [],
    }),
    CanonicalPath
  );
}

export async function POST(request: NextRequest) {
  const parsed = LegacyCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return addDeprecationHeaders(
      NextResponse.json(
        { error: 'Invalid profile payload', details: parsed.error.flatten() },
        { status: 400 }
      ),
      CanonicalPath
    );
  }

  const canonicalRequest = new NextRequest(request.url, {
    method: 'PUT',
    headers: request.headers,
    body: JSON.stringify(buildCanonicalPayload(parsed.data)),
  });

  const canonicalResponse = await putCanonicalMatchingProfile(canonicalRequest);
  const payload = await canonicalResponse.json().catch(() => null);

  if (!canonicalResponse.ok) {
    return addDeprecationHeaders(
      NextResponse.json(payload || { error: 'Failed to create profile' }, {
        status: canonicalResponse.status,
      }),
      CanonicalPath
    );
  }

  return addDeprecationHeaders(
    NextResponse.json(
      {
        success: true,
        profile: {
          ...toLegacyProfile((payload as any)?.profile),
          name: parsed.data.name || 'Default Profile',
          constraints: parsed.data.constraints || {},
        },
      },
      { status: 201 }
    ),
    CanonicalPath
  );
}

export async function PUT(request: NextRequest) {
  const parsed = LegacyUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return addDeprecationHeaders(
      NextResponse.json(
        { error: 'Invalid profile payload', details: parsed.error.flatten() },
        { status: 400 }
      ),
      CanonicalPath
    );
  }

  const canonicalRequest = new NextRequest(request.url, {
    method: 'PUT',
    headers: request.headers,
    body: JSON.stringify(buildCanonicalPayload(parsed.data)),
  });

  const canonicalResponse = await putCanonicalMatchingProfile(canonicalRequest);
  const payload = await canonicalResponse.json().catch(() => null);

  if (!canonicalResponse.ok) {
    return addDeprecationHeaders(
      NextResponse.json(payload || { error: 'Failed to update profile' }, {
        status: canonicalResponse.status,
      }),
      CanonicalPath
    );
  }

  return addDeprecationHeaders(
    NextResponse.json({
      success: true,
      profile: {
        ...toLegacyProfile((payload as any)?.profile),
        name: parsed.data.name || 'Default Profile',
        constraints: parsed.data.constraints || {},
      },
    }),
    CanonicalPath
  );
}
