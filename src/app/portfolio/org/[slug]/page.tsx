import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArrowLeft, Building2, Globe2 } from 'lucide-react';

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
      <PublicProfileSection title="Organization portfolio unavailable" titleLevel={1}>
        <PublicProfileEmptyState message="This organization link is unavailable. It may be hidden, retired, or not yet ready for public sharing." />
        <div className="mt-4">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
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
    return renderUnavailablePage(slug);
  }

  if (!isAccessiblePublicPortfolioState(data.effectiveState)) {
    return renderUnavailablePage(slug);
  }

  const assignmentSnapshot = data.assignmentSnapshot;
  const reviewSignals = [
    data.verifiedDomainPath
      ? `Verified domain path: ${data.verifiedDomainPath}`
      : 'Direct-link trust page only',
    data.organization.trust_status === 'platform_reviewed'
      ? 'Organization trust has been reviewed by Proofound.'
      : data.organization.verified
        ? 'Organization trust is verified.'
        : 'Organization trust is still in direct-link mode.',
    assignmentSnapshot
      ? 'A review-ready assignment is active, so proof review standards are already defined.'
      : 'Assignment standards are published before broader review starts.',
    'Blind-by-default review stays separate from this public page until proof-review participant consented reveal.',
  ];

  const membershipResult = user?.id
    ? await supabase
        .from('organization_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('org_id', data.organizationId)
        .eq('user_id', user.id)
        .eq('state', 'active')
    : { count: 0 };

  const viewerIsMember = Boolean(membershipResult.count && membershipResult.count > 0);

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
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-proofound-forest text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="min-w-0 break-words text-2xl font-semibold text-foreground">
                      {data.publicDisplayName}
                    </h1>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-[#D9D5CC] text-muted-foreground"
                    >
                      {data.effectiveState === 'public_indexable'
                        ? 'Indexing allowed'
                        : 'Shareable by direct link'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Public organization trust page</p>
                </div>
              </div>
              <p className="text-sm text-foreground">
                {data.publicSummary ||
                  'Trust basics only. Broad company profile sections stay out of the launch path.'}
              </p>
            </div>

            <div className="grid w-full gap-2 sm:w-auto sm:grid-flow-col sm:auto-cols-max sm:items-center lg:justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={returnPath}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {returnLabel}
                </Link>
              </Button>
              <ShareLinkButton url={data.shareUrl} className="min-h-11 w-full sm:w-auto" />
              <div className="hidden sm:contents">
                {viewerIsMember ? (
                  <DownloadOrganizationPdfButton slug={slug} className="min-h-11 sm:w-auto" />
                ) : null}
              </div>
              {data.organization.website ? (
                <a
                  href={data.organization.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 break-words rounded-md border border-[#D9D5CC] bg-[#FCFBF8] px-3 py-2 text-sm text-foreground hover:border-proofound-forest/40 hover:text-proofound-forest sm:w-auto"
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 break-words">proofound.io/portfolio/org/{slug}</span>
          <span>Minimal trust page</span>
        </div>
      }
    >
      <JsonLdScripts items={jsonLdItems} idPrefix="public-org-portfolio-jsonld" />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 space-y-4">
          <PublicProfileSection title="Mission / purpose">
            <p className="break-words whitespace-pre-line text-sm leading-6 text-foreground">
              {(data.visibility?.mission === 'public'
                ? data.organization.mission
                : data.organization.tagline) ||
                'A short purpose statement has not been published yet.'}
            </p>
          </PublicProfileSection>

          <PublicProfileSection title="What work is offered">
            <div className="min-w-0 space-y-3">
              <SummaryRow
                label="Work offered"
                value={
                  assignmentSnapshot?.role ||
                  data.organization.tagline?.trim() ||
                  'A concise statement of the work offered has not been published yet.'
                }
              />
              <SummaryRow
                label="Engagement"
                value={
                  assignmentSnapshot?.engagementType
                    ? humanizeEngagementType(assignmentSnapshot.engagementType)
                    : 'Not published'
                }
              />
              <p className="break-words whitespace-pre-line text-sm leading-6 text-foreground">
                {assignmentSnapshot?.businessValue ||
                  data.organization.tagline?.trim() ||
                  'Why this work exists has not been published yet.'}
              </p>
            </div>
          </PublicProfileSection>

          <PublicProfileSection title="Assignment clarity">
            <div className="min-w-0 space-y-3">
              <p className="break-words whitespace-pre-line text-sm leading-6 text-foreground">
                {assignmentSnapshot?.description?.trim() ||
                  data.organization.working_context?.trim() ||
                  'Assignment detail will appear here once the organization publishes it.'}
              </p>
              <SummaryRow
                label="Proof expectations"
                value={
                  assignmentSnapshot?.expectedImpact?.trim() || 'Proof expectations not published'
                }
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  Expected outcomes
                </p>
                {assignmentSnapshot?.outcomes.length ? (
                  <ul className="min-w-0 space-y-2 text-sm text-foreground">
                    {assignmentSnapshot.outcomes.map((outcome) => (
                      <li key={outcome} className="flex min-w-0 gap-2">
                        <span className="mt-1 text-proofound-forest">•</span>
                        <span className="min-w-0 break-words">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Outcome detail is not published yet.
                  </p>
                )}
              </div>
            </div>
          </PublicProfileSection>
        </div>

        <div className="min-w-0 space-y-4">
          <PublicProfileSection title="Seriousness of review">
            <div className="min-w-0 space-y-3">
              {reviewSignals.map((signal) => (
                <p
                  key={signal}
                  className="min-w-0 break-words rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-sm text-foreground shadow-sm"
                >
                  {signal}
                </p>
              ))}
            </div>
          </PublicProfileSection>

          <PublicProfileSection title="Organization basics">
            <div className="space-y-3">
              <SummaryRow label="Organization" value={data.publicDisplayName} />
              <SummaryRow
                label="Verified domain path"
                value={data.verifiedDomainPath || 'Not verified yet'}
              />
              <SummaryRow label="Website" value={data.organization.website || 'Not published'} />
              <SummaryRow
                label="Trust mode"
                value={data.organization.verified ? 'Verified' : 'Direct-link trust page'}
              />
            </div>
          </PublicProfileSection>
        </div>
      </div>
    </PublicProfileShell>
  );
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/40 bg-white/40 px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex min-w-0 items-center gap-2 text-sm text-foreground">
        {icon}
        <span className="min-w-0 break-words">{value}</span>
      </p>
    </div>
  );
}

function humanizeEngagementType(value: string) {
  switch (value) {
    case 'full_time':
      return 'Full time';
    case 'part_time':
      return 'Part time';
    case 'contract_consulting':
      return 'Contract / consulting';
    case 'fractional_project':
      return 'Fractional / project';
    default:
      return value;
  }
}
