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
import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import {
  buildPortfolioRobots,
  deriveEffectivePublicPortfolioState,
  isAccessiblePublicPortfolioState,
  isVisibleOnPublicPage,
  resolveRequestedPublicPortfolioState,
  shouldUseGenericSharePreview,
} from '@/lib/portfolio/public-contract';
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
import { getPublicSiteUrl } from '@/lib/seo/public-metadata';
import { createClient } from '@/lib/supabase/server';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
  type VerificationPolicySummary,
} from '@/lib/verification/policy';
import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';

import { CopyTextButton } from './CopyTextButton';
import { DownloadPdfButton } from './DownloadPdfButton';
import { ShareLinkButton } from './ShareLinkButton';

type ProfileRow = {
  id: string;
  handle: string;
  display_name: string | null;
  public_portfolio_state?: string | null;
  search_indexing_enabled_at?: string | null;
  individual_profiles:
    | {
        headline?: string | null;
        bio?: string | null;
        tagline?: string | null;
        skills?: string[] | null;
        redact_mode?: boolean | null;
        verification_status?: string | null;
        verification_method?: string | null;
        verified_at?: string | null;
        work_email?: string | null;
        work_email_verified?: boolean | null;
        linkedin_verification_status?: string | null;
        linkedin_verified_at?: string | null;
        linkedin_verification_data?: Record<string, unknown> | null;
        verified?: boolean | null;
      }
    | Array<{
        headline?: string | null;
        bio?: string | null;
        tagline?: string | null;
        skills?: string[] | null;
        redact_mode?: boolean | null;
        verification_status?: string | null;
        verification_method?: string | null;
        verified_at?: string | null;
        work_email?: string | null;
        work_email_verified?: boolean | null;
        linkedin_verification_status?: string | null;
        linkedin_verified_at?: string | null;
        linkedin_verification_data?: Record<string, unknown> | null;
        verified?: boolean | null;
      }>
    | null;
  field_visibility:
    | { field_visibility?: Record<string, unknown> | null }
    | Array<{ field_visibility?: Record<string, unknown> | null }>
    | null;
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

type ProfileVisibilityRow = {
  display_name?: string | null;
  headline?: string | null;
  skills?: string | null;
};

type PortfolioContractData = {
  profile: ProfileRow;
  individual: NonNullable<ReturnType<typeof pickIndividual>>;
  featuredProofs: FeaturedProof[];
  publicSkills: string[];
  visibility: ReturnType<typeof mergeVisibilityFlags>;
  profileVisibility: ProfileVisibilityRow | null;
  effectiveState: ReturnType<typeof deriveEffectivePublicPortfolioState>;
  shareUrl: string;
  signals: ReturnType<typeof buildTrustSignals>;
  verificationSummary: VerificationPolicySummary;
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

const SITE_URL = getPublicSiteUrl();

function pickIndividual(profile: ProfileRow['individual_profiles']) {
  if (!profile) return null;
  return Array.isArray(profile) ? (profile[0] ?? null) : profile;
}

function getStoredVisibility(
  fieldVisibility: ProfileRow['field_visibility']
): Record<string, unknown> | null | undefined {
  return Array.isArray(fieldVisibility)
    ? fieldVisibility[0]?.field_visibility
    : fieldVisibility?.field_visibility;
}

function hasDurableTrustSignal(signals: ReturnType<typeof buildTrustSignals>): boolean {
  return Boolean(
    signals.identity.verified ||
      signals.workEmail.verified ||
      signals.linkedin.verificationStatus === 'verified' ||
      signals.linkedin.hasIdentityVerification
  );
}

function isProofPublic(proof: SkillProofRow): boolean {
  const visibility =
    typeof proof.metadata?.visibility === 'string' ? proof.metadata.visibility : null;
  return Boolean(
    proof.verified ||
      visibility === 'public' ||
      visibility === 'link_only' ||
      visibility === 'network_only'
  );
}

function buildFeaturedProofs(
  fallbackSkillProofs: SkillProofRow[],
  shareUrl: string
): FeaturedProof[] {
  return fallbackSkillProofs.filter(isProofPublic).map((proof) => {
    const metadataUrl = typeof proof.metadata?.url === 'string' ? proof.metadata.url : null;
    const href = proof.url || metadataUrl || shareUrl;
    const importedFrom =
      typeof proof.metadata?.imported_from === 'string' ? proof.metadata.imported_from : null;

    return {
      id: proof.id,
      title: proof.title,
      role: prettifyProofType(proof.proof_type),
      timeframe: proof.created_at ? formatDate(proof.created_at) : 'Date unavailable',
      outcomes: toOutcomeLines(proof.description),
      evidence: href
        ? [
            {
              label: 'Open evidence',
              href,
            },
          ]
        : [],
      verifiedBy: proof.verified
        ? 'Verified'
        : importedFrom === 'onboarding'
          ? 'Public proof link'
          : 'Candidate evidence',
      proofPackHref: href,
    };
  });
}

async function loadProfileByHandle(handle: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select(
      `
        id,
        handle,
        display_name,
        public_portfolio_state,
        search_indexing_enabled_at,
        individual_profiles (
          headline,
          bio,
          tagline,
          skills,
          redact_mode,
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
        field_visibility: individual_profiles ( field_visibility )
      `
    )
    .eq('handle', handle)
    .maybeSingle();

  return (data as ProfileRow | null) ?? null;
}

async function loadHistoricalHandle(handle: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('profile_handle_history')
      .select('redirect_target_slug, is_active')
      .eq('slug', handle)
      .maybeSingle();

    if (!data || data.is_active === true) {
      return null;
    }

    return typeof data.redirect_target_slug === 'string' ? data.redirect_target_slug : null;
  } catch {
    return null;
  }
}

async function loadPortfolioContractData(handle: string): Promise<PortfolioContractData | null> {
  const supabase = await createClient();
  const profile = await loadProfileByHandle(handle);
  if (!profile) {
    return null;
  }

  const individual = pickIndividual(profile.individual_profiles);
  if (!individual) {
    return null;
  }

  const [profileVisibilityResult, skillProofsResult] = await Promise.all([
    supabase
      .from('profile_field_visibility')
      .select('display_name, headline, skills')
      .eq('profile_id', profile.id)
      .maybeSingle(),
    supabase
      .from('skill_proofs')
      .select('id, title, proof_type, description, url, verified, metadata, created_at')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const visibility = mergeVisibilityFlags(getStoredVisibility(profile.field_visibility));
  const profileVisibility = (profileVisibilityResult.data as ProfileVisibilityRow | null) ?? null;
  const featuredProofs = buildFeaturedProofs(
    (skillProofsResult.data || []) as SkillProofRow[],
    `${SITE_URL}/portfolio/${encodeURIComponent(handle)}`
  );
  const verificationRecords = await listVerificationRecordsForOwner(
    'individual_profile',
    profile.id
  ).catch(() => []);
  const verificationSummary = summarizeVerificationPolicy({
    records: verificationRecords,
    legacyProfile: {
      verified: individual.verified,
      verificationMethod: individual.verification_method as
        | 'veriff'
        | 'work_email'
        | 'linkedin'
        | null,
      verificationStatus: individual.verification_status as
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'failed'
        | null,
      verificationTier: null,
      verificationTierSource: null,
      workEmailCurrentlyVerified: Boolean(individual.work_email_verified),
      linkedinVerificationStatus: individual.linkedin_verification_status as
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'failed'
        | null,
      linkedinHasIdentityVerification: resolveHasLinkedInIdentityVerification(
        individual.linkedin_verification_data
      ),
    },
  });
  const signals = buildTrustSignals(
    profile as any,
    {
      proofsCount: featuredProofs.length,
    },
    verificationSummary
  );

  const publicSkills =
    visibility.skills && isVisibleOnPublicPage(profileVisibility?.skills ?? 'owner_only')
      ? (individual.skills || [])
          .filter((skill): skill is string => typeof skill === 'string')
          .slice(0, 8)
      : [];

  const minimumContentMet = Boolean(
    profile.handle &&
      (profile.display_name || profile.handle) &&
      ((visibility.header && (individual.headline || individual.tagline)) ||
        featuredProofs.length > 0 ||
        hasDurableTrustSignal(signals))
  );

  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(profile.public_portfolio_state),
    searchIndexingEnabled: Boolean(profile.search_indexing_enabled_at),
    minimumContentMet,
    redactMode: Boolean(individual.redact_mode),
    hasLinkOnlyContent: Boolean(
      visibility.skills && !isVisibleOnPublicPage(profileVisibility?.skills ?? 'owner_only')
    ),
  });

  return {
    profile,
    individual,
    featuredProofs,
    publicSkills,
    visibility,
    profileVisibility,
    effectiveState,
    shareUrl: `${SITE_URL}/portfolio/${encodeURIComponent(profile.handle)}`,
    signals,
    verificationSummary,
  };
}

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
  const safePath = `/portfolio/${encodeURIComponent(handle)}`;

  const data = await loadPortfolioContractData(handle);
  if (!data || !isAccessiblePublicPortfolioState(data.effectiveState)) {
    return buildUnavailablePublicProfileMetadata(safePath);
  }

  const displayName =
    data.profile.display_name || data.profile.handle || 'Proofound public portfolio';
  const headline =
    data.visibility.header && isVisibleOnPublicPage(data.profileVisibility?.headline ?? 'public')
      ? (data.individual.headline || data.individual.tagline || '').trim()
      : '';
  const genericPreview = shouldUseGenericSharePreview(data.effectiveState);

  return buildPublicProfileMetadata({
    title: genericPreview
      ? 'Proofound public portfolio'
      : `${displayName} | Proofound Public Portfolio`,
    description: genericPreview
      ? 'Shareable by direct link on Proofound.'
      : headline || `${displayName}'s proof-first public portfolio on Proofound.`,
    path: safePath,
    ogTitle: genericPreview ? 'Proofound public portfolio' : `${displayName} on Proofound`,
    ogDescription: genericPreview
      ? 'Shareable by direct link on Proofound.'
      : headline
        ? `${headline} Explore proof-backed work.`
        : `Explore ${displayName}'s proof-first public portfolio.`,
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

  const data = await loadPortfolioContractData(handle);

  if (!data) {
    const redirectTarget = await loadHistoricalHandle(handle);
    if (redirectTarget && redirectTarget !== handle) {
      permanentRedirect(`/portfolio/${encodeURIComponent(redirectTarget)}`);
    }
    notFound();
  }

  if (!isAccessiblePublicPortfolioState(data.effectiveState)) {
    return renderUnavailablePage(handle);
  }

  const viewerIsOwner = Boolean(user?.id && user.id === data.profile.id);
  const displayName = data.profile.display_name || data.profile.handle || 'Proofound Profile';
  const headline =
    data.visibility.header && isVisibleOnPublicPage(data.profileVisibility?.headline ?? 'public')
      ? (data.individual.headline || data.individual.tagline || '').trim() ||
        'Proof-first public portfolio'
      : 'Proof-first public portfolio';

  const publicBio = data.visibility.bio ? data.individual.bio?.trim() || null : null;

  const collaborationHref = collaborationMailto({
    subject: `Request introduction to ${displayName}`,
    body: `Hi Proofound team, I would like to request an introduction to ${displayName}. Public portfolio: ${data.shareUrl}`,
  });

  const requestContactHref = collaborationMailto({
    subject: `Request contact for ${displayName}`,
    body: `Hi Proofound team, please help me connect with ${displayName}. Public portfolio: ${data.shareUrl}`,
  });

  const publicSummaryEndpoint = `/api/portfolio/public/${encodeURIComponent(data.profile.handle)}/summary`;
  const publicExportEndpoint = `/api/portfolio/public/${encodeURIComponent(data.profile.handle)}/export`;
  const pagePath = `/portfolio/${encodeURIComponent(data.profile.handle)}`;
  const jsonLdDescription = publicBio || headline;
  const jsonLdItems = [
    buildProofoundWebsiteJsonLd(),
    buildWebPageJsonLd({
      path: pagePath,
      title: `${displayName} | Proofound Public Portfolio`,
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
          <span>proofound.io/portfolio/{data.profile.handle}</span>
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
