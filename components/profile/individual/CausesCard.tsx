"use client";

/**
 * CausesCard Component
 *
 * Displays causes the user supports as teal badge pills.
 * Features:
 * - Sparkles icon (teal color)
 * - Teal badge pills in flex wrap layout
 * - Add/edit functionality
 */

import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { profileColors, iconColors, profileOpacity } from "@/lib/profile-colors";

interface CausesCardProps {
  causes: string[];
  onAdd?: () => void;
  onEdit?: () => void;
  editable?: boolean;
}

export function CausesCard({ causes, onAdd, onEdit, editable = false }: CausesCardProps) {
  return (
    <Card className="p-6 rounded-xl border-2" style={{ borderColor: profileColors.mutedBg }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b" style={{ borderColor: profileColors.mutedBg }}>
        <Sparkles className="w-5 h-5" style={{ color: iconColors.causes }} />
        <h3 className="text-lg font-semibold font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
          Causes I Support
        </h3>
      </div>

      {/* Causes Badges */}
      {causes.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {causes.map((cause, index) => (
            <span
              key={index}
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: profileOpacity.teal[10],
                border: `1px solid ${profileColors.teal}4D`, // 30% opacity
                color: profileColors.teal,
              }}
            >
              {cause}
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
          onClick={causes.length > 0 ? onEdit : onAdd}
          style={{ color: iconColors.causes }}
        >
          <Plus className="w-4 h-4" />
          {causes.length > 0 ? 'Edit causes' : 'Add causes'}
        </Button>
      )}

      {!editable && causes.length === 0 && (
        <p className="text-sm italic" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
          No causes added yet
        </p>
      )}
    </Card>
  );
}
