'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { AssignmentSchema, type AssignmentData, createAssignment } from '@/actions/assignment';
import {
  Step1BusinessValue,
  Step2TargetOutcomes,
  Step3WeightMatrix,
  Step4Practicals,
  Step5ExpertiseMapping,
} from './assignment-steps';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AssignmentBuilderProps {
  orgId: string;
  orgSlug: string;
}

const STEPS = [
  'Business Value',
  'Target Outcomes',
  'Weight Matrix',
  'Practicals',
  'Expertise Mapping',
];

export function AssignmentBuilder({ orgId, orgSlug }: AssignmentBuilderProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AssignmentData>({
    resolver: zodResolver(AssignmentSchema),
    defaultValues: {
      status: 'active',
      currency: 'USD',
      locationMode: 'hybrid',
      weights: {
        skills: 0.4,
        values: 0.2,
        experience: 0.2,
        location: 0.1,
        availability: 0.1,
      },
      mustHaveSkills: [],
      niceToHaveSkills: [],
      valuesRequired: [],
      causeTags: [],
    },
    mode: 'onChange',
  });

  const { trigger, handleSubmit, getValues } = form;

  const handleNext = async () => {
    let isValid = false;

    // Validate current step fields before proceeding
    switch (currentStep) {
      case 0:
        isValid = await trigger(['role', 'businessValue']);
        break;
      case 1:
        // Target outcomes are optional in schema but let's check if we want to enforce anything
        isValid = true;
        break;
      case 2:
        isValid = await trigger(['weights']);
        break;
      case 3:
        isValid = await trigger(['compMin', 'compMax', 'locationMode']);
        break;
      case 4:
        isValid = await trigger(['mustHaveSkills']);
        break;
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    window.scrollTo(0, 0);
  };

  const onSubmit = async (data: AssignmentData) => {
    setIsSubmitting(true);
    try {
      const result = await createAssignment(orgId, data);

      if (result.error) {
        toast.error(result.error);
        console.error(result.details);
        return;
      }

      toast.success('Assignment created successfully!');
      router.push(`/app/o/${orgSlug}/assignments`);
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step1BusinessValue form={form} onNext={handleNext} />;
      case 1:
        return <Step2TargetOutcomes form={form} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <Step3WeightMatrix form={form} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step4Practicals form={form} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return (
          <Step5ExpertiseMapping
            form={form}
            onBack={handleBack}
            onSubmit={handleSubmit(onSubmit)}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-proofound-stone/30 dark:bg-muted -z-10" />
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={step} className="flex flex-col items-center gap-2 bg-proofound-parchment dark:bg-background px-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isCompleted
                      ? 'bg-proofound-forest text-white'
                      : isCurrent
                        ? 'bg-proofound-forest/20 text-proofound-forest border-2 border-proofound-forest'
                        : 'bg-proofound-stone/30 text-proofound-charcoal/50'
                    }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-proofound-forest' : 'text-proofound-charcoal/50'
                    }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-proofound-stone dark:border-border rounded-2xl shadow-sm">
        <CardContent className="p-6 md:p-8">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Mobile Navigation (if not handled inside steps) */}
      <div className="mt-6 flex justify-between sm:hidden">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
          className={currentStep === 0 ? 'invisible' : ''}
        >
          Back
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext}>Next</Button>
        ) : (
          <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish'}
          </Button>
        )}
      </div>
    </div>
  );
}
