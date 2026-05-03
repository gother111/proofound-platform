'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
} from '@/components/matching/assignment-steps';
import { AssignmentClarityAssistant } from '@/components/assignments/AssignmentClarityAssistant';
import { Card } from '@/components/ui/card';
import { AppSurface } from '@/components/ui/v2/AppSurface';
import { apiFetch } from '@/lib/api/fetch';

export const dynamic = 'force-dynamic';

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
};

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

export default function AssignmentBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug =
    typeof params?.slug === 'string'
      ? params.slug
      : Array.isArray(params?.slug)
        ? params.slug[0]
        : '';
  const draftId = searchParams?.get('draftId');
  const assignmentOrgQuery = slug ? `?orgSlug=${encodeURIComponent(slug)}` : '';

  const [currentStep, setCurrentStep] = useState(1);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
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
        console.error(error);
        toast.error('Could not load existing draft');
      } finally {
        setHasHydratedDraft(true);
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
        (data.mustHaveSkills && data.mustHaveSkills.length > 0)
    );
  }, []);

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

      await apiFetch(`/api/assignments/${targetAssignmentId}/outcomes${assignmentOrgQuery}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomes: transformedOutcomes }),
      });
    },
    [assignmentOrgQuery, form]
  );

  const saveExpertiseMatrix = useCallback(
    async (targetAssignmentId: string) => {
      const mustHaveSkills = form.getValues('mustHaveSkills') || [];

      const outcomesResponse = await fetch(
        `/api/assignments/${targetAssignmentId}/outcomes${assignmentOrgQuery}`
      );
      let outcomes: any[] = [];
      if (outcomesResponse.ok) {
        const outcomesData = await outcomesResponse.json();
        outcomes = outcomesData.outcomes || [];
      }

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

      await apiFetch(
        `/api/assignments/${targetAssignmentId}/expertise-matrix${assignmentOrgQuery}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expertiseMatrix: mustRows }),
        }
      );
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
        } catch (error) {
          console.error('Failed to auto-save assignment builder draft:', error);
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
      const persisted = await persistDraft({
        status: 'draft',
        creationStatus: 'draft',
      });
      await syncRelatedData(persisted.assignmentId);
      setCurrentStep((step) => Math.min(step + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save draft');
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
      const persisted = await persistDraft({
        status: 'draft',
        creationStatus: 'review_ready',
      });
      await syncRelatedData(persisted.assignmentId);
      toast.success('Assignment saved for internal review');
      router.push(`/app/o/${slug}/assignments/${persisted.assignmentId}/review`);
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save assignment');
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

  return (
    <AppSurface>
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Lean assignment corridor</p>
            <p className="text-xs text-muted-foreground">
              This builder stays narrow on purpose: one structured assignment, then internal review
              before publish.
            </p>
          </div>
        </Card>

        <div className="flex items-center justify-between">
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

        <Card className="p-8">{renderedStep}</Card>

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
        </div>
      </div>
    </AppSurface>
  );
}
