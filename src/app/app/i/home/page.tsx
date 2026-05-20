import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getDashboardMetrics } from '@/lib/dashboard/metrics';
import {
  ArrowRight,
  Briefcase,
  Download,
  Eye,
  FileCheck2,
  History,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

type ReadinessState = 'ok' | 'warn' | 'wait' | 'neutral';

function readinessStateClasses(state: ReadinessState) {
  switch (state) {
    case 'ok':
      return {
        icon: 'bg-[#dff0d9] text-proofound-forest',
        pill: 'bg-[#dff0d9] text-proofound-forest',
      };
    case 'warn':
      return {
        icon: 'bg-[#fff1df] text-[#8a4d1f]',
        pill: 'bg-[#fff1df] text-[#8a4d1f]',
      };
    case 'wait':
      return {
        icon: 'bg-[#eef3e8] text-proofound-forest',
        pill: 'bg-[#eef3e8] text-proofound-forest',
      };
    default:
      return {
        icon: 'bg-proofound-stone/35 text-muted-foreground',
        pill: 'bg-proofound-stone/35 text-muted-foreground',
      };
  }
}

export default async function IndividualHomePage() {
  const user = await requireAuth();

  // Safely load metrics with fallback values
  let metrics;
  try {
    metrics = await getDashboardMetrics();
  } catch (error) {
    console.error('Failed to load proof home metrics:', error);
    // Fallback to default values if metrics fail to load
    metrics = {
      proofStoriesCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 0,
      qualifiedMatches: 0,
      activeIntroductions: 0,
    };
  }

  const userName = user.displayName || user.handle || 'there';
  const firstName = userName.split(' ')[0];
  const hasProof = metrics.proofStoriesCount > 0;
  const hasTrustAnchor = metrics.verifiedSkills > 0;
  const hasPendingTrustAnchor = metrics.pendingVerifications > 0;
  const primaryProofLabel = hasProof ? 'Review Proof Packs' : 'Start proof record';
  const readinessTone = hasProof
    ? hasTrustAnchor
      ? 'Proof and verification are present'
      : 'Proof present; verification is next'
    : 'Start with one proof record';

  const proofRecords = [
    {
      icon: FileCheck2,
      title: 'Proof Packs',
      detail: hasProof
        ? `${metrics.proofStoriesCount} proof item${metrics.proofStoriesCount === 1 ? '' : 's'}`
        : 'No proof yet. Start with one private record.',
      status: hasProof ? 'Present' : 'Pending',
      tone: hasProof ? 'info' : 'warning',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
    },
    {
      icon: ShieldCheck,
      title: 'Verification',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} accepted verification${metrics.verifiedSkills === 1 ? '' : 's'}`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
            : 'No non-self verification yet. You can add this after the first proof.',
      status:
        metrics.verifiedSkills > 0
          ? 'Verified'
          : metrics.pendingVerifications > 0
            ? 'Pending'
            : 'Needed',
      tone:
        metrics.verifiedSkills > 0
          ? 'success'
          : metrics.pendingVerifications > 0
            ? 'warning'
            : 'neutral',
      href: '/app/i/verifications',
    },
    {
      icon: Eye,
      title: 'Public Page visibility',
      detail: hasProof
        ? 'Public-safe sharing controls'
        : 'Private by default until you choose to share',
      status: hasProof ? 'Review' : 'Locked',
      tone: hasProof ? 'info' : 'neutral',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
  ];

  const readinessSteps = [
    {
      icon: FileCheck2,
      title: hasProof ? 'Proof Pack is present' : 'First proof artifact',
      detail: hasProof
        ? 'Check the context, evidence, and visibility before sharing.'
        : 'Start with one useful artifact. It stays private while you shape it.',
      action: hasProof ? 'Review proof' : 'Start proof',
      href: '/app/i/profile?profileView=full&tab=proof_packs',
      status: hasProof ? 'Ready' : 'Needed',
      state: hasProof ? 'ok' : 'warn',
    },
    {
      icon: ShieldCheck,
      title:
        metrics.verifiedSkills > 0
          ? 'Verification accepted'
          : metrics.pendingVerifications > 0
            ? 'Verification in review'
            : 'Verification missing',
      detail:
        metrics.verifiedSkills > 0
          ? `${metrics.verifiedSkills} accepted verification${metrics.verifiedSkills === 1 ? '' : 's'} attached to your proof.`
          : metrics.pendingVerifications > 0
            ? `${metrics.pendingVerifications} verification request${metrics.pendingVerifications === 1 ? '' : 's'} pending`
            : 'Nothing is exposed yet. Add one trusted source when you are ready.',
      action: metrics.pendingVerifications > 0 ? 'View request' : 'Plan anchor',
      href: '/app/i/verifications',
      status:
        metrics.verifiedSkills > 0
          ? 'Verified'
          : metrics.pendingVerifications > 0
            ? 'Waiting'
            : 'Needed',
      state: metrics.verifiedSkills > 0 ? 'ok' : metrics.pendingVerifications > 0 ? 'wait' : 'warn',
    },
    {
      icon: Eye,
      title: hasProof ? 'Public Page visibility review' : 'Public Page not ready yet',
      detail: hasProof
        ? 'Your proof surface is ready for a final sharing pass.'
        : 'Sharing stays off by default until your first proof record is clearer.',
      action: 'Manage visibility',
      href: '/app/i/profile?profileView=full&tab=visibility',
      status: hasProof ? 'Review' : 'Locked',
      state: hasProof ? 'wait' : 'warn',
    },
  ] satisfies Array<{
    icon: typeof FileCheck2;
    title: string;
    detail: string;
    action: string;
    href: string;
    status: string;
    state: ReadinessState;
  }>;
  const unresolvedReadinessSteps = readinessSteps.filter((step) => step.state !== 'ok').length;
  const trustControls = [
    {
      icon: LockKeyhole,
      title: 'Privacy controls',
      href: '/app/i/settings/privacy',
    },
    {
      icon: Eye,
      title: 'Manage visibility',
      href: '/app/i/profile?profileView=full&tab=visibility',
    },
    {
      icon: Download,
      title: 'Export or delete',
      href: '/app/i/settings?tab=privacy',
    },
    {
      icon: History,
      title: 'Account history',
      href: '/app/i/settings/audit-log',
    },
  ];

  const scoreItems = [
    {
      label: `${metrics.verifiedSkills} accepted verification${metrics.verifiedSkills === 1 ? '' : 's'}`,
      state: hasTrustAnchor ? 'ok' : 'warn',
    },
    {
      label: `${metrics.pendingVerifications} pending verification${metrics.pendingVerifications === 1 ? '' : 's'}`,
      state: hasPendingTrustAnchor ? 'warn' : 'ok',
    },
    {
      label: `${metrics.proofStoriesCount} proof item${metrics.proofStoriesCount === 1 ? '' : 's'} ready`,
      state: hasProof ? 'ok' : 'warn',
    },
    {
      label: hasProof ? 'Public Page can be reviewed' : 'Public Page waits for first proof',
      state: hasProof ? 'wait' : 'warn',
    },
  ];

  return (
    <AppSurface density="comfortable" className="bg-[#f7f2ea]">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="overflow-hidden rounded-lg border border-proofound-stone/70 bg-white shadow-[0_18px_50px_rgba(45,51,48,0.06)]">
          <div className="border-b border-proofound-stone/60 bg-[#f3f6ef] px-6 py-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold tracking-wide uppercase text-proofound-forest">
              Portfolio Readiness
            </h2>
            <Badge
              variant="outline"
              className={
                hasProof
                  ? 'border-proofound-forest/20 bg-[#eef3e8] text-proofound-forest'
                  : 'border-proofound-stone/50 bg-[#fbf8f1] text-[#8a5b00]'
              }
            >
              {hasProof ? 'Ready to Share' : 'Setup Required'}
            </Badge>
          </div>
          <div className="p-6 md:p-8 space-y-6">
            <div className="space-y-3">
              <h1 className="font-display text-2xl font-medium leading-tight text-proofound-charcoal md:text-3xl">
                {hasProof
                  ? 'Review and manage your proof portfolio'
                  : 'Build your proof-first profile'}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Welcome back, {firstName}.{' '}
                {hasProof
                  ? 'Your proof records are structured. Review your verified skills and publish your public page to align with the matching corridor.'
                  : 'Start by creating your first proof record. Shaping a single trusted work sample or artifact makes your profile ready.'}
              </p>
            </div>

            <div className="pt-2">
              <Button
                className="w-full justify-between bg-proofound-forest px-6 py-5 text-white hover:bg-proofound-forest/90"
                asChild
              >
                <Link href={hasProof ? '/app/i/profile?profileView=full' : '/app/i/profile'}>
                  {hasProof ? 'Go to profile' : 'Guided setup'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="border-t border-proofound-stone/60 pt-6">
              <div className="flex items-start gap-3 rounded-lg bg-[#fbf8f1] p-4 border border-proofound-stone/40">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-proofound-forest" />
                <p className="text-xs leading-5 text-proofound-charcoal/90">
                  Your profile is private by default. Candidates stay hidden until they explicitly
                  authorize discovery or initiate a verification check.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppSurface>
  );
}
