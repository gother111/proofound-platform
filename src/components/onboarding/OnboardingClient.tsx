'use client';

import { useState } from 'react';
import { PersonaChoice } from '@/components/onboarding/PersonaChoice';
import { IndividualSetup } from '@/components/onboarding/IndividualSetup';
import { OrganizationSetup } from '@/components/onboarding/OrganizationSetup';

type Persona = 'individual' | 'org_member' | null;

export interface OnboardingClientProps {
  initialPersona?: Persona;
}

export function OnboardingClient({ initialPersona = null }: OnboardingClientProps) {
  const [selectedPersona, setSelectedPersona] = useState<Persona>(initialPersona);

  if (!selectedPersona) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary-100 px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-semibold text-primary-500 mb-2">
              Welcome to Proofound
            </h1>
            <p className="text-lg text-neutral-dark-600">Let&apos;s get you set up</p>
          </div>
          <PersonaChoice onSelect={setSelectedPersona} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-100 px-4 py-12">
      <div className="w-full max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedPersona(null)}
          className="mb-6 text-sm text-neutral-dark-600 hover:text-primary-500 transition-colors"
        >
          ← Back to persona choice
        </button>
        {selectedPersona === 'individual' ? <IndividualSetup /> : <OrganizationSetup />}
      </div>
    </div>
  );
}
