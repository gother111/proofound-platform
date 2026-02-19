/**
 * Deprecated matching profile adapter.
 *
 * Canonical endpoint: /api/core/matching/matching-profile
 */

import { NextRequest } from 'next/server';
import {
  GET as getCanonicalMatchingProfile,
  PUT as putCanonicalMatchingProfile,
} from '@/app/api/core/matching/matching-profile/route';
import { addDeprecationHeaders } from '@/lib/api/deprecation';

const CanonicalPath = '/api/core/matching/matching-profile';

export async function GET() {
  const response = await getCanonicalMatchingProfile();
  return addDeprecationHeaders(response, CanonicalPath);
}

export async function PUT(request: NextRequest) {
  const response = await putCanonicalMatchingProfile(request);
  return addDeprecationHeaders(response, CanonicalPath);
}
