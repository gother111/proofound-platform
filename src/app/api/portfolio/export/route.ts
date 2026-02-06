import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchTrustExportData } from '@/lib/portfolio/export-data';
import { generateTrustPdf } from '@/lib/portfolio/pdf';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await fetchTrustExportData(supabase, user.id);
    if (!data) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/${data.profile.handle}`;

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
      skills: data.skills.map((s) => ({ name: s.name, level: s.level })),
      visibility: data.visibility,
    });

    // NextResponse's BodyInit typing doesn't accept Node.js Buffer directly.
    // Convert to an ArrayBuffer-backed Uint8Array.
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    const bytes = new Uint8Array(arrayBuffer);

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="proofound-trust.pdf"',
        'Content-Length': bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('portfolio export failed', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
