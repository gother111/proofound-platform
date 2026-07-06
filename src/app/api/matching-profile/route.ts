import { NextRequest } from 'next/server';
import {
  GET as getMatchingProfile,
  PUT as putMatchingProfile,
} from '@/app/api/core/matching/matching-profile/handler';

export { dynamic } from '@/app/api/core/matching/matching-profile/handler';

export async function GET(request: NextRequest) {
  return getMatchingProfile(request);
}

export async function PUT(request: NextRequest) {
  return putMatchingProfile(request);
}
