'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SkillMatchPicker,
  type SkillMatchOption,
} from '@/components/expertise/cv-import/SkillMatchPicker';
import {
  evaluateSuggestionSelectionRisk,
  type SelectionRiskReason,
} from '@/lib/expertise/skill-confidence';

export type CandidateCategory =
  | 'technical'
  | 'soft_skills'
  | 'tools_technologies'
  | 'languages'
  | 'certifications'
  | 'other';

export interface SkillReviewCandidate {
  candidate_id: string;
  raw_skill_text: string;
  category: CandidateCategory;
  confidence: number;
  evidence_snippets: string[];
  suggestions: SkillMatchOption[];
  selected_skill_ids: string[];
  approved: boolean;
  manual_loading: boolean;
  manual_search_query: string;
  manual_options: SkillMatchOption[];
  show_all_suggestions: boolean;
  unmapped_candidate: boolean;
  already_in_profile?: boolean;
  manual_last_search_at?: string;
}

interface SkillReviewPanelProps {
  candidates: SkillReviewCandidate[];
  openPickerId: string | null;
  onOpenPicker: (candidateId: string | null) => void;
  onToggleApproved: (candidateId: string, checked: boolean) => void;
  onRawSkillChange: (candidateId: string, value: string) => void;
  onCategoryChange: (candidateId: string, value: CandidateCategory) => void;
  onSelectSkillIds: (candidateId: string, value: string[]) => void;
  onManualQueryChange: (candidateId: string, value: string) => void;
  onToggleSuggestions: (candidateId: string) => void;
  onFind: (candidateId: string) => void;
  onSelectMatch: (candidateId: string, option: SkillMatchOption) => void;
  onReplaceMatch: (candidateId: string, option: SkillMatchOption) => void;
}

type ReviewStatus = {
  label: 'Ready' | 'Needs review' | 'Needs mapping';
  variant: 'secondary' | 'outline';
  rank: number;
  reason: string;
};

function confidencePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value * 100)));
}

function resolveCandidateStatus(candidate: SkillReviewCandidate): ReviewStatus {
  if (
    candidate.approved &&
    (candidate.selected_skill_ids.length > 0 || candidate.already_in_profile)
  ) {
    return {
      label: 'Ready',
      variant: 'secondary',
      rank: 3,
      reason: candidate.already_in_profile
        ? 'Already in profile'
        : 'Approved with at least one selected Atlas skill',
    };
  }

  if (
    candidate.unmapped_candidate &&
    candidate.selected_skill_ids.length === 0 &&
    !candidate.already_in_profile
  ) {
    return {
      label: 'Needs mapping',
      variant: 'outline',
      rank: 1,
      reason: 'No valid Atlas mapping is selected yet',
    };
  }

  return {
    label: 'Needs review',
    variant: 'outline',
    rank: 2,
    reason: 'Check match quality before approving',
  };
}

function removeSelectedSkillId(selectedSkillIds: string[], skillId: string): string[] {
  return selectedSkillIds.filter((id) => id !== skillId);
}

function pickReplacementSuggestion(candidate: SkillReviewCandidate): SkillMatchOption | null {
  if (candidate.suggestions.length === 0) {
    return null;
  }

  return (
    candidate.suggestions.find(
      (option) => !candidate.selected_skill_ids.includes(option.skill_id)
    ) || candidate.suggestions[0]
  );
}

function toggleId(current: Set<string>, id: string): Set<string> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

type PendingSelection = {
  candidateId: string;
  option: SkillMatchOption;
  mode: 'select' | 'replace';
  reasons: SelectionRiskReason[];
};

function selectionRiskReasonLabel(reason: SelectionRiskReason): string {
  if (reason === 'ambiguous_token') return 'Ambiguous token';
  if (reason === 'weak_method') return 'Weak method';
  if (reason === 'low_overlap') return 'Low overlap';
  return 'Weak evidence';
}

export function SkillReviewPanel({
  candidates,
  openPickerId,
  onOpenPicker,
  onToggleApproved,
  onRawSkillChange,
  onCategoryChange,
  onSelectSkillIds,
  onManualQueryChange,
  onToggleSuggestions,
  onFind,
  onSelectMatch,
  onReplaceMatch,
}: SkillReviewPanelProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    candidates[0]?.candidate_id || null
  );
  const [expandedEditIds, setExpandedEditIds] = useState<Set<string>>(new Set());
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Set<string>>(new Set());
  const [expandedSelectedIds, setExpandedSelectedIds] = useState<Set<string>>(new Set());
  const [expandedFindIds, setExpandedFindIds] = useState<Set<string>>(new Set());
  const [pendingSelection, setPendingSelection] = useState<PendingSelection | null>(null);

  const orderedCandidates = useMemo(() => {
    return [...candidates].sort((left, right) => {
      const leftStatus = resolveCandidateStatus(left);
      const rightStatus = resolveCandidateStatus(right);
      if (leftStatus.rank !== rightStatus.rank) {
        return leftStatus.rank - rightStatus.rank;
      }
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }
      return left.raw_skill_text.localeCompare(right.raw_skill_text);
    });
  }, [candidates]);

  const unresolvedCandidates = useMemo(
    () =>
      orderedCandidates.filter((candidate) => resolveCandidateStatus(candidate).label !== 'Ready'),
    [orderedCandidates]
  );

  const readyCount = orderedCandidates.length - unresolvedCandidates.length;
  const alreadyInProfileCount = orderedCandidates.filter(
    (candidate) => candidate.already_in_profile
  ).length;

  useEffect(() => {
    if (unresolvedCandidates.length === 0) {
      setActiveCandidateId(null);
      return;
    }

    if (
      !activeCandidateId ||
      !unresolvedCandidates.some((candidate) => candidate.candidate_id === activeCandidateId)
    ) {
      setActiveCandidateId(unresolvedCandidates[0].candidate_id);
    }
  }, [unresolvedCandidates, activeCandidateId]);

  useEffect(() => {
    if (!pendingSelection) {
      return;
    }
    const candidateStillExists = candidates.some(
      (candidate) => candidate.candidate_id === pendingSelection.candidateId
    );
    if (!candidateStillExists) {
      setPendingSelection(null);
    }
  }, [pendingSelection, candidates]);

  const activeUnresolvedIndex = unresolvedCandidates.findIndex(
    (candidate) => candidate.candidate_id === activeCandidateId
  );

  const visibleCandidates = showAllSkills
    ? orderedCandidates
    : activeUnresolvedIndex >= 0
      ? [unresolvedCandidates[activeUnresolvedIndex]]
      : [];

  const goToNextUnresolved = (fromCandidateId?: string) => {
    if (unresolvedCandidates.length === 0) {
      setActiveCandidateId(null);
      return;
    }

    if (!fromCandidateId) {
      setActiveCandidateId(unresolvedCandidates[0].candidate_id);
      return;
    }

    const currentIndex = unresolvedCandidates.findIndex(
      (candidate) => candidate.candidate_id === fromCandidateId
    );

    if (currentIndex < 0) {
      setActiveCandidateId(unresolvedCandidates[0].candidate_id);
      return;
    }

    const nextCandidate =
      unresolvedCandidates[currentIndex + 1] || unresolvedCandidates[currentIndex];
    setActiveCandidateId(nextCandidate?.candidate_id || null);
  };

  const commitSelection = (
    candidate: SkillReviewCandidate,
    option: SkillMatchOption,
    mode: 'select' | 'replace'
  ) => {
    if (mode === 'replace') {
      onReplaceMatch(candidate.candidate_id, option);
    } else {
      onSelectMatch(candidate.candidate_id, option);
    }
    goToNextUnresolved(candidate.candidate_id);
  };

  const requestSelection = (
    candidate: SkillReviewCandidate,
    option: SkillMatchOption,
    mode: 'select' | 'replace'
  ) => {
    const risk = evaluateSuggestionSelectionRisk({
      rawSkillText: candidate.raw_skill_text,
      evidenceSnippets: candidate.evidence_snippets,
      suggestion: {
        skill_id: option.skill_id,
        skill_name: option.skill_name,
        match_method: option.match_method,
        score: option.score,
      },
    });

    if (risk.requiresConfirmation) {
      setPendingSelection({
        candidateId: candidate.candidate_id,
        option,
        mode,
        reasons: risk.reasons,
      });
      return;
    }

    setPendingSelection(null);
    commitSelection(candidate, option, mode);
  };

  const handleAccept = (candidate: SkillReviewCandidate) => {
    const topSuggestion = candidate.suggestions[0];
    if (topSuggestion) {
      requestSelection(candidate, topSuggestion, 'select');
      return;
    }

    setExpandedFindIds((previous) => new Set(previous).add(candidate.candidate_id));
    onOpenPicker(candidate.candidate_id);
    onFind(candidate.candidate_id);
  };

  const handleReplace = (candidate: SkillReviewCandidate) => {
    const replacement = pickReplacementSuggestion(candidate);
    if (replacement) {
      requestSelection(candidate, replacement, 'replace');
      return;
    }

    setExpandedFindIds((previous) => new Set(previous).add(candidate.candidate_id));
    onOpenPicker(candidate.candidate_id);
    onFind(candidate.candidate_id);
  };

  const handleSkip = (candidate: SkillReviewCandidate) => {
    if (pendingSelection?.candidateId === candidate.candidate_id) {
      setPendingSelection(null);
    }
    onToggleApproved(candidate.candidate_id, false);
    goToNextUnresolved(candidate.candidate_id);
  };

  if (orderedCandidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No skill candidates were found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {unresolvedCandidates.length} remaining · {readyCount} ready · {alreadyInProfileCount}{' '}
            already in profile
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToNextUnresolved(activeCandidateId || undefined)}
              disabled={unresolvedCandidates.length < 2 || showAllSkills}
            >
              Next unresolved
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAllSkills((previous) => !previous)}
            >
              {showAllSkills ? 'Hide advanced list' : 'Show all skills (advanced)'}
            </Button>
          </div>
        </div>
      </div>

      {!showAllSkills && unresolvedCandidates.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
          All skills are ready. You can proceed to apply, or open advanced list to make detailed
          edits.
        </div>
      )}

      {visibleCandidates.map((candidate) => {
        const status = resolveCandidateStatus(candidate);
        const topSuggestion = candidate.suggestions[0] || null;
        const visibleAutoSuggestions = candidate.suggestions.slice(
          0,
          candidate.show_all_suggestions ? 20 : 5
        );
        const selectedFallbackSuggestions = candidate.suggestions.filter((option) =>
          candidate.selected_skill_ids.includes(option.skill_id)
        );

        const optionMap = new Map<string, SkillMatchOption>();
        for (const option of [
          ...visibleAutoSuggestions,
          ...selectedFallbackSuggestions,
          ...candidate.manual_options,
        ]) {
          optionMap.set(option.skill_id, option);
        }

        const selectedOptions = candidate.selected_skill_ids
          .map((skillId) => optionMap.get(skillId))
          .filter((option): option is SkillMatchOption => Boolean(option));

        const isEditExpanded = expandedEditIds.has(candidate.candidate_id);
        const isEvidenceExpanded = expandedEvidenceIds.has(candidate.candidate_id);
        const isSelectedExpanded = expandedSelectedIds.has(candidate.candidate_id);
        const isFindExpanded = expandedFindIds.has(candidate.candidate_id);
        const pendingForCandidate =
          pendingSelection?.candidateId === candidate.candidate_id ? pendingSelection : null;

        return (
          <article key={candidate.candidate_id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{candidate.raw_skill_text}</p>
                <p className="text-xs text-muted-foreground">{status.reason}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">{confidencePercent(candidate.confidence)}%</Badge>
                {candidate.already_in_profile && (
                  <Badge variant="outline">Already in profile</Badge>
                )}
              </div>
            </div>

            <div className="mt-3 rounded-md border bg-background/50 p-3">
              <p className="text-xs font-medium text-muted-foreground">Top suggested Atlas skill</p>
              {topSuggestion ? (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {topSuggestion.skill_name}
                  </span>
                  <Badge variant="outline">{topSuggestion.match_method}</Badge>
                  <Badge variant="secondary">{Math.round(topSuggestion.score * 100)}%</Badge>
                </div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  No confident automatic match. Use Find manually.
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => handleAccept(candidate)}>
                <Check className="mr-1 h-3 w-3" />
                Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleReplace(candidate)}>
                Replace
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleSkip(candidate)}>
                Skip
              </Button>
            </div>

            {pendingForCandidate && (
              <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3">
                <p className="inline-flex items-center gap-1 text-xs font-medium text-amber-900">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  This match is low-confidence. Confirm before applying.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {pendingForCandidate.reasons.map((reason) => (
                    <Badge key={`${candidate.candidate_id}-${reason}`} variant="outline">
                      {selectionRiskReasonLabel(reason)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      commitSelection(
                        candidate,
                        pendingForCandidate.option,
                        pendingForCandidate.mode
                      );
                      setPendingSelection(null);
                    }}
                  >
                    Confirm selection
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setPendingSelection(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() =>
                  setExpandedEditIds((previous) => toggleId(previous, candidate.candidate_id))
                }
              >
                Edit skill text/category <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() =>
                  setExpandedEvidenceIds((previous) => toggleId(previous, candidate.candidate_id))
                }
              >
                Show evidence <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() =>
                  setExpandedSelectedIds((previous) => toggleId(previous, candidate.candidate_id))
                }
              >
                View selected ({selectedOptions.length}) <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() =>
                  setExpandedFindIds((previous) => toggleId(previous, candidate.candidate_id))
                }
              >
                Find manually <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </div>

            {isEditExpanded && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Skill found in CV</p>
                  <Textarea
                    rows={2}
                    value={candidate.raw_skill_text}
                    onChange={(event) =>
                      onRawSkillChange(candidate.candidate_id, event.target.value)
                    }
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Skill type</p>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={candidate.category}
                    onChange={(event) =>
                      onCategoryChange(
                        candidate.candidate_id,
                        event.target.value as CandidateCategory
                      )
                    }
                  >
                    {[
                      'technical',
                      'soft_skills',
                      'tools_technologies',
                      'languages',
                      'certifications',
                      'other',
                    ].map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {isEvidenceExpanded && (
              <div className="mt-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Evidence from CV</p>
                {candidate.evidence_snippets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No evidence snippet available.</p>
                ) : (
                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {candidate.evidence_snippets.map((snippet, index) => (
                      <li key={`${candidate.candidate_id}-${index}`}>{snippet}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {isSelectedExpanded && (
              <div className="mt-3 space-y-2">
                {selectedOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No skills selected yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedOptions.map((option) => (
                      <Badge
                        key={`${candidate.candidate_id}-${option.skill_id}`}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <span>{option.skill_name}</span>
                        <button
                          type="button"
                          className="rounded-sm hover:text-foreground"
                          onClick={() =>
                            onSelectSkillIds(
                              candidate.candidate_id,
                              removeSelectedSkillId(candidate.selected_skill_ids, option.skill_id)
                            )
                          }
                          aria-label={`Remove ${option.skill_name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isFindExpanded && (
              <div className="mt-3 space-y-3">
                <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                  <Input
                    value={candidate.manual_search_query}
                    onChange={(event) =>
                      onManualQueryChange(candidate.candidate_id, event.target.value)
                    }
                    placeholder="Search Atlas skills"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenPicker(candidate.candidate_id);
                      onFind(candidate.candidate_id);
                    }}
                    disabled={candidate.manual_loading}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {candidate.manual_loading ? '...' : 'Find'}
                  </Button>
                </div>

                {visibleAutoSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Suggested Atlas skills
                      </p>
                      {candidate.suggestions.length > 5 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onToggleSuggestions(candidate.candidate_id)}
                        >
                          {candidate.show_all_suggestions
                            ? 'Show fewer suggestions'
                            : 'Show more suggestions'}
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {visibleAutoSuggestions.map((option) => {
                        const isSelected = candidate.selected_skill_ids.includes(option.skill_id);
                        return (
                          <div
                            key={option.skill_id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {option.skill_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {option.match_method} · {Math.round(option.score * 100)}%
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant={isSelected ? 'secondary' : 'outline'}
                                onClick={() => {
                                  if (isSelected) {
                                    onSelectSkillIds(
                                      candidate.candidate_id,
                                      removeSelectedSkillId(
                                        candidate.selected_skill_ids,
                                        option.skill_id
                                      )
                                    );
                                    return;
                                  }
                                  requestSelection(candidate, option, 'select');
                                }}
                              >
                                {isSelected ? 'Remove' : 'Select'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => requestSelection(candidate, option, 'replace')}
                              >
                                Replace
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <SkillMatchPicker
                  open={openPickerId === candidate.candidate_id}
                  loading={candidate.manual_loading}
                  query={candidate.manual_search_query}
                  options={candidate.manual_options}
                  selectedSkillIds={candidate.selected_skill_ids}
                  lastSearchedAtLabel={candidate.manual_last_search_at}
                  onSelect={(option) => requestSelection(candidate, option, 'select')}
                  onReplace={(option) => requestSelection(candidate, option, 'replace')}
                  onClose={() => onOpenPicker(null)}
                />
              </div>
            )}

            {candidate.unmapped_candidate &&
              !candidate.already_in_profile &&
              candidate.selected_skill_ids.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Needs mapping. Select at least one Atlas skill.
                </p>
              )}
          </article>
        );
      })}
    </div>
  );
}
