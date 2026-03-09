import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

async function getProfileByHandle(handle: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle();
  return data?.id as string | undefined;
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 });

    const profileId = await getProfileByHandle(handle);
    if (!profileId) return NextResponse.json({ error: 'profile not found' }, { status: 404 });

    const properties = { handle };

    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        entity_type,
        entity_id,
        properties,
        created_at
      ) VALUES (
        'profile_viewed',
        ${profileId},
        'profile',
        ${profileId},
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
  if (!searchParams.get('handle')) {
    return NextResponse.json({ error: 'handle required' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'Owner-facing public portfolio view counts are not available in MVP.' },
    { status: 410 }
  );
}
