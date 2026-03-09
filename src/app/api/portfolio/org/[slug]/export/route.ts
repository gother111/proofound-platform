import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authorize, type OrgRole } from '@/lib/authz';
import { fetchOrganizationTrustExportData } from '@/lib/portfolio/export-data';
import { generateOrganizationProfilePdf } from '@/lib/portfolio/pdf';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: organization } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('org_id', organization.id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const orgRole = (membership?.role as OrgRole | undefined) ?? null;
    const canExport = authorize({
      resource: 'exports',
      action: 'export',
      orgRole,
    }).allowed;

    if (!canExport) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await fetchOrganizationTrustExportData(supabase, organization.id);
    if (!data) {
      return NextResponse.json({ error: 'Organization profile unavailable' }, { status: 404 });
    }

    const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/org/${data.organization.slug}`;

    const buffer = await generateOrganizationProfilePdf({
      organization: {
        displayName: data.organization.displayName,
        slug: data.organization.slug,
        tagline: data.organization.tagline,
        mission: data.organization.mission,
        website: data.organization.website,
        type: data.organization.type,
        verified: data.organization.verified,
        values: data.organization.values,
        causes: data.organization.causes,
        shareUrl,
      },
      metrics: data.metrics,
    });

    const bytes = Uint8Array.from(buffer);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proofound-org-${data.organization.slug}.pdf"`,
        'Content-Length': bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('organization portfolio export failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
