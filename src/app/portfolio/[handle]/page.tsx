import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, CheckCircle2, CircleDot, ExternalLink, Link2, Mail } from 'lucide-react';

import { Logo } from '@/components/brand/Logo';
import { PublicProfileEmptyState } from '@/components/public-profile/PublicProfileEmptyState';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getHistoricalPublicProfileHandleRedirect,
  resolvePublicIndividualPortfolioAccessByHandle,
} from '@/lib/portfolio/public-projection';
import { buildPortfolioRobots } from '@/lib/portfolio/public-contract';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';
import {
  buildBreadcrumbJsonLd,
  buildProofoundWebsiteJsonLd,
  buildWebPageJsonLd,
} from '@/lib/seo/json-ld';
import { createClient } from '@/lib/supabase/server';

import { CopyTextButton } from './CopyTextButton';
import { DownloadPdfButton } from './DownloadPdfButton';
import { ShareLinkButton } from './ShareLinkButton';

function renderUnavailablePage(handle: string) {
  return (
    <PublicProfileShell
      maxWidthClassName="max-w-4xl"
      footer={
        <div className="flex items-center justify-between gap-2">
          <span>proofound.io/portfolio/{handle}</span>
          <span>Public Page unavailable</span>
        </div>
      }
    >
      <PublicProfileSection title="Public Page unavailable">
        <PublicProfileEmptyState message="This Public Page link is unavailable. It may be hidden, retired, or not ready for launch-safe sharing." />
      </PublicProfileSection>
    </PublicProfileShell>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const access = await resolvePublicIndividualPortfolioAccessByHandle(handle);

  if (access.status !== 'accessible') {
    return buildUnavailablePublicProfileMetadata(`/portfolio/${encodeURIComponent(handle)}`);
  }

  const data = access.projection;

  return buildPublicProfileMetadata({
    title: 'Proofound Public Page',
    description: 'A proof snapshot shared by direct link on Proofound.',
    path: data.metadata.path,
    ogTitle: 'Proofound Public Page',
    ogDescription: 'A proof snapshot shared by direct link on Proofound.',
    ogType: 'website',
    robots: buildPortfolioRobots('public_link_only'),
  });
}

export default async function PortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ returnTo?: string | string[] }>;
}) {
  const { handle } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const returnPath = sanitizeReturnPath(resolvedSearchParams.returnTo, '/');
  const returnLabel = returnPath.startsWith('/app/') ? 'Return to menu' : 'Return home';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const access = await resolvePublicIndividualPortfolioAccessByHandle(handle);

  if (access.status === 'missing') {
    const redirectTarget = await getHistoricalPublicProfileHandleRedirect(handle);
    if (redirectTarget && redirectTarget !== handle) {
      const redirectAccess = await resolvePublicIndividualPortfolioAccessByHandle(redirectTarget);
      if (redirectAccess.status === 'accessible') {
        permanentRedirect(`/portfolio/${encodeURIComponent(redirectTarget)}`);
      }

      return renderUnavailablePage(handle);
    }
    notFound();
  }

  if (access.status === 'unavailable') {
    return renderUnavailablePage(handle);
  }

  const data = access.projection;
  const selectedProofPacks = data.exportData.proofPacks.slice(0, 5);
  const publicTrustBadges = data.signals.badges.filter((badge) =>
    ['identity_checked', 'workplace_confirmed', 'evidence_attested'].includes(badge.key)
  );
  const selectedOutcomeHighlights = selectedProofPacks
    .map((pack) => pack.outcomesSummary?.trim() || pack.summary?.trim() || '')
    .filter((value) => value.length > 0)
    .slice(0, 3);

  const viewerIsOwner = Boolean(user?.id && user.id === data.profileId);
  const displayName = data.publicDisplayName;
  const headline = data.publicHeadline || 'Proof-first Public Page';
  const publicBio = data.publicBio;

  const collaborationHref = collaborationMailto({
    subject: `Request introduction to ${displayName}`,
    body: `Hi Proofound team, I would like to request an introduction to ${displayName}. Public Page: ${data.shareUrl}`,
  });

  const requestContactHref = collaborationMailto({
    subject: `Request contact for ${displayName}`,
    body: `Hi Proofound team, please help me connect with ${displayName}. Public Page: ${data.shareUrl}`,
  });

  const publicSummaryEndpoint = `/api/portfolio/public/${encodeURIComponent(data.handle)}/summary`;
  const publicExportEndpoint = `/api/portfolio/public/${encodeURIComponent(data.handle)}/export`;
  const pagePath = `/portfolio/${encodeURIComponent(data.handle)}`;
  const pageTrustTier = getTrustTier(data.verifiedPublicProofPackCount > 0);
  const jsonLdItems = [
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({
      path: pagePath,
      title: `${displayName} | Proofound Public Page`,
      description: data.jsonLd.description,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: displayName, path: pagePath },
    ]),
  ];

  return (
    <PublicProfileShell
      maxWidthClassName="max-w-6xl"
      header={
        <div className="space-y-3">
          {viewerIsOwner ? (
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="px-0 text-muted-foreground hover:text-foreground"
              >
                <Link href={returnPath} className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  {returnLabel}
                </Link>
              </Button>
            </div>
          ) : null}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5 text-sm text-foreground">
              <Logo size="sm" />
              <span className="font-medium">Proofound Public Page</span>
              <Badge variant="outline" className="border-[#D9D5CC] text-muted-foreground">
                Direct-link proof snapshot
              </Badge>
              <TrustTierBadge tier={pageTrustTier} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {viewerIsOwner ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/app/i/profile?profileView=full&tab=visibility">
                    Manage visibility
                  </Link>
                </Button>
              ) : null}
              <ShareLinkButton url={data.shareUrl} />
              <DownloadPdfButton endpoint={viewerIsOwner ? undefined : publicExportEndpoint} />
              <CopyTextButton endpoint={viewerIsOwner ? undefined : publicSummaryEndpoint} />
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>proofound.io/portfolio/{data.handle}</span>
          <span>Direct-link Public Page</span>
        </div>
      }
    >
      <JsonLdScripts items={jsonLdItems} idPrefix="public-portfolio-jsonld" />
      <div className="space-y-4">
        <Card variant="bento" className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1C4D3A] to-[#C76B4A] text-xl font-semibold text-white">
                  {displayName[0]?.toUpperCase() || 'P'}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {displayName}
                  </h1>
                  <p className="text-sm text-foreground">{headline}</p>
                  <p className="text-sm text-muted-foreground">
                    Direct link is live. Search engines are off for the MVP.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.visibility.identity &&
                data.signals.badges.some((badge) => badge.key === 'identity_checked') ? (
                  <StatusChip label="Identity" value="Identity checked" tone="positive" />
                ) : null}
                {data.visibility.linkedin &&
                data.signals.badges.some((badge) => badge.key === 'workplace_confirmed') ? (
                  <StatusChip label="Workplace" value="Workplace-verified" tone="positive" />
                ) : null}
                {data.signals.badges
                  .filter((badge) => badge.key === 'evidence_attested')
                  .map((badge) => (
                    <StatusChip
                      key={badge.key}
                      label="Evidence"
                      value={badge.label}
                      tone="positive"
                    />
                  ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {publicBio || 'A proof-first Public Page with public-safe details only.'}
              </p>

              <TraceableSummaryBlock
                summary={data.traceableSummary}
                viewerIsOwner={viewerIsOwner}
              />
            </div>

            {!viewerIsOwner ? (
              <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
                <Button asChild className="bg-proofound-forest text-white hover:bg-[#163d2f]">
                  <Link href={collaborationHref}>Request introduction</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={requestContactHref}>Request contact</Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Private details stay hidden unless the owner explicitly reveals them.
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <PublicProfileSection
              title="Selected Proof Packs"
              right={<span className="text-xs text-muted-foreground">Public-safe proof only</span>}
            >
              {selectedProofPacks.length > 0 ? (
                <div className="space-y-3">
                  {selectedProofPacks.map((pack) => (
                    <article
                      key={pack.id}
                      className="space-y-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-sm transition-all duration-300 hover:bg-white/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{pack.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pack.contextLabel || 'Selected Proof Pack'}
                          </p>
                        </div>
                        <TrustTierBadge
                          tier={getTrustTier(isVerifiedProofStatus(pack.verificationStatus))}
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <SummaryStat
                          label="Trust tier"
                          value={getTrustTierLabel(
                            getTrustTier(isVerifiedProofStatus(pack.verificationStatus))
                          )}
                        />
                        <SummaryStat
                          label="Freshness"
                          value={humanizeFreshness(pack.freshnessState)}
                        />
                      </div>

                      {pack.outcomesSummary ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Selected outcome
                          </p>
                          <p className="text-sm text-foreground">{pack.outcomesSummary}</p>
                        </div>
                      ) : null}

                      {pack.verificationSummary ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Trust summary
                          </p>
                          <p className="text-sm text-foreground">{pack.verificationSummary}</p>
                        </div>
                      ) : null}

                      {pack.summary && pack.summary !== pack.outcomesSummary ? (
                        <p className="text-sm text-muted-foreground">{pack.summary}</p>
                      ) : null}

                      {pack.ownershipStatement ? (
                        <p className="text-sm text-muted-foreground">
                          Ownership: {pack.ownershipStatement}
                        </p>
                      ) : null}

                      {pack.selectedEvidence.length > 0 ? (
                        <div className="space-y-2 border-t border-[#EFECE5] pt-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Supporting evidence
                          </p>
                          <ul className="space-y-2 text-sm text-foreground">
                            {pack.selectedEvidence.map((item) => (
                              <li
                                key={`${pack.id}-${item.title}`}
                                className="rounded-lg border border-white/50 bg-white/50 px-3 py-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium">{item.title}</p>
                                    {item.description ? (
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {item.description}
                                      </p>
                                    ) : null}
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.semanticsNote}
                                    </p>
                                  </div>
                                  {item.href ? (
                                    <a
                                      href={item.href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-proofound-forest hover:text-[#143829]"
                                    >
                                      Open
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'No selected Proof Packs are published yet.'
                      : 'No selected Proof Packs are available yet.'
                  }
                  actions={
                    !viewerIsOwner ? [{ label: 'Request contact', href: requestContactHref }] : []
                  }
                />
              )}
            </PublicProfileSection>
          </div>

          <div className="space-y-4">
            <PublicProfileSection title="Proof snapshot">
              <div className="space-y-2">
                <SummaryStat label="Public Proof Packs" value={`${selectedProofPacks.length}`} />
                <SummaryStat label="Outcomes shown" value={`${selectedOutcomeHighlights.length}`} />
                <SummaryStat label="Proof-backed skills" value={`${data.publicSkills.length}`} />
                <SummaryStat
                  label="Scoped verifications"
                  value={`${data.signals.verifications.count}`}
                />
                <SummaryStat
                  label="Public credentials"
                  value={`${countPublicCredentials(selectedProofPacks)}`}
                />
              </div>
              {publicTrustBadges.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {publicTrustBadges.map((badge) => (
                    <TagPill key={`${badge.key}-${badge.label}`} label={badge.label} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Trust signals stay narrow and proof-scoped on this public surface.
                </p>
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Selected outcomes">
              {selectedOutcomeHighlights.length > 0 ? (
                <ul className="space-y-2 text-sm text-foreground">
                  {selectedOutcomeHighlights.map((outcome) => (
                    <li key={outcome} className="flex gap-2">
                      <span className="mt-1 text-proofound-forest">•</span>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              ) : publicBio ? (
                <p className="whitespace-pre-line text-sm leading-6 text-foreground">{publicBio}</p>
              ) : (
                <PublicProfileEmptyState
                  message="No public outcome summary is published yet."
                  example="Selected outcomes from Proof Packs will appear here."
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Skills snapshot">
              {data.publicSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.publicSkills.map((skill) => (
                    <TagPill key={skill} label={skill} />
                  ))}
                </div>
              ) : (
                <PublicProfileEmptyState message="Skills are not shared publicly on this Public Page." />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Contact & share">
              <div className="space-y-2 text-sm">
                {data.visibility.contact &&
                data.visibility.workEmail &&
                data.individual.work_email ? (
                  <ContactPill href={`mailto:${data.individual.work_email}`} label="Work email" />
                ) : (
                  <p className="rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-muted-foreground shadow-sm">
                    Contact hidden
                  </p>
                )}
                <ContactPill
                  href={data.shareUrl}
                  label="Share link"
                  icon={<Link2 className="h-4 w-4" />}
                />
                {!viewerIsOwner ? (
                  <ContactPill
                    href={requestContactHref}
                    label="Request contact"
                    icon={<Mail className="h-4 w-4" />}
                  />
                ) : null}
              </div>
            </PublicProfileSection>
          </div>
        </div>
      </div>
    </PublicProfileShell>
  );
}

function collaborationMailto({ subject, body }: { subject: string; body: string }): string {
  return `mailto:hello@proofound.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#D9D5CC] bg-white/70 px-3 py-1 text-sm text-foreground shadow-sm">
      {label}
    </span>
  );
}

function ContactPill({ href, label, icon }: { href: string; label: string; icon?: ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-foreground shadow-sm transition-colors hover:border-proofound-forest/30 hover:text-proofound-forest"
    >
      {icon}
      <span>{label}</span>
      <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
    </a>
  );
}

type TrustTier = 'self_reported' | 'verified';

function getTrustTier(hasAcceptedVerification: boolean): TrustTier {
  return hasAcceptedVerification ? 'verified' : 'self_reported';
}

function isVerifiedProofStatus(status: string) {
  return status === 'verified' || status === 'partially_verified';
}

function getTrustTierLabel(tier: TrustTier) {
  return tier === 'verified' ? 'Verified ✓' : 'Self-reported';
}

function TrustTierBadge({ tier }: { tier: TrustTier }) {
  const isVerified = tier === 'verified';

  return (
    <Badge
      variant="outline"
      aria-label={`Trust tier: ${getTrustTierLabel(tier)}`}
      className={
        isVerified
          ? 'w-fit border-[#D7E8DE] bg-[#F3FAF6] text-proofound-forest'
          : 'w-fit border-[#E8E2D8] bg-[#FCFBF8] text-muted-foreground'
      }
    >
      {getTrustTierLabel(tier)}
    </Badge>
  );
}

function countPublicCredentials(
  packs: Array<{ selectedEvidence?: Array<{ artifactKind?: string | null }> }>
) {
  return packs.reduce(
    (count, pack) =>
      count +
      (pack.selectedEvidence ?? []).filter((item) => item.artifactKind === 'credential').length,
    0
  );
}

function TraceableSummaryBlock({
  summary,
  viewerIsOwner,
}: {
  summary: {
    provenanceLabel: string;
    hasEnoughData: boolean;
    segments: Array<{
      key: string;
      label: string;
      value: string;
      state: 'ready' | 'fallback';
      sources: Array<{ id: string; label: string; detail: string | null }>;
    }>;
  };
  viewerIsOwner: boolean;
}) {
  const sourceEditHref =
    '/app/i/profile?profileView=full&tab=proof_packs&summarySource=traceable-profile-summary';
  const refreshHref =
    '/app/i/profile?profileView=full&tab=proof_packs&summaryRefresh=traceable-profile-summary';

  return (
    <section className="mt-3 space-y-3 rounded-xl border border-[#E6E0D6] bg-[#FCFBF8]/80 p-3 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Scale / Focus / Context</h2>
          <p className="text-xs text-muted-foreground">{summary.provenanceLabel}</p>
        </div>
        <Badge
          variant="outline"
          className={
            summary.hasEnoughData
              ? 'w-fit border-[#D7E8DE] text-proofound-forest'
              : 'w-fit border-[#E8E2D8] text-muted-foreground'
          }
        >
          {summary.hasEnoughData ? 'Traceable summary' : 'Needs more context'}
        </Badge>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {summary.segments.map((segment) => (
          <div
            key={segment.key}
            className="rounded-lg border border-white/60 bg-white/60 px-3 py-2 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {segment.label}
            </p>
            <p className="mt-1 text-sm leading-5 text-foreground">{segment.value}</p>
            {segment.sources.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {segment.sources.map((source) => (
                  <span
                    key={`${segment.key}-${source.id}`}
                    className="inline-flex max-w-full items-center rounded-full border border-[#D9D5CC] bg-[#F8F6F0] px-2 py-0.5 text-[11px] text-muted-foreground"
                    title={source.detail ? `${source.label}: ${source.detail}` : source.label}
                  >
                    <span className="truncate">{source.label}</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {viewerIsOwner ? (
        <div className="flex flex-wrap gap-2 border-t border-[#EFECE5] pt-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={sourceEditHref}>Edit source Proof Packs</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={refreshHref}>Refresh from current Proof Packs</Link>
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function StatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'positive' | 'neutral';
}) {
  const toneClasses =
    tone === 'positive'
      ? 'border-[#D7E8DE] bg-[#F3FAF6] text-proofound-forest'
      : 'border-[#E8E2D8] bg-[#FCFBF8] text-foreground';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${toneClasses}`}
    >
      {tone === 'positive' ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <CircleDot className="h-3.5 w-3.5" />
      )}
      <span>{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </span>
  );
}

function SummaryStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/40 px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-foreground">
        {icon}
        <span>{value}</span>
      </p>
    </div>
  );
}

function humanizeFreshness(state: string) {
  switch (state) {
    case 'fresh':
      return 'Fresh';
    case 'review_soon':
      return 'Review soon';
    case 'stale':
      return 'Needs refresh';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
}
