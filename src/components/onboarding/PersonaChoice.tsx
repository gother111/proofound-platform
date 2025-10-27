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
        <h2 className="text-2xl font-['Crimson_Pro'] font-semibold text-proofound-forest dark:text-primary mb-2">
          Choose Your Path
        </h2>
        <p className="text-proofound-charcoal/70 dark:text-muted-foreground">
          How will you be using Proofound?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-proofound-stone hover:border-proofound-forest dark:border-border dark:hover:border-primary transition-colors cursor-pointer group rounded-2xl">
          <CardHeader className="text-center space-y-4 p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-proofound-forest/10 flex items-center justify-center group-hover:bg-proofound-forest/20 transition-colors">
              <User className="w-8 h-8 text-proofound-forest dark:text-primary" />
            </div>
            <div>
              <CardTitle className="mb-2 font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                Individual
              </CardTitle>
              <CardDescription className="text-base text-proofound-charcoal/70 dark:text-muted-foreground">
                Build your personal profile, showcase your skills, and connect with opportunities
              </CardDescription>
            </div>
            <Button
              onClick={() => onSelect('individual')}
              className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              size="lg"
            >
              Continue as Individual
            </Button>
          </CardHeader>
        </Card>

        <Card className="border-2 border-proofound-stone hover:border-proofound-forest dark:border-border dark:hover:border-primary transition-colors cursor-pointer group rounded-2xl">
          <CardHeader className="text-center space-y-4 p-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-proofound-forest/10 flex items-center justify-center group-hover:bg-proofound-forest/20 transition-colors">
              <Building2 className="w-8 h-8 text-proofound-forest dark:text-primary" />
            </div>
            <div>
              <CardTitle className="mb-2 font-['Crimson_Pro'] text-proofound-charcoal dark:text-foreground">
                Organization
              </CardTitle>
              <CardDescription className="text-base text-proofound-charcoal/70 dark:text-muted-foreground">
                Create an organization, manage your team, and build credibility together
              </CardDescription>
            </div>
            <Button
              onClick={() => onSelect('organization')}
              className="w-full bg-proofound-forest hover:bg-proofound-forest/90 text-white"
              size="lg"
            >
              Continue as Organization
            </Button>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
