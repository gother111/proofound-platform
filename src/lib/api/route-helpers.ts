import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminUser } from '@/lib/auth/admin';

// Standardized JSON error helper to keep API responses consistent
export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status }
  );
}

// Core parser for pagination/search/sort (pure; testable without NextRequest)
export function parsePagination(searchParams: URLSearchParams, opts?: { maxLimit?: number }) {
  const schema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(opts?.maxLimit ?? 100)
      .default(10),
    search: z.string().trim().optional().default(''),
    sortField: z.string().trim().optional().default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  });

  return schema.safeParse(Object.fromEntries(searchParams.entries()));
}

// Parse pagination/search/sort params with safe defaults and caps from NextRequest
export function parsePaginationParams(request: NextRequest, opts?: { maxLimit?: number }) {
  return parsePagination(request.nextUrl.searchParams, opts);
}

// Require platform admin and return JSON 401/403 instead of redirects
export async function requirePlatformAdminJson() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return jsonError('Unauthorized', 401);
  }
  if (adminUser.adminLevel !== 'platform_admin' && adminUser.adminLevel !== 'super_admin') {
    return jsonError('Forbidden', 403);
  }
  return adminUser;
}

