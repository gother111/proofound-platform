'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Map, FileCheck, CheckCircle2, TrendingUp, Shield, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AboutSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border border-[#D8D2C8] bg-white/90 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#F7F6F1] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-[#EEF1EA] p-2">
            <BookOpen className="h-5 w-5 text-[#4A5943]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#2D3330]">What is the Expertise Atlas?</h3>
            <p className="text-sm text-[#6B6760]">
              Learn how the Atlas helps you map, evidence, and maintain your skills
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-[#6B6760]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[#6B6760]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-[#D8D2C8] pt-6">
          {/* Introduction */}
          <div>
            <p className="text-[#2D3330] mb-3">
              The <strong>Expertise Atlas</strong> is your comprehensive skills management system that goes beyond 
              traditional skills lists. It helps you map, evidence, and maintain your capabilities using a structured, 
              extensible taxonomy and proof-based credibility system.
            </p>
            <p className="text-[#2D3330]">
              Unlike simple skill tags, the Atlas organizes your expertise across 6 universal domains and over 20,000 
              curated skills, allowing you to track proficiency levels, attach evidence, request verification, and 
              monitor skill freshness over time.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h4 className="font-semibold text-[#2D3330] mb-4">How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-[#EEF1EA] p-2">
                    <Map className="h-4 w-4 text-[#4A5943]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#2D3330] text-sm mb-1">1. Pick a Category</p>
                  <p className="text-xs text-[#6B6760]">
                    Navigate through 6 domains → categories → subcategories to find or create skills
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-[#EEF1EA] p-2">
                    <TrendingUp className="h-4 w-4 text-[#4A5943]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#2D3330] text-sm mb-1">2. Add Skills</p>
                  <p className="text-xs text-[#6B6760]">
                    Select from 20K+ curated skills or create custom ones with proficiency levels
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-[#EEF1EA] p-2">
                    <FileCheck className="h-4 w-4 text-[#4A5943]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#2D3330] text-sm mb-1">3. Attach Proof</p>
                  <p className="text-xs text-[#6B6760]">
                    Add projects, certifications, media, or references to strengthen credibility
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-[#EEF1EA] p-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4A5943]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#2D3330] text-sm mb-1">4. Request Verification</p>
                  <p className="text-xs text-[#6B6760]">
                    Ask peers, managers, or clients to verify your skills for external validation
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-[#EEF1EA] p-2">
                    <TrendingUp className="h-4 w-4 text-[#4A5943]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#2D3330] text-sm mb-1">5. Track on Dashboard</p>
                  <p className="text-xs text-[#6B6760]">
                    Monitor credibility, coverage, relevance, and recency with 7 interactive widgets
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-[#EEF1EA] p-2">
                    <Shield className="h-4 w-4 text-[#4A5943]" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-[#2D3330] text-sm mb-1">Control Your Privacy</p>
                  <p className="text-xs text-[#6B6760]">
                    You decide what to share. Proofs and verifications are optional
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Basis */}
          <div className="bg-[#F7F6F1] rounded-lg p-4">
            <h4 className="font-semibold text-[#2D3330] mb-2 text-sm">Scientific Foundation</h4>
            <p className="text-xs text-[#6B6760]">
              Our taxonomy is informed by established frameworks including{' '}
              <strong>ESCO (European Skills)</strong>,{' '}
              <strong>O*NET (Occupational Information Network)</strong>,{' '}
              <strong>OECD transferable skills</strong>, and proficiency models like{' '}
              <strong>Dreyfus</strong> and <strong>Bloom's Taxonomy</strong>. 
              Evidence design follows Kirkpatrick-style validation approaches.
            </p>
          </div>

          {/* Learn More Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="border-[#4A5943] text-[#4A5943] hover:bg-[#EEF1EA]"
              asChild
            >
              <a href="/docs/expertise-atlas" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-2" />
                Read Full Documentation
              </a>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

