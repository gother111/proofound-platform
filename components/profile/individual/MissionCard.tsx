"use client";

/**
 * MissionCard Component
 *
 * Displays user's mission statement with edit capability.
 * Features:
 * - Target icon (sage color)
 * - Mission text or empty state
 * - Edit button for adding/updating mission
 */

import { useState } from "react";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { profileColors, iconColors } from "@/lib/profile-colors";

interface MissionCardProps {
  mission: string | null;
  onSave?: (mission: string) => void;
  editable?: boolean;
}

export function MissionCard({ mission, onSave, editable = false }: MissionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [missionText, setMissionText] = useState(mission || "");

  const handleSave = () => {
    if (onSave) {
      onSave(missionText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setMissionText(mission || "");
    setIsEditing(false);
  };

  return (
    <Card className="p-6 rounded-xl border-2" style={{ borderColor: profileColors.mutedBg }}>
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b" style={{ borderColor: profileColors.mutedBg }}>
        <Target className="w-5 h-5" style={{ color: iconColors.mission }} />
        <h3 className="text-lg font-semibold font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
          Mission
        </h3>
      </div>

      {isEditing ? (
        <div>
          <textarea
            value={missionText}
            onChange={(e) => setMissionText(e.target.value)}
            className="w-full p-3 text-sm rounded-lg border-2 outline-none resize-none leading-relaxed"
            style={{
              borderColor: profileColors.sage,
              color: profileColors.textPrimary,
              backgroundColor: profileColors.cardBg,
            }}
            rows={5}
            placeholder="What drives your work? Share the change you want to create in the world..."
            maxLength={2000}
            autoFocus
          />
          <p className="text-xs mt-1 mb-3" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
            {missionText.length}/2000 characters
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="text-white"
              style={{ backgroundColor: profileColors.sage }}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : mission ? (
        <div className="group">
          <p className="text-sm leading-relaxed" style={{ color: profileColors.textPrimary, opacity: 0.9 }}>
            {mission}
          </p>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setIsEditing(true)}
            >
              Edit mission
            </Button>
          )}
        </div>
      ) : editable ? (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full p-4 rounded-lg border-2 border-dashed text-left transition-colors hover:border-opacity-60"
          style={{
            borderColor: `${profileColors.textPrimary}33`, // 20% opacity
          }}
        >
          <div className="flex items-start gap-2">
            <Target className="w-5 h-5 mt-0.5" style={{ color: iconColors.mission, opacity: 0.6 }} />
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: profileColors.textPrimary, opacity: 0.8 }}>
                Add your mission
              </p>
              <p className="text-xs italic" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
                What drives your work? Share the change you want to create in the world.
              </p>
            </div>
          </div>
        </button>
      ) : (
        <p className="text-sm italic" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
          No mission statement yet
        </p>
      )}
    </Card>
  );
}
