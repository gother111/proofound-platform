'use client';

import { useState } from 'react';
import { Briefcase, FileUp } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StartFromCvDialog } from '@/components/profile/StartFromCvDialog';
import { useStartFromCvBetaStatus } from '@/hooks/useStartFromCvBetaStatus';
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
  onImportComplete?: () => void;
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
  onImportComplete,
}: ContextTabProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const startFromCvStatus = useStartFromCvBetaStatus();
  const startFromCvEnabled = startFromCvStatus.visible && startFromCvStatus.available;

  return (
    <TabsContent value="context" className="space-y-6">
      <Card className="border-proofound-stone/60 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
          {startFromCvEnabled ? (
            <Button type="button" variant="outline" onClick={() => setIsImportOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Start from CV
            </Button>
          ) : null}
        </div>
      </Card>

      {startFromCvEnabled ? (
        <Card className="border-proofound-forest/20 bg-proofound-forest/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Start from your CV</p>
              <p className="text-sm text-muted-foreground">
                Upload your CV to create private editable drafts. Nothing is published, verified,
                scored, ranked, or shown to organizations unless you choose what to keep later.
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-proofound-forest hover:bg-proofound-forest/90"
              onClick={() => setIsImportOpen(true)}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Start from CV
            </Button>
          </div>
        </Card>
      ) : null}

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start from your CV</DialogTitle>
            <DialogDescription>
              Review private drafts before applying anything to your profile context.
            </DialogDescription>
          </DialogHeader>
          <StartFromCvDialog
            onApplyComplete={() => {
              setIsImportOpen(false);
              onImportComplete?.();
            }}
          />
        </DialogContent>
      </Dialog>

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
