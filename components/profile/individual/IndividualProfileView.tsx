"use client";

/**
 * IndividualProfileView Component
 *
 * Main wrapper for the individual profile page.
 * Combines all components with proper layout and responsive grid.
 *
 * Layout:
 * - Completion Banner (if < 80%)
 * - Profile Hero
 * - Grid: Sidebar (1/3) + Content (2/3) on desktop, stacked on mobile
 * - Profile Sidebar (Mission, Values, Causes, Skills)
 * - Profile Tabs
 * - Tab Content Area
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CompletionBanner } from "./CompletionBanner";
import { ProfileHero } from "./ProfileHero";
import { ProfileSidebar } from "./ProfileSidebar";
import { ProfileTabs } from "./ProfileTabs";
import { ImpactTab } from "./tabs/ImpactTab";
import { JourneyTab } from "./tabs/JourneyTab";
import { LearningTab } from "./tabs/LearningTab";
import { ServiceTab } from "./tabs/ServiceTab";
import { NetworkTab } from "./tabs/NetworkTab";
import { profileColors } from "@/lib/profile-colors";
import type { ProfileData, ProfileTab } from "@/lib/profile-types";

interface IndividualProfileViewProps {
  profileData: ProfileData;
  editable?: boolean;
  // Callbacks for CRUD operations
  onAvatarUpload?: (file: File) => void;
  onCoverUpload?: (file: File) => void;
  onTaglineSave?: (tagline: string) => void;
  onEditBasicInfo?: () => void;
  onMissionSave?: (mission: string) => void;
  onValuesAdd?: () => void;
  onValuesEdit?: () => void;
  onCausesAdd?: () => void;
  onCausesEdit?: () => void;
  onSkillsAdd?: () => void;
  onSkillsEdit?: () => void;
  onImpactStoryAdd?: () => void;
  onImpactStoryDelete?: (id: string) => void;
  onExperienceAdd?: () => void;
  onExperienceDelete?: (id: string) => void;
  onEducationAdd?: () => void;
  onEducationDelete?: (id: string) => void;
  onVolunteeringAdd?: () => void;
  onVolunteeringDelete?: (id: string) => void;
  onNetworkVisualize?: () => void;
}

export function IndividualProfileView({
  profileData,
  editable = false,
  onAvatarUpload,
  onCoverUpload,
  onTaglineSave,
  onEditBasicInfo,
  onMissionSave,
  onValuesAdd,
  onValuesEdit,
  onCausesAdd,
  onCausesEdit,
  onSkillsAdd,
  onSkillsEdit,
  onImpactStoryAdd,
  onImpactStoryDelete,
  onExperienceAdd,
  onExperienceDelete,
  onEducationAdd,
  onEducationDelete,
  onVolunteeringAdd,
  onVolunteeringDelete,
  onNetworkVisualize,
}: IndividualProfileViewProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('impact');

  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: profileColors.bgBase }}
    >
      {/* Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Completion Banner */}
        <CompletionBanner completion={profileData.profileCompletion} />

        {/* Profile Hero */}
        <ProfileHero
          basicInfo={profileData.basicInfo}
          onEdit={onEditBasicInfo}
          onAvatarUpload={onAvatarUpload}
          onCoverUpload={onCoverUpload}
          onTaglineSave={onTaglineSave}
          editable={editable}
        />

        {/* Main Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              profileData={profileData}
              editable={editable}
              onMissionSave={onMissionSave}
              onValuesAdd={onValuesAdd}
              onValuesEdit={onValuesEdit}
              onCausesAdd={onCausesAdd}
              onCausesEdit={onCausesEdit}
              onSkillsAdd={onSkillsAdd}
              onSkillsEdit={onSkillsEdit}
            />
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <ProfileTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                role="tabpanel"
                id={`${activeTab}-panel`}
                aria-labelledby={`${activeTab}-tab`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'impact' && (
                  <ImpactTab
                    impactStories={profileData.impactStories}
                    onAdd={onImpactStoryAdd}
                    onDelete={onImpactStoryDelete}
                    editable={editable}
                  />
                )}

                {activeTab === 'journey' && (
                  <JourneyTab
                    experiences={profileData.experiences}
                    onAdd={onExperienceAdd}
                    onDelete={onExperienceDelete}
                    editable={editable}
                  />
                )}

                {activeTab === 'learning' && (
                  <LearningTab
                    education={profileData.education}
                    onAdd={onEducationAdd}
                    onDelete={onEducationDelete}
                    editable={editable}
                  />
                )}

                {activeTab === 'service' && (
                  <ServiceTab
                    volunteering={profileData.volunteering}
                    onAdd={onVolunteeringAdd}
                    onDelete={onVolunteeringDelete}
                    editable={editable}
                  />
                )}

                {activeTab === 'network' && (
                  <NetworkTab
                    stats={profileData.networkStats}
                    onVisualize={onNetworkVisualize}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
