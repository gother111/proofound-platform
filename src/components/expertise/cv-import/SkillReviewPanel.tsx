'use client';

import { type ChangeEvent } from 'react';

import { Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

function formatCategory(value: CandidateCategory): string {
  return value.replace(/_/g, ' ');
}

function parseMultiSelect(event: ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(event.target.selectedOptions).map((option) => option.value);
}

function confidencePercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value * 100)));
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
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Approve</TableHead>
            <TableHead>Skill found in CV</TableHead>
            <TableHead>Skill type</TableHead>
            <TableHead>Match confidence</TableHead>
            <TableHead>Evidence from CV</TableHead>
            <TableHead>Suggested Atlas skills</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((candidate) => {
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

            const options = Array.from(optionMap.values());

            return (
              <TableRow key={candidate.candidate_id} className="align-top">
                <TableCell>
                  <input
                    type="checkbox"
                    checked={candidate.approved}
                    onChange={(event) =>
                      onToggleApproved(candidate.candidate_id, event.target.checked)
                    }
                  />
                </TableCell>

                <TableCell className="min-w-[240px]">
                  <Textarea
                    rows={2}
                    value={candidate.raw_skill_text}
                    onChange={(event) =>
                      onRawSkillChange(candidate.candidate_id, event.target.value)
                    }
                  />
                </TableCell>

                <TableCell>
                  <select
                    className="rounded border px-2 py-1 text-sm"
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
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{confidencePercent(candidate.confidence)}%</Badge>
                </TableCell>

                <TableCell className="min-w-[260px]">
                  <ul className="list-disc pl-4 text-xs">
                    {candidate.evidence_snippets.map((snippet, index) => (
                      <li key={`${candidate.candidate_id}-${index}`}>{snippet}</li>
                    ))}
                  </ul>
                </TableCell>

                <TableCell className="min-w-[340px] space-y-2">
                  <select
                    multiple
                    className="h-28 w-full rounded border px-2 py-1 text-xs"
                    value={candidate.selected_skill_ids}
                    onChange={(event) =>
                      onSelectSkillIds(candidate.candidate_id, parseMultiSelect(event))
                    }
                  >
                    {options.map((option) => (
                      <option key={option.skill_id} value={option.skill_id}>
                        {option.skill_name} ({option.match_method}: {Math.round(option.score * 100)}
                        %)
                      </option>
                    ))}
                  </select>

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

                  <div className="flex items-center gap-2">
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

                  {candidate.unmapped_candidate && candidate.selected_skill_ids.length === 0 && (
                    <p className="text-xs text-amber-700">
                      Needs mapping. Select at least one Atlas skill.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
