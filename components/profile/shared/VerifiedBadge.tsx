/**
 * VerifiedBadge Component
 *
 * Small badge with checkmark icon to indicate verified content.
 * Uses sage color scheme from design spec.
 */

import { CheckCircle2 } from "lucide-react";
import { profileColors, profileOpacity } from "@/lib/profile-colors";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: "w-3 h-3",
    padding: "px-2 py-0.5",
    text: "text-xs",
  },
  md: {
    icon: "w-4 h-4",
    padding: "px-2 py-1",
    text: "text-xs",
  },
  lg: {
    icon: "w-5 h-5",
    padding: "px-3 py-1",
    text: "text-sm",
  },
};

export function VerifiedBadge({ size = "sm", className = "" }: VerifiedBadgeProps) {
  const config = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${config.padding} ${config.text} font-medium ${className}`}
      style={{
        backgroundColor: profileOpacity.sage[10],
        border: `1px solid ${profileOpacity.sage[30]}`,
        color: profileColors.sage,
      }}
    >
      <CheckCircle2 className={config.icon} />
      <span>Verified</span>
    </span>
  );
}
