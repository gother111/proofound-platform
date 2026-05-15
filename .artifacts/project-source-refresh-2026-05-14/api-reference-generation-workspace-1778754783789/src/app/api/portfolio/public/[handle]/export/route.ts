import { NextResponse } from 'next/server';
import {
  resolvePortfolioExportFormat,
  respondWithJson,
  respondWithPdf,
  respondWithText,
} from '@/lib/portfolio/export-response';
import { generateTrustPdf } from '@/lib/portfolio/pdf';
import { buildTextPack } from '@/lib/portfolio/text-pack';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const access = await resolvePublicIndividualPortfolioAccessByHandle(handle);
    if (access.status !== 'accessible') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const data = access.projection.exportData;
    const format = resolvePortfolioExportFormat(request);

    if (format === 'json') {
      return respondWithJson(data, `proofound-${data.profile.handle}-trust.json`);
    }

    if (format === 'text') {
      return respondWithText(buildTextPack(data), `proofound-${data.profile.handle}-trust.txt`);
    }

    const buffer = await generateTrustPdf({
      profile: {
        displayName: data.profile.displayName,
        handle: data.profile.handle,
        headline: data.profile.headline,
        bio: data.profile.bio,
        contactEmail: data.profile.contactEmail,
        shareUrl: data.shareUrl,
      },
      signals: data.signals,
      skills: data.skills.map((skill) => ({
        name: skill.name,
        level: skill.level,
      })),
      proofPacks: data.proofPacks.map((pack) => ({
        title: pack.title,
        verificationStatus: pack.verificationStatus,
        freshnessState: pack.freshnessState,
        outcomesSummary: pack.outcomesSummary,
      })),
      visibility: data.visibility,
    });

    const bytes = Uint8Array.from(buffer);
    return respondWithPdf(bytes, `proofound-${data.profile.handle}-trust.pdf`);
  } catch (error) {
    console.error('public portfolio export failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
