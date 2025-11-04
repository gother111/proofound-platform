/**
 * Assignment Builder Page - Organization
 *
 * 5-step workflow to create comprehensive assignments
 * Steps: Business Value → Outcomes → Weights → Practicals → Skills
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
  Step5ExpertiseMapping,
} from '@/components/matching/assignment-steps';

export const dynamic = 'force-dynamic';

interface AssignmentFormData {
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
  missionWeight: number;
  expertiseWeight: number;
  workModeRequired: 'hard' | 'soft';
  workModePreference: 'onsite' | 'hybrid' | 'remote';

  // Step 4
  compensationMin?: number;
  compensationMax?: number;
  currency: string;
  location: string;
  startDate?: string;
  duration?: string;
  availability?: string;

  // Step 5
  requiredSkills: Array<{
    skillCode: string;
    minLevel: number;
    weight: number;
    linkedOutcomes: string[];
    examples: string;
  }>;
  niceToHaveSkills: string[];
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

export default function AssignmentBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());

  const form = useForm<AssignmentFormData>({
    defaultValues: {
      role: '',
      businessValue: '',
      stakeholders: [],
      outcomes: [],
      missionWeight: 30,
      expertiseWeight: 70,
      workModeRequired: 'soft',
      workModePreference: 'hybrid',
      currency: 'USD',
      requiredSkills: [],
      niceToHaveSkills: [],
      educationRequired: false,
    },
  });

  // Auto-save draft every 30 seconds
  useState(() => {
    const interval = setInterval(async () => {
      const data = form.getValues();
      try {
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            organizationSlug: params.slug,
            status: 'draft',
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.assignment?.id && !assignmentId) {
            const newAssignmentId = result.assignment.id;
            const newOrgId = result.assignment.orgId;
            setAssignmentId(newAssignmentId);
            setOrgId(newOrgId);
            // Initialize step 1 as in_progress
            trackPipelineStep(1, 'in_progress');
            // Emit assignment creation started event
            if (newOrgId) {
              await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventType: 'assignment_creation_started',
                  orgId: newOrgId,
                  entityType: 'assignment',
                  entityId: newAssignmentId,
                  properties: { timestamp: new Date().toISOString() },
                }),
              });
              await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventType: 'assignment_step_started',
                  orgId: newOrgId,
                  entityType: 'assignment',
                  entityId: newAssignmentId,
                  properties: {
                    stepNumber: 1,
                    stepName: 'Business Value',
                    timestamp: new Date().toISOString(),
                  },
                }),
              });
            }
          }
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  });

  const saveOutcomes = async () => {
    if (!assignmentId) return;

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

      await fetch(`/api/assignments/${assignmentId}/outcomes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomes: transformedOutcomes }),
      });
    } catch (error) {
      console.error('Failed to save outcomes:', error);
    }
  };

  const saveExpertiseMatrix = async () => {
    if (!assignmentId) return;

    const mustHaveSkills = form.getValues('mustHaveSkills') || [];
    if (mustHaveSkills.length === 0) return;

    try {
      // Get outcomes to potentially link skills to them
      const outcomesResponse = await fetch(`/api/assignments/${assignmentId}/outcomes`);
      let outcomes: any[] = [];
      if (outcomesResponse.ok) {
        const outcomesData = await outcomesResponse.json();
        outcomes = outcomesData.outcomes || [];
      }

      // Transform skills to expertise matrix format
      const expertiseMatrix = mustHaveSkills.map((skill: any) => {
        // Try to find a linked outcome if the skill is marked as linked
        let linkedOutcomeId = undefined;
        if (skill.linkedToTO && outcomes.length > 0) {
          // Link to first outcome for now (could be improved with more specific logic)
          linkedOutcomeId = outcomes[0].id;
        }

        return {
          skillCode: skill.id,
          requiredLevel: skill.level,
          stakeholderRole: 'creator',
          linkedOutcomeId,
          outcomeRationale:
            skill.linkedToBV || skill.linkedToTO
              ? `Linked to ${skill.linkedToBV ? 'Business Value' : ''} ${skill.linkedToTO ? 'Target Outcomes' : ''}`.trim()
              : undefined,
        };
      });

      await fetch(`/api/assignments/${assignmentId}/expertise-matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertiseMatrix }),
      });
    } catch (error) {
      console.error('Failed to save expertise matrix:', error);
    }
  };

  const trackPipelineStep = async (stepOrder: number, status: 'in_progress' | 'completed') => {
    if (!assignmentId) return;

    const stepNames = [
      'Business Value',
      'Target Outcomes',
      'Weight Matrix',
      'Practicals',
      'Expertise Mapping',
    ];

    try {
      await fetch(`/api/assignments/${assignmentId}/pipeline`, {
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
    if (currentStep < 5) {
      const stepNames = [
        'Business Value',
        'Target Outcomes',
        'Weight Matrix',
        'Practicals',
        'Expertise Mapping',
      ];

      // Calculate time spent on current step
      const timeSpentSeconds = Math.floor((new Date().getTime() - stepStartTime.getTime()) / 1000);

      // Emit step completed analytics
      if (assignmentId && orgId) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'assignment_step_completed',
            orgId,
            entityType: 'assignment',
            entityId: assignmentId,
            properties: {
              stepNumber: currentStep,
              stepName: stepNames[currentStep - 1],
              timeSpentSeconds,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      }

      // Mark current step as completed
      await trackPipelineStep(currentStep, 'completed');

      // Save outcomes after Step 2
      if (currentStep === 2) {
        await saveOutcomes();
      }

      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setStepStartTime(new Date());

      // Mark next step as in_progress
      await trackPipelineStep(nextStep, 'in_progress');

      // Emit step started analytics
      if (assignmentId && orgId) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'assignment_step_started',
            orgId,
            entityType: 'assignment',
            entityId: assignmentId,
            properties: {
              stepNumber: nextStep,
              stepName: stepNames[nextStep - 1],
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
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationSlug: params.slug,
          status: 'ready_to_publish',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to save assignment');
        setIsSaving(false);
        return;
      }

      const result = await response.json();
      const savedAssignmentId = result.assignment.id;

      // Save outcomes and expertise matrix
      if (savedAssignmentId) {
        // Use the saved assignment ID if we don't have one yet
        if (!assignmentId) {
          setAssignmentId(savedAssignmentId);
        }

        // Save outcomes and expertise matrix with the correct assignment ID
        const currentAssignmentId = assignmentId || savedAssignmentId;

        try {
          // Save outcomes
          const outcomes = form.getValues('outcomes');
          if (outcomes.length > 0) {
            const transformedOutcomes = outcomes.map((outcome: any) => ({
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

            const outcomesResponse = await fetch(
              `/api/assignments/${currentAssignmentId}/outcomes`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ outcomes: transformedOutcomes }),
              }
            );

            if (!outcomesResponse.ok) {
              console.error('Failed to save outcomes');
              toast.error('Warning: Outcomes may not have been saved');
            }
          }

          // Save expertise matrix
          await saveExpertiseMatrix();
        } catch (error) {
          console.error('Failed to save related data:', error);
          toast.error('Warning: Some data may not have been saved');
        }
      }

      toast.success('Assignment saved successfully!');
      router.push(`/app/o/${params.slug}/assignments/${savedAssignmentId}/review`);
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
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.id
                      ? 'bg-[#4A5943] text-white'
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
              {index < STEPS.length - 1 && (
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
          {currentStep === 1 && <Step1BusinessValue form={form} onNext={handleNext} />}
          {currentStep === 2 && (
            <Step2TargetOutcomes form={form} onNext={handleNext} onBack={handleBack} />
          )}
          {currentStep === 3 && (
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
    </div>
  );
}
