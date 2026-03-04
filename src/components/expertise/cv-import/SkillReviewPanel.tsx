'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SkillMatchPicker,
  type SkillMatchOption,
} from '@/components/expertise/cv-import/SkillMatchPicker';

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

function formatCategory(value: CandidateCategory): string {
  return value.replace(/_/g, ' ');
}

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
  const [viewMode, setViewMode] = useState<'guided' | 'all'>('guided');
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(
    candidates[0]?.candidate_id || null
  );

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

  useEffect(() => {
    if (orderedCandidates.length === 0) {
      setActiveCandidateId(null);
      return;
    }
    if (
      !activeCandidateId ||
      !orderedCandidates.some((item) => item.candidate_id === activeCandidateId)
    ) {
      setActiveCandidateId(orderedCandidates[0].candidate_id);
    }
  }, [orderedCandidates, activeCandidateId]);

  const activeIndex = orderedCandidates.findIndex(
    (candidate) => candidate.candidate_id === activeCandidateId
  );
  const visibleCandidates =
    viewMode === 'all'
      ? orderedCandidates
      : activeIndex >= 0
        ? [orderedCandidates[activeIndex]]
        : orderedCandidates.slice(0, 1);

  if (orderedCandidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No skill candidates were found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 p-3">
        <div className="text-sm text-muted-foreground">
          {viewMode === 'guided'
            ? `Guided review ${Math.max(activeIndex + 1, 1)}/${orderedCandidates.length}`
            : `All candidates (${orderedCandidates.length})`}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === 'guided' ? 'secondary' : 'outline'}
            onClick={() => setViewMode('guided')}
          >
            Guided queue
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'all' ? 'secondary' : 'outline'}
            onClick={() => setViewMode('all')}
          >
            All cards
          </Button>
        </div>
      </div>

      {viewMode === 'guided' && orderedCandidates.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
          <Button
            size="sm"
            variant="outline"
            disabled={activeIndex <= 0}
            onClick={() => {
              if (activeIndex > 0) {
                setActiveCandidateId(orderedCandidates[activeIndex - 1].candidate_id);
              }
            }}
          >
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            Priority order: Needs mapping, Needs review, Ready
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={activeIndex < 0 || activeIndex >= orderedCandidates.length - 1}
            onClick={() => {
              if (activeIndex >= 0 && activeIndex < orderedCandidates.length - 1) {
                setActiveCandidateId(orderedCandidates[activeIndex + 1].candidate_id);
              }
            }}
          >
            Next
          </Button>
        </div>
      )}

      {visibleCandidates.map((candidate) => {
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
        const status = resolveCandidateStatus(candidate);

        return (
          <article key={candidate.candidate_id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={candidate.approved}
                    onChange={(event) =>
                      onToggleApproved(candidate.candidate_id, event.target.checked)
                    }
                  />
                  Approve
                </label>
                <Badge variant={status.variant}>{status.label}</Badge>
                <Badge variant="outline">
                  {confidencePercent(candidate.confidence)}% confidence
                </Badge>
              </div>
              {candidate.already_in_profile && <Badge variant="outline">Already in profile</Badge>}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">Why: {status.reason}</Badge>
              {candidate.unmapped_candidate && candidate.selected_skill_ids.length === 0 && (
                <Badge variant="outline">Action: find and select at least one Atlas skill</Badge>
              )}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Skill found in CV</p>
                <Textarea
                  rows={2}
                  value={candidate.raw_skill_text}
                  onChange={(event) => onRawSkillChange(candidate.candidate_id, event.target.value)}
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
                      {formatCategory(option as CandidateCategory)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

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

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">Suggested Atlas skills</p>
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

              {visibleAutoSuggestions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No automatic suggestions. Use Find to search Atlas skills manually.
                </p>
              ) : (
                <div className="space-y-2">
                  {visibleAutoSuggestions.map((option) => {
                    const isSelected = candidate.selected_skill_ids.includes(option.skill_id);
                    return (
                      <div
                        key={option.skill_id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{option.skill_name}</p>
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
                              onSelectMatch(candidate.candidate_id, option);
                            }}
                          >
                            {isSelected ? 'Remove' : 'Select'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onReplaceMatch(candidate.candidate_id, option)}
                          >
                            Replace
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Selected Atlas skills</p>
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

            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
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

            <div className="mt-2">
              <SkillMatchPicker
                open={openPickerId === candidate.candidate_id}
                loading={candidate.manual_loading}
                query={candidate.manual_search_query}
                options={candidate.manual_options}
                selectedSkillIds={candidate.selected_skill_ids}
                lastSearchedAtLabel={candidate.manual_last_search_at}
                onSelect={(option) => onSelectMatch(candidate.candidate_id, option)}
                onReplace={(option) => onReplaceMatch(candidate.candidate_id, option)}
                onClose={() => onOpenPicker(null)}
              />
            </div>

            {candidate.unmapped_candidate &&
              !candidate.already_in_profile &&
              candidate.selected_skill_ids.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  Needs mapping. Select at least one Atlas skill.
                </p>
              )}

            <div className="sticky bottom-0 mt-3 rounded-md border bg-background/95 p-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onToggleApproved(candidate.candidate_id, false)}
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onToggleApproved(candidate.candidate_id, true)}
                >
                  Approve
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
