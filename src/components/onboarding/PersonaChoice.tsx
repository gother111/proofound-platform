'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building2 } from 'lucide-react';

interface PersonaChoiceProps {
  onSelect: (persona: 'individual' | 'organization') => void;
}

export function PersonaChoice({ onSelect }: PersonaChoiceProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-display font-semibold text-primary-500 mb-2">
          Choose Your Path
        </h2>
        <p className="text-neutral-dark-600">How will you be using Proofound?</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 hover:border-primary-300 transition-colors cursor-pointer group">
          <CardHeader className="text-center space-y-4 p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <User className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <CardTitle className="mb-2">Individual</CardTitle>
              <CardDescription className="text-base">
                Build your personal profile, showcase your skills, and connect with opportunities
              </CardDescription>
            </div>
            <Button onClick={() => onSelect('individual')} className="w-full" size="lg">
              Continue as Individual
            </Button>
          </CardHeader>
        </Card>

        <Card className="border-2 hover:border-primary-300 transition-colors cursor-pointer group">
          <CardHeader className="text-center space-y-4 p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <Building2 className="w-8 h-8 text-primary-500" />
            </div>
            <div>
              <CardTitle className="mb-2">Organization</CardTitle>
              <CardDescription className="text-base">
                Create an organization, manage your team, and build credibility together
              </CardDescription>
            </div>
            <Button onClick={() => onSelect('organization')} className="w-full" size="lg">
              Continue as Organization
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
