"use client";

/**
 * ProfileSidebar Component
 *
 * Left sidebar container for Individual Profile.
 * Combines all four sidebar cards:
 * - Mission
 * - Core Values
 * - Causes I Support
 * - Skills & Expertise
 *
 * Responsive:
 * - Full width on mobile
 * - 1/3 column width on desktop (lg+)
 */

import { MissionCard } from "./MissionCard";
import { ValuesCard } from "./ValuesCard";
import { CausesCard } from "./CausesCard";
import { SkillsCard } from "./SkillsCard";
import type { ProfileData } from "@/lib/profile-types";

interface ProfileSidebarProps {
  profileData: ProfileData;
  editable?: boolean;
  onMissionSave?: (mission: string) => void;
  onValuesAdd?: () => void;
  onValuesEdit?: () => void;
  onCausesAdd?: () => void;
  onCausesEdit?: () => void;
  onSkillsAdd?: () => void;
  onSkillsEdit?: () => void;
}

export function ProfileSidebar({
  profileData,
  editable = false,
  onMissionSave,
  onValuesAdd,
  onValuesEdit,
  onCausesAdd,
  onCausesEdit,
  onSkillsAdd,
  onSkillsEdit,
}: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Mission */}
      <MissionCard
        mission={profileData.mission}
        onSave={onMissionSave}
        editable={editable}
      />

      {/* Core Values */}
      <ValuesCard
        values={profileData.values}
        onAdd={onValuesAdd}
        onEdit={onValuesEdit}
        editable={editable}
      />

      {/* Causes */}
      <CausesCard
        causes={profileData.causes}
        onAdd={onCausesAdd}
        onEdit={onCausesEdit}
        editable={editable}
      />

      {/* Skills */}
      <SkillsCard
        skills={profileData.skills}
        onAdd={onSkillsAdd}
        onEdit={onSkillsEdit}
        editable={editable}
      />
    </div>
  );
}
