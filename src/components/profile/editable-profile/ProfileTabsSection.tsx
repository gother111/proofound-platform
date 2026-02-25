'use client';

import { useState } from 'react';
import { Briefcase, GraduationCap, HandHeart, Network, Target } from 'lucide-react';
import { motion } from 'framer-motion';

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
  onEditImpactStory: (story: ImpactStory) => void;
  onDeleteImpactStory: (id: string) => void;
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

export function ProfileTabsSection({
  impactStories,
  experiences,
  education,
  volunteering,
  isPending,
  impactPending,
  onAddImpactStory,
  onEditImpactStory,
  onDeleteImpactStory,
  onAddExperience,
  onEditExperience,
  onDeleteExperience,
  onAddEducation,
  onEditEducation,
  onDeleteEducation,
  onAddVolunteering,
  onEditVolunteering,
  onDeleteVolunteering,
}: ProfileTabsSectionProps) {
  const [activeTab, setActiveTab] = useState('impact');

  return (
    <Tabs
      defaultValue="impact"
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-8"
    >
      <TabsList className="w-full justify-start bg-transparent border-b border-border/40 rounded-none h-auto p-0 gap-6 relative">
        {[
          { id: 'impact', label: 'Impact', icon: Target, color: '#7A9278' },
          { id: 'journey', label: 'Journey', icon: Briefcase, color: '#C67B5C' },
          { id: 'learning', label: 'Learning', icon: GraduationCap, color: '#5C8B89' },
          { id: 'service', label: 'Service', icon: HandHeart, color: '#C67B5C' },
          { id: 'network', label: 'Network', icon: Network, color: '#7A9278' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-0 bg-transparent shadow-none px-2 py-3 text-muted-foreground transition-colors hover:text-foreground relative group data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              style={{ color: isActive ? tab.color : undefined }}
            >
              <div className="flex items-center gap-2 relative z-10">
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full z-20"
                  style={{ backgroundColor: tab.color }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <ImpactTab
        impactStories={impactStories}
        onAddStory={onAddImpactStory}
        onEditStory={onEditImpactStory}
        onDeleteStory={onDeleteImpactStory}
        actionsDisabled={impactPending || isPending}
      />

      <JourneyTab
        experiences={experiences}
        onAddExperience={onAddExperience}
        onEditExperience={onEditExperience}
        onDeleteExperience={onDeleteExperience}
      />

      <LearningTab
        education={education}
        onAddEducation={onAddEducation}
        onEditEducation={onEditEducation}
        onDeleteEducation={onDeleteEducation}
      />

      <ServiceTab
        volunteering={volunteering}
        onAddService={onAddVolunteering}
        onEditService={onEditVolunteering}
        onDeleteService={onDeleteVolunteering}
      />

      <NetworkTab />
    </Tabs>
  );
}
