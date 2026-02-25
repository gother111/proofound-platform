import { Edit3, Eye, Leaf, Plus, Sparkles, Target } from 'lucide-react';

import { CausesCard } from '@/components/profile/CausesCard';
import { MissionCard } from '@/components/profile/MissionCard';
import { ValuesCard } from '@/components/profile/ValuesCard';
import { VisionCard } from '@/components/profile/VisionCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { ProfileData } from '@/types/profile';

type ProfileSidebarProps = {
  profile: ProfileData;
  onOpenMission: () => void;
  onOpenVision: () => void;
  onOpenValues: () => void;
  onOpenCauses: () => void;
};

export function ProfileSidebar({
  profile,
  onOpenMission,
  onOpenVision,
  onOpenValues,
  onOpenCauses,
}: ProfileSidebarProps) {
  return (
    <div className="space-y-6">
      <div
        role="button"
        tabIndex={0}
        onClick={onOpenMission}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenMission();
          }
        }}
        className="cursor-pointer"
      >
        {profile.mission ? (
          <MissionCard mission={profile.mission} />
        ) : (
          <Card className="p-6 rounded-3xl border-2 border-dashed border-[#7A9278]/30 bg-[#7A9278]/5 hover:bg-[#7A9278]/10 hover:border-[#7A9278]/50 hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7A9278]/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 mb-4 relative">
              <div className="p-2 rounded-xl bg-[#7A9278]/10 group-hover/card:bg-[#7A9278]/20 transition-colors">
                <Target className="w-4 h-4 text-[#7A9278]" />
              </div>
              <h3 className="font-display font-medium">Mission</h3>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4 relative">
              What drives your work? Share the change you want to create in the world.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs rounded-xl hover:bg-[#7A9278]/20 text-[#7A9278] relative"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add your mission
            </Button>
          </Card>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpenVision}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenVision();
          }
        }}
        className="cursor-pointer"
      >
        {profile.vision ? (
          <VisionCard vision={profile.vision} />
        ) : (
          <Card className="p-6 rounded-3xl border-2 border-dashed border-[#7A9278]/30 bg-[#7A9278]/5 hover:bg-[#7A9278]/10 hover:border-[#7A9278]/50 hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7A9278]/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 mb-4 relative">
              <div className="p-2 rounded-xl bg-[#7A9278]/10 group-hover/card:bg-[#7A9278]/20 transition-colors">
                <Eye className="w-4 h-4 text-[#7A9278]" />
              </div>
              <h3 className="font-display font-medium">Vision</h3>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4 relative">
              Where do you see yourself in the future? Describe your long-term aspirations.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs rounded-xl hover:bg-[#7A9278]/20 text-[#7A9278] relative"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add your vision
            </Button>
          </Card>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpenValues}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenValues();
          }
        }}
        className="cursor-pointer"
      >
        {profile.values.length > 0 ? (
          <ValuesCard values={profile.values} />
        ) : (
          <Card className="p-6 rounded-3xl border-2 border-dashed border-[#C67B5C]/30 bg-[#C67B5C]/5 hover:bg-[#C67B5C]/10 hover:border-[#C67B5C]/50 hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#C67B5C]/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 mb-4 relative">
              <div className="p-2 rounded-xl bg-[#C67B5C]/10 group-hover/card:bg-[#C67B5C]/20 transition-colors">
                <Sparkles className="w-4 h-4 text-[#C67B5C]" />
              </div>
              <h3 className="font-display font-medium">Core Values</h3>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4 relative">
              The principles that guide your decisions and actions.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs rounded-xl hover:bg-[#C67B5C]/20 text-[#C67B5C] relative"
            >
              <Plus className="w-3 h-3 mr-2" />
              Define your values
            </Button>
          </Card>
        )}
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={onOpenCauses}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpenCauses();
          }
        }}
        className="cursor-pointer"
      >
        {profile.causes.length > 0 ? (
          <CausesCard causes={profile.causes} />
        ) : (
          <Card className="p-6 rounded-3xl border-2 border-dashed border-[#5C8B89]/30 bg-[#5C8B89]/5 hover:bg-[#5C8B89]/10 hover:border-[#5C8B89]/50 hover:-translate-y-1 transition-all duration-300 group/card relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5C8B89]/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-2 mb-4 relative">
              <div className="p-2 rounded-xl bg-[#5C8B89]/10 group-hover/card:bg-[#5C8B89]/20 transition-colors">
                <Leaf className="w-4 h-4 text-[#5C8B89]" />
              </div>
              <h3 className="font-display font-medium">Causes I Support</h3>
            </div>
            <p className="text-sm text-muted-foreground/80 leading-relaxed italic mb-4 relative">
              The issues and movements you&apos;re passionate about.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs rounded-xl hover:bg-[#5C8B89]/20 text-[#5C8B89] relative"
            >
              <Plus className="w-3 h-3 mr-2" />
              Add causes
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
