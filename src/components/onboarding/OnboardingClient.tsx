'use client';

import { useState } from 'react';
import { PersonaChoice } from '@/components/onboarding/PersonaChoice';
import { IndividualSetup } from '@/components/onboarding/IndividualSetup';
import { OrganizationSetup } from '@/components/onboarding/OrganizationSetup';
import type { StartFromCvScaffoldingSurface } from '@/lib/ai/start-from-cv-contract';

type Persona = 'individual' | 'organization' | null;

export interface OnboardingClientProps {
  initialPersona?: Persona;
  individualCompletionPath?: string;
  startFromCvScaffoldingSurface?: StartFromCvScaffoldingSurface;
}

export function OnboardingClient({
  initialPersona = null,
  individualCompletionPath,
  startFromCvScaffoldingSurface,
}: OnboardingClientProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(initialPersona);

  if (!selectedPersona) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-proofound-parchment dark:bg-background px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
              Welcome to Proofound
            </h1>
            <p className="text-lg text-proofound-charcoal/70 dark:text-muted-foreground">
              Let&apos;s create your first Proof Pack
            </p>
          </div>
          <PersonaChoice onSelect={setSelectedPersona} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-proofound-parchment dark:bg-background px-4 py-12">
      <div className="w-full max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedPersona(null)}
          className="mb-6 text-sm text-proofound-charcoal/70 dark:text-muted-foreground hover:text-proofound-forest dark:hover:text-primary transition-colors"
        >
          ← Back to persona choice
        </button>
        {selectedPersona === 'individual' ? (
          <IndividualSetup
            completionPath={individualCompletionPath}
            startFromCvScaffoldingSurface={startFromCvScaffoldingSurface}
          />
        ) : (
          <OrganizationSetup />
        )}
      </div>
    </div>
  );
}
