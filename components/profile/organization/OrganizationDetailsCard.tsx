"use client";

/**
 * OrganizationDetailsCard Component
 *
 * Read-only display of organization details.
 * Features:
 * - URL slug with help text
 * - Organization type (capitalized)
 * - Simple card layout
 */

import { Card } from "@/components/ui/card";
import { profileColors } from "@/lib/profile-colors";
import type { Organization } from "@/lib/profile-types";

interface OrganizationDetailsCardProps {
  organization: Organization;
}

export function OrganizationDetailsCard({
  organization,
}: OrganizationDetailsCardProps) {
  return (
    <Card
      className="p-6"
      style={{ backgroundColor: profileColors.cardBg }}
    >
      {/* Card Header */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-1 font-['Crimson_Pro']"
          style={{ color: profileColors.textPrimary }}
        >
          Organization Details
        </h2>
        <p
          className="text-xs"
          style={{ color: profileColors.textPrimary, opacity: 0.6 }}
        >
          These details are set by system administrators
        </p>
      </div>

      {/* Details Grid */}
      <div className="space-y-4">
        {/* URL Slug */}
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: profileColors.textPrimary, opacity: 0.8 }}
          >
            URL Slug
          </p>
          <p
            className="text-sm font-mono mb-1"
            style={{ color: profileColors.textPrimary }}
          >
            {organization.slug}
          </p>
          <p
            className="text-xs"
            style={{ color: profileColors.textPrimary, opacity: 0.5 }}
          >
            Your organization's unique identifier in URLs
          </p>
        </div>

        {/* Type */}
        <div>
          <p
            className="text-xs font-medium mb-1"
            style={{ color: profileColors.textPrimary, opacity: 0.8 }}
          >
            Organization Type
          </p>
          <p
            className="text-sm mb-1"
            style={{ color: profileColors.textPrimary }}
          >
            {organization.type.charAt(0).toUpperCase() + organization.type.slice(1)}
          </p>
          <p
            className="text-xs"
            style={{ color: profileColors.textPrimary, opacity: 0.5 }}
          >
            Classification of your organization
          </p>
        </div>
      </div>
    </Card>
  );
}
