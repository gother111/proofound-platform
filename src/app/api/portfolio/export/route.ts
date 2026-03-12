import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchTrustExportData } from '@/lib/portfolio/export-data';
import { generateTrustPdf } from '@/lib/portfolio/pdf';
import { emitPortfolioPdfExportSucceeded } from '@/lib/analytics/events';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const trace = startLaunchTrace({
    flow: 'export',
    actorType: 'anonymous',
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'portfolio_export_unauthorized',
        failureClass: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    trace.actorId = user.id;
    trace.actorType = 'user_account';

    const data = await fetchTrustExportData(supabase, user.id);
    if (!data) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'portfolio_export_profile_missing',
        failureClass: 'profile_not_found',
      });
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    trace.objectRefs.profileId = data.profile.id;

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
      proofPacks: data.proofPacks.map((pack) => ({
        title: pack.title,
        verificationStatus: pack.verificationStatus,
        freshnessState: pack.freshnessState,
        outcomesSummary: pack.outcomesSummary,
      })),
      visibility: data.visibility,
    });

    // Copy into a fresh typed array so the response body is runtime-safe across Node environments.
    const bytes = Uint8Array.from(buffer);
    void emitPortfolioPdfExportSucceeded(user.id, {
      source: 'portfolio_export_route',
      handle: data.profile.handle,
    }).catch((analyticsError) => {
      console.error('portfolio export analytics failed', analyticsError);
    });

    const exportedHandle = data.profile.handle;
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'portfolio_export_ready',
      details: {
        handle: exportedHandle,
      },
    });

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="proofound-trust.pdf"',
        'Content-Length': bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('portfolio export failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    });
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'portfolio_export_failed',
      failureClass: error instanceof Error ? error.message : 'portfolio_export_failed',
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
