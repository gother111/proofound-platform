"use client";

/**
 * ServiceTab Component
 *
 * Displays volunteering experiences with personal connection highlighted.
 * Features:
 * - Volunteer cards with hand-heart icon (terracotta)
 * - "Personal Connection" section highlighted in terracotta box
 * - "Impact Made" and "Skills Deployed" sections
 * - Hand-heart icon for empty state
 */

import { HandHeart, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "../../shared/EmptyState";
import { ContentCard, ContentSection } from "../../shared/ContentCard";
import { profileColors, profileOpacity } from "@/lib/profile-colors";
import type { Volunteering } from "@/lib/profile-types";

interface ServiceTabProps {
  volunteering: Volunteering[];
  onAdd?: () => void;
  onDelete?: (id: string) => void;
  editable?: boolean;
}

export function ServiceTab({ volunteering, onAdd, onDelete, editable = false }: ServiceTabProps) {
  if (volunteering.length === 0) {
    return (
      <Card className="border-2 border-dashed" style={{ borderColor: `${profileColors.textPrimary}33` }}>
        <EmptyState
          icon={
            <HandHeart
              className="w-16 h-16"
              style={{ color: profileColors.terracotta, opacity: 0.6 }}
            />
          }
          title="Share Your Service"
          description="Add your volunteering experiences, focusing on your personal connection to the cause and the impact you made."
          buttonText="Add Volunteering Experience"
          onButtonClick={() => onAdd?.()}
          tip="Tip: Share your personal 'why' and the impact you made, not just your role"
          buttonStyle={{ backgroundColor: profileColors.terracotta }}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {volunteering.map((vol) => (
        <ContentCard
          key={vol.id}
          icon={<HandHeart className="w-5 h-5" style={{ color: profileColors.terracotta }} />}
          iconColor={profileColors.terracotta}
          title={vol.title}
          verified={vol.verified}
          organization={vol.orgDescription}
          timeline={vol.duration}
          onDelete={editable && onDelete ? () => onDelete(vol.id) : undefined}
        >
          {/* Personal Connection (HIGHLIGHTED) */}
          <div
            className="p-3 rounded-lg border"
            style={{
              backgroundColor: profileOpacity.terracotta[5],
              borderColor: profileOpacity.terracotta[20],
            }}
          >
            <div className="flex items-center gap-1 mb-2">
              <HandHeart className="w-3 h-3" style={{ color: profileColors.terracotta }} />
              <span
                className="text-xs font-medium"
                style={{ color: profileColors.textPrimary, opacity: 0.7 }}
              >
                Personal Connection
              </span>
            </div>
            <p className="text-sm font-medium mb-2" style={{ color: profileColors.textPrimary }}>
              {vol.cause}
            </p>
            <p
              className="text-xs italic"
              style={{ color: profileColors.textPrimary, opacity: 0.8 }}
            >
              {vol.personalWhy}
            </p>
          </div>

          {/* Impact Made Section */}
          <ContentSection label="Impact Made">
            {vol.impact}
          </ContentSection>

          {/* Skills Deployed Section */}
          <ContentSection label="Skills Deployed">
            {vol.skillsDeployed}
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
            style={{ backgroundColor: profileOpacity.terracotta[10] }}
          >
            <Plus className="w-5 h-5" style={{ color: profileColors.terracotta }} />
          </div>
          <span className="text-sm font-medium" style={{ color: profileColors.terracotta }}>
            Add Another Volunteering Experience
          </span>
        </button>
      )}
    </div>
  );
}
