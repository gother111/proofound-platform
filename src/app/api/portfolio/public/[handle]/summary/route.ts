import { NextResponse } from 'next/server';
import { respondWithText } from '@/lib/portfolio/export-response';
import { buildTextPack } from '@/lib/portfolio/text-pack';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';
import { log } from '@/lib/log';

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
    return respondWithText(text, `proofound-${data.profile.handle}-summary.txt`);
  } catch (error) {
    log.error('portfolio.public_summary.failed', { error });
    return NextResponse.json({ error: 'Failed to build summary' }, { status: 500 });
  }
}
