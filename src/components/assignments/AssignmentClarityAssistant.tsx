'use client';

import { useMemo, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Check, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api/fetch';
import { useAssistiveAiFlag } from '@/hooks/useAssistiveAiFlag';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

type AssignmentClaritySuggestion = {
  suggestionId?: string | null;
  fallback?: boolean;
  ambiguityFlags: string[];
  suggestedRewrite: {
    title?: string | null;
    rolePurpose?: string | null;
    outcomeSummary?: string | null;
    constraints?: {
      locationMode?: 'remote' | 'onsite' | 'hybrid' | null;
      city?: string | null;
      country?: string | null;
      hoursMin?: number | null;
      hoursMax?: number | null;
      compensationSummary?: string | null;
      startWindow?: string | null;
    } | null;
    capabilityExpectations?: string[] | null;
    proofExpectations?: string | null;
    verificationRequirements?: string[] | null;
  };
  reviewQuestions: string[];
  excludedOrRiskyCriteria: string[];
};

type PersistedAssignment = {
  assignmentId: string;
  orgId?: string | null;
};

type Props = {
  form: UseFormReturn<any>;
  assignmentId: string | null;
  orgId?: string | null;
  orgSlug: string;
  onEnsureDraft?: () => Promise<PersistedAssignment>;
};

type EditableField = 'title' | 'rolePurpose' | 'outcomeSummary' | 'proofExpectations';

const FIELD_LABELS: Record<EditableField, string> = {
  title: 'Title',
  rolePurpose: 'Role purpose',
  outcomeSummary: 'Outcome summary',
  proofExpectations: 'Proof expectations',
};

const FORM_FIELD_BY_REWRITE_FIELD: Record<EditableField, string> = {
  title: 'role',
  rolePurpose: 'businessValue',
  outcomeSummary: 'description',
  proofExpectations: 'expectedImpact',
};

const ASSIGNMENT_CLARITY_MANUAL_RETRY_REASON =
  'Guided suggestions could not load; manual editing still works.';
const ASSIGNMENT_CLARITY_SAVE_DRAFT_MESSAGE = 'Save a draft before clarifying this assignment.';
const ASSIGNMENT_CLARITY_RETURNED_FALLBACK_REASON =
  'Guided suggestions could not load; manual editing still works.';

function buildOutcomeSummary(outcomes: any[] = []) {
  return outcomes
    .map((outcome) =>
      [outcome.metric, outcome.target ? `success: ${outcome.target}` : null, outcome.timeframe]
        .filter(Boolean)
        .join(' - ')
    )
    .filter(Boolean)
    .join('\n');
}

function responseBody(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function getResponseStatus(response: Response) {
  return typeof response.status === 'number' ? response.status : 'unknown';
}

function hasReturnedError(payload: unknown) {
  if (!payload || typeof payload !== 'object') return false;
  const record = payload as { error?: unknown; message?: unknown };
  return (
    (typeof record.error === 'string' && record.error.trim().length > 0) ||
    (typeof record.message === 'string' && record.message.trim().length > 0)
  );
}

function buildManualAssignmentClaritySuggestion(
  values: any,
  reason: string
): AssignmentClaritySuggestion {
  const outcomeSummary = [values.description, buildOutcomeSummary(values.outcomes || [])]
    .filter(Boolean)
    .join('\n');

  return {
    fallback: true,
    ambiguityFlags: [
      reason,
      'Confirm the concrete outcome before publishing.',
      'Confirm which proof artifact or work sample would count as credible evidence.',
      'Confirm that constraints are practical, current, and not discriminatory.',
    ],
    suggestedRewrite: {
      title: values.role || '',
      rolePurpose: values.businessValue || '',
      outcomeSummary,
      constraints: {
        locationMode: values.locationMode || null,
        city: values.city || null,
        country: values.country || null,
        hoursMin: values.hoursMin ?? null,
        hoursMax: values.hoursMax ?? null,
        compensationSummary:
          values.compMin && values.compMax
            ? `${values.currency || 'USD'} ${values.compMin} to ${values.compMax}`
            : null,
        startWindow:
          [values.startEarliest, values.startLatest].filter(Boolean).join(' to ') || null,
      },
      capabilityExpectations: [],
      proofExpectations: values.expectedImpact || '',
      verificationRequirements: values.verificationGates || [],
    },
    reviewQuestions: [
      'What result must be visible in the first review window?',
      'Which proof would make this assignment safe to review?',
      'Which requirement is truly must-have rather than nice-to-have?',
    ],
    excludedOrRiskyCriteria: [],
  };
}

function recordSuggestionEvent(
  suggestionId: string | null | undefined,
  eventType: 'accepted' | 'edited' | 'dismissed',
  field: string,
  edited?: boolean
) {
  if (!suggestionId) return;
  void apiFetch('/api/ai/suggestions/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      suggestionId,
      eventType,
      field,
      fields: [{ field, edited, applied: eventType === 'accepted' }],
      metadata: { uiSurface: 'assignment_clarity_assistant' },
    }),
  }).catch(() => undefined);
}

export function AssignmentClarityAssistant({
  form,
  assignmentId,
  orgId,
  orgSlug,
  onEnsureDraft,
}: Props) {
  const assistiveAiEnabled = useAssistiveAiFlag();
  const [isClarifying, setIsClarifying] = useState(false);
  const [suggestion, setSuggestion] = useState<AssignmentClaritySuggestion | null>(null);
  const [draft, setDraft] = useState<Record<EditableField, string>>({
    title: '',
    rolePurpose: '',
    outcomeSummary: '',
    proofExpectations: '',
  });
  const [acceptedFields, setAcceptedFields] = useState<Set<string>>(() => new Set());
  const [dismissedFields, setDismissedFields] = useState<Set<string>>(() => new Set());

  const visibleEditableFields = useMemo(() => {
    if (!suggestion) return [];
    return (Object.keys(FIELD_LABELS) as EditableField[]).filter((field) => {
      const value = suggestion.suggestedRewrite[field];
      return Boolean(value && !dismissedFields.has(field));
    });
  }, [dismissedFields, suggestion]);

  const handleClarify = async () => {
    setIsClarifying(true);
    setAcceptedFields(new Set());
    setDismissedFields(new Set());
    let latestValues: any | null = null;

    const showManualChecklist = (values: any, reason = ASSIGNMENT_CLARITY_MANUAL_RETRY_REASON) => {
      const payload = buildManualAssignmentClaritySuggestion(values, reason);
      setSuggestion(payload);
      setDraft({
        title: payload.suggestedRewrite.title || '',
        rolePurpose: payload.suggestedRewrite.rolePurpose || '',
        outcomeSummary: payload.suggestedRewrite.outcomeSummary || '',
        proofExpectations: payload.suggestedRewrite.proofExpectations || '',
      });
    };

    try {
      const values = form.getValues();
      latestValues = values;
      const persisted = assignmentId
        ? { assignmentId, orgId }
        : onEnsureDraft
          ? await onEnsureDraft()
          : null;

      if (!persisted?.assignmentId) {
        throw new Error(ASSIGNMENT_CLARITY_SAVE_DRAFT_MESSAGE);
      }

      const outcomeSummary = [values.description, buildOutcomeSummary(values.outcomes || [])]
        .filter(Boolean)
        .join('\n');

      const response =
        (await apiFetch('/api/ai/assignments/clarify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentId: persisted.assignmentId,
            orgId: persisted.orgId ?? orgId ?? undefined,
            orgSlug,
            title: values.role,
            outcomeSummary,
            constraints: {
              locationMode: values.locationMode,
              city: values.city,
              country: values.country,
              compMin: values.compMin,
              compMax: values.compMax,
              currency: values.currency,
              hoursMin: values.hoursMin,
              hoursMax: values.hoursMax,
              startEarliest: values.startEarliest,
              startLatest: values.startLatest,
            },
            mustHaveSkills: values.mustHaveSkills || [],
            proofExpectations: values.expectedImpact,
            engagementType: values.engagementType,
            verificationRequirements: values.verificationGates || [],
          }),
        })) || responseBody({});

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
          fallbackAvailable?: boolean;
        };
        if (errorData.fallbackAvailable) {
          showManualChecklist(
            values,
            'AI suggestions are temporarily unavailable; manual editing still works.'
          );
          return;
        }
        dispatchClientDiagnostic('assignments.clarity_assistant.returned_error', {
          status: getResponseStatus(response),
          hasReturnedError: hasReturnedError(errorData),
        });
        showManualChecklist(values, ASSIGNMENT_CLARITY_RETURNED_FALLBACK_REASON);
        toast.error('Guided suggestions could not load. Manual checklist is ready.');
        return;
      }

      const payload = (await response.json()) as AssignmentClaritySuggestion;
      setSuggestion(payload);
      setDraft({
        title: payload.suggestedRewrite.title || '',
        rolePurpose: payload.suggestedRewrite.rolePurpose || '',
        outcomeSummary: payload.suggestedRewrite.outcomeSummary || '',
        proofExpectations: payload.suggestedRewrite.proofExpectations || '',
      });
    } catch (error) {
      if (error instanceof Error && error.message === ASSIGNMENT_CLARITY_SAVE_DRAFT_MESSAGE) {
        toast.error(ASSIGNMENT_CLARITY_SAVE_DRAFT_MESSAGE);
      } else if (latestValues) {
        dispatchClientErrorDiagnostic('assignments.clarity_assistant.request_failed', error);
        showManualChecklist(latestValues);
        toast.error('Guided suggestions could not load. Manual checklist is ready.');
      } else {
        toast.error(ASSIGNMENT_CLARITY_SAVE_DRAFT_MESSAGE);
      }
    } finally {
      setIsClarifying(false);
    }
  };

  const handleAccept = (field: EditableField) => {
    form.setValue(FORM_FIELD_BY_REWRITE_FIELD[field], draft[field], {
      shouldDirty: true,
      shouldTouch: true,
    });
    setAcceptedFields((current) => new Set(current).add(field));
    recordSuggestionEvent(
      suggestion?.suggestionId,
      'accepted',
      field,
      draft[field] !== (suggestion?.suggestedRewrite[field] || '')
    );
  };

  const handleDismiss = (field: string) => {
    setDismissedFields((current) => new Set(current).add(field));
    recordSuggestionEvent(suggestion?.suggestionId, 'dismissed', field);
  };

  const handleEdited = (field: EditableField) => {
    if (!suggestion?.suggestionId) return;
    if (draft[field] === (suggestion.suggestedRewrite[field] || '')) return;
    recordSuggestionEvent(suggestion.suggestionId, 'edited', field, true);
  };

  const handleAcceptConstraints = () => {
    const constraints = suggestion?.suggestedRewrite.constraints;
    if (!constraints) return;

    for (const [key, value] of Object.entries(constraints)) {
      if (value === null || value === undefined) continue;
      if (['locationMode', 'city', 'country', 'hoursMin', 'hoursMax'].includes(key)) {
        form.setValue(key, value, { shouldDirty: true, shouldTouch: true });
      }
    }
    setAcceptedFields((current) => new Set(current).add('constraints'));
    recordSuggestionEvent(suggestion?.suggestionId, 'accepted', 'constraints');
  };

  if (!assistiveAiEnabled) {
    return (
      <Card className="min-w-0 space-y-3 p-4" data-testid="assignment-clarity-assistant">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Assignment clarity</h2>
          <p className="break-words text-sm text-muted-foreground">
            Manual guidance: name the outcome, proof expectations, constraints, and must-have
            capabilities before publishing.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4" data-testid="assignment-clarity-assistant">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Assignment clarity</h2>
          <p className="text-sm text-muted-foreground">
            AI suggestions are drafts. They do not verify, score, rank, or evaluate anyone.
          </p>
        </div>
        <Button onClick={handleClarify} disabled={isClarifying} variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          {isClarifying ? 'Clarifying...' : 'Clarify assignment'}
        </Button>
      </div>

      {suggestion ? (
        <div className="space-y-4">
          {suggestion.fallback ? (
            <div className="rounded-md border border-proofound-stone bg-white p-3">
              <p className="text-sm font-medium text-foreground">Manual clarity checklist</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Guided suggestions are unavailable right now, so use this checklist to keep editing
                manually.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-proofound-stone bg-white p-3">
              <p className="text-sm font-medium text-foreground">Draft assistance</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Review, edit, accept, or dismiss each suggestion before it affects the draft.
              </p>
            </div>
          )}

          {suggestion.ambiguityFlags.length > 0 ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-950">Ambiguity flags</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {suggestion.ambiguityFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {visibleEditableFields.map((field) => (
            <div key={field} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`assignment-clarity-${field}`}>{FIELD_LABELS[field]}</Label>
                {acceptedFields.has(field) ? (
                  <span className="text-xs font-medium text-proofound-forest">Accepted</span>
                ) : null}
              </div>
              <Textarea
                id={`assignment-clarity-${field}`}
                aria-label={FIELD_LABELS[field]}
                value={draft[field]}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, [field]: event.target.value }))
                }
                onBlur={() => handleEdited(field)}
                className="min-h-[96px]"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => handleDismiss(field)}>
                  <X className="mr-2 h-4 w-4" />
                  Dismiss {FIELD_LABELS[field].toLowerCase()}
                </Button>
                <Button type="button" variant="outline" onClick={() => handleAccept(field)}>
                  <Check className="mr-2 h-4 w-4" />
                  Accept {FIELD_LABELS[field].toLowerCase()}
                </Button>
              </div>
            </div>
          ))}

          {suggestion.suggestedRewrite.constraints && !dismissedFields.has('constraints') ? (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Constraints</p>
                {acceptedFields.has('constraints') ? (
                  <span className="text-xs font-medium text-proofound-forest">Accepted</span>
                ) : null}
              </div>
              <dl className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                {Object.entries(suggestion.suggestedRewrite.constraints)
                  .filter(([, value]) => value !== null && value !== undefined && value !== '')
                  .map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-medium text-foreground">{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
              </dl>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => handleDismiss('constraints')}>
                  <X className="mr-2 h-4 w-4" />
                  Dismiss constraints
                </Button>
                <Button type="button" variant="outline" onClick={handleAcceptConstraints}>
                  <Check className="mr-2 h-4 w-4" />
                  Accept constraints
                </Button>
              </div>
            </div>
          ) : null}

          {suggestion.reviewQuestions.length > 0 ? (
            <div className="rounded-md border p-3">
              <p className="text-sm font-medium text-foreground">Review questions</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {suggestion.reviewQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {suggestion.excludedOrRiskyCriteria.length > 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-950">Excluded criteria</p>
              <ul className="mt-2 space-y-1 text-sm text-red-900">
                {suggestion.excludedOrRiskyCriteria.map((criteria) => (
                  <li key={criteria}>{criteria}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
