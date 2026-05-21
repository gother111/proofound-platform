import { Calendar, Edit3, Eye, EyeOff, MapPin, Share2 } from 'lucide-react';
import { FastAverageColor } from 'fast-average-color';
import { useEffect, useState } from 'react';

import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import type { ProfileData } from '@/types/profile';

type PendingState = {
  updatingBasicInfo: boolean;
  redactMode: boolean;
};

type ProfileHeroSectionProps = {
  profile: ProfileData;
  isPending: boolean;
  pending: PendingState;
  onEditProfile: () => void;
  onToggleRedact: (enabled: boolean) => void;
  onShare: () => void;
  onUpdateBasicInfo: (updates: { avatar?: string }) => void;
};

export function ProfileHeroSection({
  profile,
  isPending,
  pending,
  onEditProfile,
  onToggleRedact,
  onShare,
  onUpdateBasicInfo,
}: ProfileHeroSectionProps) {
  const [dominantColor, setDominantColor] = useState<string>('rgba(122, 146, 120, 0.15)');

  useEffect(() => {
    if (profile.basicInfo.avatar) {
      const fac = new FastAverageColor();
      // Use a timeout or handle CORS if it's an external URL.
      // fast-average-color handles Base64 naturally.
      fac
        .getColorAsync(profile.basicInfo.avatar, { ignoredColor: [255, 255, 255, 255, 20] }) // ignore pure white
        .then((color) => {
          setDominantColor(`rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.15)`);
        })
        .catch((e) => {
          dispatchClientErrorDiagnostic('profile.hero.average_color_failed', e);
        });
    }
  }, [profile.basicInfo.avatar]);

  return (
    <div className="relative">
      {/* Ambient Glow */}
      <div
        className="absolute top-[40px] left-1/2 -translate-x-1/2 w-full max-w-4xl h-[320px] blur-[120px] pointer-events-none z-0 transition-colors duration-1000 rounded-full"
        style={{ backgroundColor: dominantColor }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative py-4 sm:py-8">
          <Card className="p-4 sm:p-6 md:p-8 border border-white/40 dark:border-stone-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-white/70 dark:bg-stone-900/60 backdrop-blur-md rounded-3xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#7A9278] via-[#E0D5C7] to-[#C9A57B]" />
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start mt-2">
              <AvatarUpload
                avatar={profile.basicInfo.avatar}
                onUpload={(base64) => onUpdateBasicInfo({ avatar: base64 })}
              />

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-display font-semibold hidden sm:block">
                    {profile.basicInfo.name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEditProfile}
                    className="h-8"
                    disabled={pending.updatingBasicInfo || isPending}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant={profile.redactMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onToggleRedact(!profile.redactMode)}
                    className={`h-8 gap-1.5 ${
                      profile.redactMode
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    disabled={pending.redactMode || isPending}
                    title={
                      profile.redactMode
                        ? 'Redact mode is ON - Your profile is hidden from viewers'
                        : 'Turn on redact mode to hide your profile temporarily'
                    }
                  >
                    {profile.redactMode ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span className="text-xs">Hidden</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span className="text-xs">Visible</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onShare}
                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                    title="Share your profile"
                  >
                    <Share2 className="w-3 h-3" />
                    <span className="text-xs">Share</span>
                  </Button>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                  {profile.basicInfo.location ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.basicInfo.location}
                    </span>
                  ) : (
                    <button
                      onClick={onEditProfile}
                      className="flex items-center gap-1 hover:text-[#7A9278] transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Add location
                    </button>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {profile.basicInfo.joinedDate}
                  </span>
                </div>

                {profile.basicInfo.tagline ? (
                  <p className="text-base text-foreground mb-4 max-w-3xl">
                    {profile.basicInfo.tagline}
                  </p>
                ) : (
                  <button
                    onClick={onEditProfile}
                    className="w-full text-left p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-[#7A9278]/40 transition-colors group/tagline mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <Edit3 className="w-4 h-4 text-muted-foreground/60 mt-1 group-hover/tagline:text-[#7A9278]" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Add a tagline</p>
                        <p className="text-xs text-muted-foreground">
                          A brief statement that captures who you are and what you care about
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
