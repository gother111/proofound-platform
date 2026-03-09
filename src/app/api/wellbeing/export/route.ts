import { NextRequest, NextResponse } from 'next/server';

import { requireApiAuthContext } from '@/lib/auth';
import { buildZenExport, buildZenCheckinsCsv, recordZenAuditEvent } from '@/lib/zen/service';

export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user } = authContext;
    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_export_requested',
      routeSource: '/api/wellbeing/export',
      metadata: {
        format: request.nextUrl.searchParams.get('format') || 'json',
      },
    });

    const exportPayload = await buildZenExport(user.id);
    const format = request.nextUrl.searchParams.get('format') || 'json';

    await recordZenAuditEvent({
      userId: user.id,
      eventType: 'zen_export_completed',
      routeSource: '/api/wellbeing/export',
      metadata: {
        format,
        checkin_count: exportPayload.checkins.length,
        reflection_count: exportPayload.reflections.length,
      },
    });

    if (format === 'checkins_csv') {
      return new NextResponse(
        buildZenCheckinsCsv(
          exportPayload.checkins.map((checkin) => ({
            id: checkin.id,
            stressLevel: checkin.stressLevel,
            controlLevel: checkin.controlLevel,
            milestoneTriggerId: checkin.milestoneType,
            createdAt: new Date(checkin.createdAt),
          }))
        ),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="proofound-zen-checkins-${new Date().toISOString().slice(0, 10)}.csv"`,
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="proofound-zen-export-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('wellbeing.export.failed', error);
    return NextResponse.json({ error: 'Failed to export Zen data' }, { status: 500 });
  }
}
