import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Link2,
  Mail,
} from 'lucide-react';

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
  buildPublicPersonPortfolioJsonLd,
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
          <span>Public portfolio unavailable</span>
        </div>
      }
    >
      <PublicProfileSection title="Portfolio unavailable">
        <PublicProfileEmptyState message="This public portfolio link is unavailable. It may be hidden, retired, or not ready for launch-safe sharing." />
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
    title: data.metadata.title,
    description: data.metadata.description,
    path: data.metadata.path,
    ogTitle: data.metadata.ogTitle,
    ogDescription: data.metadata.ogDescription,
    ogType: 'profile',
    robots: buildPortfolioRobots(data.effectiveState),
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

  const viewerIsOwner = Boolean(user?.id && user.id === data.profileId);
  const displayName = data.publicDisplayName;
  const headline = data.publicHeadline || 'Proof-first public portfolio';
  const publicBio = data.publicBio;

  const collaborationHref = collaborationMailto({
    subject: `Request introduction to ${displayName}`,
    body: `Hi Proofound team, I would like to request an introduction to ${displayName}. Public portfolio: ${data.shareUrl}`,
  });

  const requestContactHref = collaborationMailto({
    subject: `Request contact for ${displayName}`,
    body: `Hi Proofound team, please help me connect with ${displayName}. Public portfolio: ${data.shareUrl}`,
  });

  const publicSummaryEndpoint = `/api/portfolio/public/${encodeURIComponent(data.handle)}/summary`;
  const publicExportEndpoint = `/api/portfolio/public/${encodeURIComponent(data.handle)}/export`;
  const pagePath = `/portfolio/${encodeURIComponent(data.handle)}`;
  const jsonLdItems = [
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({
      path: pagePath,
      title: `${displayName} | Proofound Public Portfolio`,
      description: data.jsonLd.description,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: displayName, path: pagePath },
    ]),
    buildPublicPersonPortfolioJsonLd({
      path: pagePath,
      name: displayName,
      description: data.jsonLd.description,
      skills: data.publicSkills,
    }),
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
              <span className="font-medium">Proofound public portfolio</span>
              <Badge variant="outline" className="border-[#D9D5CC] text-muted-foreground">
                {data.effectiveState === 'public_indexable'
                  ? 'Searchable'
                  : 'Shareable by direct link'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
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
          <span>
            {data.effectiveState === 'public_indexable'
              ? 'Proof-first public portfolio'
              : 'Direct-link public portfolio'}
          </span>
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
                    Public link is live. Search engines are{' '}
                    {data.effectiveState === 'public_indexable' ? 'allowed.' : 'off by default.'}
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
                {publicBio || 'A proof-first public portfolio with public-safe details only.'}
              </p>
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
            <PublicProfileSection title="Proof-based summary">
              {publicBio ? (
                <p className="whitespace-pre-line text-sm leading-6 text-foreground">{publicBio}</p>
              ) : (
                <PublicProfileEmptyState
                  message="No public summary is published yet."
                  example="I build proof-backed onboarding systems and share evidence that others can open and inspect."
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection
              title="Featured proofs"
              right={<span className="text-xs text-muted-foreground">Public-safe proof only</span>}
            >
              {data.featuredProofs.length > 0 ? (
                <div className="space-y-3">
                  {data.featuredProofs.slice(0, 5).map((proof) => (
                    <article
                      key={proof.id}
                      className="space-y-2 rounded-xl border border-white/40 bg-white/40 p-3 shadow-sm transition-all duration-300 hover:bg-white/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{proof.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {proof.role} {proof.timeframe ? `• ${proof.timeframe}` : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-[#D9D5CC] text-muted-foreground">
                          {proof.verifiedBy}
                        </Badge>
                      </div>

                      {proof.outcomes.length > 0 ? (
                        <ul className="space-y-1 text-sm text-foreground">
                          {proof.outcomes.map((outcome) => (
                            <li key={`${proof.id}-${outcome}`} className="flex gap-2">
                              <span className="mt-1 text-proofound-forest">•</span>
                              <span>{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {proof.evidence.length > 0 ? (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {proof.evidence.map((item) => (
                            <a
                              key={`${proof.id}-${item.href}`}
                              href={item.href}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-[#D9D5CC] px-2.5 py-1 text-foreground hover:border-proofound-forest/50 hover:text-proofound-forest"
                            >
                              {item.label}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ))}
                        </div>
                      ) : null}

                      {proof.proofPackHref ? (
                        <div className="flex items-center justify-between border-t border-[#EFECE5] pt-2">
                          <span className="text-xs text-muted-foreground">
                            Public-safe evidence only
                          </span>
                          <a
                            href={proof.proofPackHref}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-proofound-forest hover:text-[#143829]"
                          >
                            Open evidence
                          </a>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'No public proof links published yet.'
                      : 'No public proof is available yet.'
                  }
                  actions={
                    !viewerIsOwner ? [{ label: 'Request contact', href: requestContactHref }] : []
                  }
                />
              )}
            </PublicProfileSection>
          </div>

          <div className="space-y-4">
            <PublicProfileSection title="Skills snapshot">
              {data.publicSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.publicSkills.map((skill) => (
                    <TagPill key={skill} label={skill} />
                  ))}
                </div>
              ) : (
                <PublicProfileEmptyState message="Skills are not shared publicly in this portfolio." />
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
