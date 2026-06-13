'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileText, PencilLine, Wand2 } from 'lucide-react';

import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
} from '@/components/matching/assignment-steps';
import { AssignmentClarityAssistant } from '@/components/assignments/AssignmentClarityAssistant';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import {
  extractAssignmentDraftFromJobDescription,
  type ImportedAssignmentDraft,
} from '@/lib/assignments/job-description-import';

interface AssignmentFormData {
  engagementType?: 'full_time' | 'part_time' | 'contract_consulting' | 'fractional_project';
  role: string;
  businessValue: string;
  description: string;
  expectedImpact: string;
  outcomes: Array<{
    metric: string;
    target: string;
    timeframe: string;
  }>;
  compMin?: number;
  compMax?: number;
  currency: string;
  hoursMin?: number;
  hoursMax?: number;
  locationMode?: 'onsite' | 'hybrid' | 'remote';
  city?: string;
  country?: string;
  startEarliest?: string;
  startLatest?: string;
  verificationGates?: string[];
  mustHaveSkills: Array<{
    id: string;
    label: string;
    level: number;
    linkedToBV?: boolean;
    linkedToTO?: boolean;
  }>;
  niceToHaveSkills?: Array<{
    id: string;
    label: string;
    level: number;
    linkedToBV?: boolean;
    linkedToTO?: boolean;
  }>;
}

const STEPS = [
  { id: 1, name: 'Why this role exists', description: 'Purpose and value' },
  { id: 2, name: 'What work will actually be done', description: 'Responsibilities and outcomes' },
  { id: 3, name: 'What proof would count', description: 'Evidence and skills' },
  { id: 4, name: 'What practical constraints are real', description: 'Logistics and timing' },
  { id: 5, name: 'Internal review and publish', description: 'Review before publish' },
];

const DEFAULT_ASSIGNMENT_FORM_VALUES: AssignmentFormData = {
  engagementType: 'full_time',
  role: '',
  businessValue: '',
  description: '',
  expectedImpact: '',
  outcomes: [],
  locationMode: 'hybrid',
  compMin: 0,
  compMax: 0,
  currency: 'USD',
  hoursMin: 20,
  hoursMax: 40,
  verificationGates: [],
  mustHaveSkills: [],
  niceToHaveSkills: [],
};

type AssignmentEntryMode = 'scratch' | 'import';

type ImportedDraftNotice = {
  missingFields: string[];
  guidance: string[];
  mustHaveLabels: string[];
  niceToHaveLabels: string[];
};

type AssignmentWorkflowFeedback = {
  kind: 'draft_load' | 'draft_save' | 'review_save';
  title: string;
  message: string;
  actionLabel: string;
};

type AssignmentBuilderClientProps = {
  slug: string;
};

const DRAFT_SAVE_FAILED_MESSAGE =
  'Your changes are still on this page. Retry the draft save before moving on.';
const REVIEW_SAVE_FAILED_MESSAGE =
  'Your draft is still on this page. Retry before leaving for internal review.';
const AUTO_SAVE_FAILED_MESSAGE =
  'Auto-save did not finish. Your draft is still on this page; use Next to save before leaving.';
const JOB_DESCRIPTION_IMPORT_CHECKLIST = [
  'Role title and why this assignment matters',
  'Main workstreams or first outcomes',
  'Must-have capabilities',
  'Proof expectations',
  'Location, hours, compensation, or timing constraints',
];

function dedupeAssignmentOutcomes(outcomes: AssignmentFormData['outcomes'] = []) {
  const seen = new Set<string>();

  return outcomes.filter((outcome) => {
    const key = [
      outcome.metric?.trim().toLowerCase() || '',
      outcome.target?.trim().toLowerCase() || '',
      outcome.timeframe?.trim().toLowerCase() || '',
    ].join('|');

    if (!key.replaceAll('|', '') || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function resolveDraftResumeStep(assignment: any) {
  if (!assignment?.role || !assignment?.businessValue) return 1;

  const outcomes = Array.isArray(assignment.outcomes) ? assignment.outcomes : [];
  if (outcomes.length === 0) return 2;

  const requiredSkills = Array.isArray(assignment.requiredSkills) ? assignment.requiredSkills : [];
  if (!assignment.expectedImpact || requiredSkills.length < 3) return 3;

  return 4;
}

async function assignmentBuilderResponseError(response: Response, fallback: string) {
  const errorData = await response.json().catch(() => null);
  const message =
    typeof errorData?.message === 'string'
      ? errorData.message
      : typeof errorData?.error === 'string'
        ? errorData.error
        : fallback;

  return new Error(message);
}

export default function AssignmentBuilderPage({ slug }: AssignmentBuilderClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams?.get('draftId');
  const assignmentOrgQuery = slug ? `?orgSlug=${encodeURIComponent(slug)}` : '';

  const [currentStep, setCurrentStep] = useState(1);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isHydratingDraft, setIsHydratingDraft] = useState(Boolean(draftId));
  const [workflowFeedback, setWorkflowFeedback] = useState<AssignmentWorkflowFeedback | null>(null);
  const [autoSaveFeedback, setAutoSaveFeedback] = useState<string | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<AssignmentEntryMode>('scratch');
  const [jobDescriptionSource, setJobDescriptionSource] = useState('');
  const [jobDescriptionImportError, setJobDescriptionImportError] = useState<string | null>(null);
  const [jobDescriptionImportGuidance, setJobDescriptionImportGuidance] = useState<string[]>([]);
  const [importedDraftNotice, setImportedDraftNotice] = useState<ImportedDraftNotice | null>(null);
  const [loadedAssignmentStatus, setLoadedAssignmentStatus] = useState<
    'draft' | 'active' | 'hold' | 'closed' | null
  >(null);
  const [loadedAssignmentCreationStatus, setLoadedAssignmentCreationStatus] = useState<
    'draft' | 'assignment_ready' | 'review_ready' | null
  >(null);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const assignmentIdRef = useRef<string | null>(null);
  const loadedAssignmentStatusRef = useRef<typeof loadedAssignmentStatus>(null);
  const loadedAssignmentCreationStatusRef = useRef<typeof loadedAssignmentCreationStatus>(null);
  const transitionLockRef = useRef(false);
  const previousDraftIdRef = useRef<string | null>(draftId);

  useEffect(() => {
    assignmentIdRef.current = assignmentId;
  }, [assignmentId]);

  useEffect(() => {
    loadedAssignmentStatusRef.current = loadedAssignmentStatus;
  }, [loadedAssignmentStatus]);

  useEffect(() => {
    loadedAssignmentCreationStatusRef.current = loadedAssignmentCreationStatus;
  }, [loadedAssignmentCreationStatus]);

  const form = useForm<AssignmentFormData>({
    defaultValues: DEFAULT_ASSIGNMENT_FORM_VALUES,
  });

  useLayoutEffect(() => {
    if (previousDraftIdRef.current && !draftId) {
      form.reset(DEFAULT_ASSIGNMENT_FORM_VALUES);
      setCurrentStep(1);
      setAssignmentId(null);
      setOrgId(null);
      setLoadedAssignmentStatus(null);
      setLoadedAssignmentCreationStatus(null);
      setLastSaved(null);
      setHasHydratedDraft(false);
      setIsHydratingDraft(false);
      setWorkflowFeedback(null);
      setAutoSaveFeedback(null);
      setImportedDraftNotice(null);
    }

    previousDraftIdRef.current = draftId;
  }, [draftId, form]);

  const normalizeDateInput = useCallback((value?: string | null) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (!draftId || hasHydratedDraft) return;

    const hydrateDraft = async () => {
      setIsHydratingDraft(true);
      setWorkflowFeedback(null);

      try {
        const response = await fetch(`/api/assignments/${draftId}${assignmentOrgQuery}`);
        if (!response.ok) {
          throw new Error('Failed to load draft assignment');
        }

        const payload = await response.json();
        const assignment = payload.assignment;
        if (!assignment?.id) {
          throw new Error('Invalid draft assignment payload');
        }

        form.reset({
          engagementType: assignment.engagementType || 'full_time',
          role: assignment.role || '',
          businessValue: assignment.businessValue || '',
          description: assignment.description || '',
          expectedImpact: assignment.expectedImpact || '',
          outcomes: dedupeAssignmentOutcomes(
            Array.isArray(assignment.outcomes) ? assignment.outcomes : []
          ),
          locationMode: assignment.locationMode || 'hybrid',
          city: assignment.city || '',
          country: assignment.country || '',
          compMin: assignment.compMin ?? assignment.compensationMin ?? 0,
          compMax: assignment.compMax ?? assignment.compensationMax ?? 0,
          currency: assignment.currency || 'USD',
          hoursMin: assignment.hoursMin ?? 20,
          hoursMax: assignment.hoursMax ?? 40,
          startEarliest: normalizeDateInput(assignment.startEarliest),
          startLatest: normalizeDateInput(assignment.startLatest),
          verificationGates: assignment.verificationGates || [],
          mustHaveSkills: assignment.requiredSkills || [],
          niceToHaveSkills: assignment.niceToHaveSkills || [],
        });

        setAssignmentId(assignment.id);
        setOrgId(assignment.orgId || null);
        setLoadedAssignmentStatus(
          ['draft', 'active', 'hold', 'closed'].includes(assignment.status)
            ? assignment.status
            : 'draft'
        );
        setLoadedAssignmentCreationStatus(
          ['draft', 'assignment_ready', 'review_ready'].includes(assignment.creationStatus)
            ? assignment.creationStatus
            : 'draft'
        );
        setLastSaved(new Date());
        setCurrentStep(resolveDraftResumeStep(assignment));
      } catch (error) {
        dispatchClientErrorDiagnostic('assignment_builder.client.draft_load_failed', error);
        setWorkflowFeedback({
          kind: 'draft_load',
          title: 'Draft did not load',
          message:
            'Your saved assignment has not been changed. Retry loading before editing so you do not overwrite the draft.',
          actionLabel: 'Retry draft load',
        });
      } finally {
        setHasHydratedDraft(true);
        setIsHydratingDraft(false);
      }
    };

    void hydrateDraft();
  }, [assignmentOrgQuery, draftId, form, hasHydratedDraft, normalizeDateInput]);

  const buildAssignmentPayload = useCallback(
    (
      data: AssignmentFormData,
      overrides?: {
        status?: 'draft' | 'active' | 'hold' | 'closed';
        creationStatus?: 'draft' | 'assignment_ready' | 'review_ready';
      }
    ) => ({
      orgSlug: slug,
      builderMode: 'basic' as const,
      title: data.role,
      engagementType: data.engagementType,
      description: data.description,
      rolePurpose: data.businessValue,
      proofExpectations: data.expectedImpact,
      status: overrides?.status ?? 'draft',
      creationStatus: overrides?.creationStatus ?? 'draft',
      mustHaveSkills: data.mustHaveSkills,
      niceToHaveSkills: data.niceToHaveSkills || [],
      locationMode: data.locationMode,
      city: data.city,
      country: data.country,
      compMin: data.compMin,
      compMax: data.compMax,
      currency: data.currency,
      hoursMin: data.hoursMin,
      hoursMax: data.hoursMax,
      startEarliest: data.startEarliest,
      startLatest: data.startLatest,
      verificationGates: data.verificationGates,
      weights: null,
    }),
    [slug]
  );

  const shouldAutoSaveDraft = useCallback((data: AssignmentFormData) => {
    return Boolean(
      data.role ||
        data.businessValue ||
        data.description ||
        data.expectedImpact ||
        (data.outcomes && data.outcomes.length > 0) ||
        (data.mustHaveSkills && data.mustHaveSkills.length > 0) ||
        (data.niceToHaveSkills && data.niceToHaveSkills.length > 0)
    );
  }, []);

  const applyImportedDraft = useCallback(
    (draft: ImportedAssignmentDraft) => {
      form.reset({
        ...DEFAULT_ASSIGNMENT_FORM_VALUES,
        role: draft.role,
        engagementType: draft.engagementType,
        businessValue: draft.businessValue,
        description: draft.description,
        expectedImpact: draft.expectedImpact,
        outcomes: draft.outcomes,
        mustHaveSkills: draft.mustHaveSkills,
        niceToHaveSkills: draft.niceToHaveSkills,
        locationMode: draft.locationMode,
        city: draft.city || '',
        country: draft.country || '',
        compMin: draft.compMin ?? DEFAULT_ASSIGNMENT_FORM_VALUES.compMin,
        compMax: draft.compMax ?? DEFAULT_ASSIGNMENT_FORM_VALUES.compMax,
        currency: draft.currency || DEFAULT_ASSIGNMENT_FORM_VALUES.currency,
        hoursMin: draft.hoursMin ?? DEFAULT_ASSIGNMENT_FORM_VALUES.hoursMin,
        hoursMax: draft.hoursMax ?? DEFAULT_ASSIGNMENT_FORM_VALUES.hoursMax,
      });
      setCurrentStep(1);
      setLastSaved(null);
    },
    [form]
  );

  const handleImportJobDescription = useCallback(() => {
    const result = extractAssignmentDraftFromJobDescription(jobDescriptionSource);

    if (!result.ok) {
      setJobDescriptionImportError(result.error);
      setJobDescriptionImportGuidance(result.guidance);
      setImportedDraftNotice(null);
      return;
    }

    applyImportedDraft(result.draft);
    setJobDescriptionImportError(null);
    setJobDescriptionImportGuidance(result.guidance);
    setImportedDraftNotice({
      missingFields: result.draft.missingFields,
      guidance: result.guidance,
      mustHaveLabels: result.draft.mustHaveSkills.map((skill) => skill.label),
      niceToHaveLabels: result.draft.niceToHaveSkills.map((skill) => skill.label),
    });
    setJobDescriptionSource('');
    setEntryMode('scratch');
    toast.success('Job description converted into editable assignment fields');
  }, [applyImportedDraft, jobDescriptionSource]);

  const handleJobDescriptionSourceChange = useCallback(
    (value: string) => {
      setJobDescriptionSource(value);

      if (jobDescriptionImportError) {
        setJobDescriptionImportError(null);
        setJobDescriptionImportGuidance([]);
      }

      if (importedDraftNotice) {
        setImportedDraftNotice(null);
      }
    },
    [importedDraftNotice, jobDescriptionImportError]
  );

  const saveOutcomes = useCallback(
    async (targetAssignmentId: string) => {
      const outcomes = form.getValues('outcomes') || [];
      const transformedOutcomes = dedupeAssignmentOutcomes(outcomes).map((outcome) => ({
        outcomeType: 'continuous' as const,
        title: outcome.metric,
        description: `Target: ${outcome.target} in ${outcome.timeframe}`,
        metrics: [
          {
            name: outcome.metric,
            target: outcome.target,
            unit: '',
            current: '',
          },
        ],
        successCriteria: `Achieve ${outcome.target} within ${outcome.timeframe}`,
      }));

      const response = await apiFetch(
        `/api/assignments/${targetAssignmentId}/outcomes${assignmentOrgQuery}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcomes: transformedOutcomes }),
        }
      );

      if (!response.ok) {
        throw await assignmentBuilderResponseError(response, 'Failed to save assignment outcomes');
      }
    },
    [assignmentOrgQuery, form]
  );

  const saveExpertiseMatrix = useCallback(
    async (targetAssignmentId: string) => {
      const mustHaveSkills = form.getValues('mustHaveSkills') || [];

      const outcomesResponse = await fetch(
        `/api/assignments/${targetAssignmentId}/outcomes${assignmentOrgQuery}`
      );
      if (!outcomesResponse.ok) {
        throw await assignmentBuilderResponseError(
          outcomesResponse,
          'Failed to load assignment outcomes for expertise mapping'
        );
      }

      const outcomesData = await outcomesResponse.json();
      const outcomes = outcomesData.outcomes || [];

      const mustRows = mustHaveSkills.map((skill: any) => ({
        skillCode: skill.id,
        requiredLevel: skill.level,
        stakeholderRole: 'must',
        linkedOutcomeId: skill.linkedToTO && outcomes.length > 0 ? outcomes[0].id : undefined,
        outcomeRationale:
          skill.linkedToBV || skill.linkedToTO
            ? `Linked to${skill.linkedToBV ? ' role purpose' : ''}${skill.linkedToTO ? ' and assignment outcomes' : ''}`.trim()
            : undefined,
      }));

      const response = await apiFetch(
        `/api/assignments/${targetAssignmentId}/expertise-matrix${assignmentOrgQuery}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expertiseMatrix: mustRows }),
        }
      );

      if (!response.ok) {
        throw await assignmentBuilderResponseError(
          response,
          'Failed to save assignment expertise mapping'
        );
      }
    },
    [assignmentOrgQuery, form]
  );

  const syncRelatedData = useCallback(
    async (targetAssignmentId: string) => {
      await saveOutcomes(targetAssignmentId);
      await saveExpertiseMatrix(targetAssignmentId);
    },
    [saveExpertiseMatrix, saveOutcomes]
  );

  const persistDraft = useCallback(
    async (options?: {
      status?: 'draft' | 'active' | 'hold' | 'closed';
      creationStatus?: 'draft' | 'assignment_ready' | 'review_ready';
    }) => {
      const currentAssignmentId = assignmentIdRef.current;
      const currentLoadedStatus = loadedAssignmentStatusRef.current;
      const currentLoadedCreationStatus = loadedAssignmentCreationStatusRef.current;
      const shouldPreservePublishedStatus = currentAssignmentId && currentLoadedStatus === 'active';
      const resolvedStatus =
        shouldPreservePublishedStatus && (!options?.status || options.status === 'draft')
          ? 'active'
          : (options?.status ?? 'draft');
      const resolvedCreationStatus =
        shouldPreservePublishedStatus &&
        (!options?.creationStatus || options.creationStatus === 'draft')
          ? currentLoadedCreationStatus === 'review_ready'
            ? currentLoadedCreationStatus
            : 'review_ready'
          : (options?.creationStatus ?? 'draft');
      const payload = buildAssignmentPayload(form.getValues(), {
        status: resolvedStatus,
        creationStatus: resolvedCreationStatus,
      });

      const response = currentAssignmentId
        ? await apiFetch(`/api/assignments/${currentAssignmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await apiFetch('/api/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.error || 'Failed to persist assignment draft'
        );
      }

      const result = await response.json();
      const persistedAssignment = result.assignment;
      if (!persistedAssignment?.id) {
        throw new Error('Draft response missing assignment id');
      }

      if (!currentAssignmentId) {
        setAssignmentId(persistedAssignment.id);
        setOrgId(persistedAssignment.orgId ?? null);
        if (typeof window !== 'undefined' && slug) {
          const nextDraftUrl = `/app/o/${slug}/assignments/new?draftId=${persistedAssignment.id}`;
          window.history.replaceState(null, '', nextDraftUrl);
        }
      }

      setLoadedAssignmentStatus(
        ['draft', 'active', 'hold', 'closed'].includes(persistedAssignment.status)
          ? persistedAssignment.status
          : resolvedStatus
      );
      setLoadedAssignmentCreationStatus(
        ['draft', 'assignment_ready', 'review_ready'].includes(persistedAssignment.creationStatus)
          ? persistedAssignment.creationStatus
          : resolvedCreationStatus
      );

      setLastSaved(new Date());

      return {
        assignmentId: persistedAssignment.id as string,
        orgId: (persistedAssignment.orgId as string | null) ?? orgId,
      };
    },
    [buildAssignmentPayload, form, orgId, slug]
  );

  useEffect(() => {
    if (draftId && !hasHydratedDraft) {
      return;
    }

    const interval = setInterval(() => {
      if (transitionLockRef.current) {
        return;
      }

      const current = form.getValues();
      if (!shouldAutoSaveDraft(current)) {
        return;
      }

      void (async () => {
        try {
          const persisted = await persistDraft();
          await syncRelatedData(persisted.assignmentId);
          setAutoSaveFeedback(null);
        } catch (error) {
          dispatchClientErrorDiagnostic('assignment_builder.client.auto_save_failed', error);
          setAutoSaveFeedback(AUTO_SAVE_FAILED_MESSAGE);
        }
      })();
    }, 30000);

    return () => clearInterval(interval);
  }, [draftId, form, hasHydratedDraft, persistDraft, shouldAutoSaveDraft, syncRelatedData]);

  const handleNext = async () => {
    if (transitionLockRef.current || isAdvancing || isSaving) return;
    transitionLockRef.current = true;
    setIsAdvancing(true);

    try {
      setWorkflowFeedback(null);
      const persisted = await persistDraft({
        status: 'draft',
        creationStatus: 'draft',
      });
      await syncRelatedData(persisted.assignmentId);
      setAutoSaveFeedback(null);
      setCurrentStep((step) => Math.min(step + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      dispatchClientErrorDiagnostic('assignment_builder.client.draft_save_failed', error);
      setWorkflowFeedback({
        kind: 'draft_save',
        title: 'Draft was not saved',
        message: DRAFT_SAVE_FAILED_MESSAGE,
        actionLabel: 'Retry draft save',
      });
    } finally {
      transitionLockRef.current = false;
      setIsAdvancing(false);
    }
  };

  const handleBack = () => {
    if (transitionLockRef.current || isAdvancing || isSaving) return;
    if (currentStep <= 1) return;
    setCurrentStep((step) => Math.max(step - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (transitionLockRef.current || isAdvancing || isSaving) return;
    transitionLockRef.current = true;
    setIsSaving(true);
    try {
      setWorkflowFeedback(null);
      const persisted = await persistDraft({
        status: 'draft',
        creationStatus: 'review_ready',
      });
      await syncRelatedData(persisted.assignmentId);
      setAutoSaveFeedback(null);
      toast.success('Assignment saved for internal review');
      router.push(`/app/o/${slug}/assignments/${persisted.assignmentId}/review`);
    } catch (error) {
      dispatchClientErrorDiagnostic('assignment_builder.client.review_save_failed', error);
      setWorkflowFeedback({
        kind: 'review_save',
        title: 'Assignment was not saved for review',
        message: REVIEW_SAVE_FAILED_MESSAGE,
        actionLabel: 'Retry review save',
      });
    } finally {
      transitionLockRef.current = false;
      setIsSaving(false);
    }
  };

  const ensureClarityDraft = useCallback(async () => {
    if (transitionLockRef.current || isAdvancing || isSaving) {
      throw new Error('Wait for the current draft save to finish.');
    }

    transitionLockRef.current = true;
    try {
      const persisted = await persistDraft({
        status: 'draft',
        creationStatus: 'draft',
      });
      await syncRelatedData(persisted.assignmentId);
      return persisted;
    } finally {
      transitionLockRef.current = false;
    }
  }, [isAdvancing, isSaving, persistDraft, syncRelatedData]);

  const handleRetryWorkflowFeedback = () => {
    if (!workflowFeedback || transitionLockRef.current || isAdvancing || isSaving) return;

    if (workflowFeedback.kind === 'draft_load') {
      setHasHydratedDraft(false);
      return;
    }

    if (workflowFeedback.kind === 'draft_save') {
      void handleNext();
      return;
    }

    void handleSubmit();
  };

  let renderedStep;
  switch (currentStep) {
    case 1:
      renderedStep = (
        <Step1BusinessValue form={form} onNext={handleNext} isSubmitting={isAdvancing} />
      );
      break;
    case 2:
      renderedStep = (
        <Step2TargetOutcomes
          form={form}
          onNext={handleNext}
          onBack={handleBack}
          isSubmitting={isAdvancing}
        />
      );
      break;
    case 3:
      renderedStep = (
        <Step3WeightMatrix
          form={form}
          onNext={handleNext}
          onBack={handleBack}
          isSubmitting={isAdvancing}
        />
      );
      break;
    case 4:
    default:
      renderedStep = (
        <Step4Practicals
          form={form}
          onNext={handleSubmit}
          onBack={handleBack}
          isSubmitting={isSaving}
        />
      );
      break;
  }

  const isDraftLoadBlocked = workflowFeedback?.kind === 'draft_load';
  const shouldShowBuilderSections = !isHydratingDraft && !isDraftLoadBlocked;

  return (
    <AppSurface>
      <div className="mx-auto flex min-w-0 max-w-4xl flex-col gap-6">
        <header className="space-y-1 border-b border-proofound-stone/50 pb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-proofound-forest">
            Lean assignment corridor
          </p>
          <h1 className="font-display text-3xl font-semibold text-proofound-charcoal">
            Create assignment
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Define one proof-led role with clear expectations, then save for internal review before
            publish.
          </p>
        </header>

        {workflowFeedback ? (
          <div
            role="alert"
            aria-live="assertive"
            className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">{workflowFeedback.title}</p>
                <p className="text-sm leading-6">{workflowFeedback.message}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-700 text-amber-950 hover:bg-amber-100"
              onClick={handleRetryWorkflowFeedback}
              disabled={isAdvancing || isSaving}
            >
              {workflowFeedback.actionLabel}
            </Button>
          </div>
        ) : null}

        {isHydratingDraft ? (
          <Card
            className="p-5 text-sm leading-6 text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            Loading saved assignment draft...
          </Card>
        ) : null}

        {shouldShowBuilderSections ? (
          <>
            <section className="rounded-xl border border-proofound-stone/70 bg-white/75 p-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.6fr)] lg:items-center">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-foreground">
                    What this assignment path proves
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The company turns a vague role into measurable outcomes and proof-based
                    requirements before inviting proof submissions.
                  </p>
                </div>
                <div
                  className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-proofound-forest"
                  data-testid="assignment-demo-path"
                >
                  <span className="rounded-md border border-proofound-stone/70 bg-[#f8f6f1] px-2 py-2">
                    Start
                  </span>
                  <span className="rounded-md border border-proofound-stone/70 bg-[#f8f6f1] px-2 py-2">
                    Middle
                  </span>
                  <span className="rounded-md border border-proofound-stone/70 bg-[#f8f6f1] px-2 py-2">
                    Finish
                  </span>
                </div>
              </div>
            </section>

            <Card className="min-w-0 p-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Start from scratch or import
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Keep the corridor narrow: one structured assignment, then internal review before
                    publish.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <Button
                    type="button"
                    variant={entryMode === 'scratch' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => {
                      setEntryMode('scratch');
                      setJobDescriptionImportError(null);
                      setWorkflowFeedback(null);
                      setAutoSaveFeedback(null);
                    }}
                  >
                    <PencilLine className="mr-2 h-4 w-4" />
                    Create from scratch
                  </Button>
                  <Button
                    type="button"
                    variant={entryMode === 'import' ? 'default' : 'outline'}
                    className="justify-start"
                    onClick={() => {
                      setEntryMode('import');
                      setWorkflowFeedback(null);
                      setAutoSaveFeedback(null);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Import existing assignment brief
                  </Button>
                </div>

                {entryMode === 'import' ? (
                  <div className="space-y-3 rounded-md border bg-muted/30 p-4">
                    <div className="space-y-1">
                      <label
                        htmlFor="job-description-import"
                        className="text-sm font-medium text-foreground"
                      >
                        Existing assignment brief
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Paste the source text. It will be split into draft fields for review.
                      </p>
                    </div>
                    <Textarea
                      id="job-description-import"
                      value={jobDescriptionSource}
                      onChange={(event) => handleJobDescriptionSourceChange(event.target.value)}
                      className="min-h-[220px]"
                      placeholder="Paste the existing assignment brief here..."
                      aria-describedby={
                        jobDescriptionImportError
                          ? 'job-description-import-help job-description-import-error'
                          : 'job-description-import-help'
                      }
                    />
                    <div
                      id="job-description-import-help"
                      className="rounded-md border border-proofound-stone/70 bg-white p-3 text-xs leading-5 text-muted-foreground"
                    >
                      <p className="font-medium text-foreground">Best conversion input includes:</p>
                      <ul className="mt-1 list-disc space-y-1 pl-4">
                        {JOB_DESCRIPTION_IMPORT_CHECKLIST.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    {jobDescriptionImportError ? (
                      <div
                        id="job-description-import-error"
                        role="alert"
                        aria-live="assertive"
                        className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
                      >
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <div className="space-y-1">
                          <p className="font-medium">Import needs a fuller brief</p>
                          <p>{jobDescriptionImportError}</p>
                          {jobDescriptionImportGuidance.map((item) => (
                            <p key={item}>{item}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex justify-end">
                      <Button type="button" onClick={handleImportJobDescription}>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Convert to structured draft
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>

            {importedDraftNotice ? (
              <Card className="p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5D7B5A]" />
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Imported draft ready for review
                      </p>
                      {importedDraftNotice.guidance.map((item) => (
                        <p key={item} className="text-xs text-muted-foreground">
                          {item}
                        </p>
                      ))}
                    </div>
                    {importedDraftNotice.mustHaveLabels.length > 0 ||
                    importedDraftNotice.niceToHaveLabels.length > 0 ? (
                      <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                        {importedDraftNotice.mustHaveLabels.length > 0 ? (
                          <div>
                            <p className="font-medium text-foreground">Must-have capabilities</p>
                            <p>{importedDraftNotice.mustHaveLabels.join(', ')}</p>
                          </div>
                        ) : null}
                        {importedDraftNotice.niceToHaveLabels.length > 0 ? (
                          <div>
                            <p className="font-medium text-foreground">Secondary capabilities</p>
                            <p>{importedDraftNotice.niceToHaveLabels.join(', ')}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {importedDraftNotice.missingFields.length > 0 ? (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                        <p className="font-medium">Missing or unclear fields</p>
                        <p>{importedDraftNotice.missingFields.join(', ')}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            ) : null}

            <div className="rounded-2xl border border-proofound-stone/70 bg-white/75 p-4 lg:hidden">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-proofound-forest">
                <span>
                  Step {currentStep} of {STEPS.length - 1}
                </span>
                <span>{Math.round((currentStep / (STEPS.length - 1)) * 100)}% drafted</span>
              </div>
              <div className="mb-3 h-1 overflow-hidden rounded-full bg-proofound-stone/30">
                <div
                  className="h-full bg-proofound-forest transition-all duration-300"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
              <p className="mt-1 font-display text-xl font-semibold text-proofound-charcoal">
                {STEPS.find((step) => step.id === currentStep)?.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {STEPS.find((step) => step.id === currentStep)?.description}
              </p>
            </div>

            <div className="hidden items-center justify-between lg:flex">
              {STEPS.map((step, index) => {
                const isCurrent = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isPendingReview = step.id === 5;

                return (
                  <div key={step.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                          isCurrent
                            ? 'bg-proofound-forest text-white'
                            : isCompleted || (isPendingReview && currentStep === 4)
                              ? 'bg-[#7A9278] text-white'
                              : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {step.id}
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-medium text-foreground">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 ? (
                      <div
                        className={`mx-2 h-1 flex-1 ${
                          currentStep > step.id ? 'bg-[#7A9278]' : 'bg-gray-200'
                        }`}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>

            <Card className="min-w-0 p-5 sm:p-8">{renderedStep}</Card>

            <AssignmentClarityAssistant
              form={form}
              assignmentId={assignmentId}
              orgId={orgId}
              orgSlug={slug}
              onEnsureDraft={ensureClarityDraft}
            />

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Drafts auto-save every 30 seconds.
                {lastSaved ? (
                  <span className="ml-2 text-green-600">
                    • Last saved {lastSaved.toLocaleTimeString()}
                  </span>
                ) : null}
                {isSaving ? (
                  <span className="ml-2 text-muted-foreground">• Saving review draft…</span>
                ) : null}
              </p>
              {autoSaveFeedback ? (
                <p className="mt-2 text-amber-700" role="status" aria-live="polite">
                  {autoSaveFeedback}
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </AppSurface>
  );
}
