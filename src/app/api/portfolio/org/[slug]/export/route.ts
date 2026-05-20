import { NextResponse } from 'next/server';
import { getCanonicalActiveOrgMembership } from '@/lib/api/auth';
import { createClient } from '@/lib/supabase/server';
import { authorize, type OrgRole } from '@/lib/authz';
import { fetchOrganizationTrustExportData } from '@/lib/portfolio/export-data';
import {
  resolvePortfolioExportFormat,
  respondWithJson,
  respondWithPdf,
  respondWithText,
} from '@/lib/portfolio/export-response';
import { generateOrganizationProfilePdf } from '@/lib/portfolio/pdf';
import { buildOrganizationTextPack } from '@/lib/portfolio/text-pack';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
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

    const membership = await getCanonicalActiveOrgMembership(supabase, user.id, organization.id);
    const orgRole = (membership?.role as OrgRole | null) ?? null;
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
        state: 'org_export_trust_page_unavailable',
        failureClass: 'organization_trust_page_unavailable',
      });
      return NextResponse.json({ error: 'Organization trust page unavailable' }, { status: 404 });
    }

    const format = resolvePortfolioExportFormat(request);

    if (format === 'json') {
      emitLaunchTrace(trace, {
        outcome: 'success',
        state: 'organization_export_ready',
        details: {
          orgSlug: data.organization.slug,
          format,
        },
      });
      return respondWithJson(data, `proofound-org-${data.organization.slug}.json`);
    }

    if (format === 'text') {
      const text = buildOrganizationTextPack(data);
      emitLaunchTrace(trace, {
        outcome: 'success',
        state: 'organization_export_ready',
        details: {
          orgSlug: data.organization.slug,
          format,
        },
      });
      return respondWithText(text, `proofound-org-${data.organization.slug}.txt`);
    }

    const buffer = await generateOrganizationProfilePdf({
      organization: {
        displayName: data.organization.displayName,
        slug: data.organization.slug,
        verifiedDomainPath: data.organization.verifiedDomainPath,
        mission: data.organization.mission,
        whyWorkMatters: data.organization.whyWorkMatters,
        operatingContext: data.organization.operatingContext,
        website: data.organization.website,
        verified: data.organization.verified,
        shareUrl: data.shareUrl,
      },
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
    return respondWithPdf(bytes, `proofound-org-${exportedSlug}.pdf`);
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
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
