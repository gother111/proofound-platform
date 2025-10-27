"use client";

/**
 * SkillsCard Component
 *
 * Displays user's skills & expertise as ochre badge pills.
 * Features:
 * - Lightbulb icon (ochre color)
 * - Ochre badge pills with verified icons
 * - Add/edit functionality
 */

import { Lightbulb, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { profileColors, iconColors, profileOpacity } from "@/lib/profile-colors";
import type { Skill } from "@/lib/profile-types";

interface SkillsCardProps {
  skills: Skill[];
  onAdd?: () => void;
  onEdit?: () => void;
  editable?: boolean;
}

export function SkillsCard({ skills, onAdd, onEdit, editable = false }: SkillsCardProps) {
  return (
    <Card className="p-6 rounded-xl border-2" style={{ borderColor: profileColors.mutedBg }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b" style={{ borderColor: profileColors.mutedBg }}>
        <Lightbulb className="w-5 h-5" style={{ color: iconColors.skills }} />
        <h3 className="text-lg font-semibold font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
          Skills & Expertise
        </h3>
      </div>

      {/* Skills Badges */}
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill) => (
            <span
              key={skill.id}
              className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1"
              style={{
                backgroundColor: profileOpacity.ochre[10],
                border: `1px solid ${profileColors.ochre}4D`, // 30% opacity
                color: profileColors.ochre,
              }}
            >
              {skill.name}
              {skill.verified && (
                <CheckCircle2 className="w-3 h-3" style={{ color: profileColors.sage }} />
              )}
            </span>
          ))}
        </div>
      ) : null}

      {/* Action Buttons */}
      {editable && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={skills.length > 0 ? onEdit : onAdd}
          style={{ color: iconColors.skills }}
        >
          <Plus className="w-4 h-4" />
          {skills.length > 0 ? 'Edit skills' : 'Add skills'}
        </Button>
      )}

      {!editable && skills.length === 0 && (
        <p className="text-sm italic" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
          No skills added yet
        </p>
      )}
    </Card>
  );
}
