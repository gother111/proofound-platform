import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!searchParams.get('slugOrHandle') && !searchParams.get('handle')) {
    return NextResponse.json({ error: 'slugOrHandle required' }, { status: 400 });
  }

  return NextResponse.json(
    { error: 'Public portfolio view counters are not available in MVP.' },
    { status: 410 }
  );
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
