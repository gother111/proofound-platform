/**
 * Assignment Builder Page - Organization
 *
 * 5-step workflow to create comprehensive assignments
 * Steps: Business Value → Outcomes → Weights → Practicals → Skills
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
  Step5ExpertiseMapping,
} from '@/components/matching/assignment-steps';
import { TemplatePicker, type AssignmentTemplate } from '@/components/matching/TemplatePicker';
import { mapTemplateToAssignmentForm } from '@/lib/templates/prefill';
import { CLIENT_FF_DEFAULTS } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';

interface AssignmentFormData {
  builderMode?: 'basic' | 'advanced';
  // Step 1
  role: string;
  businessValue: string;
  expectedImpact?: string;
  stakeholders: string[];

  // Step 2
  outcomes: Array<{
    metric: string;
    target: string;
    timeframe: string;
  }>;

  // Step 3
  weights: {
    mission: number;
    expertise: number;
    workMode: number;
  };
  missionWeight?: number;
  expertiseWeight?: number;
  workModeRequirement: 'hard' | 'soft';
  workModePreference: 'onsite' | 'hybrid' | 'remote';

  // Step 4
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
  duration?: string;
  availability?: string;
  verificationGates?: string[];

  // Step 5
  mustHaveSkills: Array<{
    id: string;
    label: string;
    level: number;
    linkedToBV?: boolean;
    linkedToTO?: boolean;
  }>;
  niceToHaveSkills: Array<{ id: string; label: string; level?: number }>;
  educationRequired: boolean;
  educationJustification?: string;
}

const STEPS = [
  { id: 1, name: 'Business Value', description: 'Define role and value' },
  { id: 2, name: 'Target Outcomes', description: 'Set measurable goals' },
  { id: 3, name: 'Weight Matrix', description: 'Prioritize criteria' },
  { id: 4, name: 'Practicals', description: 'Compensation & logistics' },
  { id: 5, name: 'Expertise', description: 'Required skills' },
];

type BuilderMode = 'basic' | 'advanced';

function getActiveSteps(mode: BuilderMode) {
  if (mode === 'advanced') return STEPS;
  return STEPS.filter((step) => step.id !== 3);
}

export default function AssignmentBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug =
    typeof params.slug === 'string'
      ? params.slug
      : Array.isArray(params.slug)
        ? params.slug[0]
        : '';
  const draftId = searchParams.get('draftId');
  const [currentStep, setCurrentStep] = useState(1);
  const [builderMode, setBuilderMode] = useState<BuilderMode>(
    CLIENT_FF_DEFAULTS.assignmentBasicMode ? 'basic' : 'advanced'
  );
  const [assignmentBasicModeEnabled, setAssignmentBasicModeEnabled] = useState(
    CLIENT_FF_DEFAULTS.assignmentBasicMode
  );
  const [advancedModeUnlocked, setAdvancedModeUnlocked] = useState(
    !CLIENT_FF_DEFAULTS.assignmentBasicMode
  );
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());
  const [templates, setTemplates] = useState<AssignmentTemplate[]>([]);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);
  const assignmentIdRef = useRef<string | null>(null);
  const activeSteps = getActiveSteps(builderMode);

  useEffect(() => {
    assignmentIdRef.current = assignmentId;
  }, [assignmentId]);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags');
        if (!response.ok) return;
        const payload = await response.json();
        const basicModeEnabled = payload?.flags?.assignmentBasicMode !== false;
        setAssignmentBasicModeEnabled(basicModeEnabled);

        if (!basicModeEnabled) {
          setBuilderMode('advanced');
          setAdvancedModeUnlocked(true);
          setCurrentStep((prev) => (prev === 3 ? 4 : prev));
        }
      } catch (error) {
        console.error('Failed to load feature flags for assignment builder', error);
      } finally {
        setFlagsLoaded(true);
      }
    };

    void loadFlags();
  }, []);

  const form = useForm<AssignmentFormData>({
    defaultValues: {
      role: '',
      businessValue: '',
      stakeholders: [],
      outcomes: [],
      weights: { mission: 33, expertise: 34, workMode: 33 },
      workModeRequirement: 'soft',
      workModePreference: 'hybrid',
      locationMode: 'hybrid',
      compMin: 0,
      compMax: 0,
      currency: 'USD',
      hoursMin: 20,
      hoursMax: 40,
      duration: '12mo',
      verificationGates: [],
      mustHaveSkills: [],
      niceToHaveSkills: [],
      educationRequired: false,
      educationJustification: '',
    },
  });

  const normalizeDateInput = useCallback((value?: string | null) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const asDate = new Date(value);
    if (Number.isNaN(asDate.getTime())) return '';
    return asDate.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    if (!draftId || hasHydratedDraft) return;

    const hydrateDraft = async () => {
      try {
        const response = await fetch(`/api/assignments/${draftId}`);
        if (!response.ok) {
          throw new Error('Failed to load draft assignment');
        }

        const payload = await response.json();
        const assignment = payload.assignment;
        if (!assignment?.id) {
          throw new Error('Invalid draft assignment payload');
        }

        form.reset({
          ...form.getValues(),
          builderMode:
            assignmentBasicModeEnabled && assignment.builderMode === 'advanced'
              ? 'advanced'
              : assignmentBasicModeEnabled
                ? 'basic'
                : 'advanced',
          role: assignment.role || '',
          businessValue: assignment.businessValue || '',
          expectedImpact: assignment.expectedImpact || '',
          outcomes: Array.isArray(assignment.outcomes) ? assignment.outcomes : [],
          weights:
            assignment.weights && typeof assignment.weights === 'object'
              ? assignment.weights
              : { mission: 33, expertise: 34, workMode: 33 },
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
        if (assignmentBasicModeEnabled) {
          const isAdvancedDraft = assignment.builderMode === 'advanced';
          setBuilderMode(isAdvancedDraft ? 'advanced' : 'basic');
          setAdvancedModeUnlocked(isAdvancedDraft);
        } else {
          setBuilderMode('advanced');
          setAdvancedModeUnlocked(true);
        }
        setLastSaved(new Date());
      } catch (error) {
        console.error(error);
        toast.error('Could not load existing draft');
      } finally {
        setHasHydratedDraft(true);
      }
    };

    void hydrateDraft();
  }, [assignmentBasicModeEnabled, draftId, form, hasHydratedDraft, normalizeDateInput]);

  // Load templates for the organization
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await fetch(`/api/assignment-templates?orgSlug=${slug}`);
        if (!response.ok) {
          throw new Error('Failed to load templates');
        }
        const data = await response.json();
        setTemplates(data.items || []);
      } catch (error) {
        console.error(error);
        toast.error('Could not load templates');
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    loadTemplates();
  }, [slug]);

  const trackTemplateApplied = useCallback(
    (template: AssignmentTemplate, selectedBuilderMode: BuilderMode) => {
      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'assignment_template_applied',
          orgId: orgId ?? undefined,
          entityType: assignmentIdRef.current ? 'assignment' : undefined,
          entityId: assignmentIdRef.current ?? undefined,
          properties: {
            templateId: template.id,
            templateName: template.name,
            roleFamily: template.roleFamily,
            orgSlug: slug,
            selectedBuilderMode,
            recommendedBuilderMode: template.recommendedBuilderMode || null,
          },
        }),
      }).catch(() => undefined);
    },
    [orgId, slug]
  );

  const handleApplyTemplate = (template: AssignmentTemplate) => {
    const mapped = mapTemplateToAssignmentForm(template.presetPayload);
    form.reset({ ...form.getValues(), ...mapped });

    let selectedBuilderMode: BuilderMode = 'advanced';

    if (assignmentBasicModeEnabled) {
      const templateMode = template.recommendedBuilderMode || 'basic';
      selectedBuilderMode =
        templateMode === 'advanced' && !advancedModeUnlocked ? 'basic' : templateMode;
      setBuilderMode(selectedBuilderMode);

      if (templateMode === 'advanced' && !advancedModeUnlocked) {
        toast.info('This template includes advanced controls. Enable Advanced mode to use them.');
      }
      if (selectedBuilderMode === 'basic' && currentStep === 3) {
        setCurrentStep(4);
      }
    } else {
      selectedBuilderMode = 'advanced';
      setBuilderMode('advanced');
    }

    setAppliedTemplateId(template.id);
    setAppliedTemplateName(template.name);
    setCurrentStep(1);
    setStepStartTime(new Date());
    toast.success(`Applied template: ${template.name}`);
    setIsTemplatePickerOpen(false);
    trackTemplateApplied(template, selectedBuilderMode);
  };

  const buildAssignmentPayload = useCallback(
    (
      data: AssignmentFormData,
      overrides?: {
        status?: 'draft' | 'active' | 'paused' | 'closed';
        creationStatus?:
          | 'draft'
          | 'pipeline_in_progress'
          | 'pending_review'
          | 'ready_to_publish'
          | 'published';
      }
    ) => ({
      orgSlug: slug,
      builderMode: assignmentBasicModeEnabled ? builderMode : 'advanced',
      role: data.role,
      description: data.businessValue,
      businessValue: data.businessValue,
      expectedImpact: data.expectedImpact,
      status: overrides?.status ?? 'draft',
      creationStatus: overrides?.creationStatus ?? 'pipeline_in_progress',
      valuesRequired: [],
      causeTags: [],
      mustHaveSkills: data.mustHaveSkills,
      niceToHaveSkills: data.niceToHaveSkills,
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
      weights: data.weights,
    }),
    [assignmentBasicModeEnabled, builderMode, slug]
  );

  const shouldAutoSaveDraft = useCallback((data: AssignmentFormData) => {
    return Boolean(
      data.role ||
        data.businessValue ||
        (data.outcomes && data.outcomes.length > 0) ||
        (data.mustHaveSkills && data.mustHaveSkills.length > 0)
    );
  }, []);

  const persistDraft = useCallback(
    async (options?: {
      status?: 'draft' | 'active' | 'paused' | 'closed';
      creationStatus?:
        | 'draft'
        | 'pipeline_in_progress'
        | 'pending_review'
        | 'ready_to_publish'
        | 'published';
    }) => {
      const currentAssignmentId = assignmentIdRef.current;
      const data = form.getValues();
      const payload = buildAssignmentPayload(data, {
        status: options?.status ?? 'draft',
        creationStatus: options?.creationStatus ?? 'pipeline_in_progress',
      });

      const response = currentAssignmentId
        ? await fetch(`/api/assignments/${currentAssignmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/assignments', {
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

      const isFirstCreate = !currentAssignmentId;
      if (isFirstCreate) {
        setAssignmentId(persistedAssignment.id);
        setOrgId(persistedAssignment.orgId ?? null);
        if (typeof window !== 'undefined' && slug) {
          const draftUrl = `/app/o/${slug}/assignments/new?draftId=${persistedAssignment.id}`;
          window.history.replaceState(null, '', draftUrl);
        }
      }

      setLastSaved(new Date());

      if (isFirstCreate && persistedAssignment.orgId) {
        await fetch(`/api/assignments/${persistedAssignment.id}/pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepOrder: 1,
            stepName: 'Business Value',
            stakeholderRole: 'creator',
            status: 'in_progress',
            stepData: {},
          }),
        });
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'assignment_creation_started',
            orgId: persistedAssignment.orgId,
            entityType: 'assignment',
            entityId: persistedAssignment.id,
            properties: { timestamp: new Date().toISOString() },
          }),
        });
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'assignment_step_started',
            orgId: persistedAssignment.orgId,
            entityType: 'assignment',
            entityId: persistedAssignment.id,
            properties: {
              stepNumber: 1,
              stepName: 'Business Value',
              builderMode,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }

      return {
        assignmentId: persistedAssignment.id as string,
        orgId: (persistedAssignment.orgId as string | null) ?? orgId,
      };
    },
    [buildAssignmentPayload, builderMode, form, orgId, slug]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const current = form.getValues();
      if (!shouldAutoSaveDraft(current)) {
        return;
      }

      void persistDraft().catch((error) => {
        console.error('Failed to auto-save:', error);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [form, persistDraft, shouldAutoSaveDraft]);

  const saveOutcomes = async (targetAssignmentId: string) => {
    if (!targetAssignmentId) return;

    const outcomes = form.getValues('outcomes');
    if (outcomes.length === 0) return;

    try {
      // Transform outcomes to match the database schema
      const transformedOutcomes = outcomes.map((outcome: any) => ({
        outcomeType: 'continuous' as const, // Default to continuous
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

      await fetch(`/api/assignments/${targetAssignmentId}/outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomes: transformedOutcomes }),
      });
    } catch (error) {
      console.error('Failed to save outcomes:', error);
    }
  };

  const saveExpertiseMatrix = async (targetAssignmentId: string) => {
    if (!targetAssignmentId) return;

    const mustHaveSkills = form.getValues('mustHaveSkills') || [];
    const niceToHaveSkills = form.getValues('niceToHaveSkills') || [];
    if (mustHaveSkills.length === 0 && niceToHaveSkills.length === 0) return;

    try {
      // Get outcomes to potentially link skills to them
      const outcomesResponse = await fetch(`/api/assignments/${targetAssignmentId}/outcomes`);
      let outcomes: any[] = [];
      if (outcomesResponse.ok) {
        const outcomesData = await outcomesResponse.json();
        outcomes = outcomesData.outcomes || [];
      }

      // Transform skills to expertise matrix format
      const mustRows = mustHaveSkills.map((skill: any) => {
        // Try to find a linked outcome if the skill is marked as linked
        let linkedOutcomeId = undefined;
        if (skill.linkedToTO && outcomes.length > 0) {
          // Link to first outcome for now (could be improved with more specific logic)
          linkedOutcomeId = outcomes[0].id;
        }

        return {
          skillCode: skill.id,
          requiredLevel: skill.level,
          stakeholderRole: 'must',
          linkedOutcomeId,
          outcomeRationale:
            skill.linkedToBV || skill.linkedToTO
              ? `Linked to ${skill.linkedToBV ? 'Business Value' : ''} ${skill.linkedToTO ? 'Target Outcomes' : ''}`.trim()
              : undefined,
        };
      });

      const niceRows = niceToHaveSkills.map((skill: any) => ({
        skillCode: skill.id,
        requiredLevel: skill.level || 1,
        stakeholderRole: 'nice',
      }));

      const expertiseMatrix = [...mustRows, ...niceRows];

      await fetch(`/api/assignments/${targetAssignmentId}/expertise-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertiseMatrix }),
      });
    } catch (error) {
      console.error('Failed to save expertise matrix:', error);
    }
  };

  const trackPipelineStep = async (
    targetAssignmentId: string,
    stepOrder: number,
    status: 'in_progress' | 'completed'
  ) => {
    if (!targetAssignmentId) return;

    const stepNames = [
      'Business Value',
      'Target Outcomes',
      'Weight Matrix',
      'Practicals',
      'Expertise Mapping',
    ];

    try {
      await fetch(`/api/assignments/${targetAssignmentId}/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepOrder,
          stepName: stepNames[stepOrder - 1],
          stakeholderRole: 'creator',
          status,
          stepData: {},
        }),
      });
    } catch (error) {
      console.error('Failed to track pipeline step:', error);
    }
  };

  const handleNext = async () => {
    const lastStepId = activeSteps[activeSteps.length - 1]?.id ?? 5;
    if (currentStep < lastStepId) {
      let targetAssignmentId = assignmentId;
      let targetOrgId = orgId;

      try {
        const persisted = await persistDraft({
          status: 'draft',
          creationStatus: 'pipeline_in_progress',
        });
        targetAssignmentId = persisted.assignmentId;
        targetOrgId = persisted.orgId;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save draft');
        return;
      }

      const stepNames: Record<number, string> = {
        1: 'Business Value',
        2: 'Target Outcomes',
        3: 'Weight Matrix',
        4: 'Practicals',
        5: 'Expertise Mapping',
      };

      // Calculate time spent on current step
      const timeSpentSeconds = Math.floor((new Date().getTime() - stepStartTime.getTime()) / 1000);

      // Emit step completed analytics
      if (targetAssignmentId && targetOrgId) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'assignment_step_completed',
            orgId: targetOrgId,
            entityType: 'assignment',
            entityId: targetAssignmentId,
            properties: {
              stepNumber: currentStep,
              stepName: stepNames[currentStep],
              builderMode,
              timeSpentSeconds,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }

      // Mark current step as completed
      if (targetAssignmentId) {
        await trackPipelineStep(targetAssignmentId, currentStep, 'completed');
      }

      // Save outcomes after Step 2
      if (currentStep === 2 && targetAssignmentId) {
        await saveOutcomes(targetAssignmentId);
      }

      // Move to next step
      const nextStep = builderMode === 'basic' && currentStep === 2 ? 4 : currentStep + 1;
      setCurrentStep(nextStep);
      setStepStartTime(new Date());

      // Mark next step as in_progress
      if (targetAssignmentId) {
        await trackPipelineStep(targetAssignmentId, nextStep, 'in_progress');
      }

      // Emit step started analytics
      if (targetAssignmentId && targetOrgId) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'assignment_step_started',
            orgId: targetOrgId,
            entityType: 'assignment',
            entityId: targetAssignmentId,
            properties: {
              stepNumber: nextStep,
              stepName: stepNames[nextStep],
              builderMode,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      if (builderMode === 'basic' && currentStep === 4) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEnableAdvancedMode = () => {
    setAdvancedModeUnlocked(true);
    setBuilderMode('advanced');
  };

  const handleSwitchToBasicMode = () => {
    setBuilderMode('basic');
    setCurrentStep((prev) => (prev === 3 ? 4 : prev));
  };

  const handleSubmit = async () => {
    setIsSaving(true);

    try {
      const data = form.getValues();

      // Validate required fields
      if (!data.role || data.role.length < 3) {
        toast.error('Role title is required and must be at least 3 characters');
        setIsSaving(false);
        return;
      }

      if (!data.businessValue) {
        toast.error('Business value is required');
        setIsSaving(false);
        return;
      }

      if (!data.outcomes || data.outcomes.length === 0) {
        toast.error('At least one target outcome is required');
        setIsSaving(false);
        return;
      }

      if (!data.mustHaveSkills || data.mustHaveSkills.length === 0) {
        toast.error('At least one must-have skill is required');
        setIsSaving(false);
        return;
      }

      if (builderMode === 'basic' && data.mustHaveSkills.length < 3) {
        toast.error('Basic mode requires at least 3 must-have skills');
        setIsSaving(false);
        return;
      }

      if (builderMode === 'advanced') {
        const totalWeight =
          (data.weights?.mission || 0) +
          (data.weights?.expertise || 0) +
          (data.weights?.workMode || 0);
        if (totalWeight !== 100) {
          toast.error('Advanced mode requires weight matrix total to be exactly 100%');
          setIsSaving(false);
          return;
        }
      }

      const persisted = await persistDraft({
        status: 'draft',
        creationStatus: 'pending_review',
      });
      const savedAssignmentId = persisted.assignmentId;

      try {
        await saveOutcomes(savedAssignmentId);
        await saveExpertiseMatrix(savedAssignmentId);
        await trackPipelineStep(savedAssignmentId, 5, 'completed');
      } catch (error) {
        console.error('Failed to save related data:', error);
        toast.error('Warning: Some data may not have been saved');
      }

      toast.success('Assignment saved for review');
      router.push(`/app/o/${slug}/assignments/${savedAssignmentId}/review`);
    } catch (error) {
      console.error('Failed to save assignment:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F1] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {assignmentBasicModeEnabled && flagsLoaded ? (
          <Card className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2D3330]">Assignment builder mode</p>
                <p className="text-xs text-[#6B6760]">
                  {advancedModeUnlocked
                    ? 'Switch between Basic and Advanced any time.'
                    : 'You are in Basic mode. Enable Advanced mode only when you need extra control.'}
                </p>
              </div>
              {advancedModeUnlocked ? (
                <div className="inline-flex rounded-md border border-[#E8E6DD] bg-white p-1">
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-sm ${
                      builderMode === 'basic'
                        ? 'bg-[#1C4D3A] text-white'
                        : 'text-[#2D3330] hover:bg-[#F7F6F1]'
                    }`}
                    onClick={handleSwitchToBasicMode}
                  >
                    Basic
                  </button>
                  <button
                    type="button"
                    className={`rounded px-3 py-1 text-sm ${
                      builderMode === 'advanced'
                        ? 'bg-[#1C4D3A] text-white'
                        : 'text-[#2D3330] hover:bg-[#F7F6F1]'
                    }`}
                    onClick={handleEnableAdvancedMode}
                  >
                    Advanced
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-testid="advanced-mode-opt-in"
                  className="rounded-md border border-[#1C4D3A]/30 px-3 py-1.5 text-sm font-medium text-[#1C4D3A] hover:bg-[#EAF1ED]"
                  onClick={handleEnableAdvancedMode}
                >
                  Need extra control? Enable Advanced mode
                </button>
              )}
            </div>
          </Card>
        ) : null}

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {activeSteps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.id
                      ? 'bg-[#1C4D3A] text-white'
                      : currentStep > step.id
                        ? 'bg-[#7A9278] text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.id}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium text-[#2D3330]">{step.name}</p>
                  <p className="text-xs text-[#6B6760]">{step.description}</p>
                </div>
              </div>
              {index < activeSteps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-[#7A9278]' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-8">
          {currentStep === 1 && (
            <Step1BusinessValue
              form={form}
              onNext={handleNext}
              onOpenTemplatePicker={() => setIsTemplatePickerOpen(true)}
              appliedTemplateName={appliedTemplateName}
              isLoadingTemplates={isLoadingTemplates}
            />
          )}
          {currentStep === 2 && (
            <Step2TargetOutcomes form={form} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && builderMode === 'advanced' && (
            <Step3WeightMatrix form={form} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 4 && (
            <Step4Practicals form={form} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 5 && (
            <Step5ExpertiseMapping
              form={form}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isSubmitting={isSaving}
            />
          )}
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-[#6B6760]">
          <p>
            Your progress is automatically saved every 30 seconds
            {lastSaved && (
              <span className="ml-2 text-green-600">
                • Last saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
      </div>

      <TemplatePicker
        open={isTemplatePickerOpen}
        onOpenChange={setIsTemplatePickerOpen}
        templates={templates}
        isLoading={isLoadingTemplates}
        onApply={handleApplyTemplate}
        appliedTemplateId={appliedTemplateId}
      />
    </div>
  );
}
