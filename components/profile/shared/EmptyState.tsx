/**
 * EmptyState Component
 *
 * Reusable empty state for all profile tabs.
 * Features:
 * - Custom SVG icon
 * - Title and description
 * - Action button
 * - Optional tip
 */

import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { profileColors } from "@/lib/profile-colors";

interface EmptyStateProps {
  icon: React.ReactNode;           // SVG or icon component
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  tip?: string;
  buttonStyle?: React.CSSProperties;
}

export function EmptyState({
  icon,
  title,
  description,
  buttonText,
  onButtonClick,
  tip,
  buttonStyle,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {/* Icon Container */}
      <div
        className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(122, 146, 120, 0.1), rgba(92, 139, 137, 0.1))`,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold mb-2 font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm max-w-md mx-auto mb-6" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
        {description}
      </p>

      {/* Action Button */}
      <Button
        onClick={onButtonClick}
        className="rounded-full text-white px-6 focus-visible:ring-2 focus-visible:ring-offset-2"
        style={buttonStyle || { backgroundColor: profileColors.sage }}
        aria-label={buttonText}
      >
        {buttonText}
      </Button>

      {/* Tip */}
      {tip && (
        <p className="text-xs mt-4 flex items-center justify-center gap-1" style={{ color: profileColors.ochre }} role="note">
          <Lightbulb className="w-3 h-3" aria-hidden="true" />
          {tip}
        </p>
      )}
    </div>
  );
}
