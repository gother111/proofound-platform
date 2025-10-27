"use client";

/**
 * OrganizationProfileView Component
 *
 * Main wrapper for the organization profile page.
 * Much simpler form-based layout compared to individual profiles.
 *
 * Layout:
 * - Max-width 3xl container, centered
 * - Header section
 * - Basic Information form (editable if canEdit)
 * - Organization Details card (read-only)
 */

import { BasicInformationForm } from "./BasicInformationForm";
import { OrganizationDetailsCard } from "./OrganizationDetailsCard";
import { profileColors } from "@/lib/profile-colors";
import type { Organization } from "@/lib/profile-types";

interface OrganizationProfileViewProps {
  organization: Organization;
  canEdit?: boolean;
  onSave?: (data: Partial<Organization>) => void;
}

export function OrganizationProfileView({
  organization,
  canEdit = false,
  onSave,
}: OrganizationProfileViewProps) {
  return (
    <div
      className="min-h-screen pb-12"
      style={{ backgroundColor: profileColors.bgBase }}
    >
      {/* Container */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-semibold mb-2 font-['Crimson_Pro']"
            style={{ color: profileColors.textPrimary }}
          >
            Organization Profile
          </h1>
          <p
            className="text-sm"
            style={{ color: profileColors.textPrimary, opacity: 0.7 }}
          >
            Manage your organization's basic information and settings
          </p>
        </div>

        {/* Basic Information Form */}
        <BasicInformationForm
          organization={organization}
          canEdit={canEdit}
          onSave={onSave}
        />

        {/* Organization Details (Read-only) */}
        <OrganizationDetailsCard organization={organization} />
      </div>
    </div>
  );
}
