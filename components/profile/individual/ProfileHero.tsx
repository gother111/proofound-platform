"use client";

/**
 * ProfileHero Component
 *
 * Top section of the individual profile featuring:
 * - Cover image with gradient default
 * - Avatar (128x128px, overlapping cover)
 * - Name, location, joined date
 * - Tagline (editable or placeholder)
 * - Edit button
 */

import { useState } from "react";
import { MapPin, Calendar, Edit3, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "../shared/ProfileAvatar";
import { profileColors, coverGradient } from "@/lib/profile-colors";
import type { BasicInfo } from "@/lib/profile-types";

interface ProfileHeroProps {
  basicInfo: BasicInfo;
  onEdit?: () => void;
  onAvatarUpload?: (file: File) => void;
  onCoverUpload?: (file: File) => void;
  onTaglineSave?: (tagline: string) => void;
  editable?: boolean;
}

export function ProfileHero({
  basicInfo,
  onEdit,
  onAvatarUpload,
  onCoverUpload,
  onTaglineSave,
  editable = false,
}: ProfileHeroProps) {
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [tagline, setTagline] = useState(basicInfo.tagline || "");

  const handleTaglineSave = () => {
    if (onTaglineSave) {
      onTaglineSave(tagline);
    }
    setIsEditingTagline(false);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onCoverUpload) {
      onCoverUpload(file);
    }
  };

  return (
    <div className="mb-8">
      {/* Cover Image */}
      <div className="relative group">
        <div
          className="w-full h-48 rounded-t-xl"
          style={{
            background: basicInfo.coverImage
              ? `url(${basicInfo.coverImage}) center/cover`
              : coverGradient.background,
            backgroundImage: basicInfo.coverImage
              ? undefined
              : `${coverGradient.background}, ${coverGradient.stripes}`,
          }}
        />
        {editable && onCoverUpload && (
          <label
            htmlFor="cover-upload"
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-t-xl"
          >
            <div className="text-center text-white">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium">
                {basicInfo.coverImage ? "Change Cover" : "Add Cover"}
              </span>
            </div>
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              aria-label="Upload cover image"
            />
          </label>
        )}
      </div>

      {/* Profile Header Card */}
      <Card
        className="p-6 -mt-16 border-2"
        style={{
          borderColor: profileColors.mutedBg,
          backgroundColor: profileColors.cardBg,
        }}
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="mx-auto sm:mx-0">
            <ProfileAvatar
              src={basicInfo.avatar}
              alt={basicInfo.name}
              size={128}
              editable={editable}
              onUpload={onAvatarUpload}
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            {/* Name and Edit Button */}
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
              <h1
                className="text-3xl font-semibold font-['Crimson_Pro']"
                style={{ color: profileColors.textPrimary }}
              >
                {basicInfo.name}
              </h1>
              {editable && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={onEdit}
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Metadata (Location & Joined Date) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4 text-sm" style={{ color: profileColors.textPrimary, opacity: 0.7 }}>
              {basicInfo.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {basicInfo.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {basicInfo.joinedDate}
              </span>
            </div>

            {/* Tagline */}
            {isEditingTagline ? (
              <div className="max-w-3xl">
                <textarea
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full p-3 text-base rounded-xl border-2 outline-none resize-none"
                  style={{
                    borderColor: profileColors.sage,
                    color: profileColors.textPrimary,
                    backgroundColor: profileColors.cardBg,
                  }}
                  rows={2}
                  placeholder="Add a tagline that captures who you are..."
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleTaglineSave}
                    className="text-white"
                    style={{ backgroundColor: profileColors.sage }}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setTagline(basicInfo.tagline || "");
                      setIsEditingTagline(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : basicInfo.tagline ? (
              <div className="group">
                <p
                  className="text-base max-w-3xl mb-4"
                  style={{ color: profileColors.textPrimary }}
                >
                  {basicInfo.tagline}
                </p>
                {editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingTagline(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit3 className="w-3 h-3 mr-1" />
                    Edit tagline
                  </Button>
                )}
              </div>
            ) : editable ? (
              <button
                onClick={() => setIsEditingTagline(true)}
                className="w-full max-w-3xl p-4 rounded-xl border-2 border-dashed text-left transition-colors hover:border-opacity-60"
                style={{
                  borderColor: `${profileColors.textPrimary}33`, // 20% opacity
                }}
              >
                <div className="flex items-center gap-2">
                  <Edit3
                    className="w-4 h-4"
                    style={{ color: profileColors.textPrimary, opacity: 0.6 }}
                  />
                  <span
                    className="text-sm italic"
                    style={{ color: profileColors.textPrimary, opacity: 0.6 }}
                  >
                    Add a tagline that captures who you are and what you care about
                  </span>
                </div>
              </button>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
