import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CvImportSuggestResponseSchema,
  type CvImportCandidate,
  type CvImportSuggestResponse,
} from '@/lib/expertise/cv-import-suggest';
import {
  CvImportWizardSuggestResponseSchema,
  type CvImportWizardSuggestResponse,
} from '@/archive/non_launch_python_internal/lib/expertise/cv-import-wizard-types';

type MinimalSupabaseClient = Pick<SupabaseClient, 'from'>;

type SkillRow = {
  skill_id?: string | null;
  skill_code?: string | null;
};

function normalizeSkillId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toExistingSkillIdSet(rows: SkillRow[] | null | undefined): Set<string> {
  const existing = new Set<string>();

  for (const row of rows || []) {
    const skillId = normalizeSkillId(row.skill_id);
    if (skillId) {
      existing.add(skillId);
    }

    const skillCode = normalizeSkillId(row.skill_code);
    if (skillCode) {
      existing.add(skillCode);
    }
  }

  return existing;
}

export async function loadExistingSkillIdsForProfile(
  supabase: MinimalSupabaseClient | null | undefined,
  profileId: string
): Promise<Set<string>> {
  if (!supabase || typeof supabase.from !== 'function') {
    return new Set<string>();
  }

  try {
    const { data, error } = await supabase
      .from('skills')
      .select('skill_id, skill_code')
      .eq('profile_id', profileId);

    if (error) {
      console.warn('[cv-import] failed to load existing skills for dedupe', {
        profileId,
        error: error.message,
      });
      return new Set<string>();
    }

    return toExistingSkillIdSet(data as SkillRow[] | null | undefined);
  } catch (error) {
    console.warn('[cv-import] existing skill lookup failed; continuing without dedupe', {
      profileId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new Set<string>();
  }
}

function filterCandidateSuggestions(
  candidate: CvImportCandidate,
  existingSkillIds: ReadonlySet<string>
): CvImportCandidate {
  if (candidate.suggestions.length === 0) {
    return candidate;
  }

  const nextSuggestions = candidate.suggestions.filter(
    (suggestion) => !existingSkillIds.has(suggestion.skill_id)
  );

  if (nextSuggestions.length === candidate.suggestions.length) {
    return candidate;
  }

  if (nextSuggestions.length === 0) {
    return {
      ...candidate,
      suggestions: [],
      unmapped_candidate: false,
      already_in_profile: true,
    };
  }

  return {
    ...candidate,
    suggestions: nextSuggestions,
    unmapped_candidate: false,
    already_in_profile: false,
  };
}

function countUnmappedCandidates(
  documents: Array<{ candidates: CvImportCandidate[] } | { skill_candidates: CvImportCandidate[] }>
): number {
  return documents.reduce((total, document) => {
    const candidates = 'candidates' in document ? document.candidates : document.skill_candidates;
    return (
      total +
      candidates.reduce(
        (candidateTotal, candidate) => candidateTotal + (candidate.unmapped_candidate ? 1 : 0),
        0
      )
    );
  }, 0);
}

export function filterExistingSkillsFromSuggestResponse(
  payload: CvImportSuggestResponse,
  existingSkillIds: ReadonlySet<string>
): CvImportSuggestResponse {
  if (existingSkillIds.size === 0) {
    return payload;
  }

  const documents = payload.documents.map((document) => {
    const candidates = document.candidates.map((candidate) =>
      filterCandidateSuggestions(candidate, existingSkillIds)
    );

    return {
      ...document,
      candidate_count: candidates.length,
      candidates,
    };
  });

  return {
    ...payload,
    documents,
    metadata: {
      ...payload.metadata,
      unmapped_candidates_count: countUnmappedCandidates(documents),
    },
  };
}

export function filterExistingSkillsFromWizardSuggestResponse(
  payload: CvImportWizardSuggestResponse,
  existingSkillIds: ReadonlySet<string>
): CvImportWizardSuggestResponse {
  if (existingSkillIds.size === 0) {
    return payload;
  }

  const documents = payload.documents.map((document) => {
    const skillCandidates = document.skill_candidates.map((candidate) =>
      filterCandidateSuggestions(candidate, existingSkillIds)
    );

    return {
      ...document,
      skill_candidates: skillCandidates,
    };
  });

  return {
    ...payload,
    documents,
    metadata: {
      ...payload.metadata,
      unmapped_candidates_count: countUnmappedCandidates(documents),
    },
  };
}

export function maybeFilterExistingSkillsFromSuggestPayload(
  payload: unknown,
  existingSkillIds: ReadonlySet<string>
): unknown {
  const parsed = CvImportSuggestResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return payload;
  }

  return filterExistingSkillsFromSuggestResponse(parsed.data, existingSkillIds);
}

export function maybeFilterExistingSkillsFromWizardSuggestPayload(
  payload: unknown,
  existingSkillIds: ReadonlySet<string>
): unknown {
  const parsed = CvImportWizardSuggestResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return payload;
  }

  return filterExistingSkillsFromWizardSuggestResponse(parsed.data, existingSkillIds);
}
