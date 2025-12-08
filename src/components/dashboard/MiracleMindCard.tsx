'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Brain, ShieldCheck } from 'lucide-react';

const IOS_LINK = 'https://apps.apple.com/'; // Replace with live App Store link
const ANDROID_LINK = 'https://play.google.com/store/'; // Replace with live Play Store link

/**
 * MiracleMindCard
 * Compact CTA to download the Miracle of Mind meditation app.
 * Keeps styling consistent with other dashboard widgets.
 */
export function MiracleMindCard() {
  return (
    <Card
      className="p-4 h-full flex flex-col justify-between border"
      style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1C4D3A]" />
          <h5 className="text-sm font-medium" style={{ color: '#2D3330' }}>
            Miracle of Mind
          </h5>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: '#6B6760' }}>
          7-minute guided meditation to reset your mind, track streaks, and get calm anywhere.
        </p>
        <div className="space-y-2 text-xs" style={{ color: '#2D3330' }}>
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-[#1C4D3A]" />
            <span>AI-powered “Tune in” tips tailored to your mood.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1C4D3A]" />
            <span>Private, personal wellbeing companion — separate from your profile.</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button asChild className="bg-[#1C4D3A] hover:bg-[#2D5F4A] text-white text-xs">
          <a href={IOS_LINK} target="_blank" rel="noopener noreferrer">
            Download on iOS
          </a>
        </Button>
        <Button variant="outline" asChild className="text-xs border-[#1C4D3A] text-[#1C4D3A]">
          <a href={ANDROID_LINK} target="_blank" rel="noopener noreferrer">
            Get it on Android
          </a>
        </Button>
      </div>
    </Card>
  );
}
