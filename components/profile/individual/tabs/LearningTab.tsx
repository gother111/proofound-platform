"use client";

/**
 * LearningTab Component
 *
 * Displays education entries with graduation cap empty state.
 * Features:
 * - Education cards with graduation cap icon (teal)
 * - "Skills Gained" and "Meaningful Projects" sections
 * - Graduation cap icon for empty state
 */

import { GraduationCap, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../../shared/EmptyState";
import { ContentCard, ContentSection } from "../../shared/ContentCard";
import { profileColors, profileOpacity } from "@/lib/profile-colors";
import type { Education } from "@/lib/profile-types";

interface LearningTabProps {
  education: Education[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function LearningTab({ education, onAdd, onDelete, editable = false }: LearningTabProps) {
  if (education.length === 0) {
    return (
      <Card className="border-2 border-dashed" style={{ borderColor: `${profileColors.textPrimary}33` }}>
        <EmptyState
          icon={
            <GraduationCap
              className="w-16 h-16"
              style={{ color: profileColors.teal, opacity: 0.6 }}
            />
          }
          title="Share Your Learning"
          description="Add your educational background, focusing on skills gained and meaningful projects rather than just degrees."
          buttonText="Add Education"
          onButtonClick={() => onAdd?.()}
          tip="Tip: Include skills gained and meaningful projects, not just institution names"
          buttonStyle={{ backgroundColor: profileColors.teal }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {education.map((edu) => (
        <ContentCard
          key={edu.id}
          icon={<GraduationCap className="w-5 h-5" style={{ color: profileColors.teal }} />}
          iconColor={profileColors.teal}
          title={edu.degree}
          verified={edu.verified}
          organization={edu.institution}
          timeline={edu.duration}
          onDelete={editable && onDelete ? () => onDelete(edu.id) : undefined}
        >
          {/* Skills Gained Section */}
          <ContentSection label="Skills Gained">
            {edu.skills}
          </ContentSection>

          {/* Meaningful Projects Section */}
          <ContentSection label="Meaningful Projects">
            {edu.projects}
          </ContentSection>
        </ContentCard>
      ))}

      {/* Add More Button */}
      {editable && onAdd && (
        <button
          onClick={onAdd}
          className="w-full p-4 rounded-xl border-2 border-dashed text-left transition-colors hover:border-opacity-60 flex items-center gap-3"
          style={{
            borderColor: `${profileColors.teal}4D`, // 30% opacity
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: profileOpacity.teal[10] }}
          >
            <Plus className="w-5 h-5" style={{ color: profileColors.teal }} />
          </div>
          <span className="text-sm font-medium" style={{ color: profileColors.teal }}>
            Add Another Education Entry
          </span>
        </button>
      )}
    </div>
  );
}
