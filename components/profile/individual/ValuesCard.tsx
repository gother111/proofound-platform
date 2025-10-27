"use client";

/**
 * ValuesCard Component
 *
 * Displays user's core values with icons and verified badges.
 * Features:
 * - Value items with terracotta icons
 * - Verified badges for confirmed values
 * - Add/edit functionality
 */

import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { profileColors, iconColors } from "@/lib/profile-colors";
import type { Value, ValueIconType } from "@/lib/profile-types";

interface ValuesCardProps {
  values: Value[];
  onAdd?: () => void;
  onEdit?: () => void;
  editable?: boolean;
}

// Icon mapping from string to Lucide component
const getIconComponent = (iconName: ValueIconType) => {
  const icons: Record<ValueIconType, React.ComponentType<any>> = {
    Heart: LucideIcons.Heart,
    Sparkles: LucideIcons.Sparkles,
    Users: LucideIcons.Users,
    Eye: LucideIcons.Eye,
    Target: LucideIcons.Target,
    Shield: LucideIcons.Shield,
    Leaf: LucideIcons.Leaf,
    Lightbulb: LucideIcons.Lightbulb,
    HandHeart: LucideIcons.HandHeart,
  };
  return icons[iconName] || LucideIcons.Heart;
};

export function ValuesCard({ values, onAdd, onEdit, editable = false }: ValuesCardProps) {
  return (
    <Card className="p-6 rounded-xl border-2" style={{ borderColor: profileColors.mutedBg }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b" style={{ borderColor: profileColors.mutedBg }}>
        <LucideIcons.Heart className="w-5 h-5" style={{ color: iconColors.values }} />
        <h3 className="text-lg font-semibold font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
          Core Values
        </h3>
      </div>

      {/* Values List */}
      {values.length > 0 ? (
        <div className="space-y-2 mb-4">
          {values.map((value) => {
            const IconComponent = getIconComponent(value.icon);
            return (
              <div
                key={value.id}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ backgroundColor: `${iconColors.values}14` }} // ~8% opacity
              >
                <IconComponent className="w-4 h-4" style={{ color: iconColors.values }} />
                <span className="text-sm flex-1" style={{ color: profileColors.textPrimary }}>
                  {value.label}
                </span>
                {value.verified && (
                  <LucideIcons.CheckCircle2 className="w-4 h-4" style={{ color: profileColors.sage }} />
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Action Buttons */}
      {editable && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={values.length > 0 ? onEdit : onAdd}
          style={{ color: iconColors.values }}
        >
          <LucideIcons.Plus className="w-4 h-4" />
          {values.length > 0 ? 'Edit your values' : 'Define your values'}
        </Button>
      )}

      {!editable && values.length === 0 && (
        <p className="text-sm italic" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
          No values added yet
        </p>
      )}
    </Card>
  );
}
