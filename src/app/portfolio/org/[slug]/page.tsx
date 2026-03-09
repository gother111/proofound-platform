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
  buildPortfolioRobots,
  deriveEffectivePublicPortfolioState,
  isAccessiblePublicPortfolioState,
  resolveRequestedPublicPortfolioState,
  shouldUseGenericSharePreview,
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
import { getPublicSiteUrl } from '@/lib/seo/public-metadata';
import { createClient } from '@/lib/supabase/server';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';

import { ShareLinkButton } from '../../[handle]/ShareLinkButton';
import { DownloadOrganizationPdfButton } from './DownloadOrganizationPdfButton';

type OrganizationRow = {
  id: string;
  slug: string;
  display_name: string;
  public_portfolio_state?: string | null;
  search_indexing_enabled_at?: string | null;
  trust_status?: string | null;
  trust_status_updated_at?: string | null;
  website_verified_at?: string | null;
  operating_region?: string | null;
  verified?: boolean | null;
  website?: string | null;
  tagline?: string | null;
  mission?: string | null;
  type?: string | null;
};

type AssignmentSummaryRow = {
  id: string;
  role?: string | null;
  business_value?: string | null;
  location_mode?: string | null;
};

type OrganizationVisibilityRow = {
  display_name?: string | null;
  mission?: string | null;
};

type OrgContractData = {
  organization: OrganizationRow;
  assignment: AssignmentSummaryRow | null;
  visibility: OrganizationVisibilityRow | null;
  effectiveState: ReturnType<typeof deriveEffectivePublicPortfolioState>;
  shareUrl: string;
  verificationSummary: ReturnType<typeof summarizeVerificationPolicy>;
};

const SITE_URL = getPublicSiteUrl();

function hasTrustBasics(
  organization: OrganizationRow,
  visibility: OrganizationVisibilityRow | null
) {
  return Boolean(
    organization.display_name &&
      organization.type &&
      organization.website &&
      (visibility?.mission === 'public'
        ? organization.mission?.trim()
        : organization.tagline?.trim())
  );
}

async function loadOrganizationBySlug(slug: string): Promise<OrganizationRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select(
      'id, slug, display_name, public_portfolio_state, search_indexing_enabled_at, trust_status, trust_status_updated_at, website_verified_at, operating_region, verified, website, tagline, mission, type'
    )
    .eq('slug', slug)
    .maybeSingle();

  return (data as OrganizationRow | null) ?? null;
}

async function loadHistoricalSlug(slug: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('organization_slug_history')
      .select('redirect_target_slug, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (!data || data.is_active === true) {
      return null;
    }

    return typeof data.redirect_target_slug === 'string' ? data.redirect_target_slug : null;
  } catch {
    return null;
  }
}

async function loadOrgContractData(slug: string): Promise<OrgContractData | null> {
  const supabase = await createClient();
  const organization = await loadOrganizationBySlug(slug);
  if (!organization) {
    return null;
  }

  const [visibilityResult, assignmentResult] = await Promise.all([
    supabase
      .from('organization_field_visibility')
      .select('display_name, mission')
      .eq('org_id', organization.id)
      .maybeSingle(),
    supabase
      .from('assignments')
      .select('id, role, business_value, location_mode')
      .eq('org_id', organization.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const visibility = (visibilityResult.data as OrganizationVisibilityRow | null) ?? null;
  const minimumContentMet = hasTrustBasics(organization, visibility);
  const verificationRecords = await listVerificationRecordsForOwner(
    'organization',
    organization.id
  ).catch(() => []);
  const verificationSummary = summarizeVerificationPolicy({
    records: verificationRecords,
    legacyOrganization: {
      trustStatus:
        organization.trust_status === 'unverified' ||
        organization.trust_status === 'pending' ||
        organization.trust_status === 'domain_verified' ||
        organization.trust_status === 'platform_reviewed'
          ? organization.trust_status
          : 'unverified',
      verified: organization.verified,
    },
  });
  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    searchIndexingEnabled: Boolean(organization.search_indexing_enabled_at),
    minimumContentMet,
    hasLinkOnlyContent: false,
  });

  return {
    organization,
    assignment: (assignmentResult.data as AssignmentSummaryRow | null) ?? null,
    visibility,
    effectiveState,
    shareUrl: `${SITE_URL}/portfolio/org/${encodeURIComponent(organization.slug)}`,
    verificationSummary,
  };
}

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
  const safePath = `/portfolio/org/${encodeURIComponent(slug)}`;
  const data = await loadOrgContractData(slug);

  if (!data || !isAccessiblePublicPortfolioState(data.effectiveState)) {
    return buildUnavailablePublicProfileMetadata(safePath);
  }

  const genericPreview = shouldUseGenericSharePreview(data.effectiveState);
  const displayName = data.organization.display_name || 'Proofound organization';
  const purpose =
    (data.visibility?.mission === 'public'
      ? data.organization.mission
      : data.organization.tagline) || '';

  return buildPublicProfileMetadata({
    title: genericPreview
      ? 'Proofound organization portfolio'
      : `${displayName} | Proofound Organization Portfolio`,
    description: genericPreview
      ? 'Shareable organization trust card on Proofound.'
      : purpose || `Explore ${displayName}'s public organization portfolio on Proofound.`,
    path: safePath,
    ogTitle: genericPreview ? 'Proofound organization portfolio' : `${displayName} on Proofound`,
    ogDescription: genericPreview
      ? 'Shareable organization trust card on Proofound.'
      : purpose || `View ${displayName}'s public trust card on Proofound.`,
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

  const data = await loadOrgContractData(slug);

  if (!data) {
    const redirectTarget = await loadHistoricalSlug(slug);
    if (redirectTarget && redirectTarget !== slug) {
      permanentRedirect(`/portfolio/org/${encodeURIComponent(redirectTarget)}`);
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
        .eq('org_id', data.organization.id)
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

  const pagePath = `/portfolio/org/${encodeURIComponent(slug)}`;
  const jsonLdDescription =
    (data.visibility?.mission === 'public'
      ? data.organization.mission
      : data.organization.tagline) || 'Public organization trust card on Proofound.';
  const jsonLdItems = [
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({
      path: pagePath,
      title: `${data.organization.display_name} | Proofound Organization Portfolio`,
      description: jsonLdDescription,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: data.organization.display_name, path: pagePath },
    ]),
    buildPublicOrganizationPortfolioJsonLd({
      path: pagePath,
      name: data.organization.display_name,
      description: jsonLdDescription,
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
                      {data.organization.display_name}
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
                {(data.visibility?.mission === 'public'
                  ? data.organization.mission
                  : data.organization.tagline) ||
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
      <JsonLdScripts items={jsonLdItems} idPrefix="public-org-portfolio-jsonld" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-4">
          <PublicProfileSection title="Trust basics">
            <div className="space-y-3">
              <SummaryRow label="Organization" value={data.organization.display_name} />
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
