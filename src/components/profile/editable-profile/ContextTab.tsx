'use client';

import { Briefcase } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { Education, Experience, Volunteering } from '@/types/profile';

import { JourneySection } from './JourneyTab';
import { LearningSection } from './LearningTab';
import { ServiceSection } from './ServiceTab';

type ContextTabProps = {
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  onAddExperience: () => void;
  onEditExperience: (experience: Experience) => void;
  onDeleteExperience: (id: string) => void;
  onAddEducation: () => void;
  onEditEducation: (education: Education) => void;
  onDeleteEducation: (id: string) => void;
  onAddVolunteering: () => void;
  onEditVolunteering: (volunteering: Volunteering) => void;
  onDeleteVolunteering: (id: string) => void;
};

export function ContextTab({
  experiences,
  education,
  volunteering,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
  onAddVolunteering,
  onEditVolunteering,
  onDeleteVolunteering,
}: ContextTabProps) {
  return (
    <TabsContent value="context" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-proofound-forest/10 p-2 text-proofound-forest">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Context</h3>
            <p className="text-sm text-muted-foreground">
              Context stays private by default. Add just enough work, learning, or volunteering
              detail to anchor your proof in real situations.
            </p>
          </div>
        </div>
      </Card>

      <JourneySection
        experiences={experiences}
        onAddExperience={onAddExperience}
        onEditExperience={onEditExperience}
        onDeleteExperience={onDeleteExperience}
      />

      <LearningSection
        education={education}
        onAddEducation={onAddEducation}
        onEditEducation={onEditEducation}
        onDeleteEducation={onDeleteEducation}
      />

      <ServiceSection
        volunteering={volunteering}
        onAddService={onAddVolunteering}
        onEditService={onEditVolunteering}
        onDeleteService={onDeleteVolunteering}
      />
    </TabsContent>
  );
}
