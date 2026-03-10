import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, Building2, Globe2, ShieldCheck } from 'lucide-react';

import { PublicProfileEmptyState } from '@/components/public-profile/PublicProfileEmptyState';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getHistoricalOrganizationPublicSlugRedirect,
  getPublicOrganizationPortfolioProjectionBySlug,
} from '@/lib/portfolio/public-projection';
import {
  buildPortfolioRobots,
  isAccessiblePublicPortfolioState,
} from '@/lib/portfolio/public-contract';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';
import {
  buildBreadcrumbJsonLd,
  buildProofoundWebsiteJsonLd,
  buildPublicOrganizationPortfolioJsonLd,
  buildWebPageJsonLd,
} from '@/lib/seo/json-ld';
import { createClient } from '@/lib/supabase/server';

import { ShareLinkButton } from '../../[handle]/ShareLinkButton';
import { ViewCounterClient } from '../../[handle]/ViewCounterClient';
import { DownloadOrganizationPdfButton } from './DownloadOrganizationPdfButton';

function renderUnavailablePage(slug: string) {
  return (
    <PublicProfileShell
      maxWidthClassName="max-w-4xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span>proofound.io/portfolio/org/{slug}</span>
          <span>Organization portfolio unavailable</span>
        </div>
      }
    >
      <PublicProfileSection title="Organization portfolio unavailable">
        <PublicProfileEmptyState message="This organization link is unavailable. It may be hidden, retired, or not yet ready for public sharing." />
      </PublicProfileSection>
    </PublicProfileShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicOrganizationPortfolioProjectionBySlug(slug);

  if (!data || !isAccessiblePublicPortfolioState(data.effectiveState)) {
    return buildUnavailablePublicProfileMetadata(`/portfolio/org/${encodeURIComponent(slug)}`);
  }

  return buildPublicProfileMetadata({
    title: data.metadata.title,
    description: data.metadata.description,
    path: data.metadata.path,
    ogTitle: data.metadata.ogTitle,
    ogDescription: data.metadata.ogDescription,
    robots: buildPortfolioRobots(data.effectiveState),
  });
}

export default async function OrganizationPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnPath = sanitizeReturnPath(resolvedSearchParams.returnTo, '/');
  const returnLabel = returnPath.startsWith('/app/') ? 'Return to menu' : 'Return home';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const data = await getPublicOrganizationPortfolioProjectionBySlug(slug);

  if (!data) {
    const redirectTarget = await getHistoricalOrganizationPublicSlugRedirect(slug);
    if (redirectTarget && redirectTarget !== slug) {
      const redirectData = await getPublicOrganizationPortfolioProjectionBySlug(redirectTarget);
      if (redirectData && isAccessiblePublicPortfolioState(redirectData.effectiveState)) {
        permanentRedirect(`/portfolio/org/${encodeURIComponent(redirectTarget)}`);
      }

      return renderUnavailablePage(slug);
    }
    notFound();
  }

  if (!isAccessiblePublicPortfolioState(data.effectiveState)) {
    return renderUnavailablePage(slug);
  }

  const membershipResult = user?.id
    ? await supabase
        .from('organization_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('org_id', data.organizationId)
        .eq('user_id', user.id)
        .eq('status', 'active')
    : { count: 0 };

  const viewerIsMember = Boolean(membershipResult.count && membershipResult.count > 0);
  const trustSignals = data.verificationSummary.publicBadges
    .filter((badge) => badge.key === 'domain_confirmed' || badge.key === 'platform_reviewed')
    .map((badge) => badge.label)
    .slice(0, 2);

  if (trustSignals.length === 0) {
    if (data.organization.verified || data.organization.trust_status === 'platform_reviewed') {
      trustSignals.push('Platform reviewed');
    }
    if (
      data.organization.website_verified_at ||
      data.organization.trust_status === 'domain_verified'
    ) {
      trustSignals.push('Domain verified');
    }
  }

  const pagePath = `/portfolio/org/${encodeURIComponent(data.slug)}`;
  const jsonLdItems = [
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({
      path: pagePath,
      title: `${data.publicDisplayName} | Proofound Organization Portfolio`,
      description: data.jsonLd.description,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: data.publicDisplayName, path: pagePath },
    ]),
    buildPublicOrganizationPortfolioJsonLd({
      path: pagePath,
      name: data.publicDisplayName,
      description: data.jsonLd.description,
      operatingRegion: data.organization.operating_region,
    }),
  ];

  return (
    <PublicProfileShell
      maxWidthClassName="max-w-5xl"
      header={
        <div className="space-y-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-proofound-forest text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                      {data.publicDisplayName}
                    </h1>
                    <Badge variant="outline" className="border-[#D9D5CC] text-muted-foreground">
                      {data.effectiveState === 'public_indexable'
                        ? 'Searchable'
                        : 'Shareable by direct link'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Public organization trust card</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                {data.publicSummary ||
                  'Trust basics only. Rich company profile sections stay out of the launch path.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={returnPath} className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  {returnLabel}
                </Link>
              </Button>
              <ShareLinkButton url={data.shareUrl} />
              {viewerIsMember ? <DownloadOrganizationPdfButton slug={slug} /> : null}
              {data.organization.website ? (
                <a
                  href={data.organization.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-[#D9D5CC] bg-[#FCFBF8] px-3 py-2 text-sm text-foreground hover:border-proofound-forest/40 hover:text-proofound-forest"
                >
                  <Globe2 className="h-4 w-4" />
                  Website
                </a>
              ) : null}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span>proofound.io/portfolio/org/{slug}</span>
          <span>Minimal public trust card</span>
        </div>
      }
    >
      {!viewerIsMember ? (
        <ViewCounterClient subjectType="organization" slugOrHandle={data.slug} />
      ) : null}
      <JsonLdScripts items={jsonLdItems} idPrefix="public-org-portfolio-jsonld" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <PublicProfileSection title="Trust basics">
            <div className="space-y-3">
              <SummaryRow label="Organization" value={data.publicDisplayName} />
              <SummaryRow label="Type" value={data.organization.type || 'Not specified'} />
              <SummaryRow label="Website" value={data.organization.website || 'Not published'} />
              <SummaryRow
                label="Trust status"
                value={
                  data.verificationSummary.publicBadges.find(
                    (badge) => badge.key === 'platform_reviewed' || badge.key === 'domain_confirmed'
                  )?.label ||
                  (data.organization.verified ||
                  data.organization.trust_status === 'platform_reviewed'
                    ? 'Platform reviewed'
                    : data.organization.website_verified_at ||
                        data.organization.trust_status === 'domain_verified'
                      ? 'Domain verified'
                      : 'No active trust badge')
                }
                icon={<ShieldCheck className="h-4 w-4 text-proofound-forest" />}
              />
              {data.organization.operating_region ? (
                <SummaryRow label="Operating region" value={data.organization.operating_region} />
              ) : null}
            </div>
          </PublicProfileSection>

          <PublicProfileSection title="Purpose">
            <p className="whitespace-pre-line text-sm leading-6 text-foreground">
              {(data.visibility?.mission === 'public'
                ? data.organization.mission
                : data.organization.tagline) ||
                'A short purpose statement has not been published yet.'}
            </p>
          </PublicProfileSection>
        </div>

        <div className="space-y-4">
          <PublicProfileSection title="Durable trust signals">
            {trustSignals.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trustSignals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded-full border border-[#D9D5CC] bg-japandi-bg px-2.5 py-1 text-xs text-foreground"
                  >
                    {signal}
                  </span>
                ))}
              </div>
            ) : (
              <PublicProfileEmptyState message="Trust review has not produced a durable public signal yet." />
            )}
          </PublicProfileSection>

          <PublicProfileSection title="Active assignment">
            {data.assignment ? (
              <div className="space-y-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-sm">
                <p className="text-sm font-semibold text-foreground">
                  {data.assignment.role || 'Active assignment'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.assignment.business_value || 'Assignment summary is still being prepared.'}
                </p>
                {data.assignment.location_mode ? (
                  <p className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
                    {data.assignment.location_mode}
                  </p>
                ) : null}
              </div>
            ) : (
              <PublicProfileEmptyState message="No active assignment yet." />
            )}
          </PublicProfileSection>
        </div>
      </div>
    </PublicProfileShell>
  );
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/40 px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
        {icon}
        <span>{value}</span>
      </p>
    </div>
  );
}
