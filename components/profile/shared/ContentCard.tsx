"use client";

/**
 * ContentCard Component
 *
 * Base card component for Impact Stories, Experiences, Education, and Volunteering.
 * Features:
 * - Icon container
 * - Title with verified badge
 * - Metadata (organization, timeline)
 * - Content sections
 * - Delete button on hover (edit mode)
 * - Hover border effect
 */

import { useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerifiedBadge } from "./VerifiedBadge";
import { profileColors } from "@/lib/profile-colors";

interface ContentCardProps {
  icon: React.ReactNode;           // Icon element
  iconColor: string;               // Icon background color
  title: string;
  verified?: boolean | null;
  organization?: string;
  timeline?: string;
  children: React.ReactNode;       // Content sections
  onDelete?: () => void;           // Delete handler (shows delete button if provided)
}

export function ContentCard({
  icon,
  iconColor,
  title,
  verified,
  organization,
  timeline,
  children,
  onDelete,
}: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className="relative group p-6 border-2"
        style={{
          borderColor: isHovered ? `${profileColors.sage}4D` : profileColors.mutedBg,
          transition: 'border-color 0.3s ease',
        }}
      >
        {/* Delete Button (Edit Mode) */}
        {onDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label={`Delete ${title}`}
              className="focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Delete {title}</span>
            </Button>
          </motion.div>
        )}

      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}33` }} // 20% opacity
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold font-['Crimson_Pro'] mb-1" style={{ color: profileColors.textPrimary }}>
                {title}
              </h3>
              {organization && (
                <p className="text-sm mb-1" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
                  {organization}
                </p>
              )}
              {timeline && (
                <p className="text-xs flex items-center gap-1" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
                  {timeline}
                </p>
              )}
            </div>
            {verified && <VerifiedBadge size="sm" />}
          </div>

          {/* Content Sections */}
          <div className="space-y-4 mt-4">
            {children}
          </div>
        </div>
      </div>
    </Card>
    </motion.div>
  );
}

/**
 * ContentSection Component
 *
 * Reusable section within a content card.
 */
interface ContentSectionProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  highlighted?: boolean;           // Use highlighted styling
  highlightColor?: string;
}

export function ContentSection({
  label,
  icon,
  children,
  highlighted = false,
  highlightColor,
}: ContentSectionProps) {
  const containerStyle = highlighted
    ? {
        backgroundColor: highlightColor ? `${highlightColor}0D` : profileColors.mutedBg, // 5% opacity
        border: `1px solid ${highlightColor ? `${highlightColor}33` : profileColors.mutedBg}`, // 20% opacity
        padding: '1rem',
        borderRadius: '0.75rem',
      }
    : {};

  return (
    <div style={containerStyle}>
      <div className="flex items-center gap-1 mb-2">
        {icon}
        <span className="text-xs font-medium" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
          {label}
        </span>
      </div>
      <p className="text-sm" style={{ color: profileColors.textPrimary }}>
        {children}
      </p>
    </div>
  );
}
