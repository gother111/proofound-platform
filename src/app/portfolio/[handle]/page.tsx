import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { HoverTilt } from '@/components/ui/hover-tilt';
import { FadeIn } from '@/components/ui/fade-in';
import { SlideUp } from '@/components/ui/slide-up';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ShieldCheck,
  Mail,
  Link2,
  Sparkles,
  CheckCircle2,
  Globe2,
  UserRound,
  ArrowLeft,
} from 'lucide-react';
import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
import { sanitizeReturnPath } from '@/lib/navigation/sanitize-return-path';
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
    <AppSurface density="comfortable" className="min-h-screen">
      <FadeIn duration={0.6}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 lg:flex-row lg:py-8">
          <div className="flex-1 space-y-6">
            <SlideUp delay={0.1}>
              <GlassCard interactive>
                <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-semibold text-white">
                      {displayName[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold text-slate-900">{displayName}</h1>
                        {visibility.identity && signals.identity.verified && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-200 text-emerald-700"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      {visibility.header && (
                        <>
                          <p className="text-sm text-slate-600">@{profile.handle}</p>
                          <p className="text-sm text-slate-700">{headline}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={returnPath} className="inline-flex items-center gap-1.5">
                        <ArrowLeft className="h-4 w-4" />
                        {returnLabel}
                      </Link>
                    </Button>
                    <ShareLinkButton url={shareUrl} />
                    {viewerIsOwner && <CopyTextButton />}
                    {viewerIsOwner && <DownloadPdfButton />}
                    <ViewCounterClient handle={handle} showCount={viewerIsOwner} />
                  </div>
                </CardContent>
              </GlassCard>
            </SlideUp>

            {publicMessage && (
              <SlideUp delay={0.2}>
                <GlassCard>
                  <CardContent className="flex items-center gap-3 p-4 text-sm text-slate-700">
                    <Globe2 className="h-4 w-4 text-slate-500" />
                    {publicMessage}
                  </CardContent>
                </GlassCard>
              </SlideUp>
            )}

            {visibility.proofBar && (
              <SlideUp delay={0.3}>
                <GlassCard>
                  <CardHeader>
                    <CardTitle>Trust signals</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    {visibility.identity && (
                      <TrustRow
                        label="Identity"
                        value={signals.identity.verified ? 'Verified' : 'Not verified'}
                        helper={
                          signals.identity.verified
                            ? `Method: ${signals.identity.method ?? '—'}`
                            : 'Complete identity verification to boost trust.'
                        }
                        positive={signals.identity.verified}
                      />
                    )}
                    {visibility.workEmail && (
                      <TrustRow
                        label="Work email"
                        value={signals.workEmail.verified ? 'Verified' : 'Not verified'}
                        helper={
                          signals.workEmail.verified
                            ? 'Work email confirmed.'
                            : 'Verify a work email for extra credibility.'
                        }
                        positive={signals.workEmail.verified}
                      />
                    )}
                    {visibility.linkedin && (
                      <TrustRow
                        label="LinkedIn"
                        value={
                          signals.linkedin.verificationStatus === 'pending'
                            ? 'Pending'
                            : signals.linkedin.verificationStatus === 'verified' &&
                                signals.linkedin.hasIdentityVerification
                              ? 'Verified (Identity badge)'
                              : signals.linkedin.verificationStatus === 'verified'
                                ? 'Verified (no identity badge)'
                                : signals.linkedin.verificationStatus === 'failed'
                                  ? 'Failed'
                                  : 'Not checked'
                        }
                        helper={
                          signals.linkedin.verificationStatus === 'pending'
                            ? 'LinkedIn verification is under review.'
                            : signals.linkedin.verificationStatus === 'verified' &&
                                signals.linkedin.hasIdentityVerification
                              ? 'Official LinkedIn identity verification detected.'
                              : signals.linkedin.verificationStatus === 'verified'
                                ? 'LinkedIn verification completed without identity badge.'
                                : signals.linkedin.verificationStatus === 'failed'
                                  ? 'Retry LinkedIn verification to refresh this signal.'
                                  : 'Run LinkedIn check for a quick trust boost.'
                        }
                        positive={signals.linkedin.verificationStatus === 'verified'}
                      />
                    )}
                    {visibility.counts && (
                      <>
                        <TrustRow
                          label="Proofs"
                          value={`${signals.proofs.count} added`}
                          helper="Add proof links or uploads to your top skills."
                          positive={signals.proofs.count > 0}
                        />
                        <TrustRow
                          label="Verified skills"
                          value={`${signals.verifications.count} accepted`}
                          helper="Ask a peer/manager to verify a skill."
                          positive={signals.verifications.count > 0}
                        />
                        <TrustRow
                          label="Peer attestations"
                          value={`${signals.attestations.count} received`}
                          helper="Collect attestations to strengthen trust."
                          positive={signals.attestations.count > 0}
                        />
                      </>
                    )}
                  </CardContent>
                </GlassCard>
              </SlideUp>
            )}

            <SlideUp delay={0.4}>
              <GlassCard>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibility.bio ? (
                    <p className="text-sm text-slate-700">{bio}</p>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {viewerIsOwner
                        ? 'Bio/About is hidden from public view.'
                        : 'This section is hidden.'}
                    </p>
                  )}
                  {viewerIsOwner && (
                    <p className="text-xs text-slate-500">
                      Edit your profile, proofs, and verifications from Settings or Expertise Hub.
                    </p>
                  )}
                </CardContent>
              </GlassCard>
            </SlideUp>
          </div>

          <div className="flex-1 space-y-6">
            <SlideUp delay={0.5}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Proofs & verifications</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    High-signal
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibility.counts ? (
                    <>
                      <SummaryRow
                        label="Proofs added"
                        value={signals.proofs.count}
                        description="Links, media, certifications, or project evidence."
                      />
                      <Separator />
                      <SummaryRow
                        label="Skills verified"
                        value={signals.verifications.count}
                        description="Accepted verification requests from peers or managers."
                      />
                      <Separator />
                      <SummaryRow
                        label="Peer attestations"
                        value={signals.attestations.count}
                        description="Trusted confirmations attached to your profile."
                      />
                      {viewerIsOwner && (
                        <p className="text-xs text-slate-500">
                          Tip: Add proof to your top 3 skills, then request one verification each
                          for a fast trust lift.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">
                      {viewerIsOwner
                        ? 'Counts are hidden from public view.'
                        : 'This section is hidden.'}
                    </p>
                  )}
                </CardContent>
              </GlassCard>
            </SlideUp>

            <SlideUp delay={0.6}>
              <GlassCard>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Skills snapshot</CardTitle>
                  <Badge variant="outline" className="gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    {skillView.length || 'Add skills'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibility.skills ? (
                    skillView.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        {viewerIsOwner
                          ? 'Add your top skills and proofs to light up this section.'
                          : 'Skills will appear here once added.'}
                      </p>
                    ) : (
                      skillView.map((skill) => (
                        <div key={skill.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm text-slate-800">
                            <span>{skill.name}</span>
                            <span className="text-slate-500">
                              {Math.round((skill.level / 5) * 100)}%
                            </span>
                          </div>
                          <Progress value={(skill.level / 5) * 100} className="h-2" />
                        </div>
                      ))
                    )
                  ) : (
                    <p className="text-sm text-slate-600">
                      {viewerIsOwner ? 'Skills hidden from public view.' : 'Skills are hidden.'}
                    </p>
                  )}
                </CardContent>
              </GlassCard>
            </SlideUp>

            <SlideUp delay={0.7}>
              <GlassCard>
                <CardHeader>
                  <CardTitle>Contact</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3 text-sm">
                  {individual?.work_email && visibility.contact ? (
                    <ContactPill href={`mailto:${individual.work_email}`} label="Work email" />
                  ) : (
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-500">
                      Contact email hidden
                    </span>
                  )}
                  <ContactPill
                    href={shareUrl}
                    label="Shareable link"
                    icon={<Link2 className="h-4 w-4" />}
                  />
                </CardContent>
              </GlassCard>
            </SlideUp>
          </div>
        </div>
      </FadeIn>
    </AppSurface>
  );
}

function TrustRow({
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
    <HoverTilt intensity={2}>
      <div className="h-full rounded-lg border border-slate-200 bg-white/60 p-3 shadow-sm transition-colors hover:bg-white/80 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900/80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={`h-4 w-4 ${positive ? 'text-emerald-600' : 'text-slate-400'}`}
            />
            <p className="text-sm font-semibold text-slate-900">{label}</p>
          </div>
          <Badge variant={positive ? 'default' : 'outline'} className="text-xs">
            {value}
          </Badge>
        </div>
        {helper && <p className="mt-2 text-xs text-slate-600">{helper}</p>}
      </div>
    </HoverTilt>
  );
}

function SummaryRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <HoverTilt intensity={2} className="block w-full">
      <div className="flex items-start justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-slate-100/50 dark:hover:bg-slate-800/50">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          {value}
        </div>
      </div>
    </HoverTilt>
  );
}

function ContactPill({
  href,
  label,
  icon,
  muted,
}: {
  href: string;
  label: string;
  icon?: ReactNode;
  muted?: boolean;
}) {
  return (
    <a
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noreferrer"
      className={`flex items-center gap-2 rounded-full border px-3 py-1 ${
        muted
          ? 'border-slate-200 text-slate-500'
          : 'border-slate-200 text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
      }`}
    >
      {icon ?? <Mail className="h-4 w-4" />}
      {label}
    </a>
  );
}
