"use client";

/**
 * ImpactTab Component
 *
 * Displays user's impact stories with custom SVG empty state.
 * Features:
 * - Impact story cards with all details
 * - Circle with plus sign SVG for empty state
 * - Outcomes highlighted in special box
 * - Delete button on hover (edit mode)
 */

import { Target, Calendar, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../../shared/EmptyState";
import { ContentCard, ContentSection } from "../../shared/ContentCard";
import { profileColors } from "@/lib/profile-colors";
import type { ImpactStory } from "@/lib/profile-types";

interface ImpactTabProps {
  impactStories: ImpactStory[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function ImpactTab({ impactStories, onAdd, onDelete, editable = false }: ImpactTabProps) {
  if (impactStories.length === 0) {
    return (
      <Card className="border-2 border-dashed" style={{ borderColor: `${profileColors.textPrimary}33` }}>
        <EmptyState
          icon={
            <svg viewBox="0 0 100 100" className="w-20 h-20">
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke={profileColors.sage}
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d="M 50 30 L 50 70 M 30 50 L 70 50"
                stroke={profileColors.sage}
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>
          }
          title="Map Your Impact"
          description="Share your most meaningful work and the measurable outcomes you've achieved. Focus on what changed and the value you delivered."
          buttonText="Add Your First Impact Story"
          onButtonClick={() => onAdd?.()}
          tip="Tip: Include context about the organization, your role, and measurable outcomes"
          buttonStyle={{ backgroundColor: profileColors.sage }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {impactStories.map((story) => (
        <ContentCard
          key={story.id}
          icon={<Target className="w-5 h-5" style={{ color: profileColors.sage }} />}
          iconColor={profileColors.sage}
          title={story.title}
          verified={story.verified}
          organization={story.orgDescription}
          timeline={story.timeline}
          onDelete={editable && onDelete ? () => onDelete(story.id) : undefined}
        >
          {/* Impact Section */}
          <ContentSection label="Impact">
            {story.impact}
          </ContentSection>

          {/* Business Value Section */}
          <ContentSection label="Business Value">
            {story.businessValue}
          </ContentSection>

          {/* Outcomes Section (Highlighted) */}
          <ContentSection
            label="Outcomes"
            highlighted
            highlightColor={profileColors.sage}
          >
            {story.outcomes}
          </ContentSection>
        </ContentCard>
      ))}

      {/* Add More Button */}
      {editable && onAdd && (
        <button
          onClick={onAdd}
          className="w-full p-4 rounded-xl border-2 border-dashed text-left transition-colors hover:border-opacity-60 flex items-center gap-3"
          style={{
            borderColor: `${profileColors.sage}4D`, // 30% opacity
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${profileColors.sage}1A` }} // 10% opacity
          >
            <Plus className="w-5 h-5" style={{ color: profileColors.sage }} />
          </div>
          <span className="text-sm font-medium" style={{ color: profileColors.sage }}>
            Add Another Impact Story
          </span>
        </button>
      )}
    </div>
  );
}
