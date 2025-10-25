'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import { Button } from '../../ui/button';
import { Play, Calendar, Pin, Volume2, VolumeX, Info } from 'lucide-react';
import { EvidenceBadge } from './EvidenceBadge';
import { EvidenceDrawer } from './EvidenceDrawer';

interface PracticeDetailSheetProps {
  open: boolean;
  onClose: () => void;
  practice: {
    title: string;
    duration: string;
    promise: string;
    steps: string[];
    evidenceType: 'rct-backed' | 'nice-recommended' | 'meta-reviewed' | 'initial' | 'third-party';
    evidencePoints: string[];
    adverseNote?: string;
  };
  onStart: () => void;
  onSchedule: () => void;
  onPin: () => void;
}

export function PracticeDetailSheet({
  open,
  onClose,
  practice,
  onStart,
  onSchedule,
  onPin,
}: PracticeDetailSheetProps) {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onClose();
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <SheetTitle className="text-[var(--color-text-primary)] mb-2">
                  {practice.title}
                </SheetTitle>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 bg-[var(--color-primary)] bg-opacity-10 text-[var(--color-primary)] rounded-lg text-xs">
                    {practice.duration}
                  </span>
                </div>
                <p className="text-[var(--color-text-secondary)] italic">
                  &ldquo;{practice.promise}&rdquo;
                </p>
              </div>
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 rounded-lg hover:bg-[var(--color-neutral-light)] dark:hover:bg-[var(--color-neutral-dark)] transition-colors"
              >
                {audioEnabled ? (
                  <Volume2 className="w-5 h-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <VolumeX className="w-5 h-5 text-[var(--color-text-secondary)]" />
                )}
              </button>
            </div>
          </SheetHeader>

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-[var(--color-text-primary)]">Steps</h3>
              <div className="space-y-3">
                {practice.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(index)}
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-colors ${
                        index === currentStep
                          ? 'bg-[var(--color-primary)]'
                          : 'bg-[var(--color-border)] hover:bg-[var(--color-primary)]/40'
                      }`}
                    />
                    <p className="text-[var(--color-text-secondary)] flex-1">{step}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                {practice.steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep
                        ? 'bg-[var(--color-primary)]'
                        : 'bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[var(--color-text-primary)]">Evidence</h3>
                <EvidenceBadge type={practice.evidenceType} />
              </div>
              <button
                onClick={() => setEvidenceDrawerOpen(true)}
                className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
              >
                <Info className="w-4 h-4" />
                Why this works
              </button>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
              <Button
                onClick={onStart}
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Start practice
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={onSchedule} variant="outline" className="w-full">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button onClick={onPin} variant="outline" className="w-full">
                  <Pin className="w-4 h-4 mr-2" />
                  Pin
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <EvidenceDrawer
        open={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        evidenceType={practice.evidenceType}
        evidencePoints={practice.evidencePoints}
        adverseNote={practice.adverseNote}
      />
    </>
  );
}
