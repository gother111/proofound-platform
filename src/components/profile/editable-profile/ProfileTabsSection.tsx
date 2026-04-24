'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Globe, PackageOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';
import type { Education, Experience, ImpactStory, Volunteering } from '@/types/profile';

import { ContextTab } from './ContextTab';
import { ImpactTab } from './ImpactTab';
import { VerificationTab } from './VerificationTab';
import { VisibilityPortfolioTab } from './VisibilityPortfolioTab';

type ProfileTabsSectionProps = {
  impactStories: ImpactStory[];
  experiences: Experience[];
  education: Education[];
  volunteering: Volunteering[];
  completionState: IndividualProfileCompletionState;
  initialTab?: ProfileTabId;
  proofArtifactCount: number;
  acceptedVerificationCount: number;
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
  onImportContextComplete?: () => void;
  onAddFirstProof: () => void;
};

type ProfileTabId = 'context' | 'proof_packs' | 'verification' | 'visibility';

function isProfileTabId(value: string): value is ProfileTabId {
  return (
    value === 'context' ||
    value === 'proof_packs' ||
    value === 'verification' ||
    value === 'visibility'
  );
}

export function ProfileTabsSection({
  impactStories,
  experiences,
  education,
  volunteering,
  completionState,
  initialTab = 'context',
  proofArtifactCount,
  acceptedVerificationCount,
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
  onImportContextComplete,
  onAddFirstProof,
}: ProfileTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabId>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  return (
    <Tabs
      defaultValue="context"
      value={activeTab}
      onValueChange={(value) => {
        if (isProfileTabId(value)) {
          setActiveTab(value);
        }
      }}
      className="space-y-8"
    >
      <TabsList className="w-full justify-start bg-transparent border-b border-border/40 rounded-none h-auto p-0 gap-6 relative">
        {[
          { id: 'context', label: 'Context', icon: Briefcase, color: '#C67B5C' },
          { id: 'proof_packs', label: 'Proof Packs', icon: PackageOpen, color: '#7A9278' },
          { id: 'verification', label: 'Verification', icon: ShieldCheck, color: '#5C8B89' },
          { id: 'visibility', label: 'Visibility / Portfolio', icon: Globe, color: '#7A9278' },
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

      <ContextTab
        experiences={experiences}
        education={education}
        volunteering={volunteering}
        onAddExperience={onAddExperience}
        onEditExperience={onEditExperience}
        onDeleteExperience={onDeleteExperience}
        onAddEducation={onAddEducation}
        onEditEducation={onEditEducation}
        onDeleteEducation={onDeleteEducation}
        onAddVolunteering={onAddVolunteering}
        onEditVolunteering={onEditVolunteering}
        onDeleteVolunteering={onDeleteVolunteering}
        onImportComplete={onImportContextComplete}
      />

      <ImpactTab
        impactStories={impactStories}
        onAddStory={onAddImpactStory}
        onEditStory={onEditImpactStory}
        onDeleteStory={onDeleteImpactStory}
        actionsDisabled={impactPending || isPending}
        completionState={completionState}
        proofArtifactCount={proofArtifactCount}
        acceptedVerificationCount={acceptedVerificationCount}
        onAddFirstProof={onAddFirstProof}
      />

      <VerificationTab acceptedVerificationCount={acceptedVerificationCount} />

      <VisibilityPortfolioTab completionState={completionState} />
    </Tabs>
  );
}
