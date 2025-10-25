'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { ChevronLeft, ChevronRight, Download, Check } from 'lucide-react';

interface SafetyPlanWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, title: 'Warning signs', field: 'warningSigns' },
  { id: 2, title: 'People to contact', field: 'contacts' },
  { id: 3, title: 'Safe places', field: 'safePlaces' },
  { id: 4, title: 'Coping strategies', field: 'copingStrategies' },
  { id: 5, title: 'Review & export', field: 'review' },
];

export function SafetyPlanWizard({ open, onClose }: SafetyPlanWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    warningSigns: '',
    contacts: '',
    safePlaces: '',
    copingStrategies: '',
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleExportPDF = () => {
    alert('Safety plan would be exported as PDF');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text-primary)]">
            Create your safety plan
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-colors ${
                    step.id === currentStep
                      ? 'bg-[var(--color-primary)] text-white'
                      : step.id < currentStep
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        : 'bg-[var(--color-neutral-light)] dark:bg-[var(--color-neutral-dark)] text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                </div>
                <span
                  className={`text-sm hidden sm:inline ${
                    step.id === currentStep
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    step.id < currentStep
                      ? 'bg-green-200 dark:bg-green-800'
                      : 'bg-[var(--color-border)]'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-6">
          {currentStep === 1 && (
            <div>
              <h3 className="mb-2 text-[var(--color-text-primary)]">
                What are your warning signs?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Thoughts, behaviors, or feelings that indicate you might need help.
              </p>
              <Textarea
                value={formData.warningSigns}
                onChange={(e) => setFormData({ ...formData, warningSigns: e.target.value })}
                placeholder="E.g., feeling hopeless, withdrawing from friends, trouble sleeping..."
                rows={6}
                className="w-full"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="mb-2 text-[var(--color-text-primary)]">Who can you contact?</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                People you trust and their contact information.
              </p>
              <Textarea
                value={formData.contacts}
                onChange={(e) => setFormData({ ...formData, contacts: e.target.value })}
                placeholder="Name, relationship, phone number..."
                rows={6}
                className="w-full"
              />
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="mb-2 text-[var(--color-text-primary)]">What are your safe places?</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Physical or virtual spaces where you feel calm and supported.
              </p>
              <Textarea
                value={formData.safePlaces}
                onChange={(e) => setFormData({ ...formData, safePlaces: e.target.value })}
                placeholder="E.g., library, park, friend's house, specific online communities..."
                rows={6}
                className="w-full"
              />
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h3 className="mb-2 text-[var(--color-text-primary)]">What helps you cope?</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Activities or strategies that help you manage difficult moments.
              </p>
              <Textarea
                value={formData.copingStrategies}
                onChange={(e) => setFormData({ ...formData, copingStrategies: e.target.value })}
                placeholder="E.g., breathing exercises, calling a friend, walking, listening to music..."
                rows={6}
                className="w-full"
              />
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h3 className="text-[var(--color-text-primary)]">Your safety plan</h3>

              <div className="space-y-4 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] rounded-xl p-6">
                {formData.warningSigns && (
                  <div>
                    <h4 className="text-sm mb-2 text-[var(--color-text-secondary)]">
                      Warning signs
                    </h4>
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {formData.warningSigns}
                    </p>
                  </div>
                )}

                {formData.contacts && (
                  <div>
                    <h4 className="text-sm mb-2 text-[var(--color-text-secondary)]">
                      People to contact
                    </h4>
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {formData.contacts}
                    </p>
                  </div>
                )}

                {formData.safePlaces && (
                  <div>
                    <h4 className="text-sm mb-2 text-[var(--color-text-secondary)]">Safe places</h4>
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {formData.safePlaces}
                    </p>
                  </div>
                )}

                {formData.copingStrategies && (
                  <div>
                    <h4 className="text-sm mb-2 text-[var(--color-text-secondary)]">
                      Coping strategies
                    </h4>
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
                      {formData.copingStrategies}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleExportPDF}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
          <Button onClick={handlePrev} variant="outline" disabled={currentStep === 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={onClose} variant="outline">
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
