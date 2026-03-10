import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  authorize,
  isActiveMembershipState,
  normalizeAuthorizedOrgRole,
  type OrgRole,
} from '@/lib/authz';
import { fetchOrganizationTrustExportData } from '@/lib/portfolio/export-data';
import { generateOrganizationProfilePdf } from '@/lib/portfolio/pdf';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const trace = startLaunchTrace({
    flow: 'export',
    actorType: 'anonymous',
  });

  try {
    const { slug } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'org_export_unauthorized',
        failureClass: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    trace.actorId = user.id;
    trace.actorType = 'organization_member';

    const { data: organization } = await supabase
      .from('organizations')
      .select('id, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!organization) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'org_export_org_missing',
        failureClass: 'organization_not_found',
      });
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    trace.objectRefs.orgId = organization.id;

    const { data: membership } = await supabase
      .from('organization_members')
      .select('role, state')
      .eq('org_id', organization.id)
      .eq('user_id', user.id)
      .maybeSingle();

    const orgRole = isActiveMembershipState(membership?.state)
      ? (normalizeAuthorizedOrgRole(membership?.role) as OrgRole | null)
      : null;
    const canExport = authorize({
      resource: 'exports',
      action: 'export',
      orgRole,
    }).allowed;

    if (!canExport) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'org_export_forbidden',
        failureClass: 'forbidden',
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await fetchOrganizationTrustExportData(supabase, organization.id);
    if (!data) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'org_export_profile_unavailable',
        failureClass: 'organization_profile_unavailable',
      });
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

    const exportedSlug = data.organization.slug;
    const bytes = Uint8Array.from(buffer);
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'organization_export_ready',
      details: {
        orgSlug: exportedSlug,
      },
    });
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="proofound-org-${exportedSlug}.pdf"`,
        'Content-Length': bytes.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('organization portfolio export failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
      message: error instanceof Error ? error.message : 'Unknown error',
      error,
    });
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'org_export_failed',
      failureClass: error instanceof Error ? error.message : 'organization_export_failed',
    });
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
