'use client';

import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  Briefcase,
  Eye,
  FileText,
  LockKeyhole,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';
import type { ImpactStory, ProfileProofPack } from '@/types/profile';

type ImpactTabProps = {
  impactStories: ImpactStory[];
  proofPacks?: ProfileProofPack[];
  onAddStory: () => void;
  onEditStory: (story: ImpactStory) => void;
  onDeleteStory: (id: string) => void;
  actionsDisabled: boolean;
  completionState: IndividualProfileCompletionState;
  proofArtifactCount: number;
  acceptedVerificationCount: number;
  onAddFirstProof: () => void;
  onCompleteSafeShell: () => void;
};

type ProofPackSortMode =
  | 'newest'
  | 'proof_strength'
  | 'verification'
  | 'context_type'
  | 'visibility'
  | 'role_relevance';

const SORT_OPTIONS: Array<{ value: ProofPackSortMode; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'proof_strength', label: 'Strongest proof' },
  { value: 'verification', label: 'Verification state' },
  { value: 'context_type', label: 'Context type' },
  { value: 'visibility', label: 'Visibility' },
  { value: 'role_relevance', label: 'Role relevance' },
];

function resolveProofPackBlockers(completionState: IndividualProfileCompletionState) {
  const blockers: string[] = [];

  if (!completionState.checks.hasSafeShell) {
    blockers.push('Complete your safe shell before publishing proof publicly.');
  }

  if (!completionState.checks.hasRealContext) {
    blockers.push('Add one real context so your proof has a credible anchor.');
  }

  if (!completionState.checks.hasFirstProof) {
    blockers.push('Add your first proof link or artifact.');
  }

  if (!completionState.checks.hasStructuredProofPack) {
    blockers.push('Structure one anchored Proof Pack before you publish.');
  }

  if (!completionState.checks.hasRequiredVerification) {
    blockers.push('Add one accepted non-self verification tied to anchored proof.');
  }

  if (!completionState.checks.hasPublishedPortfolio) {
    blockers.push('Choose one proof-backed public signal and publish your portfolio.');
  }

  return blockers.slice(0, 3);
}

function formatEnumLabel(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatContextType(value: string) {
  switch (value) {
    case 'experience':
      return 'Work context';
    case 'education':
      return 'Learning context';
    case 'volunteering':
      return 'Volunteering context';
    case 'impact_story':
      return 'Impact story';
    case 'skill':
      return 'Skill context';
    case 'project':
      return 'Project context';
    default:
      return formatEnumLabel(value);
  }
}

function formatVisibility(value: ProfileProofPack['visibility']) {
  switch (value) {
    case 'public':
      return 'Public';
    case 'link_only':
      return 'Link only';
    case 'matched_org':
      return 'Matched org';
    case 'internal_only':
      return 'Internal only';
    case 'owner_only':
    default:
      return 'Private';
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function toTime(value: string | null) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getVerificationRank(status: ProfileProofPack['verificationStatus']) {
  switch (status) {
    case 'verified':
      return 4;
    case 'partially_verified':
      return 3;
    case 'unverified':
      return 2;
    case 'disputed':
    default:
      return 1;
  }
}

function getFreshnessRank(state: ProfileProofPack['freshnessState']) {
  switch (state) {
    case 'fresh':
      return 4;
    case 'review_soon':
      return 3;
    case 'stale':
      return 2;
    case 'expired':
    default:
      return 1;
  }
}

function getVisibilityRank(visibility: ProfileProofPack['visibility']) {
  switch (visibility) {
    case 'public':
      return 5;
    case 'link_only':
      return 4;
    case 'matched_org':
      return 3;
    case 'owner_only':
      return 2;
    case 'internal_only':
    default:
      return 1;
  }
}

function getRoleRelevanceRank(pack: ProfileProofPack) {
  return (
    (pack.roleContext ? 3 : 0) +
    Math.min(pack.linkedSkills.length, 3) +
    (pack.contextType !== 'individual_profile' ? 1 : 0)
  );
}

function getProofStrengthRank(pack: ProfileProofPack) {
  return (
    (pack.proofQualityScore ?? 0) * 100 +
    getVerificationRank(pack.verificationStatus) * 8 +
    getFreshnessRank(pack.freshnessState) * 4 +
    Math.min(pack.artifacts.length, 5)
  );
}

function compareNewest(left: ProfileProofPack, right: ProfileProofPack) {
  return (
    toTime(right.createdAt ?? right.lastRefreshedAt ?? right.updatedAt) -
    toTime(left.createdAt ?? left.lastRefreshedAt ?? left.updatedAt)
  );
}

function sortProofPacks(packs: ProfileProofPack[], sortMode: ProofPackSortMode) {
  return [...packs].sort((left, right) => {
    switch (sortMode) {
      case 'proof_strength':
        return (
          getProofStrengthRank(right) - getProofStrengthRank(left) || compareNewest(left, right)
        );
      case 'verification':
        return (
          getVerificationRank(right.verificationStatus) -
            getVerificationRank(left.verificationStatus) || compareNewest(left, right)
        );
      case 'context_type':
        return (
          formatContextType(left.contextType).localeCompare(formatContextType(right.contextType)) ||
          compareNewest(left, right)
        );
      case 'visibility':
        return (
          getVisibilityRank(right.visibility) - getVisibilityRank(left.visibility) ||
          compareNewest(left, right)
        );
      case 'role_relevance':
        return (
          getRoleRelevanceRank(right) - getRoleRelevanceRank(left) || compareNewest(left, right)
        );
      case 'newest':
      default:
        return compareNewest(left, right);
    }
  });
}

function VerificationBadge({ status }: { status: ProfileProofPack['verificationStatus'] }) {
  if (status === 'verified') {
    return <Badge variant="verified-premium">Verified</Badge>;
  }
  if (status === 'partially_verified') {
    return <Badge variant="info">Partially verified</Badge>;
  }
  if (status === 'disputed') {
    return <Badge variant="destructive">Disputed</Badge>;
  }
  return <Badge variant="outline">Unverified</Badge>;
}

function VisibilityBadge({ visibility }: { visibility: ProfileProofPack['visibility'] }) {
  const isPrivate = visibility === 'owner_only' || visibility === 'internal_only';
  const Icon = isPrivate ? LockKeyhole : Eye;

  return (
    <Badge variant={isPrivate ? 'outline' : 'success'} className="gap-1.5">
      <Icon className="h-3 w-3" />
      {formatVisibility(visibility)}
    </Badge>
  );
}

export function ImpactTab({
  proofPacks = [],
  completionState,
  proofArtifactCount,
  acceptedVerificationCount,
  actionsDisabled,
  onAddFirstProof,
  onCompleteSafeShell,
}: ImpactTabProps) {
  const [sortMode, setSortMode] = useState<ProofPackSortMode>('newest');
  const blockers = resolveProofPackBlockers(completionState);
  const sortedProofPacks = useMemo(
    () => sortProofPacks(proofPacks, sortMode),
    [proofPacks, sortMode]
  );
  const primaryCtaLabel = !completionState.checks.hasSafeShell
    ? 'Complete safe shell'
    : proofArtifactCount > 0
      ? 'Add another proof'
      : 'Add your first proof';
  const primaryCtaAction = !completionState.checks.hasSafeShell
    ? onCompleteSafeShell
    : onAddFirstProof;

  return (
    <TabsContent value="proof_packs" className="space-y-6">
      <div className="rounded-lg border border-proofound-stone/60 bg-white p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
              <PackageOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Proof Packs</h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Browse anchored proof by artifact, context, outcomes, skills, verification, and
                visibility without turning proof into a popularity feed.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-64">
            <label
              htmlFor="proof-pack-sort"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
            >
              <ArrowDownUp className="h-3.5 w-3.5" />
              Sort
            </label>
            <select
              id="proof-pack-sort"
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as ProofPackSortMode)}
              className="h-10 rounded-md border border-proofound-stone bg-white px-3 text-sm text-foreground outline-none focus:border-proofound-forest focus:ring-2 focus:ring-proofound-forest/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-proofound-stone/60 bg-japandi-bg/40 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Packs</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {completionState.counts.proofPacks}
            </p>
          </div>
          <div className="rounded-lg border border-proofound-stone/60 bg-japandi-bg/40 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Artifacts</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{proofArtifactCount}</p>
          </div>
          <div className="rounded-lg border border-proofound-stone/60 bg-japandi-bg/40 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Verification
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {acceptedVerificationCount}
            </p>
          </div>
        </div>
      </div>

      {sortedProofPacks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2" aria-live="polite">
          {sortedProofPacks.map((pack) => {
            const refreshedAt = formatDate(
              pack.lastRefreshedAt ?? pack.updatedAt ?? pack.createdAt
            );
            const visibleArtifacts = pack.artifacts.slice(0, 3);

            return (
              <Card
                key={pack.id}
                className="rounded-lg border-proofound-stone/70 p-5 shadow-none"
                data-testid="proof-pack-card"
              >
                <div className="flex h-full flex-col gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <VerificationBadge status={pack.verificationStatus} />
                      <VisibilityBadge visibility={pack.visibility} />
                      <Badge variant="outline">{formatEnumLabel(pack.freshnessState)}</Badge>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-semibold leading-snug text-foreground">
                        {pack.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {pack.primaryClaim ||
                          pack.summary ||
                          'Structured proof without a claim summary yet.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <div className="rounded-lg border border-proofound-stone/60 bg-white px-3 py-2">
                      <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <Briefcase className="h-4 w-4 text-proofound-forest" />
                        Context
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {pack.contextLabel
                          ? `${pack.contextLabel} - ${formatContextType(pack.contextType)}`
                          : formatContextType(pack.contextType)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-proofound-stone/60 bg-white px-3 py-2">
                      <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <Sparkles className="h-4 w-4 text-proofound-forest" />
                        Outcomes
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {pack.outcomesSummary || 'No outcome summary recorded yet.'}
                      </p>
                    </div>

                    <div className="rounded-lg border border-proofound-stone/60 bg-white px-3 py-2">
                      <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                        <FileText className="h-4 w-4 text-proofound-forest" />
                        Artifacts
                      </p>
                      {visibleArtifacts.length > 0 ? (
                        <ul className="mt-2 space-y-1">
                          {visibleArtifacts.map((artifact) => (
                            <li key={artifact.id} className="text-muted-foreground">
                              {artifact.title}
                              <span className="text-muted-foreground/70">
                                {' '}
                                ({formatEnumLabel(artifact.kind)})
                              </span>
                            </li>
                          ))}
                          {pack.artifacts.length > visibleArtifacts.length && (
                            <li className="text-muted-foreground">
                              +{pack.artifacts.length - visibleArtifacts.length} more artifact
                              {pack.artifacts.length - visibleArtifacts.length === 1 ? '' : 's'}
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="mt-1 text-muted-foreground">No artifacts attached yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto space-y-3 border-t border-proofound-stone/60 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {pack.linkedSkills.length > 0 ? (
                        pack.linkedSkills.slice(0, 4).map((skill) => (
                          <Badge key={skill.id} variant="glass" className="gap-1.5">
                            <Tag className="h-3 w-3" />
                            {skill.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">No linked skills yet</Badge>
                      )}
                    </div>

                    <div className="grid gap-2 text-xs text-muted-foreground">
                      <p className="inline-flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-proofound-forest" />
                        {pack.verificationSummary}
                      </p>
                      <p>
                        {pack.roleContext
                          ? `Role relevance: ${pack.roleContext}`
                          : 'Role relevance: no role context recorded yet.'}
                      </p>
                      {refreshedAt && <p>Last refreshed {refreshedAt}</p>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-proofound-stone/70 bg-white p-6">
          <p className="text-sm font-semibold text-foreground">No browsable Proof Packs yet</p>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Add a real proof artifact and anchor it to context. Once the canonical pack exists, it
            will appear here as a reviewable card.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-proofound-stone/60 bg-japandi-bg/50 p-4">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-proofound-forest" />
          Readiness blockers
        </p>
        {blockers.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {blockers.map((blocker) => (
              <li key={blocker} className="text-sm text-muted-foreground">
                {blocker}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Your portfolio foundation is in place. Keep proof fresh and public-safe.
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={primaryCtaAction}
        disabled={actionsDisabled}
        className="bg-proofound-forest text-white hover:bg-proofound-forest/90"
      >
        {primaryCtaLabel}
      </Button>
    </TabsContent>
  );
}
