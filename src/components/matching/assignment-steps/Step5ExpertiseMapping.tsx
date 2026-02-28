/**
 * Assignment Builder - Step 5: Expertise Mapping
 *
 * Pick L4 skills, link to BV/TO, education justification
 */

'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, AlertTriangle, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Step5Props {
  form: UseFormReturn<any>;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

interface TaxonomyNode {
  catId?: number;
  subcatId?: number;
  l3Id?: number;
  nameI18n?: { en?: string };
}

interface TaxonomySkill {
  code: string;
  slug?: string;
  catId?: number;
  subcatId?: number;
  l3Id?: number;
  nameI18n?: { en?: string };
  l1?: TaxonomyNode;
  l2?: TaxonomyNode;
  l3?: TaxonomyNode;
}

interface AssignmentSkill {
  id: string;
  label?: string;
  level: number;
  linkedToBV?: boolean;
  linkedToTO?: boolean;
  catId?: number;
  subcatId?: number;
  l3Id?: number;
  l1Label?: string;
  l2Label?: string;
  l3Label?: string;
  name?: string;
  skillName?: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 20;

function getSkillLabel(skill: Partial<AssignmentSkill>) {
  return skill.label || skill.name || skill.skillName || skill.id || 'Unknown skill';
}

function normalizeText(value: string | undefined) {
  return (value || '').trim().toLowerCase();
}

function skillPathText(skill: Partial<AssignmentSkill>) {
  const parts = [skill.l1Label, skill.l2Label, skill.l3Label].filter(Boolean);
  return parts.join(' > ');
}

function taxonomyPathText(skill: TaxonomySkill) {
  const parts = [skill.l1?.nameI18n?.en, skill.l2?.nameI18n?.en, skill.l3?.nameI18n?.en].filter(
    Boolean
  );
  return parts.join(' > ');
}

function mapTaxonomySkillToAssignmentSkill(
  taxonomySkill: TaxonomySkill,
  level: number,
  linkedToBV = false,
  linkedToTO = false
): AssignmentSkill {
  return {
    id: taxonomySkill.code,
    label: taxonomySkill.nameI18n?.en || taxonomySkill.code,
    level,
    linkedToBV,
    linkedToTO,
    catId: taxonomySkill.catId,
    subcatId: taxonomySkill.subcatId,
    l3Id: taxonomySkill.l3Id,
    l1Label: taxonomySkill.l1?.nameI18n?.en,
    l2Label: taxonomySkill.l2?.nameI18n?.en,
    l3Label: taxonomySkill.l3?.nameI18n?.en,
  };
}

async function searchTaxonomySkills(query: string, signal?: AbortSignal): Promise<TaxonomySkill[]> {
  const response = await fetch(`/api/expertise/taxonomy?search=${encodeURIComponent(query)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch taxonomy skills');
  }

  const payload = await response.json();
  const skills = Array.isArray(payload?.l4_skills) ? payload.l4_skills : [];
  return skills.slice(0, MAX_RESULTS);
}

function pickBestLegacyMatch(
  candidates: TaxonomySkill[],
  skillId: string,
  skillLabel?: string
): TaxonomySkill | null {
  if (!candidates.length) return null;

  const normalizedId = normalizeText(skillId);
  const normalizedLabel = normalizeText(skillLabel);

  const exactCode = candidates.find((candidate) => normalizeText(candidate.code) === normalizedId);
  if (exactCode) return exactCode;

  const exactSlug = candidates.find((candidate) => normalizeText(candidate.slug) === normalizedId);
  if (exactSlug) return exactSlug;

  const exactNameFromId = candidates.find(
    (candidate) => normalizeText(candidate.nameI18n?.en) === normalizedId
  );
  if (exactNameFromId) return exactNameFromId;

  if (normalizedLabel) {
    const exactNameFromLabel = candidates.find(
      (candidate) => normalizeText(candidate.nameI18n?.en) === normalizedLabel
    );
    if (exactNameFromLabel) return exactNameFromLabel;
  }

  return candidates[0];
}

export function Step5ExpertiseMapping({
  form,
  onSubmit,
  onBack,
  isSubmitting = false,
}: Step5Props) {
  const { watch, setValue } = form;

  const watchedMustHaveSkills = watch('mustHaveSkills') as AssignmentSkill[] | undefined;
  const watchedNiceToHaveSkills = watch('niceToHaveSkills') as AssignmentSkill[] | undefined;
  const mustHaveSkills = useMemo(() => watchedMustHaveSkills ?? [], [watchedMustHaveSkills]);
  const niceToHaveSkills = useMemo(() => watchedNiceToHaveSkills ?? [], [watchedNiceToHaveSkills]);
  const educationRequired = watch('educationRequired') || false;
  const educationJustification = watch('educationJustification') || '';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TaxonomySkill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [unresolvedLegacyIds, setUnresolvedLegacyIds] = useState<string[]>([]);

  const hasResolvedLegacyRef = useRef(false);

  const allSelectedSkillIds = useMemo(
    () => new Set([...mustHaveSkills, ...niceToHaveSkills].map((skill) => skill.id)),
    [mustHaveSkills, niceToHaveSkills]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedQuery;

    if (query.length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();

    const runSearch = async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchTaxonomySkills(query, controller.signal);
        setSearchResults(results);
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        setSearchResults([]);
        setSearchError('Failed to search skills. Please try again.');
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    void runSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (hasResolvedLegacyRef.current) return;
    hasResolvedLegacyRef.current = true;

    let cancelled = false;

    const resolveLegacySkills = async () => {
      const unresolved: string[] = [];

      const resolveSkill = async (skill: AssignmentSkill): Promise<AssignmentSkill> => {
        const initialId = String(skill.id || '').trim();
        if (!initialId) return skill;

        try {
          const primaryCandidates = await searchTaxonomySkills(initialId);
          let selected = pickBestLegacyMatch(primaryCandidates, initialId, getSkillLabel(skill));

          if (!selected && skill.label && normalizeText(skill.label) !== normalizeText(initialId)) {
            const labelCandidates = await searchTaxonomySkills(skill.label);
            selected = pickBestLegacyMatch(labelCandidates, initialId, skill.label);
          }

          if (!selected) {
            unresolved.push(initialId);
            return skill;
          }

          const mapped = mapTaxonomySkillToAssignmentSkill(
            selected,
            skill.level ?? 3,
            !!skill.linkedToBV,
            !!skill.linkedToTO
          );

          if (!mapped.label) {
            mapped.label = getSkillLabel(skill);
          }

          return {
            ...skill,
            ...mapped,
          };
        } catch {
          unresolved.push(initialId);
          return skill;
        }
      };

      const [resolvedMust, resolvedNice] = await Promise.all([
        Promise.all(mustHaveSkills.map((skill) => resolveSkill(skill))),
        Promise.all(niceToHaveSkills.map((skill) => resolveSkill(skill))),
      ]);

      const mustChanged = JSON.stringify(resolvedMust) !== JSON.stringify(mustHaveSkills);
      const niceChanged = JSON.stringify(resolvedNice) !== JSON.stringify(niceToHaveSkills);

      if (cancelled) return;

      if (mustChanged) {
        setValue('mustHaveSkills', resolvedMust);
      }

      if (niceChanged) {
        setValue('niceToHaveSkills', resolvedNice);
      }

      setUnresolvedLegacyIds(Array.from(new Set(unresolved)));
    };

    if (mustHaveSkills.length || niceToHaveSkills.length) {
      void resolveLegacySkills();
    }

    return () => {
      cancelled = true;
    };
    // Intentionally run once on first mount with initial form values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSkill = (taxonomySkill: TaxonomySkill, target: 'must' | 'nice') => {
    const mappedSkill = mapTaxonomySkillToAssignmentSkill(
      taxonomySkill,
      target === 'must' ? 3 : 2,
      false,
      false
    );

    if (allSelectedSkillIds.has(mappedSkill.id)) {
      toast.error('Skill already added to this assignment.');
      return;
    }

    if (target === 'must') {
      setValue('mustHaveSkills', [...mustHaveSkills, mappedSkill]);
      return;
    }

    setValue('niceToHaveSkills', [...niceToHaveSkills, mappedSkill]);
  };

  const removeMustHaveSkill = (index: number) => {
    setValue(
      'mustHaveSkills',
      mustHaveSkills.filter((_: AssignmentSkill, i: number) => i !== index)
    );
  };

  const removeNiceToHaveSkill = (index: number) => {
    setValue(
      'niceToHaveSkills',
      niceToHaveSkills.filter((_: AssignmentSkill, i: number) => i !== index)
    );
  };

  const updateMustHaveSkill = (index: number, field: string, value: unknown) => {
    const updated = [...mustHaveSkills];
    updated[index] = { ...updated[index], [field]: value };
    setValue('mustHaveSkills', updated);
  };

  const updateNiceToHaveSkill = (index: number, field: string, value: unknown) => {
    const updated = [...niceToHaveSkills];
    updated[index] = { ...updated[index], [field]: value };
    setValue('niceToHaveSkills', updated);
  };

  const isValid =
    mustHaveSkills.length > 0 &&
    (!educationRequired || (educationJustification && educationJustification.length > 0));

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Step 5: Expertise Mapping</h2>
          <span className="text-sm text-muted-foreground">Step 5 of 5</span>
        </div>
        <p className="text-muted-foreground">
          Pick skills, link to business value and target outcomes, and specify education
          requirements.
        </p>
        <Progress value={100} className="mt-4" />
      </div>

      {unresolvedLegacyIds.length > 0 && (
        <div className="border border-yellow-400 bg-yellow-50 rounded-lg p-4 text-yellow-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium">
                Some prefilled skills could not be auto-mapped to taxonomy codes.
              </p>
              <div className="flex flex-wrap gap-2">
                {unresolvedLegacyIds.map((id) => (
                  <Badge key={id} variant="outline" className="border-yellow-500 text-yellow-900">
                    {id}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
        <Label htmlFor="skill-search">Search skills</Label>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="skill-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Type a skill name (minimum 2 characters)..."
            className="pl-9 pr-9"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        {searchError && <p className="text-sm text-destructive">{searchError}</p>}

        {debouncedQuery.length > 0 && debouncedQuery.length < MIN_SEARCH_LENGTH && (
          <p className="text-sm text-muted-foreground">
            Type at least {MIN_SEARCH_LENGTH} characters to search taxonomy skills.
          </p>
        )}

        {debouncedQuery.length >= MIN_SEARCH_LENGTH &&
          !isSearching &&
          searchResults.length === 0 &&
          !searchError && (
            <p className="text-sm text-muted-foreground">No skills found for this query.</p>
          )}

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-72 overflow-auto">
            {searchResults.map((skill) => {
              const path = taxonomyPathText(skill);
              const selected = allSelectedSkillIds.has(skill.code);
              return (
                <div
                  key={skill.code}
                  className="border rounded-md p-3 bg-background flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{skill.nameI18n?.en || skill.code}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {path || 'No taxonomy path'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{skill.code}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSkill(skill, 'must')}
                      disabled={selected}
                    >
                      Must-have
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addSkill(skill, 'nice')}
                      disabled={selected}
                    >
                      Nice-to-have
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Label>
          Must-Have Skills <span className="text-destructive">*</span>
        </Label>
        {mustHaveSkills.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <p className="text-muted-foreground">
              No must-have skills added. Add at least one skill.
            </p>
          </div>
        ) : (
          mustHaveSkills.map((skill: AssignmentSkill, index: number) => (
            <div key={`${skill.id}-${index}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{getSkillLabel(skill)}</p>
                  {skillPathText(skill) && (
                    <p className="text-xs text-muted-foreground">{skillPathText(skill)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{skill.id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMustHaveSkill(index)}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Proficiency Level</Label>
                  <span className="text-sm font-medium">{skill.level}/5</span>
                </div>
                <Slider
                  value={[skill.level]}
                  onValueChange={(value) => updateMustHaveSkill(index, 'level', value[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`bv-${index}`}
                    checked={!!skill.linkedToBV}
                    onCheckedChange={(checked) =>
                      updateMustHaveSkill(index, 'linkedToBV', checked === true)
                    }
                  />
                  <Label htmlFor={`bv-${index}`} className="text-sm font-normal cursor-pointer">
                    Link to Business Value
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`to-${index}`}
                    checked={!!skill.linkedToTO}
                    onCheckedChange={(checked) =>
                      updateMustHaveSkill(index, 'linkedToTO', checked === true)
                    }
                  />
                  <Label htmlFor={`to-${index}`} className="text-sm font-normal cursor-pointer">
                    Link to Target Outcomes
                  </Label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <Label>Nice-to-Have Skills</Label>
        {niceToHaveSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No nice-to-have skills added.</p>
        ) : (
          niceToHaveSkills.map((skill: AssignmentSkill, index: number) => (
            <div key={`${skill.id}-${index}`} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{getSkillLabel(skill)}</p>
                  {skillPathText(skill) && (
                    <p className="text-xs text-muted-foreground">{skillPathText(skill)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{skill.id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNiceToHaveSkill(index)}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Proficiency Level</Label>
                  <span className="text-sm font-medium">{skill.level}/5</span>
                </div>
                <Slider
                  value={[skill.level]}
                  onValueChange={(value) => updateNiceToHaveSkill(index, 'level', value[0])}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="educationRequired"
            checked={educationRequired}
            onCheckedChange={(checked) => setValue('educationRequired', checked === true)}
          />
          <Label htmlFor="educationRequired" className="font-normal cursor-pointer">
            Formal education required for this role
          </Label>
        </div>

        {educationRequired && (
          <div className="space-y-2">
            <Label htmlFor="educationJustification">
              Education Justification <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="educationJustification"
              placeholder="Explain why formal education is required for this role..."
              className="min-h-[100px]"
              maxLength={500}
              value={educationJustification}
              onChange={(event) => setValue('educationJustification', event.target.value)}
            />
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Required by PRD: Explain why formal education is necessary
              </p>
              <span className="text-xs text-muted-foreground">
                {educationJustification?.length || 0}/500
              </span>
            </div>
            {educationRequired && !educationJustification && (
              <p className="text-sm text-destructive">
                Justification is required when education is mandatory
              </p>
            )}
          </div>
        )}
      </div>

      {mustHaveSkills.length === 0 && (
        <p className="text-sm text-destructive">At least one must-have skill is required</p>
      )}

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting} type="button">
          Back
        </Button>
        <Button onClick={onSubmit} disabled={!isValid || isSubmitting} type="button">
          {isSubmitting ? 'Saving...' : 'Review & Publish'}
        </Button>
      </div>
    </div>
  );
}
