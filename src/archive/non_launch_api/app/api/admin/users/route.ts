import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/api/route-helpers';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { ilike, or, desc, asc, sql, eq, and } from 'drizzle-orm';
import { adminListGuard } from '@/app/api/admin/_utils';

export async function GET(request: NextRequest) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) return guardResult;
    const { page, limit, search, sortField, sortDir } = guardResult.params;

    const offset = (page - 1) * limit;

    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(profiles.displayName, `%${search}%`),
        ilike(profiles.handle, `%${search}%`)
      );
    }

    const orderBy =
      sortField === 'displayName'
        ? sortDir === 'desc'
          ? desc(profiles.displayName)
          : asc(profiles.displayName)
        : sortDir === 'desc'
          ? desc(profiles.createdAt)
          : asc(profiles.createdAt);

    const usersQuery = db
      .select()
      .from(profiles)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const [users, countResult] = await Promise.all([
      usersQuery,
      db
        .select({ count: sql<number>`count(*)` })
        .from(profiles)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
