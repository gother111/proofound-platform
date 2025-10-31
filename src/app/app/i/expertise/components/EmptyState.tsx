'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Plus, BookOpen } from 'lucide-react';

interface EmptyStateProps {
  onAddSkill: () => void;
}

export function EmptyState({ onAddSkill }: EmptyStateProps) {
  return (
    <div className="min-h-[600px] flex items-center justify-center px-6 py-12">
      <Card className="max-w-2xl w-full border border-[#D8D2C8] bg-white/90 p-12 text-center shadow-sm">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-[#EEF1EA] p-6">
            <Sparkles className="h-12 w-12 text-[#4A5943]" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-[#2D3330] mb-3">
          Your Expertise Atlas is empty
        </h2>

        {/* Description */}
        <p className="text-[#6B6760] mb-8 max-w-lg mx-auto">
          Start building your skills map by adding your first capability. Choose from over 20,000 
          curated skills across 6 major domains, or create your own.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={onAddSkill}
            className="bg-[#4A5943] text-white hover:bg-[#3C4936]"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add your first skill
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Learn how it works
          </Button>
        </div>

        {/* Info Pills */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center text-xs text-[#4A5943]">
          <span className="flex items-center gap-2 rounded-full bg-[#EEF1EA] px-4 py-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            20,000+ curated skills
          </span>
          <span className="flex items-center gap-2 rounded-full bg-[#EEF1EA] px-4 py-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Attach proofs & verifications
          </span>
          <span className="flex items-center gap-2 rounded-full bg-[#EEF1EA] px-4 py-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Track recency & growth
          </span>
        </div>
      </Card>
    </div>
  );
}


