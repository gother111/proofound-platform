import { Briefcase, GraduationCap, HandHeart, Network, Target } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Education, Experience, ImpactStory, Volunteering } from '@/types/profile';

import { ImpactTab } from './ImpactTab';
import { JourneyTab } from './JourneyTab';
import { LearningTab } from './LearningTab';
import { NetworkTab } from './NetworkTab';
import { ServiceTab } from './ServiceTab';

type ProfileTabsSectionProps = {
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  isPending: boolean;
  impactPending: boolean;
  onAddImpactStory: () => void;
  onDeleteImpactStory: (id: string) => void;
  onAddExperience: () => void;
  onDeleteExperience: (id: string) => void;
  onAddEducation: () => void;
  onDeleteEducation: (id: string) => void;
  onAddVolunteering: () => void;
  onDeleteVolunteering: (id: string) => void;
};

export function ProfileTabsSection({
  impactStories,
  experiences,
  education,
  volunteering,
  isPending,
  impactPending,
  onAddImpactStory,
  onDeleteImpactStory,
  onAddExperience,
  onDeleteExperience,
  onAddEducation,
  onDeleteEducation,
  onAddVolunteering,
  onDeleteVolunteering,
}: ProfileTabsSectionProps) {
  return (
    <Tabs defaultValue="impact" className="space-y-8">
      <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-6">
        <TabsTrigger
          value="impact"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7A9278] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#7A9278] transition-all"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Impact</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="journey"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C67B5C] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#C67B5C] transition-all"
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Journey</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="learning"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#5C8B89] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#5C8B89] transition-all"
        >
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span>Learning</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="service"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#C67B5C] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#C67B5C] transition-all"
        >
          <div className="flex items-center gap-2">
            <HandHeart className="w-4 h-4" />
            <span>Service</span>
          </div>
        </TabsTrigger>
        <TabsTrigger
          value="network"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#7A9278] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 py-3 text-muted-foreground data-[state=active]:text-[#7A9278] transition-all"
        >
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4" />
            <span>Network</span>
          </div>
        </TabsTrigger>
      </TabsList>

      <ImpactTab
        impactStories={impactStories}
        onAddStory={onAddImpactStory}
        onDeleteStory={onDeleteImpactStory}
        actionsDisabled={impactPending || isPending}
      />

      <JourneyTab
        experiences={experiences}
        onAddExperience={onAddExperience}
        onDeleteExperience={onDeleteExperience}
      />

      <LearningTab
        education={education}
        onAddEducation={onAddEducation}
        onDeleteEducation={onDeleteEducation}
      />

      <ServiceTab
        volunteering={volunteering}
        onAddService={onAddVolunteering}
        onDeleteService={onDeleteVolunteering}
      />

      <NetworkTab />
    </Tabs>
  );
}
