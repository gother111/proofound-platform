'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  Map,
  FileCheck,
  CheckCircle2,
  TrendingUp,
  Shield,
  BookOpen,
  Clock3,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function AboutSection() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border border-border bg-white/90 mb-6">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-japandi-bg transition-colors"
        aria-expanded={isExpanded}
        aria-controls="about-section-content"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-proofound-forest/5 p-2">
            <BookOpen className="h-5 w-5 text-proofound-forest" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">What is the Expertise Atlas?</h3>
            <p className="text-sm text-muted-foreground">
              Learn how the Atlas helps you map, evidence, and maintain your skills
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div id="about-section-content" className="px-6 pb-6 space-y-6 border-t border-border pt-6">
          {/* Introduction */}
          <div>
            <p className="text-foreground mb-3">
              The <strong>Expertise Atlas</strong> is your comprehensive skills management system
              that goes beyond traditional skills lists. It helps you map, evidence, and maintain
              your capabilities using a structured, extensible taxonomy and proof-based credibility
              system.
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge
                variant="secondary"
                className="gap-1 bg-proofound-forest/5 text-proofound-forest"
              >
                <Clock3 className="h-3.5 w-3.5" />
                First 3 skills ≈ 2–3 mins
              </Badge>
              <Badge variant="outline" className="gap-1 border-border text-foreground">
                <Info className="h-3.5 w-3.5" />
                Use synonyms—search matches common wording
              </Badge>
            </div>
            <p className="text-foreground">
              Unlike simple skill tags, the Atlas organizes your expertise across 6 universal
              domains and over 18,000 curated skills, allowing you to track proficiency levels,
              attach evidence, request verification, and monitor skill freshness over time.
            </p>
          </div>

          {/* How It Works */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">How It Works</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-proofound-forest/5 p-2">
                    <Map className="h-4 w-4 text-proofound-forest" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">1. Pick a Category</p>
                  <p className="text-xs text-muted-foreground">
                    Navigate through 6 domains → categories → subcategories to find or create skills
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-proofound-forest/5 p-2">
                    <TrendingUp className="h-4 w-4 text-proofound-forest" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">2. Add Skills</p>
                  <p className="text-xs text-muted-foreground">
                    Select from 18K+ curated skills or create custom ones with proficiency levels
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-proofound-forest/5 p-2">
                    <FileCheck className="h-4 w-4 text-proofound-forest" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">3. Attach Proof</p>
                  <p className="text-xs text-muted-foreground">
                    Add projects, certifications, media, or references to strengthen credibility
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-proofound-forest/5 p-2">
                    <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">
                    4. Request Verification
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ask peers, managers, or clients to verify your skills for external validation
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-proofound-forest/5 p-2">
                    <TrendingUp className="h-4 w-4 text-proofound-forest" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">5. Review in Overview</p>
                  <p className="text-xs text-muted-foreground">
                    Monitor credibility, coverage, relevance, and recency in one calm overview
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="rounded-full bg-proofound-forest/5 p-2">
                    <Shield className="h-4 w-4 text-proofound-forest" />
                  </div>
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm mb-1">Control Your Privacy</p>
                  <p className="text-xs text-muted-foreground">
                    You decide what to share. Proofs and verifications are optional
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Basis */}
          <div className="bg-japandi-bg rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2 text-sm">Scientific Foundation</h4>
            <p className="text-xs text-muted-foreground">
              Our taxonomy is informed by established frameworks including{' '}
              <strong>ESCO (European Skills)</strong>,{' '}
              <strong>O*NET (Occupational Information Network)</strong>,{' '}
              <strong>OECD transferable skills</strong>, and proficiency models like{' '}
              <strong>Dreyfus</strong> and <strong>Bloom's Taxonomy</strong>. Evidence design
              follows Kirkpatrick-style validation approaches.
            </p>
          </div>

          {/* Learn More Button */}
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              className="border-proofound-forest text-proofound-forest hover:bg-proofound-forest/5"
              asChild
            >
              <Link href="/docs/expertise-atlas">
                <BookOpen className="h-4 w-4 mr-2" />
                Read Full Documentation
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
