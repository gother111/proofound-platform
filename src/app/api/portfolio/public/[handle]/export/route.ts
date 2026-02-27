import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchPublicTrustExportDataByHandle } from '@/lib/portfolio/export-data';
import { generateTrustPdf } from '@/lib/portfolio/pdf';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params;
    const supabase = await createClient();

    const data = await fetchPublicTrustExportDataByHandle(supabase, handle);
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/${encodeURIComponent(
      data.profile.handle
    )}`;

    const buffer = await generateTrustPdf({
      profile: {
        displayName: data.profile.displayName,
        handle: data.profile.handle,
        headline: data.profile.headline,
        bio: data.profile.bio,
        contactEmail: data.profile.contactEmail,
        shareUrl,
      },
      signals: data.signals,
      skills: data.skills.map((skill) => ({
        name: skill.name,
        level: skill.level,
      })),
      visibility: data.visibility,
    });

    const bytes = Uint8Array.from(buffer);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proofound-${data.profile.handle}-trust.pdf"`,
        'Content-Length': bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('public portfolio export failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
