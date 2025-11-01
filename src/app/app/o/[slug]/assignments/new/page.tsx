/**
 * Assignment Builder Page - Organization
 * 
 * 5-step workflow to create comprehensive assignments
 * Steps: Business Value → Outcomes → Weights → Practicals → Skills
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
  Step5ExpertiseMapping,
} from '@/components/matching/assignment-steps';

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
        await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            organizationSlug: params.slug,
            status: 'draft',
          }),
        });
      } catch (error) {
        console.error('Failed to auto-save:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  });

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
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
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          organizationSlug: params.slug,
          status: 'ready_to_publish',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/app/o/${params.slug}/assignments/${result.assignment.id}/review`);
      } else {
        alert('Failed to save assignment');
      }
    } catch (error) {
      console.error('Failed to save assignment:', error);
      alert('Failed to save assignment');
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
              onBack={handleBack}
              onSubmit={handleSubmit}
              isSubmitting={isSaving}
            />
          )}
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-[#6B6760]">
          <p>Your progress is automatically saved every 30 seconds</p>
        </div>
      </div>
    </div>
  );
}

