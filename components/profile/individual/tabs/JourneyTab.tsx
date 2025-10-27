"use client";

/**
 * JourneyTab Component
 *
 * Displays professional experiences with growth path SVG empty state.
 * Features:
 * - Experience cards with briefcase icon
 * - "What I Learned" and "How I Grew" sections
 * - Growth path SVG with dots for empty state
 */

import { Briefcase, Lightbulb, TrendingUp, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../../shared/EmptyState";
import { ContentCard, ContentSection } from "../../shared/ContentCard";
import { profileColors } from "@/lib/profile-colors";
import type { Experience } from "@/lib/profile-types";

interface JourneyTabProps {
  experiences: Experience[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function JourneyTab({ experiences, onAdd, onDelete, editable = false }: JourneyTabProps) {
  if (experiences.length === 0) {
    return (
      <Card className="border-2 border-dashed" style={{ borderColor: `${profileColors.textPrimary}33` }}>
        <EmptyState
          icon={
            <svg viewBox="0 0 100 100" className="w-20 h-20">
              <path
                d="M 20 70 Q 35 40, 50 50 T 80 30"
                fill="none"
                stroke={profileColors.terracotta}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <circle cx="20" cy="70" r="5" fill={profileColors.terracotta} />
              <circle cx="50" cy="50" r="5" fill={profileColors.ochre} />
              <circle cx="80" cy="30" r="5" fill={profileColors.sage} />
            </svg>
          }
          title="Chart Your Journey"
          description="Share your professional experiences focusing on what you learned and how you grew. Emphasize personal development over job titles."
          buttonText="Add Work Experience"
          onButtonClick={() => onAdd?.()}
          tip="Tip: Focus on learning, growth, and skills developed rather than just responsibilities"
          buttonStyle={{ backgroundColor: profileColors.terracotta }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {experiences.map((exp) => (
        <ContentCard
          key={exp.id}
          icon={<Briefcase className="w-5 h-5" style={{ color: profileColors.terracotta }} />}
          iconColor={profileColors.terracotta}
          title={exp.title}
          verified={exp.verified}
          organization={exp.orgDescription}
          timeline={exp.duration}
          onDelete={editable && onDelete ? () => onDelete(exp.id) : undefined}
        >
          {/* What I Learned Section */}
          <ContentSection
            label="What I Learned"
            icon={<Lightbulb className="w-3 h-3" />}
          >
            {exp.learning}
          </ContentSection>

          {/* How I Grew Section */}
          <ContentSection
            label="How I Grew"
            icon={<TrendingUp className="w-3 h-3" />}
          >
            {exp.growth}
          </ContentSection>
        </ContentCard>
      ))}

      {/* Add More Button */}
      {editable && onAdd && (
        <button
          onClick={onAdd}
          className="w-full p-4 rounded-xl border-2 border-dashed text-left transition-colors hover:border-opacity-60 flex items-center gap-3"
          style={{
            borderColor: `${profileColors.terracotta}4D`, // 30% opacity
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${profileColors.terracotta}1A` }} // 10% opacity
          >
            <Plus className="w-5 h-5" style={{ color: profileColors.terracotta }} />
          </div>
          <span className="text-sm font-medium" style={{ color: profileColors.terracotta }}>
            Add Another Experience
          </span>
        </button>
      )}
    </div>
  );
}
