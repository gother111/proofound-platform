import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/api/route-helpers';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { ilike, or, desc, asc, sql } from 'drizzle-orm';
import { adminListGuard } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) return guardResult;
    const { page, limit, search, sortField, sortDir } = guardResult.params;

    const offset = (page - 1) * limit;

    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(organizations.displayName, `%${search}%`),
        ilike(organizations.slug, `%${search}%`),
        ilike(organizations.legalName, `%${search}%`)
      );
    }

    const orderBy =
      sortField === 'displayName'
        ? sortDir === 'desc'
          ? desc(organizations.displayName)
          : asc(organizations.displayName)
        : sortDir === 'desc'
          ? desc(organizations.createdAt)
          : asc(organizations.createdAt);

    const orgsQuery = db
      .select()
      .from(organizations)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(orderBy);

    const [orgs, countResult] = await Promise.all([
      orgsQuery,
      db.select({ count: sql<number>`count(*)` }).from(organizations).where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      organizations: orgs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      {
      error: 'Failed to fetch organizations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

