import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { computeSkillGaps } from '@/lib/skills/gap-service';

export const dynamic = 'force-dynamic';

/**
 * Compatibility endpoint.
 *
 * Canonical gap endpoint is /api/skill-gaps. This route keeps legacy callers
 * functioning while returning data from the canonical service.
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = authContext;
    const params = request.nextUrl.searchParams;
    const roleFilter = params.get('role') || undefined;
    const timeframe = Number(params.get('timeframe') ?? 180);
    const timeframeDays = Number.isFinite(timeframe) && timeframe > 0 ? timeframe : 180;

    const analysis = await computeSkillGaps({
      profileId: user.id,
      roleFilter,
      timeframeDays,
      supabase,
    });

    const catIds = Array.from(new Set(analysis.gaps.map((gap) => gap.catId).filter(Boolean)));
    const subcatIds = Array.from(new Set(analysis.gaps.map((gap) => gap.subcatId).filter(Boolean)));
    const l3Ids = Array.from(new Set(analysis.gaps.map((gap) => gap.l3Id).filter(Boolean)));

    const [{ data: l1Rows }, { data: l2Rows }, { data: l3Rows }, { count: totalSkills }] =
      await Promise.all([
        catIds.length
          ? supabase.from('skills_categories').select('cat_id, name_i18n').in('cat_id', catIds)
          : Promise.resolve({ data: [] as any[] }),
        subcatIds.length
          ? supabase
              .from('skills_subcategories')
              .select('cat_id, subcat_id, name_i18n')
              .in('subcat_id', subcatIds)
          : Promise.resolve({ data: [] as any[] }),
        l3Ids.length
          ? supabase
              .from('skills_l3')
              .select('cat_id, subcat_id, l3_id, name_i18n')
              .in('l3_id', l3Ids)
          : Promise.resolve({ data: [] as any[] }),
        supabase
          .from('skills')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', user.id),
      ]);

    const l1Map = new Map(
      (l1Rows || []).map((row) => [row.cat_id, row.name_i18n?.en || 'Unknown'])
    );
    const l2Map = new Map(
      (l2Rows || []).map((row) => [
        `${row.cat_id}-${row.subcat_id}`,
        row.name_i18n?.en || 'Unspecified',
      ])
    );
    const l3Map = new Map(
      (l3Rows || []).map((row) => [
        `${row.cat_id}-${row.subcat_id}-${row.l3_id}`,
        row.name_i18n?.en || 'Unspecified',
      ])
    );

    const legacyGaps = analysis.gaps.map((gap) => {
      const l1 = gap.catId ? l1Map.get(gap.catId) || 'Unknown' : 'Unknown';
      const l2 =
        gap.catId && gap.subcatId
          ? l2Map.get(`${gap.catId}-${gap.subcatId}`) || 'Unspecified'
          : 'Unspecified';
      const l3 =
        gap.catId && gap.subcatId && gap.l3Id
          ? l3Map.get(`${gap.catId}-${gap.subcatId}-${gap.l3Id}`) || 'Unspecified'
          : 'Unspecified';

      return {
        skillCode: gap.skillCode,
        skillName: gap.skillName,
        l1,
        l2,
        l3,
        importance: gap.importance,
        currentLevel: gap.currentLevel,
        targetLevel: gap.targetLevel,
        gap: gap.gap,
        relatedRoles: Array.from(
          new Set(gap.assignments.map((assignment) => assignment.role).filter(Boolean))
        ) as string[],
      };
    });

    const response = NextResponse.json({
      gaps: legacyGaps,
      totalSkills: totalSkills || 0,
      analyzedRoles: Array.from(
        new Set(analysis.assignments.map((assignment) => assignment.role).filter(Boolean))
      ),
      canonicalEndpoint: '/api/skill-gaps',
    });

    response.headers.set('X-Proofound-Deprecated', 'true');
    response.headers.set('X-Proofound-Canonical', '/api/skill-gaps');
    return response;
  } catch (error) {
    console.error('Error in expertise gap-analysis compatibility route', error);
    return NextResponse.json(
      { error: 'Failed to analyze skill gaps' },
      { status: 500, headers: { 'X-Proofound-Deprecated': 'true' } }
    );
  }
}
