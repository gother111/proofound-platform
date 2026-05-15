import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminJson, jsonError } from '@/lib/api/route-helpers';
import { db } from '@/db';
import { adminAuditLog, profiles } from '@/db/schema';
import { ilike, or, desc, asc, sql, eq, and, gte, lte } from 'drizzle-orm';
import { adminListGuard } from '../_utils';

export async function GET(request: NextRequest) {
  try {
    const guardResult = await adminListGuard(request);
    if (guardResult instanceof NextResponse) return guardResult;
    const { page, limit } = guardResult.params;

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const actionFilter = searchParams.get('action') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(adminAuditLog.action, `%${search}%`),
          ilike(adminAuditLog.targetType, `%${search}%`),
          ilike(profiles.displayName, `%${search}%`)
        )
      );
    }

    if (actionFilter) {
      conditions.push(eq(adminAuditLog.action, actionFilter));
    }

    if (startDate) {
      conditions.push(gte(adminAuditLog.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(adminAuditLog.createdAt, new Date(endDate)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const logsQuery = db
      .select({
        log: adminAuditLog,
        admin: {
          id: profiles.id,
          displayName: profiles.displayName,
          handle: profiles.handle,
        },
      })
      .from(adminAuditLog)
      .leftJoin(profiles, eq(adminAuditLog.adminId, profiles.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(adminAuditLog.createdAt));

    const [logs, countResult] = await Promise.all([
      logsQuery,
      db
        .select({ count: sql<number>`count(*)` })
        .from(adminAuditLog)
        .leftJoin(profiles, eq(adminAuditLog.adminId, profiles.id)) // Need join for search on admin name
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    const flattenedLogs = logs.map(({ log, admin }) => ({
      ...log,
      admin,
    }));

    return NextResponse.json({
      logs: flattenedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
