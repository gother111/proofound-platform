import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPublicTrustExportDataByHandle } from '@/lib/portfolio/export-data';
import { buildTextPack } from '@/lib/portfolio/text-pack';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const supabase = await createClient();
    const data = await fetchPublicTrustExportDataByHandle(supabase, handle);

    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const text = buildTextPack(data);
    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('public text pack failed', error);
    return NextResponse.json({ error: 'Failed to build summary' }, { status: 500 });
  }
}
