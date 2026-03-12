import { NextResponse } from 'next/server';
import { buildTextPack } from '@/lib/portfolio/text-pack';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const access = await resolvePublicIndividualPortfolioAccessByHandle(handle);

    if (access.status !== 'accessible') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const data = access.projection.exportData;
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
