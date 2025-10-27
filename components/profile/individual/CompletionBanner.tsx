"use client";

/**
 * CompletionBanner Component
 *
 * Displays profile completion progress with motivational messaging.
 * Only shows when profile completion < 80%.
 *
 * Features:
 * - Animated fade-in from top
 * - Progress bar with percentage
 * - Quick tip to guide users
 * - Gradient background (sage → teal)
 */

import { motion } from "framer-motion";
import { Sparkles, Compass } from "lucide-react";
import { profileColors, profileOpacity } from "@/lib/profile-colors";

interface CompletionBannerProps {
  completion: number;              // 0-100 percentage
}

export function CompletionBanner({ completion }: CompletionBannerProps) {
  // Don't show if 80% or more complete
  if (completion >= 80) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 rounded-xl border-2 mb-8"
      style={{
        borderColor: profileOpacity.sage[30],
        backgroundImage: `linear-gradient(to right, ${profileOpacity.sage[5]}, ${profileColors.bgBase}, ${profileOpacity.teal[10]})`,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: profileOpacity.sage[10] }}
        >
          <Sparkles className="w-6 h-6" style={{ color: profileColors.sage }} />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Title and Percentage */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
              Welcome to Proofound!
            </h3>
            <span className="text-sm font-medium" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
              {completion}% complete
            </span>
          </div>

          {/* Description */}
          <p className="text-sm mb-3" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
            Your profile is a space to share your impact, values, and growth journey. Add meaningful context to help others understand who you are and what you care about.
          </p>

          {/* Progress Bar */}
          <div
            className="h-2 rounded-full mb-3 overflow-hidden"
            style={{ backgroundColor: profileColors.mutedBg }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: profileColors.sage }}
              initial={{ width: 0 }}
              animate={{ width: `${completion}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>

          {/* Tip */}
          <p className="text-xs flex items-center gap-1" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
            <Compass className="w-3 h-3" />
            <span>Start by adding a photo, tagline, and your mission</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
