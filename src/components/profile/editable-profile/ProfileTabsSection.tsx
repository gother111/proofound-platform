'use client';

import { useEffect, useState } from 'react';
import { Briefcase, Globe, PackageOpen, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE } from '@/lib/ai/start-from-cv-contract';
import type { IndividualProfileCompletionState } from '@/lib/profile/completion-flow';
import type {
  Education,
  Experience,
  ImpactStory,
  ProfileProofPack,
  Volunteering,
} from '@/types/profile';

import { ContextTab } from './ContextTab';
import { ImpactTab } from './ImpactTab';
import { VerificationTab } from './VerificationTab';
import { VisibilityPortfolioTab } from './VisibilityPortfolioTab';

type ProfileTabsSectionProps = {
  impactStories: ImpactStory[];
  proofPacks?: ProfileProofPack[];
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
  onCompleteSafeShell: () => void;
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
  proofPacks = [],
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
  onCompleteSafeShell,
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
      <TabsList className="grid h-auto w-full grid-cols-2 items-stretch gap-2 rounded-lg border border-border/40 bg-white/65 p-1 text-left sm:inline-flex sm:items-center sm:justify-start sm:gap-6 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:bg-transparent sm:p-0">
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
              className="relative min-h-11 rounded-md border-0 bg-transparent px-2 py-2 text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none sm:rounded-none sm:py-3"
              style={{ color: isActive ? tab.color : undefined }}
            >
              <div className="relative z-10 flex min-w-0 items-center justify-center gap-2 sm:justify-start">
                <Icon className="w-4 h-4" />
                <span className="whitespace-normal text-xs leading-tight sm:whitespace-nowrap sm:text-sm">
                  {tab.label}
                </span>
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
        cvScaffoldingSurface={START_FROM_CV_GUEST_FIRST_PROOF_SCAFFOLDING_SURFACE}
      />

      <ImpactTab
        impactStories={impactStories}
        proofPacks={proofPacks}
        onAddStory={onAddImpactStory}
        onEditStory={onEditImpactStory}
        onDeleteStory={onDeleteImpactStory}
        actionsDisabled={impactPending || isPending}
        completionState={completionState}
        proofArtifactCount={proofArtifactCount}
        acceptedVerificationCount={acceptedVerificationCount}
        onAddFirstProof={onAddFirstProof}
        onCompleteSafeShell={onCompleteSafeShell}
      />

      <VerificationTab acceptedVerificationCount={acceptedVerificationCount} />

      <VisibilityPortfolioTab
        completionState={completionState}
        onCompleteSafeShell={onCompleteSafeShell}
      />
    </Tabs>
  );
}
