'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { RiskState, riskStates } from '@/data/zen';

interface MoodContextType {
  mood: RiskState;
  setMood: (mood: RiskState) => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodResponsiveContainer');
  }
  return context;
}

interface MoodResponsiveContainerProps {
  children: React.ReactNode;
}

export function MoodResponsiveContainer({ children }: MoodResponsiveContainerProps) {
  const [mood, setMood] = useState<RiskState>('calm');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedMood = localStorage.getItem('zen_mood') as RiskState;
    if (savedMood && riskStates.some((s) => s.id === savedMood)) {
      setMood(savedMood);
    }
    setIsMounted(true);
  }, []);

  const handleSetMood = (newMood: RiskState) => {
    setMood(newMood);
    localStorage.setItem('zen_mood', newMood);
  };

  // Prevent hydration mismatch by rendering children only after mount
  // or rendering a default state that matches server (calm)
  // But for layout stability, we might want to render immediately.
  // Since it's a client component, let's just use 'calm' as default.

  return (
    <MoodContext.Provider value={{ mood, setMood: handleSetMood }}>
      <div
        className={`transition-colors duration-500 min-h-screen ${
          mood === 'support'
            ? 'bg-[#FDF2F2] dark:bg-[#2F2020]' // Rose tint for support
            : mood === 'focus'
              ? 'bg-[#FFFBF0] dark:bg-[#2F2A20]' // Amber tint for focus
              : 'bg-[#F7F6F1] dark:bg-[#2A2520]' // Sage/Neutral for calm
        }`}
      >
        {children}
      </div>
    </MoodContext.Provider>
  );
}
