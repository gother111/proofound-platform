import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonError, parsePaginationParams, requirePlatformAdminJson } from '@/lib/api/route-helpers';

// Shared helper to enforce platform/super admin and parse pagination/search/sort safely
export async function adminListGuard(request: NextRequest) {
  const adminUser = await requirePlatformAdminJson();
  if (adminUser instanceof NextResponse) return adminUser;

  const parsed = parsePaginationParams(request, { maxLimit: 100 });
  if (!parsed.success) {
    return jsonError('Invalid query parameters', 400, parsed.error.flatten());
  }

  return { adminUser, params: parsed.data };
}

// Basic schema for simple ID payloads (can extend per route as needed)
export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

