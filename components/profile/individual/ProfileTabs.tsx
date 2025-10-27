"use client";

/**
 * ProfileTabs Component
 *
 * Tab navigation for individual profile content.
 * Features:
 * - 5 equal-width columns
 * - Icons + text (text hidden on mobile)
 * - Color-coded tabs
 * - Rounded-full background
 * - Active state styling
 */

import { Target, Briefcase, GraduationCap, HandHeart, Network } from "lucide-react";
import { motion } from "framer-motion";
import { profileColors, tabThemes } from "@/lib/profile-colors";
import type { ProfileTab } from "@/lib/profile-types";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs = [
  { id: 'impact' as ProfileTab, label: 'Impact', Icon: Target, theme: tabThemes.impact },
  { id: 'journey' as ProfileTab, label: 'Journey', Icon: Briefcase, theme: tabThemes.journey },
  { id: 'learning' as ProfileTab, label: 'Learning', Icon: GraduationCap, theme: tabThemes.learning },
  { id: 'service' as ProfileTab, label: 'Service', Icon: HandHeart, theme: tabThemes.service },
  { id: 'network' as ProfileTab, label: 'Network', Icon: Network, theme: tabThemes.network },
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Profile sections"
      className="grid grid-cols-5 gap-1 p-1 rounded-full mb-6"
      style={{ backgroundColor: `${profileColors.mutedBg}4D` }} // 30% opacity
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.Icon;

        return (
          <motion.button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tab.id}-panel`}
            aria-label={`${tab.label} tab`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(tab.id);
              }
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 rounded-full text-xs sm:text-sm font-medium relative focus-visible:ring-2 focus-visible:ring-offset-2 outline-none"
            style={{
              backgroundColor: isActive ? profileColors.cardBg : 'transparent',
              color: isActive ? tab.theme.color : profileColors.textPrimary,
              opacity: isActive ? 1 : 0.7,
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden sr-only">{tab.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
