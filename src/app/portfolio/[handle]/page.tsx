import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Link2, Mail, ShieldCheck } from 'lucide-react';
import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
import {
  buildPublicProfileMetadata,
  buildUnavailablePublicProfileMetadata,
} from '@/lib/seo/public-profile-metadata';
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { ShareLinkButton } from './ShareLinkButton';
import { DownloadPdfButton } from './DownloadPdfButton';
import { CopyTextButton } from './CopyTextButton';
import { ViewCounterClient } from './ViewCounterClient';

type SkillRow = {
  id: string;
  level: number | null;
  taxonomy?:
    | {
        name_i18n?: Record<string, string> | null;
      }
    | {
        name_i18n?: Record<string, string> | null;
      }[]
    | null;
  skill_code?: string | null;
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
    const headline = visibility.header
      ? (individual?.headline || individual?.tagline || '').trim() || null
      : null;

    return buildPublicProfileMetadata({
      title: `${displayName} | Proofound Public Portfolio`,
      description: headline
        ? `${displayName}. ${headline}`
        : `Explore ${displayName}'s public Proofound portfolio and trust signals.`,
      path: safePath,
      ogTitle: `${displayName} on Proofound`,
      ogDescription: headline
        ? `${headline} View this public profile on Proofound.`
        : `View ${displayName}'s public profile and trust signals on Proofound.`,
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

  let proofsCount = 0;
  let acceptedVerificationsCount = 0;
  let attestationCount = 0;
  let skills: SkillRow[] = [];

  if (viewerIsOwner) {
    try {
      const { count } = await supabase
        .from('skill_proofs')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', profile.id);
      proofsCount = count || 0;
    } catch {
      proofsCount = 0;
    }

    try {
      const { count } = await supabase
        .from('skill_verification_requests')
        .select('id', { count: 'exact', head: true })
        .eq('requester_profile_id', profile.id)
        .eq('status', 'accepted')
        .eq('integrity_status', 'clear');
      acceptedVerificationsCount = count || 0;
    } catch {
      acceptedVerificationsCount = 0;
    }

    try {
      const { count } = await supabase
        .from('attestations')
        .select('id', { count: 'exact', head: true })
        .eq('subject_user_id', profile.id)
        .eq('status', 'verified');
      attestationCount = count || 0;
    } catch {
      attestationCount = 0;
    }

    try {
      const { data } = await supabase
        .from('skills')
        .select(
          `
            id,
            level,
            skill_code,
            taxonomy:skill_code (
              name_i18n
            )
          `
        )
        .eq('profile_id', profile.id)
        .order('level', { ascending: false })
        .limit(6);
      skills = data || [];
    } catch {
      skills = [];
    }
  }

  const signals = buildTrustSignals(profile, {
    proofsCount,
    acceptedVerificationsCount,
    attestationCount,
  });

  const individual = Array.isArray(profile.individual_profiles)
    ? profile.individual_profiles[0]
    : profile.individual_profiles;

  const visibility = mergeVisibilityFlags(
    Array.isArray((profile as any).field_visibility)
      ? (profile as any).field_visibility[0]?.field_visibility
      : (profile as any).field_visibility?.field_visibility
  );

  const displayName = profile.display_name || profile.handle || 'Portfolio';
  const headline =
    individual?.headline || individual?.tagline || 'Purpose-built, proof-backed profile';
  const bio =
    individual?.bio || 'Showcase verifiable work, skills, and trust signals in one shareable page.';

  const shareUrl = `${FALLBACK_URL.replace(/\/$/, '')}/portfolio/${handle}`;

  const skillView = skills.map((skill) => {
    const name =
      (skill.taxonomy as any)?.name_i18n?.en ||
      (skill.taxonomy as any)?.name_i18n?.default ||
      skill.skill_code ||
      'Skill';

    return {
      id: skill.id,
      name,
      level: skill.level ?? 0,
    };
  });

  const publicMessage = viewerIsOwner
    ? null
    : 'This is a public, read-only view. Owner-only actions are hidden.';

  return (
    <PublicProfileShell
      maxWidthClassName="max-w-5xl"
      header={
        <div className="space-y-3">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1C4D3A] to-[#C76B4A] text-lg font-semibold text-white">
                  {displayName[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold text-[#2D3330]">{displayName}</h1>
                    {visibility.identity && signals.identity.verified ? (
                      <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                  {visibility.header ? (
                    <>
                      <p className="text-sm text-[#6B6760]">@{profile.handle}</p>
                      <p className="text-sm text-[#2D3330]">{headline}</p>
                    </>
                  ) : null}
                </div>
              </div>
              {publicMessage ? <p className="text-sm text-[#6B6760]">{publicMessage}</p> : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={returnPath} className="inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  {returnLabel}
                </Link>
              </Button>
              <ShareLinkButton url={shareUrl} />
              {viewerIsOwner ? <CopyTextButton /> : null}
              {viewerIsOwner ? <DownloadPdfButton /> : null}
              <ViewCounterClient handle={handle} showCount={viewerIsOwner} />
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between">
          <span>proofound.io/portfolio/{profile.handle}</span>
          <span>Proofound public profile</span>
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <PublicProfileSection title="Trust summary">
            {visibility.identity ||
            visibility.workEmail ||
            visibility.linkedin ||
            visibility.counts ? (
              <div className="space-y-1.5">
                {visibility.identity ? (
                  <TrustSummaryRow
                    label="Identity"
                    value={signals.identity.verified ? 'Verified' : 'Not verified'}
                    helper={
                      signals.identity.verified
                        ? `Method: ${signals.identity.method ?? 'Not specified'}`
                        : 'Complete identity verification to boost trust.'
                    }
                    positive={signals.identity.verified}
                  />
                ) : null}
                {visibility.workEmail ? (
                  <TrustSummaryRow
                    label="Work Email"
                    value={signals.workEmail.verified ? 'Verified' : 'Not verified'}
                    helper={
                      signals.workEmail.verified
                        ? 'Work email confirmed.'
                        : 'Verify a work email for extra credibility.'
                    }
                    positive={signals.workEmail.verified}
                  />
                ) : null}
                {visibility.linkedin ? (
                  <TrustSummaryRow
                    label="LinkedIn"
                    value={formatLinkedinStatus(signals)}
                    helper={formatLinkedinHelper(signals)}
                    positive={signals.linkedin.verificationStatus === 'verified'}
                  />
                ) : null}
                {visibility.counts ? (
                  <TrustSummaryRow
                    label="Proofs Added"
                    value={`${signals.proofs.count}`}
                    helper="Skills proofs, accepted verifications, and attestations shown below."
                    positive={signals.proofs.count > 0}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[#6B6760]">
                {viewerIsOwner
                  ? 'Trust summary is hidden from public view.'
                  : 'This section is hidden.'}
              </p>
            )}
          </PublicProfileSection>

          <PublicProfileSection
            title="Skills snapshot"
            right={
              <span className="rounded-full border border-[#D9D5CC] bg-[#F7F6F1] px-2.5 py-1 text-xs text-[#2D3330]">
                {skillView.length || 'Add skills'}
              </span>
            }
          >
            {visibility.skills ? (
              skillView.length > 0 ? (
                <div className="space-y-2.5">
                  {skillView.map((skill) => {
                    const levelPercent = Math.round((skill.level / 5) * 100);

                    return (
                      <div key={skill.id} className="space-y-1">
                        <div className="flex items-center justify-between gap-2 text-sm text-[#2D3330]">
                          <span>{skill.name}</span>
                          <span className="text-[#6B6760]">{levelPercent}%</span>
                        </div>
                        <Progress
                          value={levelPercent}
                          className="h-1.5 bg-[#E8E6DD]"
                          indicatorClassName="bg-[#1C4D3A]"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#6B6760]">
                  {viewerIsOwner
                    ? 'Add your top skills and proofs to light up this section.'
                    : 'Skills will appear here once added.'}
                </p>
              )
            ) : (
              <p className="text-sm text-[#6B6760]">
                {viewerIsOwner ? 'Skills hidden from public view.' : 'Skills are hidden.'}
              </p>
            )}
          </PublicProfileSection>

          <PublicProfileSection title="Profile narrative">
            {visibility.bio ? (
              <p className="whitespace-pre-line text-sm leading-6 text-[#2D3330]">{bio}</p>
            ) : (
              <p className="text-sm text-[#6B6760]">
                {viewerIsOwner
                  ? 'Bio/About is hidden from public view.'
                  : 'This section is hidden.'}
              </p>
            )}
            {viewerIsOwner ? (
              <p className="mt-2 text-xs text-[#6B6760]">
                Edit your profile, proofs, and verifications from Settings or Expertise Hub.
              </p>
            ) : null}
          </PublicProfileSection>
        </div>

        <div className="space-y-4">
          <PublicProfileSection title="Proof totals">
            {visibility.counts ? (
              <div className="space-y-2">
                <MetricRow label="Proofs added" value={signals.proofs.count} />
                <MetricRow label="Skills verified" value={signals.verifications.count} />
                <MetricRow label="Peer attestations" value={signals.attestations.count} />
                {viewerIsOwner ? (
                  <p className="pt-1 text-xs text-[#6B6760]">
                    Tip: add proof to your top 3 skills, then request one verification each for a
                    fast trust lift.
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-[#6B6760]">
                {viewerIsOwner ? 'Counts are hidden from public view.' : 'This section is hidden.'}
              </p>
            )}
          </PublicProfileSection>

          <PublicProfileSection title="Contact">
            <div className="flex flex-wrap gap-2 text-sm">
              {individual?.work_email && visibility.contact ? (
                <ContactPill href={`mailto:${individual.work_email}`} label="Work email" />
              ) : (
                <span className="rounded-full border border-[#D9D5CC] px-3 py-1 text-[#6B6760]">
                  Contact email hidden
                </span>
              )}
              <ContactPill
                href={shareUrl}
                label="Shareable link"
                icon={<Link2 className="h-4 w-4" />}
              />
            </div>
          </PublicProfileSection>
        </div>
      </div>
    </PublicProfileShell>
  );
}

function formatLinkedinStatus(signals: ReturnType<typeof buildTrustSignals>): string {
  if (signals.linkedin.verificationStatus === 'pending') {
    return 'Pending';
  }

  if (
    signals.linkedin.verificationStatus === 'verified' &&
    signals.linkedin.hasIdentityVerification
  ) {
    return 'Verified badge';
  }

  if (signals.linkedin.verificationStatus === 'verified') {
    return 'Verified';
  }

  if (signals.linkedin.verificationStatus === 'failed') {
    return 'Failed';
  }

  return 'Not checked';
}

function formatLinkedinHelper(signals: ReturnType<typeof buildTrustSignals>): string {
  if (signals.linkedin.verificationStatus === 'pending') {
    return 'LinkedIn verification is under review.';
  }

  if (
    signals.linkedin.verificationStatus === 'verified' &&
    signals.linkedin.hasIdentityVerification
  ) {
    return 'Official LinkedIn identity verification detected.';
  }

  if (signals.linkedin.verificationStatus === 'verified') {
    return 'LinkedIn verification completed without identity badge.';
  }

  if (signals.linkedin.verificationStatus === 'failed') {
    return 'Retry LinkedIn verification to refresh this signal.';
  }

  return 'Run LinkedIn check for a quick trust boost.';
}

function TrustSummaryRow({
  label,
  value,
  helper,
  positive,
}: {
  label: string;
  value: string;
  helper?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#E8E6DD] bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`h-4 w-4 ${positive ? 'text-emerald-600' : 'text-[#9A958D]'}`} />
          <span className="text-sm font-medium text-[#2D3330]">{label}</span>
        </div>
        <span className="text-sm font-semibold text-[#1C4D3A]">{value}</span>
      </div>
      {helper ? <p className="pt-1 text-xs text-[#6B6760]">{helper}</p> : null}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#E8E6DD] bg-white px-3 py-2">
      <span className="text-sm text-[#2D3330]">{label}</span>
      <span className="rounded-full bg-[#F7F6F1] px-2.5 py-0.5 text-sm font-semibold text-[#2D3330]">
        {value}
      </span>
    </div>
  );
}

function ContactPill({ href, label, icon }: { href: string; label: string; icon?: ReactNode }) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className="flex items-center gap-2 rounded-full border border-[#D9D5CC] px-3 py-1 text-[#2D3330] hover:border-[#1C4D3A]/40 hover:text-[#1C4D3A]"
    >
      {icon ?? <Mail className="h-4 w-4" />}
      {label}
    </a>
  );
}
