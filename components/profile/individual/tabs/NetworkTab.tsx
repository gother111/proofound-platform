"use client";

/**
 * NetworkTab Component
 *
 * Displays network statistics and visualization option.
 * Features:
 * - Network icon header
 * - Three stat cards (People, Organizations, Institutions)
 * - "Visualize Network Graph" button
 * - Help text below button
 */

import { Network, User, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { profileColors } from "@/lib/profile-colors";
import type { NetworkStats } from "@/lib/profile-types";

interface NetworkTabProps {
  stats?: NetworkStats;
  onVisualize?: () => void;
}

export function NetworkTab({ stats, onVisualize }: NetworkTabProps) {
  const networkStats = stats || { people: 0, organizations: 0, institutions: 0 };

  return (
    <div className="text-center py-8 px-4">
      {/* Header Icon */}
      <div
        className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
        style={{ backgroundColor: `${profileColors.sage}1A` }} // 10% opacity
      >
        <Network className="w-8 h-8" style={{ color: profileColors.sage }} />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold mb-2 font-['Crimson_Pro']" style={{ color: profileColors.textPrimary }}>
        Living Network
      </h2>

      {/* Description */}
      <p className="text-sm max-w-2xl mx-auto mb-6" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
        Your network represents the people, organizations, and institutions you've worked with and learned from throughout your journey.
      </p>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 max-w-3xl mx-auto">
        {/* People */}
        <Card className="p-4 text-center" style={{ backgroundColor: `${profileColors.sage}0D` }}> {/* 5% opacity */}
          <User className="w-6 h-6 mx-auto mb-2" style={{ color: profileColors.sage }} />
          <p className="text-xs mb-1" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
            People
          </p>
          <p className="text-2xl font-semibold mb-1" style={{ color: profileColors.textPrimary }}>
            {networkStats.people}
          </p>
          <p className="text-xs" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
            Active connections
          </p>
        </Card>

        {/* Organizations */}
        <Card className="p-4 text-center" style={{ backgroundColor: `${profileColors.terracotta}0D` }}> {/* 5% opacity */}
          <Briefcase className="w-6 h-6 mx-auto mb-2" style={{ color: profileColors.terracotta }} />
          <p className="text-xs mb-1" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
            Organizations
          </p>
          <p className="text-2xl font-semibold mb-1" style={{ color: profileColors.textPrimary }}>
            {networkStats.organizations}
          </p>
          <p className="text-xs" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
            Active connections
          </p>
        </Card>

        {/* Institutions */}
        <Card className="p-4 text-center" style={{ backgroundColor: `${profileColors.teal}1A` }}> {/* 10% opacity */}
          <GraduationCap className="w-6 h-6 mx-auto mb-2" style={{ color: profileColors.teal }} />
          <p className="text-xs mb-1" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
            Institutions
          </p>
          <p className="text-2xl font-semibold mb-1" style={{ color: profileColors.textPrimary }}>
            {networkStats.institutions}
          </p>
          <p className="text-xs" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
            Active connections
          </p>
        </Card>
      </div>

      {/* Visualize Button */}
      <Button
        onClick={onVisualize}
        className="rounded-full text-white px-6"
        style={{ backgroundColor: profileColors.sage }}
      >
        <Network className="w-4 h-4 mr-2" />
        Visualize Network Graph
      </Button>

      {/* Help Text */}
      <p className="text-xs mt-3" style={{ color: profileColors.textPrimary, opacity: 0.6 }}>
        See how your connections form a living map of your professional journey
      </p>
    </div>
  );
}
