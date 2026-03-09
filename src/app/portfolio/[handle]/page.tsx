import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Logo } from '@/components/brand/Logo';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ExternalLink,
  Link2,
  Mail,
} from 'lucide-react';
import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
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
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { PublicProfileEmptyState } from '@/components/public-profile/PublicProfileEmptyState';
import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { ShareLinkButton } from './ShareLinkButton';
import { DownloadPdfButton } from './DownloadPdfButton';
import { CopyTextButton } from './CopyTextButton';
import { ViewCounterClient } from './ViewCounterClient';

type MatchingProfileRow = {
  desired_roles?: string[] | null;
  work_mode?: string | null;
  availability_earliest?: string | null;
  availability_latest?: string | null;
  city?: string | null;
  country?: string | null;
  timezone?: string | null;
  languages?: Array<{ code?: string; level?: string }> | null;
  values_tags?: string[] | null;
  cause_tags?: string[] | null;
};

type SkillProofRow = {
  id: string;
  title: string;
  proof_type?: string | null;
  description?: string | null;
  url?: string | null;
  verified?: boolean | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
};

type FeaturedProof = {
  id: string;
  title: string;
  role: string;
  timeframe: string;
  outcomes: string[];
  evidence: Array<{ label: string; href: string }>;
  verifiedBy: string;
  proofPackHref: string;
};

const FALLBACK_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const safePath = `/portfolio/${encodeURIComponent(handle)}`;

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        `
          handle,
          display_name,
          individual_profiles (
            headline,
            tagline
          ),
          field_visibility: individual_profiles(field_visibility)
        `
      )
      .eq('handle', handle)
      .maybeSingle();

    if (!profile) {
      return buildUnavailablePublicProfileMetadata(safePath);
    }

    const visibility = mergeVisibilityFlags(
      Array.isArray((profile as any).field_visibility)
        ? (profile as any).field_visibility[0]?.field_visibility
        : (profile as any).field_visibility?.field_visibility
    );

    const individual = Array.isArray(profile.individual_profiles)
      ? profile.individual_profiles[0]
      : profile.individual_profiles;

    const displayName = profile.display_name || profile.handle || 'Proofound Member';
    const positioning = visibility.header
      ? (individual?.headline || individual?.tagline || '').trim() || null
      : null;

    return buildPublicProfileMetadata({
      title: `${displayName} | Proofound Public Profile`,
      description: positioning
        ? `${displayName}. ${positioning}`
        : `${displayName}'s proof-first public profile on Proofound.`,
      path: safePath,
      ogTitle: `${displayName} on Proofound`,
      ogDescription: positioning
        ? `${positioning} Explore verified proof and outcomes.`
        : `Explore ${displayName}'s public proof profile on Proofound.`,
    });
  } catch {
    return buildUnavailablePublicProfileMetadata(safePath);
  }
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

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
        id,
        handle,
        display_name,
        avatar_url,
        individual_profiles (
          headline,
          bio,
          location,
          mission,
          vision,
          tagline,
          verification_status,
          verification_method,
          verified_at,
          work_email,
          work_email_verified,
          linkedin_verification_status,
          linkedin_verified_at,
          linkedin_verification_data,
          verified
        ),
        field_visibility: individual_profiles(field_visibility)
      `
    )
    .eq('handle', handle)
    .maybeSingle();

  if (!profile) {
    return notFound();
  }

  const viewerIsOwner = Boolean(user?.id && user.id === profile.id);
  const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/${encodeURIComponent(handle)}`;

  const [matchingResult, fallbackSkillProofsResult] = await Promise.all([
    supabase
      .from('matching_profiles')
      .select(
        `
          desired_roles,
          work_mode,
          availability_earliest,
          availability_latest,
          city,
          country,
          timezone,
          languages,
          values_tags,
          cause_tags
        `
      )
      .eq('profile_id', profile.id)
      .maybeSingle(),
    supabase
      .from('skill_proofs')
      .select(
        `
          id,
          title,
          proof_type,
          description,
          url,
          verified,
          metadata,
          created_at
        `
      )
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);
  const signals = buildTrustSignals(profile);

  const individual = Array.isArray(profile.individual_profiles)
    ? profile.individual_profiles[0]
    : profile.individual_profiles;

  const visibility = mergeVisibilityFlags(
    Array.isArray((profile as any).field_visibility)
      ? (profile as any).field_visibility[0]?.field_visibility
      : (profile as any).field_visibility?.field_visibility
  );

  const matchingProfile = (matchingResult.data || null) as MatchingProfileRow | null;

  const displayName = profile.display_name || profile.handle || 'Proofound Profile';
  const headline = visibility.header
    ? (individual?.headline || individual?.tagline || '').trim() ||
      'Proof-based professional profile'
    : 'Proof-based professional profile';
  const bio = visibility.bio ? (individual?.bio || '').trim() || null : null;
  const locationLine =
    viewerIsOwner && individual?.location?.trim() ? individual.location.trim() : null;
  const ownerMission = viewerIsOwner ? individual?.mission?.trim() || null : null;
  const ownerVision = viewerIsOwner ? individual?.vision?.trim() || null : null;
  const fallbackSkillProofs = (fallbackSkillProofsResult.data || []) as SkillProofRow[];

  const featuredProofs = buildFeaturedProofs({
    fallbackSkillProofs,
    shareUrl,
  });
  const pagePath = `/portfolio/${encodeURIComponent(handle)}`;
  const jsonLdDescription =
    bio || headline || 'Public proof portfolio on Proofound with verifiable outcomes and evidence.';
  const jsonLdItems = [
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({
      path: pagePath,
      title: `${displayName} | Proofound Public Profile`,
      description: jsonLdDescription,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: displayName, path: pagePath },
    ]),
    buildPublicPersonPortfolioJsonLd({
      path: pagePath,
      name: displayName,
      description: jsonLdDescription,
    }),
  ];

  const collaborationHref = collaborationMailto({
    subject: `Request collaboration with ${displayName}`,
    body: `Hi Proofound team, I would like to request collaboration with ${displayName}. Public profile: ${shareUrl}`,
  });

  const requestProofPackHref = collaborationMailto({
    subject: `Request proof pack for ${displayName}`,
    body: `Hi Proofound team, please share a proof pack for ${displayName}. Public profile: ${shareUrl}`,
  });

  const requestContactHref = collaborationMailto({
    subject: `Request contact for ${displayName}`,
    body: `Hi Proofound team, please help me connect with ${displayName}. Public profile: ${shareUrl}`,
  });

  const publicSummaryEndpoint = `/api/portfolio/public/${encodeURIComponent(profile.handle)}/summary`;
  const publicExportEndpoint = `/api/portfolio/public/${encodeURIComponent(profile.handle)}/export`;

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
              <span className="font-medium">Proofound public profile</span>
              {!viewerIsOwner ? (
                <Badge variant="outline" className="border-[#D9D5CC] text-muted-foreground">
                  Public viewer mode
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  Owner preview mode
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ShareLinkButton url={shareUrl} />
              <DownloadPdfButton endpoint={viewerIsOwner ? undefined : publicExportEndpoint} />
              <CopyTextButton endpoint={viewerIsOwner ? undefined : publicSummaryEndpoint} />

              <ViewCounterClient handle={handle} showCount={viewerIsOwner} />
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span>proofound.io/portfolio/{profile.handle}</span>
          <span>Proof-first public profile</span>
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
                    {locationLine || (viewerIsOwner ? 'Location not set yet' : 'Location hidden')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {visibility.identity ? (
                  <StatusChip
                    label="Identity"
                    value={signals.identity.verified ? 'Verified' : 'Not verified'}
                    tone={signals.identity.verified ? 'positive' : 'neutral'}
                  />
                ) : null}
                {visibility.linkedin ? (
                  <StatusChip
                    label="LinkedIn"
                    value={
                      signals.linkedin.verificationStatus === 'verified'
                        ? 'Verified'
                        : 'Not verified'
                    }
                    tone={
                      signals.linkedin.verificationStatus === 'verified' ? 'positive' : 'neutral'
                    }
                  />
                ) : null}
              </div>

              <p className="text-sm text-muted-foreground">
                {bio || 'I build meaningful outcomes with proof you can open, review, and verify.'}
              </p>
            </div>

            {!viewerIsOwner ? (
              <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
                <Button asChild className="bg-proofound-forest text-white hover:bg-[#163d2f]">
                  <Link href={collaborationHref}>Request collaboration</Link>
                </Button>
                {!(visibility.contact && visibility.workEmail && individual?.work_email) ? (
                  <Button variant="outline" asChild>
                    <Link href={requestContactHref}>Request contact</Link>
                  </Button>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Contact details may be hidden. Use request actions to engage.
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <PublicProfileSection title="Proof-based summary">
              {bio ? (
                <p className="whitespace-pre-line text-sm leading-6 text-foreground">{bio}</p>
              ) : (
                <PublicProfileEmptyState
                  message="A detailed proof-based summary has not been published yet."
                  example="I build onboarding flows for mission-driven teams, measured by activation and retention lift."
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection
              title="Featured proofs"
              right={
                <span className="text-xs text-muted-foreground">
                  Finalized verifications with evidence.
                </span>
              }
            >
              {featuredProofs.length > 0 ? (
                <div className="space-y-3">
                  {featuredProofs.slice(0, 5).map((proof) => (
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
                          {proof.evidence.slice(0, 3).map((item) => (
                            <a
                              key={`${proof.id}-${item.href}-${item.label}`}
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

                      <div className="flex items-center justify-between border-t border-[#EFECE5] pt-2">
                        <span className="text-xs text-muted-foreground">
                          Audit log available on request
                        </span>
                        <a
                          href={proof.proofPackHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-proofound-forest hover:text-[#143829]"
                        >
                          Open proof pack
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'No finalized proofs published yet.'
                      : 'No proofs published yet.'
                  }
                  actions={
                    !viewerIsOwner
                      ? [
                          { label: 'Request proof pack', href: requestProofPackHref },
                          { label: 'Invite to assignment', href: collaborationHref },
                        ]
                      : []
                  }
                  example="Reduced churn by 14% in one quarter with a verified rollout artifact"
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Expertise snapshot">
              <PublicProfileEmptyState message="Selection rules for this section are being finalized." />
            </PublicProfileSection>
          </div>

          <div className="space-y-4">
            <PublicProfileSection title="My next challenge">
              {hasOpenToData(matchingProfile) ? (
                <div className="space-y-2 text-sm text-foreground">
                  <OpenToRow
                    label="Roles"
                    value={
                      matchingProfile?.desired_roles?.length
                        ? matchingProfile.desired_roles.join(', ')
                        : 'Not specified'
                    }
                  />
                  <OpenToRow label="Work mode" value={formatWorkMode(matchingProfile?.work_mode)} />
                  <OpenToRow
                    label="Availability"
                    value={formatAvailabilityRange(
                      matchingProfile?.availability_earliest,
                      matchingProfile?.availability_latest
                    )}
                  />
                  <OpenToRow
                    label="Location & timezone"
                    value={formatLocationAndTimezone(
                      matchingProfile?.city,
                      matchingProfile?.country,
                      matchingProfile?.timezone
                    )}
                  />
                  <OpenToRow
                    label="Languages"
                    value={formatLanguages(matchingProfile?.languages ?? null)}
                  />
                </div>
              ) : (
                <PublicProfileEmptyState message="Availability is not shared." />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Mission & vision">
              <Tabs defaultValue="mission" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#F3F1EB]">
                  <TabsTrigger value="mission">Mission</TabsTrigger>
                  <TabsTrigger value="vision">Vision</TabsTrigger>
                </TabsList>
                <TabsContent value="mission" className="mt-3">
                  <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                    {ownerMission || 'Mission is private in this view.'}
                  </p>
                </TabsContent>
                <TabsContent value="vision" className="mt-3">
                  <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                    {ownerVision || 'Vision is private in this view.'}
                  </p>
                </TabsContent>
              </Tabs>
            </PublicProfileSection>

            <PublicProfileSection title="Values & causes">
              {(matchingProfile?.values_tags?.length || 0) +
                (matchingProfile?.cause_tags?.length || 0) >
              0 ? (
                <div className="flex flex-wrap gap-2">
                  {(matchingProfile?.values_tags || []).map((value) => (
                    <TagPill key={`value-${value}`} label={value} />
                  ))}
                  {(matchingProfile?.cause_tags || []).map((cause) => (
                    <TagPill key={`cause-${cause}`} label={cause} />
                  ))}
                </div>
              ) : (
                <PublicProfileEmptyState message="Not specified." />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Contact & share">
              <div className="space-y-2 text-sm">
                {visibility.contact && visibility.workEmail && individual?.work_email ? (
                  <ContactPill href={`mailto:${individual.work_email}`} label="Work email" />
                ) : (
                  <p className="rounded-xl border border-white/40 bg-white/40 px-3 py-2 text-muted-foreground shadow-sm">
                    Contact hidden
                  </p>
                )}
                <ContactPill
                  href={shareUrl}
                  label="Share link"
                  icon={<Link2 className="h-4 w-4" />}
                />
                {!viewerIsOwner &&
                !(visibility.contact && visibility.workEmail && individual?.work_email) ? (
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

function buildFeaturedProofs({
  fallbackSkillProofs,
  shareUrl,
}: {
  fallbackSkillProofs: SkillProofRow[];
  shareUrl: string;
}): FeaturedProof[] {
  return fallbackSkillProofs
    .map((proof) => {
      if (!proof.verified) {
        return null;
      }
      const metadataUrl = typeof proof.metadata?.url === 'string' ? proof.metadata.url : null;
      const href = proof.url || metadataUrl || shareUrl;

      return {
        id: proof.id,
        title: proof.title,
        role: prettifyProofType(proof.proof_type),
        timeframe: proof.created_at ? formatDate(proof.created_at) : 'Date unavailable',
        outcomes: toOutcomeLines(proof.description),
        evidence: href
          ? [
              {
                label: 'Primary artifact',
                href,
              },
            ]
          : [],
        verifiedBy: 'Verified',
        proofPackHref: href,
      };
    })
    .filter((proof): proof is FeaturedProof => Boolean(proof));
}

function toOutcomeLines(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\n|;|\.|\u2022/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function prettifyProofType(value: string | null | undefined): string {
  if (!value) {
    return 'Proof';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function collaborationMailto({ subject, body }: { subject: string; body: string }): string {
  return `mailto:hello@proofound.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function hasOpenToData(profile: MatchingProfileRow | null): boolean {
  if (!profile) {
    return false;
  }

  return Boolean(
    (profile.desired_roles && profile.desired_roles.length > 0) ||
      profile.work_mode ||
      profile.availability_earliest ||
      profile.availability_latest ||
      profile.city ||
      profile.country ||
      profile.timezone ||
      (Array.isArray(profile.languages) && profile.languages.length > 0)
  );
}

function formatWorkMode(mode: string | null | undefined): string {
  if (!mode) {
    return 'Not specified';
  }

  if (mode === 'hybrid') {
    return 'Hybrid';
  }
  if (mode === 'remote') {
    return 'Remote';
  }
  if (mode === 'onsite') {
    return 'On-site';
  }

  return mode;
}

function formatAvailabilityRange(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) {
    return 'Not specified';
  }

  if (start && end) {
    return `${formatDate(start)} to ${formatDate(end)}`;
  }

  return start ? `From ${formatDate(start)}` : `Until ${formatDate(end as string)}`;
}

function formatLocationAndTimezone(
  city: string | null | undefined,
  country: string | null | undefined,
  timezone: string | null | undefined
): string {
  const location = [city, country].filter(Boolean).join(', ');
  if (location && timezone) {
    return `${location} (${timezone})`;
  }
  return location || timezone || 'Not specified';
}

function formatLanguages(languages: MatchingProfileRow['languages']): string {
  if (!Array.isArray(languages) || languages.length === 0) {
    return 'Not specified';
  }

  return languages
    .map((language) => {
      const code = (language.code || '').toUpperCase();
      const level = language.level ? ` (${language.level})` : '';
      return `${code || 'Language'}${level}`;
    })
    .join(', ');
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
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
        tone === 'positive'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-[#D9D5CC] bg-japandi-bg text-muted-foreground'
      }`}
    >
      {tone === 'positive' ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <CircleDot className="h-3.5 w-3.5" />
      )}
      {label}: {value}
    </span>
  );
}

function OpenToRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/40 bg-white/40 px-3 py-2 shadow-sm transition-colors hover:bg-white/60">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/40 bg-white/40 px-3 py-1 text-sm text-foreground shadow-sm transition-colors hover:bg-white/60">
      {label}
    </span>
  );
}

function ContactPill({ href, label, icon }: { href: string; label: string; icon?: ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="flex items-center gap-2 rounded-full border border-white/40 bg-white/40 px-3 py-1 text-foreground shadow-sm transition-colors hover:bg-white/60 hover:text-proofound-forest"
    >
      {icon ?? <CalendarClock className="h-4 w-4" />}
      {label}
    </a>
  );
}
