"use client";

/**
 * ProfileAvatar Component
 *
 * Displays user avatar with exact specifications:
 * - 128x128px size
 * - 4px white border
 * - 2px sage ring with offset
 * - Shadow
 * - Default user icon when no avatar
 * - Optional upload functionality
 */

import { User } from "lucide-react";
import { profileColors } from "@/lib/profile-colors";

interface ProfileAvatarProps {
  src?: string | null;
  alt?: string;
  size?: number;                     // Default 128px
  onUpload?: (file: File) => void;   // Optional upload handler
  editable?: boolean;                // Show upload UI
}

export function ProfileAvatar({
  src,
  alt = "Profile avatar",
  size = 128,
  onUpload,
  editable = false,
}: ProfileAvatarProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="relative inline-block">
      <div
        className="relative rounded-full ring-2 ring-offset-2 shadow-lg overflow-hidden"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          border: '4px solid white',
          ringColor: profileColors.sage,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: profileColors.bgBase }}
          >
            <User
              className="w-12 h-12"
              style={{ color: profileColors.sage }}
            />
          </div>
        )}
      </div>

      {editable && (
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110 focus-within:ring-2 focus-within:ring-offset-2"
          style={{ backgroundColor: profileColors.sage }}
          aria-label="Upload profile picture"
        >
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Choose profile picture file"
          />
          <User className="w-5 h-5 text-white" aria-hidden="true" />
        </label>
      )}
    </div>
  );
}
