import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

type PublicSubjectType = 'individual_profile' | 'organization';

async function getSubjectBySlugOrHandle(subjectType: PublicSubjectType, slugOrHandle: string) {
  const supabase = await createClient();
  if (subjectType === 'organization') {
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slugOrHandle)
      .maybeSingle();
    return data?.id as string | undefined;
  }

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', slugOrHandle)
    .maybeSingle();
  return data?.id as string | undefined;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSubjectType = searchParams.get('subjectType');
    const subjectType: PublicSubjectType =
      rawSubjectType === 'organization' ? 'organization' : 'individual_profile';
    const slugOrHandle = searchParams.get('slugOrHandle') || searchParams.get('handle');
    if (!slugOrHandle) {
      return NextResponse.json({ error: 'slugOrHandle required' }, { status: 400 });
    }

    const subjectId = await getSubjectBySlugOrHandle(subjectType, slugOrHandle);
    if (!subjectId) {
      return NextResponse.json({ error: 'public portfolio not found' }, { status: 404 });
    }

    const properties = {
      subject_type: subjectType,
      source: 'public_portfolio_page',
      slug_or_handle: slugOrHandle,
      viewer_context: 'external_public_viewer',
    };

    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        entity_type,
        entity_id,
        properties,
        created_at
      ) VALUES (
        'public_portfolio_viewed',
        NULL,
        'page',
        ${subjectId},
        ${JSON.stringify(properties)}::jsonb,
        NOW()
      )
    `);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('view increment failed', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get('slugOrHandle') && !searchParams.get('handle')) {
    return NextResponse.json({ error: 'slugOrHandle required' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'Owner-facing public portfolio view counts are not available in MVP.' },
    { status: 410 }
  );
}
