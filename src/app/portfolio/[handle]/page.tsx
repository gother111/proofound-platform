import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { PublicProfileSection } from '@/components/public-profile/PublicProfileSection';
import { PublicProfileShell } from '@/components/public-profile/PublicProfileShell';
import { PublicProfileEmptyState } from '@/components/public-profile/PublicProfileEmptyState';
import { ShareLinkButton } from './ShareLinkButton';
import { DownloadPdfButton } from './DownloadPdfButton';
import { CopyTextButton } from './CopyTextButton';
import { ViewCounterClient } from './ViewCounterClient';

type SkillRow = {
  id: string;
  level: number | null;
  last_used_at?: string | null;
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

type ImpactStoryRow = {
  id: string;
  title: string;
  role_title?: string | null;
  timeline?: string | null;
  outcomes?: string | null;
  measured_outcomes?: unknown;
  supporting_artifacts?: unknown;
  verified?: boolean | null;
  updated_at?: string | null;
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

type VerificationActivityRow = {
  id: string;
  responded_at?: string | null;
  created_at?: string | null;
  verifier_source?: string | null;
  verifier_email?: string | null;
  skill?: {
    skill_code?: string | null;
    taxonomy?:
      | {
          name_i18n?: Record<string, string> | null;
        }
      | {
          name_i18n?: Record<string, string> | null;
        }[]
      | null;
  } | null;
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

type SkillWithCoverage = {
  id: string;
  name: string;
  level: number;
  evidenceCount: number;
  lastUsedAt: string | null;
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

  const [
    proofCountResult,
    verificationCountResult,
    attestationCountResult,
    skillsResult,
    skillProofCountsResult,
    matchingResult,
    impactStoriesResult,
    fallbackSkillProofsResult,
    verificationActivityResult,
  ] = await Promise.all([
    supabase
      .from('skill_proofs')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id),
    supabase
      .from('skill_verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requester_profile_id', profile.id)
      .eq('status', 'accepted')
      .eq('integrity_status', 'clear'),
    supabase
      .from('attestations')
      .select('id', { count: 'exact', head: true })
      .eq('subject_user_id', profile.id)
      .eq('status', 'verified'),
    supabase
      .from('skills')
      .select(
        `
          id,
          level,
          last_used_at,
          skill_code,
          taxonomy:skill_code (
            name_i18n
          )
        `
      )
      .eq('profile_id', profile.id)
      .order('level', { ascending: false })
      .limit(24),
    supabase.from('skill_proofs').select('skill_id').eq('profile_id', profile.id),
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
      .from('impact_stories')
      .select(
        `
          id,
          title,
          role_title,
          timeline,
          outcomes,
          measured_outcomes,
          supporting_artifacts,
          verified,
          updated_at
        `
      )
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(5),
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
    supabase
      .from('skill_verification_requests')
      .select(
        `
          id,
          responded_at,
          created_at,
          verifier_source,
          verifier_email,
          skill:skill_id (
            skill_code,
            taxonomy:skill_code (
              name_i18n
            )
          )
        `
      )
      .eq('requester_profile_id', profile.id)
      .eq('status', 'accepted')
      .eq('integrity_status', 'clear')
      .order('responded_at', { ascending: false })
      .limit(5),
  ]);

  const proofsCount = proofCountResult.count || 0;
  const acceptedVerificationsCount = verificationCountResult.count || 0;
  const attestationCount = attestationCountResult.count || 0;

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

  const matchingProfile = (matchingResult.data || null) as MatchingProfileRow | null;

  const displayName = profile.display_name || profile.handle || 'Proofound Profile';
  const headline = visibility.header
    ? (individual?.headline || individual?.tagline || '').trim() ||
      'Proof-based professional profile'
    : 'Proof-based professional profile';
  const bio = visibility.bio ? (individual?.bio || '').trim() || null : null;

  const locationLine = [matchingProfile?.city, matchingProfile?.country].filter(Boolean).join(', ');

  const skillRows = (skillsResult.data || []) as SkillRow[];
  const skillProofRows = (skillProofCountsResult.data || []) as Array<{ skill_id: string | null }>;
  const proofCountsBySkill = skillProofRows.reduce<Record<string, number>>((acc, row) => {
    if (!row.skill_id) {
      return acc;
    }
    acc[row.skill_id] = (acc[row.skill_id] || 0) + 1;
    return acc;
  }, {});

  const skillCoverage = skillRows.map((skill) => {
    const name =
      (skill.taxonomy as any)?.name_i18n?.en ||
      (skill.taxonomy as any)?.name_i18n?.default ||
      skill.skill_code ||
      'Skill';

    return {
      id: skill.id,
      name,
      level: skill.level ?? 0,
      evidenceCount: proofCountsBySkill[skill.id] || 0,
      lastUsedAt: skill.last_used_at || null,
    } satisfies SkillWithCoverage;
  });

  const sortedSkills = [...skillCoverage].sort((a, b) => {
    if (b.evidenceCount !== a.evidenceCount) {
      return b.evidenceCount - a.evidenceCount;
    }
    return b.level - a.level;
  });

  const recencyCount = visibility.skills
    ? skillCoverage.filter((skill) => isRecentSkill(skill.lastUsedAt)).length
    : 0;
  const skillsWithEvidenceCount = visibility.skills
    ? skillCoverage.filter((skill) => skill.evidenceCount > 0).length
    : 0;

  const proofCoverageScore =
    visibility.counts || visibility.skills
      ? Math.max(
          5,
          Math.min(
            100,
            (visibility.counts ? Math.min(45, proofsCount * 12) : 0) +
              (visibility.counts ? Math.min(30, acceptedVerificationsCount * 15) : 0) +
              (visibility.skills ? Math.min(25, recencyCount * 8) : 0)
          )
        )
      : 0;

  const impactStories = (impactStoriesResult.data || []) as ImpactStoryRow[];
  const fallbackSkillProofs = (fallbackSkillProofsResult.data || []) as SkillProofRow[];

  const featuredProofs = buildFeaturedProofs({
    impactStories,
    fallbackSkillProofs,
    shareUrl,
  });

  const verificationActivities = (
    (verificationActivityResult.data || []) as VerificationActivityRow[]
  ).map((event) => {
    const skillName =
      (event.skill?.taxonomy as any)?.name_i18n?.en ||
      (event.skill?.taxonomy as any)?.name_i18n?.default ||
      event.skill?.skill_code ||
      'Skill';

    return {
      id: event.id,
      date: event.responded_at || event.created_at || null,
      type: 'Skill verification',
      verifier: formatVerifierLabel(event.verifier_source, event.verifier_email),
      item: skillName,
    };
  });

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

  const editProfileHref = '/app/i/profile';
  const expertiseHubHref = '/app/i/expertise';
  const ownerAuditHref = '/app/i/settings/audit-log';

  const publicSummaryEndpoint = `/api/portfolio/public/${encodeURIComponent(profile.handle)}/summary`;
  const publicExportEndpoint = `/api/portfolio/public/${encodeURIComponent(profile.handle)}/export`;

  const ctaPrimaryHref = viewerIsOwner ? expertiseHubHref : collaborationHref;
  const ctaPrimaryLabel = viewerIsOwner ? 'Add proof' : 'Request collaboration';

  return (
    <PublicProfileShell
      maxWidthClassName="max-w-6xl"
      header={
        <div className="space-y-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5 text-sm text-[#2D3330]">
              <Logo size="sm" />
              <span className="font-medium">Proofound public profile</span>
              {!viewerIsOwner ? (
                <Badge variant="outline" className="border-[#D9D5CC] text-[#6B6760]">
                  Public viewer mode
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                  Owner preview mode
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {viewerIsOwner ? (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-[#6B6760] hover:text-[#2D3330]"
                >
                  <Link href={returnPath} className="inline-flex items-center gap-1.5">
                    <ArrowLeft className="h-4 w-4" />
                    {returnLabel}
                  </Link>
                </Button>
              ) : null}

              <ShareLinkButton url={shareUrl} />
              <DownloadPdfButton endpoint={viewerIsOwner ? undefined : publicExportEndpoint} />
              <CopyTextButton endpoint={viewerIsOwner ? undefined : publicSummaryEndpoint} />

              {viewerIsOwner ? (
                <Button variant="secondary" size="sm" asChild>
                  <Link href={editProfileHref}>Edit profile</Link>
                </Button>
              ) : null}

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
      <div className="space-y-4">
        <section className="rounded-xl border border-[#E8E6DD] bg-[#FCFBF8] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1C4D3A] to-[#C76B4A] text-xl font-semibold text-white">
                  {displayName[0]?.toUpperCase() || 'P'}
                </div>
                <div className="space-y-1">
                  <h1 className="text-2xl font-semibold tracking-tight text-[#2D3330]">
                    {displayName}
                  </h1>
                  <p className="text-sm text-[#2D3330]">{headline}</p>
                  <p className="text-sm text-[#6B6760]">
                    {locationLine || 'Location not shared yet'}
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

              <p className="text-sm text-[#6B6760]">
                {bio || 'I build meaningful outcomes with proof you can open, review, and verify.'}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
              <Button asChild className="bg-[#1C4D3A] text-white hover:bg-[#163d2f]">
                <Link href={ctaPrimaryHref}>{ctaPrimaryLabel}</Link>
              </Button>
              {!viewerIsOwner &&
              !(visibility.contact && visibility.workEmail && individual?.work_email) ? (
                <Button variant="outline" asChild>
                  <Link href={requestContactHref}>Request contact</Link>
                </Button>
              ) : null}
              {!viewerIsOwner ? (
                <p className="text-xs text-[#6B6760]">
                  Contact details may be hidden. Use request actions to engage.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <PublicProfileSection title="Credibility at a glance">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm text-[#2D3330]">
                <span>Proof coverage</span>
                <span className="font-semibold">{proofCoverageScore}%</span>
              </div>
              <Progress
                value={proofCoverageScore}
                className="h-2 bg-[#E8E6DD]"
                indicatorClassName="bg-[#1C4D3A]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <CredibilityPill
                label="Identity"
                status={statusFromVisibility(visibility.identity, signals.identity.verified)}
              />
              <CredibilityPill
                label="Work proofs"
                status={statusFromVisibility(visibility.counts, proofsCount > 0)}
              />
              <CredibilityPill
                label="Skills evidence"
                status={statusFromVisibility(visibility.skills, skillsWithEvidenceCount > 0)}
              />
              <CredibilityPill
                label="Peer attestations"
                status={statusFromVisibility(visibility.counts, attestationCount > 0)}
              />
              <CredibilityPill
                label="Recency"
                status={statusFromVisibility(visibility.skills, recencyCount > 0)}
              />
            </div>

            <p className="text-sm text-[#6B6760]">
              {viewerIsOwner
                ? proofsCount > 0
                  ? 'Keep adding outcomes and verifications to strengthen profile trust.'
                  : 'Add 1 proof to unlock verified highlights and raise trust.'
                : proofsCount > 0
                  ? 'Signals above summarize published proof and recent verification activity.'
                  : 'This profile is new. Ask for a proof pack or invite them to an assignment.'}
            </p>
          </div>
        </PublicProfileSection>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <PublicProfileSection
              title="Featured proofs"
              right={
                <span className="text-xs text-[#6B6760]">
                  Projects, outcomes, and evidence you can verify.
                </span>
              }
            >
              {featuredProofs.length > 0 ? (
                <div className="space-y-3">
                  {featuredProofs.slice(0, 5).map((proof) => (
                    <article
                      key={proof.id}
                      className="space-y-2 rounded-lg border border-[#E8E6DD] bg-white p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-[#2D3330]">{proof.title}</h3>
                          <p className="text-sm text-[#6B6760]">
                            {proof.role} {proof.timeframe ? `• ${proof.timeframe}` : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-[#D9D5CC] text-[#6B6760]">
                          {proof.verifiedBy}
                        </Badge>
                      </div>

                      {proof.outcomes.length > 0 ? (
                        <ul className="space-y-1 text-sm text-[#2D3330]">
                          {proof.outcomes.map((outcome) => (
                            <li key={`${proof.id}-${outcome}`} className="flex gap-2">
                              <span className="mt-1 text-[#1C4D3A]">•</span>
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
                              className="inline-flex items-center gap-1 rounded-full border border-[#D9D5CC] px-2.5 py-1 text-[#2D3330] hover:border-[#1C4D3A]/50 hover:text-[#1C4D3A]"
                            >
                              {item.label}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between border-t border-[#EFECE5] pt-2">
                        <span className="text-xs text-[#6B6760]">
                          Audit log available on request
                        </span>
                        <a
                          href={proof.proofPackHref}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#1C4D3A] hover:text-[#143829]"
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
                      ? 'Add your first proof in a few steps: add proof, include one outcome, attach one artifact.'
                      : 'No proofs published yet.'
                  }
                  actions={
                    viewerIsOwner
                      ? [
                          { label: 'Add your first proof', href: expertiseHubHref },
                          { label: 'Request verification', href: expertiseHubHref },
                        ]
                      : [
                          { label: 'Request proof pack', href: requestProofPackHref },
                          { label: 'Invite to assignment', href: collaborationHref },
                        ]
                  }
                  example="Reduced churn by 14% in one quarter with a verified rollout artifact"
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Skills (with evidence)">
              {visibility.skills ? (
                sortedSkills.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 text-xs text-[#6B6760]">
                      <span className="rounded-full border border-[#D9D5CC] bg-[#F7F6F1] px-2.5 py-1 text-[#2D3330]">
                        Top skills ({Math.min(sortedSkills.length, 8)})
                      </span>
                      <span className="rounded-full border border-[#D9D5CC] px-2.5 py-1">
                        Tools seen in proofs ({skillsWithEvidenceCount})
                      </span>
                      <span className="rounded-full border border-[#D9D5CC] px-2.5 py-1">
                        All skills ({sortedSkills.length})
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {sortedSkills.slice(0, 8).map((skill) => (
                        <div
                          key={skill.id}
                          className="space-y-1 rounded-md border border-[#E8E6DD] bg-white px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-[#2D3330]">{skill.name}</span>
                            <span className="text-xs text-[#6B6760]">
                              {skill.evidenceCount} supporting proofs
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-xs text-[#6B6760]">
                            <span>
                              {skill.lastUsedAt
                                ? `Recent use: ${formatDate(skill.lastUsedAt)}`
                                : 'Recent use: not shared'}
                            </span>
                            <span className="font-medium text-[#1C4D3A]">
                              View supporting proof
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <PublicProfileEmptyState
                    message={
                      viewerIsOwner
                        ? 'Add 3 skills and attach at least 1 proof to each to light up this section.'
                        : 'Skills are not published yet. Ask for proof-backed skills.'
                    }
                    actions={
                      viewerIsOwner
                        ? [{ label: 'Add skills and proofs', href: expertiseHubHref }]
                        : [{ label: 'Request proof-backed skills', href: collaborationHref }]
                    }
                  />
                )
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'Skills are currently hidden from public view.'
                      : 'Skills are not shared publicly.'
                  }
                  actions={
                    viewerIsOwner
                      ? [{ label: 'Edit visibility settings', href: editProfileHref }]
                      : []
                  }
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Proof-based summary">
              {bio ? (
                <p className="whitespace-pre-line text-sm leading-6 text-[#2D3330]">{bio}</p>
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'Write a short proof-based summary: what you build, for whom, and how outcomes are measured.'
                      : 'A detailed proof-based summary has not been published yet.'
                  }
                  actions={viewerIsOwner ? [{ label: 'Add summary', href: editProfileHref }] : []}
                  example="I build onboarding flows for mission-driven teams, measured by activation and retention lift."
                />
              )}
            </PublicProfileSection>
          </div>

          <div className="space-y-4">
            <PublicProfileSection title="Open to">
              {hasOpenToData(matchingProfile) ? (
                <div className="space-y-2 text-sm text-[#2D3330]">
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
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'Add what you are open to so incoming invites are relevant.'
                      : 'Availability is not shared.'
                  }
                  actions={
                    viewerIsOwner
                      ? [{ label: 'Update open-to settings', href: editProfileHref }]
                      : []
                  }
                />
              )}
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

            <PublicProfileSection title="Verification activity">
              {verificationActivities.length > 0 ? (
                <div className="space-y-2.5">
                  {verificationActivities.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-md border border-[#E8E6DD] bg-white px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-[#2D3330]">{event.type}</p>
                      <p className="text-[#6B6760]">{event.item}</p>
                      <p className="text-xs text-[#6B6760]">
                        {event.date ? formatDate(event.date) : 'Date unavailable'} •{' '}
                        {event.verifier}
                      </p>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Link
                      href={viewerIsOwner ? ownerAuditHref : requestProofPackHref}
                      className="text-xs font-semibold text-[#1C4D3A] hover:text-[#143829]"
                    >
                      View full ledger
                    </Link>
                  </div>
                </div>
              ) : (
                <PublicProfileEmptyState
                  message={
                    viewerIsOwner
                      ? 'Request your first verification to start your trust ledger.'
                      : 'No verification activity yet.'
                  }
                  actions={
                    viewerIsOwner
                      ? [{ label: 'Request verification', href: expertiseHubHref }]
                      : [{ label: 'Request proof pack', href: requestProofPackHref }]
                  }
                />
              )}
            </PublicProfileSection>

            <PublicProfileSection title="Contact & share">
              <div className="space-y-2 text-sm">
                {visibility.contact && visibility.workEmail && individual?.work_email ? (
                  <ContactPill href={`mailto:${individual.work_email}`} label="Work email" />
                ) : (
                  <p className="rounded-md border border-[#E8E6DD] bg-white px-3 py-2 text-[#6B6760]">
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

        <section className="rounded-xl border border-[#E8E6DD] bg-[#FCFBF8] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {viewerIsOwner ? (
              <>
                <Button size="sm" asChild className="bg-[#1C4D3A] text-white hover:bg-[#163d2f]">
                  <Link href={expertiseHubHref}>Add proof</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={expertiseHubHref}>Request verification</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={editProfileHref}>Edit profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" asChild className="bg-[#1C4D3A] text-white hover:bg-[#163d2f]">
                  <Link href={collaborationHref}>Invite to assignment</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={requestProofPackHref}>Request proof pack</Link>
                </Button>
                <ShareLinkButton url={shareUrl} />
              </>
            )}
          </div>
        </section>
      </div>
    </PublicProfileShell>
  );
}

function buildFeaturedProofs({
  impactStories,
  fallbackSkillProofs,
  shareUrl,
}: {
  impactStories: ImpactStoryRow[];
  fallbackSkillProofs: SkillProofRow[];
  shareUrl: string;
}): FeaturedProof[] {
  if (impactStories.length > 0) {
    return impactStories.map((story) => {
      const measured = toMeasuredOutcomeLines(story.measured_outcomes);
      const narrativeOutcomes = toOutcomeLines(story.outcomes);
      const evidence = toEvidenceItems(story.supporting_artifacts);

      return {
        id: story.id,
        title: story.title,
        role: story.role_title || 'Role not specified',
        timeframe: story.timeline || 'Timeline not shared',
        outcomes: measured.length > 0 ? measured : narrativeOutcomes,
        evidence,
        verifiedBy: story.verified ? 'Verified' : 'Pending verification',
        proofPackHref: evidence[0]?.href || shareUrl,
      };
    });
  }

  return fallbackSkillProofs.map((proof) => {
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
      verifiedBy: proof.verified ? 'Verified' : 'Pending verification',
      proofPackHref: href,
    };
  });
}

function toMeasuredOutcomeLines(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 3)
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return '';
      }

      const label = typeof (entry as any).metric === 'string' ? (entry as any).metric : '';
      const amount = typeof (entry as any).value === 'string' ? (entry as any).value : '';
      const unit = typeof (entry as any).unit === 'string' ? (entry as any).unit : '';
      const composed = [label, [amount, unit].filter(Boolean).join(' ')].filter(Boolean).join(': ');
      return composed.trim();
    })
    .filter((line) => line.length > 0);
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

function toEvidenceItems(value: unknown): Array<{ label: string; href: string }> {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const href =
        typeof (entry as any).url === 'string'
          ? (entry as any).url
          : typeof (entry as any).href === 'string'
            ? (entry as any).href
            : null;

      if (!href) {
        return null;
      }

      const label =
        typeof (entry as any).title === 'string'
          ? (entry as any).title
          : typeof (entry as any).name === 'string'
            ? (entry as any).name
            : `Artifact ${index + 1}`;

      return { label, href };
    })
    .filter((item): item is { label: string; href: string } => Boolean(item))
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

function isRecentSkill(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return days <= 365;
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

function formatVerifierLabel(
  source: string | null | undefined,
  email: string | null | undefined
): string {
  if (email && email.includes('@')) {
    const [local, domain] = email.split('@');
    const start = local.slice(0, 1);
    return `${start}***@${domain}`;
  }

  if (source) {
    return `${source} verifier`;
  }

  return 'Verifier available on request';
}

function collaborationMailto({ subject, body }: { subject: string; body: string }): string {
  return `mailto:hello@proofound.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function statusFromVisibility(
  visible: boolean,
  hasSignal: boolean
): 'hidden' | 'present' | 'empty' {
  if (!visible) {
    return 'hidden';
  }
  return hasSignal ? 'present' : 'empty';
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
          : 'border-[#D9D5CC] bg-[#F7F6F1] text-[#6B6760]'
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

function CredibilityPill({
  label,
  status,
}: {
  label: string;
  status: 'hidden' | 'present' | 'empty';
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${
        status === 'present'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : status === 'hidden'
            ? 'border-[#E6E3DB] bg-[#F3F1EB] text-[#9A958D]'
            : 'border-[#D9D5CC] bg-white text-[#6B6760]'
      }`}
    >
      {label}: {status === 'present' ? 'Present' : status === 'hidden' ? 'Hidden' : 'Empty'}
    </span>
  );
}

function OpenToRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#E8E6DD] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#6B6760]">{label}</p>
      <p className="text-sm text-[#2D3330]">{value}</p>
    </div>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#D9D5CC] bg-white px-3 py-1 text-sm text-[#2D3330]">
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
      className="flex items-center gap-2 rounded-full border border-[#D9D5CC] bg-white px-3 py-1 text-[#2D3330] hover:border-[#1C4D3A]/40 hover:text-[#1C4D3A]"
    >
      {icon ?? <CalendarClock className="h-4 w-4" />}
      {label}
    </a>
  );
}
