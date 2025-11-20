import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { organizations } from '@/db/schema';
import { ilike, or, desc, asc, sql } from 'drizzle-orm';

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

    let whereClause = undefined;
    if (search) {
      whereClause = or(
        ilike(organizations.displayName, `%${search}%`),
        ilike(organizations.slug, `%${search}%`),
        ilike(organizations.legalName, `%${search}%`)
      );
    }

    let orderBy = desc(organizations.createdAt);
    if (sortField === 'displayName') {
      orderBy = sortDir === 'desc' ? desc(organizations.displayName) : asc(organizations.displayName);
    } else if (sortField === 'createdAt') {
      orderBy = sortDir === 'desc' ? desc(organizations.createdAt) : asc(organizations.createdAt);
    }

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
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }
}

