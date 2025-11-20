import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { ilike, or, desc, asc, sql, eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requirePlatformAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDir = searchParams.get('sortDir') || 'desc';

    const offset = (page - 1) * limit;

    let whereClause = eq(profiles.deleted, false);
    if (search) {
      whereClause = and(
        eq(profiles.deleted, false),
        or(
          ilike(profiles.displayName, `%${search}%`),
          ilike(profiles.handle, `%${search}%`)
        )
      )!;
    }

    let orderBy = desc(profiles.createdAt);
    if (sortField === 'displayName') {
      orderBy = sortDir === 'desc' ? desc(profiles.displayName) : asc(profiles.displayName);
    } else if (sortField === 'createdAt') {
      orderBy = sortDir === 'desc' ? desc(profiles.createdAt) : asc(profiles.createdAt);
    }

    const usersQuery = db
      .select()
      .from(profiles)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const [users, countResult] = await Promise.all([
      usersQuery,
      db.select({ count: sql<number>`count(*)` }).from(profiles).where(whereClause),
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
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

