import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  EyeOff,
  Link2,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { Logo } from '@/components/brand/Logo';
import { PublicProfileEmptyState } from '@/components/public-profile/PublicProfileEmptyState';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { PublicProofPackList } from '@/components/public-profile/PublicProofPackList';
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

function renderUnavailablePage(
  handle: string,
  {
    returnHref = '/',
    returnLabel = 'Return home',
  }: { returnHref?: string; returnLabel?: string } = {}
) {
  return (
    <PublicProfileShell
      maxWidthClassName="max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>proofound.io/portfolio/{handle}</span>
          <span>Public page unavailable</span>
        </div>
      }
    >
      <PublicProfileSection
        title="Public page unavailable"
        titleLevel={1}
        right={
          <Badge variant="outline" className="border-[#D9D5CC] text-muted-foreground">
            Direct-link gate
          </Badge>
        }
        contentClassName="space-y-4"
      >
        <div className="space-y-3">
          <p className="text-sm leading-6 text-foreground">
            This Public Page link is unavailable. It may be hidden, retired, or not ready for
            launch-safe sharing.
          </p>

          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-[#D7E8DE] bg-[#F3FAF6] px-4 py-3 text-sm leading-6 text-proofound-charcoal shadow-sm"
          >
            <div className="flex min-w-0 gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-proofound-forest">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-proofound-forest">
                  No private profile details were shown from this link.
                </p>
                <p className="mt-1 text-muted-foreground">
                  Public Pages only load selected public-safe Proof Packs when the owner has an
                  active direct-link snapshot.
                </p>
              </div>
            </div>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex min-w-0 gap-2">
              <span className="mt-1 shrink-0 text-proofound-forest">
                <Link2 className="h-4 w-4 text-proofound-forest" />
              </span>
              <p className="min-w-0 leading-6 text-muted-foreground">
                <span className="font-semibold text-proofound-charcoal">Link inactive.</span> The
                owner may have hidden, retired, or not yet published this snapshot.
              </p>
            </li>
            <li className="flex min-w-0 gap-2">
              <span className="mt-1 shrink-0 text-proofound-forest">
                <EyeOff className="h-4 w-4 text-proofound-forest" />
              </span>
              <p className="min-w-0 leading-6 text-muted-foreground">
                <span className="font-semibold text-proofound-charcoal">Details protected.</span>{' '}
                Contact, identity, and proof details stay hidden until a public snapshot is active.
              </p>
            </li>
            <li className="flex min-w-0 gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-proofound-forest" />
              <p className="min-w-0 leading-6 text-muted-foreground">
                <span className="font-semibold text-proofound-charcoal">Next step.</span> Ask the
                owner for a fresh Public Page link if you expected access.
              </p>
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="bg-proofound-forest text-white hover:bg-[#163d2f]">
            <Link href={returnHref}>{returnLabel}</Link>
          </Button>
        </div>
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

      return renderUnavailablePage(handle, { returnHref: returnPath, returnLabel });
    }
    return renderUnavailablePage(handle, { returnHref: returnPath, returnLabel });
  }

  if (access.status === 'unavailable') {
    return renderUnavailablePage(handle, { returnHref: returnPath, returnLabel });
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
  const publicCredentialCount = countPublicCredentials(selectedProofPacks);
  const trustSummaryItems = buildTrustSummaryItems({
    countsArePublic: data.visibility.counts,
    proofPackCount: selectedProofPacks.length,
    verificationCount: data.signals.verifications.count,
    skillCount: data.publicSkills.length,
    skillsArePublic: data.visibility.skills,
    publicCredentialCount,
  });

  const viewerIsOwner = Boolean(user?.id && user.id === data.profileId);
  const displayName = data.publicDisplayName;
  const headline = data.publicHeadline || 'Proof-first Public Page';
  const publicBio = data.publicBio;

  const collaborationHref = collaborationMailto({
    subject: `Request introduction to ${displayName}`,
    body: `Hi Proofound team, I would like to request an introduction to ${displayName}. Public Page: ${data.shareUrl}`,
  });

  const publicSummaryEndpoint = `/api/portfolio/public/${encodeURIComponent(data.handle)}/summary`;
  const publicExportEndpoint = `/api/portfolio/public/${encodeURIComponent(data.handle)}/export`;
  const pagePath = `/portfolio/${encodeURIComponent(data.handle)}`;
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
            </div>

            {viewerIsOwner ? (
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/i/profile?profileView=full&tab=visibility">Manage visibility</Link>
              </Button>
            ) : null}
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
          <div className="grid gap-x-4 gap-y-2 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)] lg:items-start">
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1C4D3A] to-[#C76B4A] text-xl font-semibold text-white">
                  {displayName[0]?.toUpperCase() || 'P'}
                </div>
                <div className="space-y-1">
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {displayName}
                  </h1>
                  <p className="text-sm text-foreground">{headline}</p>
                  <p className="text-sm text-muted-foreground">
                    Direct link is live. Search engines are off until the owner opts in.
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
            </div>

            <div className="flex w-full flex-col gap-3 border-t border-[#EFECE5] pt-4 lg:w-auto lg:min-w-[220px] lg:border-t-0 lg:pt-0">
              <div className="flex flex-col gap-3">
                {!viewerIsOwner ? (
                  <Button
                    asChild
                    className="min-h-11 bg-proofound-forest text-white hover:bg-[#163d2f]"
                  >
                    <Link href={collaborationHref}>Request introduction</Link>
                  </Button>
                ) : null}

                <PublicPageActionButtons
                  shareUrl={data.shareUrl}
                  viewerIsOwner={viewerIsOwner}
                  publicExportEndpoint={publicExportEndpoint}
                  publicSummaryEndpoint={publicSummaryEndpoint}
                />
              </div>

              {!viewerIsOwner ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  Private details stay hidden unless the owner explicitly reveals them. Introduction
                  requests stay routed through Proofound first. Export and copy actions use only
                  this page&apos;s public-safe details.
                </p>
              ) : null}
            </div>

            <div className="lg:col-start-1">
              <TraceableSummaryBlock
                summary={data.traceableSummary}
                viewerIsOwner={viewerIsOwner}
              />
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <PublicProfileSection
              title="Selected Proof Packs"
              right={<span className="text-xs text-muted-foreground">Public-safe proof only</span>}
            >
              {selectedProofPacks.length > 0 ? (
                <PublicProofPackList proofPacks={selectedProofPacks} />
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'No selected Proof Packs are published yet.'
                      : 'No selected Proof Packs are available yet.'
                  }
                  actions={
                    !viewerIsOwner
                      ? [{ label: 'Request introduction', href: collaborationHref }]
                      : []
                  }
                />
              )}
            </PublicProfileSection>
          </div>

          <div className="space-y-4">
            <PublicProfileSection title="Public trust summary">
              <div className="space-y-2">
                {trustSummaryItems.map((item) => (
                  <TrustSummaryItem key={item.label} label={item.label} value={item.value} />
                ))}
              </div>
              {publicTrustBadges.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {publicTrustBadges.map((badge) => (
                    <TagPill key={`${badge.key}-${badge.label}`} label={badge.label} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Verification checks stay narrow and proof-scoped on this public surface.
                </p>
              )}
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                This summary only describes selected public-safe material. Private context and
                unshared credentials stay closed.
              </p>
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
                  <ContactHiddenNotice />
                )}
                <ContactPill
                  href={data.shareUrl}
                  label="Share link"
                  icon={<Link2 className="h-4 w-4" />}
                />
                {!viewerIsOwner ? (
                  <ContactPill
                    href={collaborationHref}
                    label="Request introduction"
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

function PublicPageActionButtons({
  shareUrl,
  viewerIsOwner,
  publicExportEndpoint,
  publicSummaryEndpoint,
}: {
  shareUrl: string;
  viewerIsOwner: boolean;
  publicExportEndpoint: string;
  publicSummaryEndpoint: string;
}) {
  return (
    <div
      aria-label="Public Page export and copy actions"
      className="grid w-full gap-2 sm:grid-cols-3 lg:grid-cols-1 [&>div]:w-full [&_button]:w-full"
    >
      <ShareLinkButton url={shareUrl} className="min-h-11 justify-center" />
      <DownloadPdfButton
        endpoint={viewerIsOwner ? undefined : publicExportEndpoint}
        className="min-h-11"
      />
      <CopyTextButton
        endpoint={viewerIsOwner ? undefined : publicSummaryEndpoint}
        className="min-h-11"
      />
    </div>
  );
}

function ContactHiddenNotice() {
  return (
    <div className="rounded-xl border border-[#D7E8DE] bg-[#F3FAF6] px-3 py-2 text-proofound-charcoal shadow-sm">
      <div className="flex min-w-0 gap-2">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-proofound-forest" />
        <div className="min-w-0">
          <p className="font-medium text-proofound-forest">
            Contact is hidden on this Public Page.
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Request an introduction through Proofound; private details stay closed unless the owner
            chooses to reveal them.
          </p>
        </div>
      </div>
    </div>
  );
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
      className="flex min-h-11 items-center gap-2 rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-foreground shadow-sm transition-colors hover:border-proofound-forest/30 hover:text-proofound-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-proofound-forest focus-visible:ring-offset-2"
    >
      {icon}
      <span>{label}</span>
      <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
    </a>
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
            className="min-w-0 rounded-lg border border-white/60 bg-white/60 px-3 py-2 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {segment.label}
            </p>
            <p className="mt-1 text-sm leading-5 text-foreground">{segment.value}</p>
            {segment.sources.length > 0 ? (
              <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
                {segment.sources.map((source) => (
                  <span
                    key={`${segment.key}-${source.id}`}
                    className="inline-flex min-w-0 max-w-full items-center rounded-full border border-[#D9D5CC] bg-[#F8F6F0] px-2 py-0.5 text-[11px] text-muted-foreground"
                    title={source.detail ? `${source.label}: ${source.detail}` : source.label}
                  >
                    <span className="min-w-0 truncate">{source.label}</span>
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

function TrustSummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/40 px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-5 text-foreground">{value}</p>
    </div>
  );
}

function buildTrustSummaryItems({
  countsArePublic,
  proofPackCount,
  verificationCount,
  skillCount,
  skillsArePublic,
  publicCredentialCount,
}: {
  countsArePublic: boolean;
  proofPackCount: number;
  verificationCount: number;
  skillCount: number;
  skillsArePublic: boolean;
  publicCredentialCount: number;
}) {
  const items = [
    {
      label: 'Proof shown',
      value: countsArePublic
        ? formatCountSummary(proofPackCount, 'selected public-safe Proof Pack')
        : proofPackCount > 0
          ? 'Selected public-safe Proof Packs are shown below.'
          : 'No selected Proof Packs are public yet.',
    },
    {
      label: 'Verification scope',
      value: countsArePublic
        ? formatCountSummary(verificationCount, 'scoped verification')
        : 'Verification status appears only where the owner made it public.',
    },
  ];

  if (skillsArePublic && skillCount > 0) {
    items.push({
      label: 'Skills shared',
      value: countsArePublic
        ? formatCountSummary(skillCount, 'proof-backed skill')
        : 'Proof-backed skills are listed without count metadata.',
    });
  }

  if (publicCredentialCount > 0) {
    items.push({
      label: 'Credentials shared',
      value: countsArePublic
        ? formatCountSummary(publicCredentialCount, 'public credential')
        : 'Public credential files are shown without count metadata.',
    });
  }

  return items;
}

function formatCountSummary(count: number, singular: string) {
  if (count <= 0) {
    return `No ${singular}s are public yet.`;
  }

  return `${count} ${count === 1 ? singular : `${singular}s`} shared on this page.`;
}
