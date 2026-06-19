'use client';

import { useEffect, useState, type ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Clock,
  DollarSign,
  Shield,
  Eye,
  EyeOff,
  BellOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { VerificationGatesWarning } from './VerificationGatesWarning';
import { apiFetch } from '@/lib/api/fetch';
import {
  MATCH_EXPLAINER_TEST_IDS,
  MATCH_EXPLAINER_TRIGGER_LABEL,
} from '@/lib/matching/explainer-contract';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { skillDisplayLabel } from '@/lib/copy/labels';
import { reasonCodeDisplayLabel } from '@/lib/matching/reason-codes';

const PROOF_SIGNAL_LABELS: Record<string, string> = {
  skills_fit: 'Skills',
  proof_fit: 'Proof',
  constraints_fit: 'Practical',
  verification_fit: 'Trust',
  skills: 'Skills',
  proof: 'Proof',
  constraints: 'Practical',
  verifications: 'Trust',
  recency: 'Recent',
  evidence: 'Evidence',
};

function reviewBandLabel(label?: string | null): string | null {
  if (!label) return null;
  if (
    /^top\s*\d+/i.test(label) ||
    /^#\d+/i.test(label) ||
    /^(highest-priority|high-priority|priority|strong|clear)\s+proof review$/i.test(label) ||
    /^(highest-priority|high-priority|priority|strong|clear)$/i.test(label)
  ) {
    return 'Review-ready proof';
  }
  return label;
}

const REVIEW_STATE_LABELS: Record<string, string> = {
  possible_discovery_match: 'Possible discovery',
  review_ready_match: 'Review ready',
  intro_ready_match: 'Intro ready',
  strong_evidence_overlap: 'Strong evidence overlap',
  relevant_partial: 'Relevant partial',
  adjacent_exploratory: 'Adjacent exploratory',
  needs_more_proof: 'Needs more proof',
  constraint_or_trust_hold: 'Constraint or trust hold',
  intro_ready: 'Intro ready',
  intro_hold_missing_trust_anchor: 'Trust anchor needed',
  intro_hold_missing_fresh_relevant_proof: 'Fresh proof needed',
  intro_hold_constraint_mismatch: 'Constraint hold',
  intro_hold_privacy_or_policy_review: 'Privacy or policy hold',
  intro_hold_not_match_visible: 'Discovery only',
};

const MATCH_EXPLAINER_LOADING_LABEL = 'Loading proof reasoning...';
const MATCH_EXPLAINER_ERROR_MESSAGE =
  'Proof reasoning could not load. Your match review is unchanged; try again.';

function reviewStateLabel(value?: string | null): string | null {
  if (!value) return null;
  return REVIEW_STATE_LABELS[value] ?? value.replace(/_/g, ' ');
}

type DeferredComponent = ComponentType<any>;

interface MatchResultCardProps {
  result: {
    id?: string; // Match ID for fetching detailed explanation
    contributions?: Record<string, number>;
    proofSignals?: Array<{ key: string; support: string }>;
    profileId?: string;
    assignmentId?: string;
    reviewStage?: string;
    revealScope?: string;
    corridorState?: string;
    progressiveRevealStage?: string;
    discoveryStatus?: string;
    fitBand?: string;
    introGate?: string;
    canRequestIntro?: boolean;
    missingGates?: string[];
    supplyState?: string | null;
    visibleIdentityFields?: string[];
    fairness?: {
      status?: string;
    };
    reviewCard?: {
      candidateLabel: string;
      strongestProof: {
        summary: string | null;
        outcome: string | null;
        ownership: string | null;
        anchorContext: string | null;
        freshnessLabel: string | null;
      };
      verification: {
        summaryLabel: string;
        count: number | null;
      };
      trustLabels: string[];
      fitBand: string | null;
      fitSummary: {
        headline: string;
        bullets: string[];
        reasonCodes: string[];
      };
    };
    profile?: {
      workMode?: string;
      locationMode?: string;
      country?: string;
      hoursMin?: number;
      hoursMax?: number;
      compMin?: number;
      compMax?: number;
      currency?: string;
    };
    assignment?: {
      role?: string;
      locationMode?: string;
      workMode?: string;
      country?: string;
      hoursMin?: number;
      hoursMax?: number;
      compMin?: number;
      compMax?: number;
      currency?: string;
    };
    gaps?: Array<{ id: string; required: number; have: number }>;
  };
  variant?: 'blind' | 'revealed';
  onInterested?: () => void;
  onHide?: () => void;
  skills?: Array<{ id: string; label: string; level: number }>;
}

/**
 * Match result card showing blind-first or revealed match details.
 */
export function MatchResultCard({
  result,
  variant = 'blind',
  onInterested,
  onHide,
  skills = [],
}: MatchResultCardProps) {
  const isOrgView = !!result.profileId; // Org reviewing proof submissions
  const data = isOrgView ? result.profile : result.assignment;
  const [matchExplanation, setMatchExplanation] = useState<any>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState<string | null>(null);
  const [openExplanationWhenReady, setOpenExplanationWhenReady] = useState(false);
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [showGatesWarning, setShowGatesWarning] = useState(false);
  const [gateCheckResult, setGateCheckResult] = useState<any>(null);
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [visibleFieldsData, setVisibleFieldsData] = useState<any>(null);
  const [MatchExplainerModalView, setMatchExplainerModalView] = useState<DeferredComponent | null>(
    null
  );
  const [SnoozeDialogView, setSnoozeDialogView] = useState<DeferredComponent | null>(null);
  const [ConsentToShareDialogView, setConsentToShareDialogView] =
    useState<DeferredComponent | null>(null);

  const topSkills = skills.slice(0, 3);
  const showExactCompensation =
    (result.assignment as any)?.visibility?.showExactSalary === true ||
    (result.profile as any)?.visibility?.showExactSalary === true ||
    (data as any)?.showExactSalary === true;

  const proofSignals = result.proofSignals ?? [];
  const proofFitLabel = proofSignals.length > 0 ? 'Proof signals available' : 'Proof review needed';
  const contributionLabel = (key: string) =>
    PROOF_SIGNAL_LABELS[key] ||
    key.replace(/[_-]+/g, ' ').replace(/^\w/, (char) => char.toUpperCase());
  useEffect(() => {
    if (!matchExplanation || MatchExplainerModalView) {
      return;
    }

    let cancelled = false;

    void import('./MatchExplainerModal').then((module) => {
      if (!cancelled) {
        setMatchExplainerModalView(() => module.MatchExplainerModal);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [MatchExplainerModalView, matchExplanation]);

  useEffect(() => {
    if (!isSnoozeDialogOpen || SnoozeDialogView) {
      return;
    }

    let cancelled = false;

    void import('./SnoozeDialog').then((module) => {
      if (!cancelled) {
        setSnoozeDialogView(() => module.SnoozeDialog);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [SnoozeDialogView, isSnoozeDialogOpen]);

  useEffect(() => {
    if (!visibleFieldsData || ConsentToShareDialogView) {
      return;
    }

    let cancelled = false;

    void import('./ConsentToShareDialog').then((module) => {
      if (!cancelled) {
        setConsentToShareDialogView(() => module.ConsentToShareDialog);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ConsentToShareDialogView, visibleFieldsData]);

  // Fetch detailed match explanation when requested
  const fetchMatchExplanation = async () => {
    if (!result.id || matchExplanation) return; // Already loaded

    setIsLoadingExplanation(true);
    setExplanationError(null);
    setOpenExplanationWhenReady(true);
    try {
      const response = await apiFetch(`/api/match/explain/${result.id}`);
      if (!response.ok) {
        throw new Error('match_explanation_request_failed');
      }

      const data = await response.json();
      setMatchExplanation(data);
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.result_card.explanation_fetch_failed', error);
      setExplanationError(MATCH_EXPLAINER_ERROR_MESSAGE);
      setOpenExplanationWhenReady(false);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  // Fetch visible fields for consent dialog
  const fetchVisibleFields = async () => {
    if (!result.id) return;

    try {
      const response = await apiFetch(`/api/match/visible-fields/${result.id}`);
      if (response.ok) {
        const data = await response.json();
        setVisibleFieldsData(data);
        setIsConsentDialogOpen(true);
      }
    } catch (error) {
      dispatchClientErrorDiagnostic('matching.result_card.visible_fields_fetch_failed', error);
    }
  };

  // Handle consent and interest
  const handleInterested = async () => {
    if (!isOrgView) {
      // Individual view - check gates first
      if (result.assignmentId) {
        try {
          const gatesResponse = await apiFetch('/api/match/gates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId: result.assignmentId,
            }),
          });

          if (gatesResponse.ok) {
            const gatesData = await gatesResponse.json();
            if (!gatesData.canIntroduce) {
              setGateCheckResult(gatesData);
              setShowGatesWarning(true);
              return;
            }
          }
        } catch (error) {
          dispatchClientErrorDiagnostic('matching.result_card.gates_check_failed', error);
        }
      }

      // If gates passed (or failed to check/org view), proceed to consent
      await fetchVisibleFields();
    } else {
      // Org view - direct action
      if (onInterested) onInterested();
    }
  };

  // Handle consent given - actually express interest
  const handleConsentGiven = async (matchId: string) => {
    if (onInterested) {
      await onInterested();
    }
  };

  const stateBadgeLabel =
    result.corridorState === 'request_intro'
      ? 'Intro requested'
      : result.corridorState === 'intro_approved'
        ? 'Masked intro open'
        : result.corridorState === 'request_reveal'
          ? 'Reveal pending'
          : result.corridorState === 'interview_scheduled'
            ? 'Interview scheduled'
            : result.reviewStage === 'shortlisted'
              ? 'Shortlisted'
              : 'Blind review';

  const privacyCue =
    result.revealScope === 'full_identity'
      ? 'Identity revealed'
      : result.revealScope === 'shortlist_identity'
        ? 'Context reveal only'
        : 'Blind by default';

  const orgReviewCard = matchExplanation?.reviewCard ?? result.reviewCard;
  const orgFallbackFitBullets = [
    topSkills.length > 0
      ? `Matched skills: ${topSkills.map((skill) => skillDisplayLabel({ label: skill.label, id: skill.id })).join(', ')}.`
      : 'Skills and proof signals are available for assignment review.',
    result.profile?.workMode || result.profile?.locationMode
      ? 'Practical alignment is checked against the assignment work mode and constraints.'
      : 'Practical alignment is kept separate from identity-bearing profile details.',
    orgReviewCard?.verification?.summaryLabel
      ? `Trust signal: ${orgReviewCard.verification.summaryLabel}.`
      : 'Blind-by-default review keeps identity details hidden until the proof-review participant consents to reveal.',
  ];
  const orgFitBullets =
    orgReviewCard?.fitSummary.bullets && orgReviewCard.fitSummary.bullets.length > 0
      ? [...new Set([...orgReviewCard.fitSummary.bullets, ...orgFallbackFitBullets])].slice(0, 3)
      : orgFallbackFitBullets;
  const orgReasonCodes =
    orgReviewCard?.fitSummary.reasonCodes && orgReviewCard.fitSummary.reasonCodes.length > 0
      ? orgReviewCard.fitSummary.reasonCodes
      : Object.keys(result.contributions ?? {}).slice(0, 3);
  const showOrgPrimaryAction =
    result.reviewStage === 'blind_review' ||
    (result.reviewStage === 'shortlisted' && result.corridorState === 'shortlist');
  const orgPrimaryLabel = result.reviewStage === 'shortlisted' ? 'Request intro' : 'Shortlist';
  const orgPrimaryDisabled =
    result.reviewStage === 'shortlisted' && result.canRequestIntro === false;
  const explanationErrorAlert = explanationError ? (
    <div
      className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{explanationError}</span>
    </div>
  ) : null;

  if (isOrgView) {
    return (
      <div className="block h-full">
        <Card variant="bento" className="flex h-full flex-col p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-proofound-charcoal">
                {orgReviewCard?.candidateLabel || 'Proof Submission'}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{privacyCue}</Badge>
                <Badge variant="secondary">{stateBadgeLabel}</Badge>
                {reviewBandLabel(orgReviewCard?.fitBand) ? (
                  <Badge variant="outline">{reviewBandLabel(orgReviewCard?.fitBand)}</Badge>
                ) : null}
                {reviewStateLabel(result.discoveryStatus) ? (
                  <Badge variant="outline">{reviewStateLabel(result.discoveryStatus)}</Badge>
                ) : null}
                {reviewStateLabel(result.fitBand) ? (
                  <Badge variant="outline">{reviewStateLabel(result.fitBand)}</Badge>
                ) : null}
                {reviewStateLabel(result.introGate) ? (
                  <Badge variant="secondary">{reviewStateLabel(result.introGate)}</Badge>
                ) : null}
                {result.fairness?.status && result.fairness.status !== 'pass' ? (
                  <Badge variant="outline">Policy protected</Badge>
                ) : null}
              </div>
            </div>

            {result.id ? (
              matchExplanation && MatchExplainerModalView ? (
                <MatchExplainerModalView
                  matchId={matchExplanation.matchId}
                  rank={matchExplanation.rank}
                  totalCandidates={matchExplanation.totalCandidates}
                  rankBand={matchExplanation.rankBand}
                  rankMode={matchExplanation.rankMode}
                  exactRankAvailable={matchExplanation.exactRankAvailable}
                  fairnessWarning={matchExplanation.fairness?.warning}
                  reasonSummary={matchExplanation.reasonSummary}
                  reasonSections={matchExplanation.reasonSections}
                  proofSignals={matchExplanation.proofSignals}
                  skillsMatch={matchExplanation.skillsMatch}
                  constraints={matchExplanation.constraints}
                  reviewCard={matchExplanation.reviewCard}
                  defaultOpen={openExplanationWhenReady}
                />
              ) : matchExplanation ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] gap-1.5 rounded-full px-3 text-xs text-proofound-forest hover:bg-proofound-forest/5"
                  disabled
                  data-testid={MATCH_EXPLAINER_TEST_IDS.trigger}
                  aria-haspopup="dialog"
                >
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {MATCH_EXPLAINER_LOADING_LABEL}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] gap-1.5 rounded-full px-3 text-xs text-proofound-forest hover:bg-proofound-forest/5"
                  onClick={fetchMatchExplanation}
                  disabled={isLoadingExplanation}
                  data-testid={MATCH_EXPLAINER_TEST_IDS.trigger}
                  aria-haspopup="dialog"
                >
                  {isLoadingExplanation ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {MATCH_EXPLAINER_LOADING_LABEL}
                    </>
                  ) : (
                    MATCH_EXPLAINER_TRIGGER_LABEL
                  )}
                </Button>
              )
            ) : null}
          </div>

          {explanationErrorAlert}

          {result.supplyState === 'browse_only_low_candidate_supply' ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Low-supply discovery widened review results. Intro gates are unchanged.
            </div>
          ) : null}

          <div className="mb-4 rounded-xl border border-proofound-stone bg-proofound-parchment/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Strongest relevant proof
            </p>
            <p className="text-sm font-medium text-proofound-charcoal">
              {orgReviewCard?.strongestProof.summary ||
                'Proof-backed evidence is available for review.'}
            </p>
            {orgReviewCard?.strongestProof.outcome ? (
              <p className="mt-2 text-sm text-proofound-charcoal/85">
                Outcome: {orgReviewCard.strongestProof.outcome}
              </p>
            ) : null}
            {orgReviewCard?.strongestProof.ownership ? (
              <p className="mt-2 text-sm text-proofound-charcoal/85">
                Ownership: {orgReviewCard.strongestProof.ownership}
              </p>
            ) : null}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {orgReviewCard?.strongestProof.anchorContext ? (
              <Badge variant="outline">{orgReviewCard.strongestProof.anchorContext}</Badge>
            ) : null}
            {orgReviewCard?.strongestProof.freshnessLabel ? (
              <Badge variant="outline">{orgReviewCard.strongestProof.freshnessLabel}</Badge>
            ) : null}
            {(orgReviewCard?.trustLabels || []).map((label: string) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>

          <div className="flex-1 rounded-xl border border-proofound-stone/80 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Proof alignment summary
            </p>
            <p className="mb-3 text-sm font-medium text-proofound-charcoal">
              {orgReviewCard?.fitSummary.headline || 'Proof-backed alignment available for review.'}
            </p>
            <ul className="space-y-2 text-sm text-proofound-charcoal/85">
              {orgFitBullets.map((bullet: string) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-proofound-forest" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            {orgReasonCodes.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {orgReasonCodes.map((reasonCode: string) => (
                  <Badge key={reasonCode} variant="secondary" className="text-[11px]">
                    {reasonCodeDisplayLabel(reasonCode)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          {showOrgPrimaryAction ? (
            <>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInterested}
                  disabled={orgPrimaryDisabled}
                  style={{ backgroundColor: '#1C4D3A' }}
                  className="min-h-[44px] flex-1"
                >
                  {orgPrimaryLabel}
                </Button>
                <Button size="sm" variant="outline" onClick={onHide} className="min-h-[44px]">
                  Pass
                </Button>
              </div>
              {orgPrimaryDisabled ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  {reviewStateLabel(result.introGate) || 'Intro hold'}
                  {Array.isArray(result.missingGates) && result.missingGates.length > 0
                    ? `: ${result.missingGates.map((gate) => gate.replace(/_/g, ' ')).join(', ')}`
                    : ''}
                </p>
              ) : null}
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-proofound-stone bg-proofound-parchment/30 px-3 py-2 text-sm text-muted-foreground">
              Review actions continue in the masked intro corridor.
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="block h-full" data-testid="match-card">
      <Card variant="bento" className="flex h-full flex-col p-4 sm:p-5">
        {/* Header */}
        <div className="mb-4 flex min-w-0 flex-col gap-3">
          <div className="min-w-0">
            {isOrgView ? (
              <h2 className="mb-1 break-words text-base font-medium text-proofound-charcoal">
                {variant === 'revealed' ? 'John Doe' : 'Proof Submission'}
              </h2>
            ) : (
              <h2 className="mb-2 break-words text-base font-semibold leading-6 text-proofound-charcoal">
                {result.assignment?.role || 'Assignment Match'}
              </h2>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-proofound-forest/20 bg-proofound-forest/10 px-2.5 py-1 text-xs font-medium text-proofound-forest">
                {proofFitLabel}
              </span>
              <span className="rounded-full border border-proofound-stone bg-white px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {variant === 'blind' ? 'Blind by default' : 'Identity revealed'}
              </span>
              {variant === 'blind' ? (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-proofound-forest" />
              )}
            </div>

            {result.id && (
              <div className="mt-2">
                {matchExplanation && MatchExplainerModalView ? (
                  <>
                    <MatchExplainerModalView
                      matchId={matchExplanation.matchId}
                      rank={matchExplanation.rank}
                      totalCandidates={matchExplanation.totalCandidates}
                      rankBand={matchExplanation.rankBand}
                      rankMode={matchExplanation.rankMode}
                      exactRankAvailable={matchExplanation.exactRankAvailable}
                      fairnessWarning={matchExplanation.fairness?.warning}
                      reasonSummary={matchExplanation.reasonSummary}
                      reasonSections={matchExplanation.reasonSections}
                      proofSignals={matchExplanation.proofSignals}
                      skillsMatch={matchExplanation.skillsMatch}
                      constraints={matchExplanation.constraints}
                      reviewCard={matchExplanation.reviewCard}
                      defaultOpen={openExplanationWhenReady}
                    />
                  </>
                ) : matchExplanation ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] gap-1.5 rounded-full px-3 text-xs text-proofound-forest hover:bg-proofound-forest/5"
                    disabled
                    data-testid={MATCH_EXPLAINER_TEST_IDS.trigger}
                    aria-haspopup="dialog"
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {MATCH_EXPLAINER_LOADING_LABEL}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] gap-1.5 rounded-full px-3 text-xs text-proofound-forest hover:bg-proofound-forest/5"
                    onClick={fetchMatchExplanation}
                    disabled={isLoadingExplanation}
                    data-testid={MATCH_EXPLAINER_TEST_IDS.trigger}
                    aria-haspopup="dialog"
                  >
                    {isLoadingExplanation ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {MATCH_EXPLAINER_LOADING_LABEL}
                      </>
                    ) : (
                      MATCH_EXPLAINER_TRIGGER_LABEL
                    )}
                  </Button>
                )}
              </div>
            )}
            {explanationErrorAlert}
          </div>
        </div>

        {/* Top Skills */}
        {topSkills.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {topSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="border border-proofound-stone/70 bg-proofound-parchment px-2 py-0.5 text-xs font-medium text-proofound-charcoal"
                >
                  {skillDisplayLabel({ label: skill.label, id: skill.id })} L{skill.level}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key details */}
        <div className="mb-3 space-y-1.5 rounded-xl border border-proofound-stone/70 bg-proofound-parchment/35 p-3 text-xs text-muted-foreground">
          {/* Location */}
          {(data?.workMode || data?.locationMode) && (
            <div className="flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="min-w-0 break-words">
                {data.workMode || data.locationMode}
                {data.country && variant === 'revealed' && ` • ${data.country}`}
                {data.country && variant === 'blind' && ' • Region hidden'}
              </span>
            </div>
          )}

          {/* Hours */}
          {(data?.hoursMin || data?.hoursMax) && (
            <div className="flex min-w-0 items-start gap-2">
              <Clock className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {data.hoursMin}-{data.hoursMax} hrs/week
              </span>
            </div>
          )}

          {/* Compensation */}
          {(data?.compMin || data?.compMax) && (
            <div className="flex min-w-0 items-start gap-2">
              <DollarSign className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="min-w-0 break-words">
                {showExactCompensation && (data?.compMin || data?.compMax)
                  ? `${data.currency} ${data.compMin?.toLocaleString()}-${data.compMax?.toLocaleString()}`
                  : 'Compensation overlap only'}
              </span>
            </div>
          )}

          {/* Verifications (generic in blind mode) */}
          {variant === 'blind' && (
            <div className="flex min-w-0 items-start gap-2">
              <Shield className="mt-0.5 h-3 w-3 shrink-0" />
              <span>Verification check visible only within this review stage</span>
            </div>
          )}
        </div>

        {proofSignals.length > 0 ? (
          <div className="mb-3 flex-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why this review
            </p>
            <div className="space-y-1.5">
              {proofSignals.map((signal) => (
                <div
                  key={signal.key}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-proofound-stone/70 bg-white px-3 py-2"
                >
                  <span className="text-xs font-medium capitalize text-proofound-charcoal">
                    {contributionLabel(signal.key)}
                  </span>
                  <span className="rounded-full bg-proofound-parchment px-2 py-0.5 text-xs text-muted-foreground">
                    {signal.support}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Actions */}
        {variant === 'blind' && (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              size="sm"
              onClick={handleInterested}
              style={{ backgroundColor: '#1C4D3A' }}
              className="col-span-2 min-h-[44px] min-w-0 flex-1 sm:min-w-[8rem]"
            >
              {isOrgView ? 'Shortlist' : 'Submit proof interest'}
            </Button>
            <Button size="sm" variant="outline" onClick={onHide} className="min-h-[44px] min-w-0">
              {isOrgView ? 'Hide' : 'Hide review'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (result.id) {
                  setIsSnoozeDialogOpen(true);
                }
              }}
              disabled={!result.id}
              title={
                !result.id
                  ? 'Pause becomes available once this assignment review is saved'
                  : undefined
              }
              className="min-h-[44px] min-w-0 text-xs text-muted-foreground hover:bg-japandi-bg"
            >
              <BellOff className="w-3.5 h-3.5 mr-1.5" />
              Pause review
            </Button>
          </div>
        )}

        {variant === 'revealed' && (
          <div>
            <Button size="sm" className="w-full" style={{ backgroundColor: '#1C4D3A' }}>
              View Full Profile
            </Button>
          </div>
        )}

        {/* Gaps (if any) */}
        {result.gaps && result.gaps.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
            <p className="text-xs mb-1" style={{ color: '#C76B4A' }}>
              Skill gaps:
            </p>
            {result.gaps.slice(0, 2).map((gap) => (
              <p key={gap.id} className="text-xs" style={{ color: '#6B6760' }}>
                {gap.id}: Needs L{gap.required}, has L{gap.have}
              </p>
            ))}
          </div>
        )}

        {/* Snooze Dialog */}
        {result.id && isSnoozeDialogOpen && SnoozeDialogView && (
          <SnoozeDialogView
            open={isSnoozeDialogOpen}
            onOpenChange={setIsSnoozeDialogOpen}
            matchId={result.id}
            assignmentTitle={result.assignment?.role || 'This assignment review'}
            onSnoozed={() => {
              // Refresh assignment reviews or remove this card from the current view.
              if (onHide) onHide();
            }}
          />
        )}

        {/* Verification Gates Warning */}
        {gateCheckResult && (
          <VerificationGatesWarning
            open={showGatesWarning}
            onOpenChange={setShowGatesWarning}
            unmetGates={gateCheckResult.unmetGates || []}
            userVerifications={gateCheckResult.userVerifications || []}
            assignmentTitle={result.assignment?.role || 'this role'}
          />
        )}

        {/* Consent to Share Dialog */}
        {visibleFieldsData && ConsentToShareDialogView && (
          <ConsentToShareDialogView
            isOpen={isConsentDialogOpen}
            onClose={() => setIsConsentDialogOpen(false)}
            matchId={result.id || ''}
            organizationName={visibleFieldsData.organizationName}
            assignmentRole={visibleFieldsData.assignmentRole}
            visibleFields={visibleFieldsData.visibleFields || []}
            onConsent={handleConsentGiven}
          />
        )}
      </Card>
    </div>
  );
}
