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

    await db.execute(sql`
      INSERT INTO analytics_events (
        event_type,
        user_id,
        profile_id,
        entity_type,
        entity_id,
        properties,
        privacy_partition,
        occurred_at
      ) VALUES (
        'profile_viewed',
        ${profileId},
        ${profileId},
        'profile',
        ${profileId},
        ${sql.raw(`'{"handle":"${handle}"}'`)},
        'default',
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
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    if (!handle) return NextResponse.json({ error: 'handle required' }, { status: 400 });

    const profileId = await getProfileByHandle(handle);
    if (!profileId) return NextResponse.json({ error: 'profile not found' }, { status: 404 });

    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'profile_viewed'
        AND profile_id = ${profileId}
    `);

    const count = parseInt((result[0] as any)?.count || '0');
    return NextResponse.json({ count });
  } catch (error) {
    console.error('view count failed', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}
