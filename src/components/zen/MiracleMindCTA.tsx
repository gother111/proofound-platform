'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, ShieldCheck } from 'lucide-react';

const IOS_LINK = 'https://apps.apple.com/app/miracle-of-mind-sadhguru/id6737795677';
const ANDROID_LINK = 'https://play.google.com/store/apps/details?id=org.sadhguru.miracleofmind';

/**
 * MiracleMindCTA
 * Practices-tab promo for the Miracle of Mind app with store buttons.
 */
export function MiracleMindCTA() {
  return (
    <Card className="p-4 lg:p-5 border border-proofound-stone bg-white/80 dark:bg-[#2F2823]/70">
      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr] items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-proofound-forest" />
            <h3 className="text-base font-semibold text-foreground dark:text-[#E8E6DD]">
              Miracle of Mind
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground dark:text-[#C9C2B8]">
            7-minute guided meditation to reset your mind, track streaks, and stay calm anywhere.
          </p>
          <div className="space-y-2 text-xs text-foreground dark:text-[#E8E6DD]">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-proofound-forest" />
              <span>AI-powered “Tune in” tips tailored to your mood.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-proofound-forest" />
              <span>Private companion — fully separate from your profile and matching.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:justify-self-end w-full">
          <Button
            asChild
            className="bg-proofound-forest hover:bg-proofound-forest/90 text-white text-xs sm:text-sm"
          >
            <a href={IOS_LINK} target="_blank" rel="noopener noreferrer">
              Download on iOS
            </a>
          </Button>
          <Button
            variant="outline"
            asChild
            className="text-xs sm:text-sm border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
          >
            <a href={ANDROID_LINK} target="_blank" rel="noopener noreferrer">
              Get it on Android
            </a>
          </Button>
        </div>
      </div>
    </Card>
  );
}
