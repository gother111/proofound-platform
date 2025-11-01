'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
  Step5ExpertiseMapping,
} from './assignment-steps';

// Zod validation schema matching assignments table
const AssignmentFormSchema = z.object({
  // Step 1: Business Value
  role: z.string().min(3, 'Role title must be at least 3 characters'),
  businessValue: z.string().min(1, 'Business value is required'),
  expectedImpact: z.string().optional(),
  stakeholders: z.array(z.string()).optional(),

  // Step 2: Target Outcomes
  outcomes: z
    .array(
      z.object({
        metric: z.string().min(1, 'Metric is required'),
        target: z.string().min(1, 'Target is required'),
        timeframe: z.string().min(1, 'Timeframe is required'),
      })
    )
    .min(1, 'At least one outcome is required'),

  // Step 3: Weight Matrix
  weights: z.object({
    mission: z.number().min(0).max(100),
    expertise: z.number().min(0).max(100),
    workMode: z.number().min(0).max(100),
  }),
  workModeRequirement: z.enum(['hard', 'soft']),
  workModePreference: z.enum(['onsite', 'hybrid', 'remote']),

  // Step 4: Practicals
  compMin: z.number().min(1, 'Minimum salary is required'),
  compMax: z.number().min(1, 'Maximum salary is required'),
  currency: z.string().default('USD'),
  hoursMin: z.number().min(10).max(40),
  hoursMax: z.number().min(10).max(40),
  locationMode: z.enum(['onsite', 'hybrid', 'remote']),
  city: z.string().optional(),
  country: z.string().optional(),
  startEarliest: z.string().optional(),
  startLatest: z.string().optional(),
  duration: z.string().optional(),

  // Step 5: Expertise Mapping
  mustHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        level: z.number().min(1).max(5),
        linkedToBV: z.boolean().optional(),
        linkedToTO: z.boolean().optional(),
      })
    )
    .min(1, 'At least one must-have skill is required'),
  niceToHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        level: z.number().min(1).max(5),
      })
    )
    .optional(),
  educationRequired: z.boolean().optional(),
  educationJustification: z.string().optional(),
}).refine(
  (data) => data.compMax > data.compMin,
  {
    message: 'Maximum salary must be greater than minimum',
    path: ['compMax'],
  }
).refine(
  (data) => data.hoursMax >= data.hoursMin,
  {
    message: 'Maximum hours must be greater than or equal to minimum',
    path: ['hoursMax'],
  }
).refine(
  (data) => {
    const total = data.weights.mission + data.weights.expertise + data.weights.workMode;
    return total === 100;
  },
  {
    message: 'Weights must total exactly 100%',
    path: ['weights'],
  }
).refine(
  (data) => !data.educationRequired || (data.educationJustification && data.educationJustification.length > 0),
  {
    message: 'Education justification is required when education is mandatory',
    path: ['educationJustification'],
  }
);

type AssignmentFormData = z.infer<typeof AssignmentFormSchema>;

interface AssignmentBuilderV2Props {
  onComplete?: (assignmentId: string) => void;
  onCancel?: () => void;
}

export function AssignmentBuilderV2({ onComplete, onCancel }: AssignmentBuilderV2Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(AssignmentFormSchema),
    defaultValues: {
      role: '',
      businessValue: '',
      expectedImpact: '',
      stakeholders: [],
      outcomes: [],
      weights: {
        mission: 33,
        expertise: 34,
        workMode: 33,
      },
      workModeRequirement: 'soft',
      workModePreference: 'hybrid',
      compMin: 0,
      compMax: 0,
      currency: 'USD',
      hoursMin: 20,
      hoursMax: 40,
      locationMode: 'hybrid',
      city: '',
      country: '',
      startEarliest: '',
      startLatest: '',
      duration: '12mo',
      mustHaveSkills: [],
      niceToHaveSkills: [],
      educationRequired: false,
      educationJustification: '',
    },
    mode: 'onChange',
  });

  // Auto-save draft (debounced)
  // TODO: Implement debounced auto-save to /api/assignments with status='draft'

  const handleNext = async () => {
    // Validate current step before proceeding
    let fieldsToValidate: (keyof AssignmentFormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ['role', 'businessValue'];
        break;
      case 2:
        fieldsToValidate = ['outcomes'];
        break;
      case 3:
        fieldsToValidate = ['weights', 'workModeRequirement', 'workModePreference'];
        break;
      case 4:
        fieldsToValidate = ['compMin', 'compMax', 'hoursMin', 'hoursMax', 'locationMode'];
        break;
      case 5:
        fieldsToValidate = ['mustHaveSkills'];
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(currentStep + 1);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      // Transform data to match API expectations
      const payload = {
        role: data.role,
        description: data.businessValue, // Map businessValue to description
        businessValue: data.businessValue,
        expectedImpact: JSON.stringify(data.outcomes), // Store outcomes as JSON
        status: 'draft',
        creationStatus: 'pending_review', // Step 5 complete, awaiting approval
        valuesRequired: [], // TODO: Map from form if values are collected
        causeTags: [],
        mustHaveSkills: data.mustHaveSkills.map((skill) => ({
          id: skill.id,
          level: skill.level,
        })),
        niceToHaveSkills: data.niceToHaveSkills?.map((skill) => ({
          id: skill.id,
          level: skill.level,
        })) || [],
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
        weights: data.weights,
        verificationGates: [], // TODO: Add if verification gates are collected
      };

      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create assignment');
      }

      const result = await response.json();
      const assignmentId = result.assignment?.id;

      toast.success('Assignment created successfully! Ready for review.');

      if (onComplete && assignmentId) {
        onComplete(assignmentId);
      } else {
        router.push(`/o/assignments/${assignmentId}`);
      }
    } catch (error) {
      console.error('Assignment creation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Assignment</h1>
        <p className="text-muted-foreground">
          5-step workflow to define role, outcomes, and expertise requirements
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        {currentStep === 1 && (
          <Step1BusinessValue form={form} onNext={handleNext} />
        )}

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
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        )}
      </div>

      {onCancel && (
        <div className="mt-4 text-center">
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

