"use client";

/**
 * BasicInformationForm Component
 *
 * Editable form for organization basic information.
 * Features:
 * - 4 fields: displayName, legalName, mission (textarea), website
 * - Character limits and validation
 * - Save Changes button (conditional on canEdit)
 * - Field labels and help text
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { profileColors } from "@/lib/profile-colors";
import type { Organization } from "@/lib/profile-types";

interface BasicInformationFormProps {
  organization: Organization;
  canEdit?: boolean;
  onSave?: (data: Partial<Organization>) => void;
}

export function BasicInformationForm({
  organization,
  canEdit = false,
  onSave,
}: BasicInformationFormProps) {
  const [displayName, setDisplayName] = useState(organization.displayName);
  const [legalName, setLegalName] = useState(organization.legalName || "");
  const [mission, setMission] = useState(organization.mission || "");
  const [website, setWebsite] = useState(organization.website || "");

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: string) => {
    setHasChanges(true);
    switch (field) {
      case "displayName":
        setDisplayName(value);
        break;
      case "legalName":
        setLegalName(value);
        break;
      case "mission":
        setMission(value);
        break;
      case "website":
        setWebsite(value);
        break;
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        displayName,
        legalName,
        mission,
        website,
      });
      setHasChanges(false);
    }
  };

  return (
    <Card
      className="p-6 mb-6"
      style={{ backgroundColor: profileColors.cardBg }}
    >
      {/* Card Header */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-1 font-['Crimson_Pro']"
          style={{ color: profileColors.textPrimary }}
        >
          Basic Information
        </h2>
        <p
          className="text-xs"
          style={{ color: profileColors.textPrimary, opacity: 0.6 }}
        >
          Update your organization's public-facing information
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Display Name */}
        <div>
          <Label
            htmlFor="displayName"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: profileColors.textPrimary, opacity: 0.8 }}
          >
            Display Name *
          </Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => handleChange("displayName", e.target.value)}
            disabled={!canEdit}
            maxLength={100}
            placeholder="Your Organization Name"
            className="text-sm"
            style={{
              backgroundColor: canEdit ? "white" : profileColors.mutedBg,
              borderColor: `${profileColors.textPrimary}26`, // 15% opacity
              color: profileColors.textPrimary,
            }}
          />
          <p
            className="text-xs mt-1"
            style={{ color: profileColors.textPrimary, opacity: 0.5 }}
          >
            How your organization appears publicly
          </p>
        </div>

        {/* Legal Name */}
        <div>
          <Label
            htmlFor="legalName"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: profileColors.textPrimary, opacity: 0.8 }}
          >
            Legal Name
          </Label>
          <Input
            id="legalName"
            value={legalName}
            onChange={(e) => handleChange("legalName", e.target.value)}
            disabled={!canEdit}
            maxLength={100}
            placeholder="Official registered name"
            className="text-sm"
            style={{
              backgroundColor: canEdit ? "white" : profileColors.mutedBg,
              borderColor: `${profileColors.textPrimary}26`,
              color: profileColors.textPrimary,
            }}
          />
          <p
            className="text-xs mt-1"
            style={{ color: profileColors.textPrimary, opacity: 0.5 }}
          >
            Official registered name (if different)
          </p>
        </div>

        {/* Mission */}
        <div>
          <Label
            htmlFor="mission"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: profileColors.textPrimary, opacity: 0.8 }}
          >
            Mission Statement
          </Label>
          <Textarea
            id="mission"
            value={mission}
            onChange={(e) => handleChange("mission", e.target.value)}
            disabled={!canEdit}
            maxLength={2000}
            placeholder="Describe your organization's mission and purpose..."
            className="text-sm resize-none"
            style={{
              minHeight: "120px",
              backgroundColor: canEdit ? "white" : profileColors.mutedBg,
              borderColor: `${profileColors.textPrimary}26`,
              color: profileColors.textPrimary,
            }}
          />
          <div className="flex items-center justify-between mt-1">
            <p
              className="text-xs"
              style={{ color: profileColors.textPrimary, opacity: 0.5 }}
            >
              What drives your organization's work
            </p>
            <p
              className="text-xs"
              style={{ color: profileColors.textPrimary, opacity: 0.5 }}
            >
              {mission.length}/2000
            </p>
          </div>
        </div>

        {/* Website */}
        <div>
          <Label
            htmlFor="website"
            className="text-xs font-medium mb-1.5 block"
            style={{ color: profileColors.textPrimary, opacity: 0.8 }}
          >
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={website}
            onChange={(e) => handleChange("website", e.target.value)}
            disabled={!canEdit}
            maxLength={200}
            placeholder="https://yourorganization.com"
            className="text-sm"
            style={{
              backgroundColor: canEdit ? "white" : profileColors.mutedBg,
              borderColor: `${profileColors.textPrimary}26`,
              color: profileColors.textPrimary,
            }}
          />
          <p
            className="text-xs mt-1"
            style={{ color: profileColors.textPrimary, opacity: 0.5 }}
          >
            Your organization's website URL
          </p>
        </div>
      </div>

      {/* Save Button */}
      {canEdit && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: `${profileColors.textPrimary}1A` }}>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="rounded-full text-white px-6"
            style={{
              backgroundColor: hasChanges ? profileColors.sage : profileColors.mutedBg,
              opacity: hasChanges ? 1 : 0.5,
            }}
          >
            Save Changes
          </Button>
        </div>
      )}
    </Card>
  );
}
