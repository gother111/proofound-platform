/**
 * Match explainer modal for the launch corridor.
 *
 * The explanation stays proof-first and privacy-safe:
 * - strongest proof and fit rationale lead
 * - blind-by-default review stays explicit
 * - comparative score detail stays secondary
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useResponsiveModalMode } from '@/hooks/use-responsive-modal-mode';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Info,
  Heart,
  Target,
  CheckCircle2,
  TrendingUp,
  Award,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UI_VOCABULARY } from '@/lib/copy/vocabulary';
import {
  buildMatchExplainerContract,
  MATCH_EXPLAINER_TEST_IDS,
} from '@/lib/matching/explainer-contract';
import { motion } from 'framer-motion';

interface MatchExplainerProps {
  // Overall match data
  matchId: string;
  compositeScore: number; // 0-1
  rank?: number; // User's rank in this match pool
  totalCandidates?: number; // Total candidates in pool
  rankBand?: string; // e.g., "Top 5", "Top 10"
  rankMode?: 'exact' | 'band';
  exactRankAvailable?: boolean;

  // Subscore breakdown
  subscores: {
    skills?: number; // 0-1
    pac?: number; // 0-1 (Purpose-Alignment Contribution)
    constraints?: number; // 0-1 (location, salary, hours match)
    recency?: number; // 0-1 (skill freshness)
    evidence?: number; // 0-1 (verification strength)
  };

  // Skills overlap
  skillsMatch?: {
    required: Array<{
      skillName: string;
      requiredLevel: number;
      yourLevel: number;
      met: boolean;
    }>;
    nice: Array<{
      skillName: string;
      desiredLevel?: number;
      yourLevel: number;
      met: boolean;
    }>;
  };

  // PAC breakdown
  pac?: {
    valuesOverlap: number; // 0-1
    causesOverlap: number; // 0-1
    sharedValues: string[];
    sharedCauses: string[];
    totalValues: number;
    totalCauses: number;
  };

  // Constraints match
  constraints?: {
    location: { match: boolean; details?: string };
    salary: { match: boolean; details?: string };
    hours: { match: boolean; details?: string };
    workMode: { match: boolean; details?: string };
  };
  reasonSummary?: string[];
  reasonSections?: Record<string, string[]>;
  fairnessWarning?: string | null;
  reviewCard?: {
    candidateLabel: string;
    strongestProof: {
      summary: string | null;
      outcome: string | null;
      ownership: string | null;
      anchorContext: string | null;
      freshnessLabel: string | null;
    };
    verification: {
      summaryLabel: string;
      count: number | null;
    };
    fitSummary: {
      headline: string;
      bullets: string[];
      reasonCodes: string[];
    };
  };

  // Custom trigger button (optional)
  trigger?: React.ReactNode;
}

export function MatchExplainerModal({
  matchId,
  compositeScore,
  rank,
  totalCandidates,
  rankBand,
  rankMode,
  exactRankAvailable,
  subscores,
  skillsMatch,
  pac,
  constraints,
  reasonSummary = [],
  reasonSections,
  fairnessWarning,
  reviewCard,
  trigger,
}: MatchExplainerProps) {
  const [open, setOpen] = useState(false);
  const explainerContract = buildMatchExplainerContract();

  // Calculate percentages
  const overallPercent = Math.round(compositeScore * 100);
  const skillsPercent = Math.round((subscores.skills ?? 0) * 100);
  const pacPercent = Math.round((subscores.pac ?? 0) * 100);
  const constraintsPercent = Math.round((subscores.constraints ?? 0) * 100);
  const recencyPercent = Math.round((subscores.recency ?? 0) * 100);
  const evidencePercent = Math.round((subscores.evidence ?? 0) * 100);

  // Determine rank display
  const getRankDisplay = () => {
    if (rankBand) return rankBand;
    if (rank && totalCandidates) {
      if (rank <= 5) return 'Top 5';
      if (rank <= 10) return 'Top 10';
      if (rank <= 20) return 'Top 20';
      return `#${rank} of ${totalCandidates}`;
    }
    return 'Competitive';
  };

  const getRankColor = () => {
    if (!rank) return '#6B6760';
    if (rank <= 5) return '#1C4D3A'; // Forest green
    if (rank <= 10) return '#C76B4A'; // Terracotta
    return '#6B6760'; // Charcoal
  };

  // Default trigger
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="text-xs gap-1.5 text-proofound-forest hover:bg-proofound-forest/5"
      data-testid={MATCH_EXPLAINER_TEST_IDS.trigger}
      aria-haspopup="dialog"
    >
      <Info className="w-4 h-4" />
      {explainerContract.triggerLabel}
    </Button>
  );

  const isDesktop = useResponsiveModalMode(open);

  const renderModalContentBody = () => (
    <motion.div
      layoutId={matchId ? `match-card-${matchId}` : undefined}
      className="bg-background sm:rounded-xl shadow-lg border-0 sm:border p-0 sm:p-2 sm:m-1 h-full w-full flex flex-col"
    >
      <div className="space-y-6 py-4 px-4 md:px-0 flex-1 flex flex-col">
        <DialogHeader className="md:px-0 px-2 text-left">
          <DialogTitle
            className="flex items-center gap-2 text-xl"
            data-testid={MATCH_EXPLAINER_TEST_IDS.title}
          >
            <Zap className="w-6 h-6 text-proofound-forest" />
            {explainerContract.title}
          </DialogTitle>
          <DialogDescription
            className="mt-1 text-sm text-muted-foreground"
            data-testid={MATCH_EXPLAINER_TEST_IDS.description}
          >
            {explainerContract.dialogDescription}
          </DialogDescription>
        </DialogHeader>

        {reviewCard ? (
          <div className="rounded-xl border border-proofound-stone bg-proofound-parchment/35 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Strongest relevant proof
                </p>
                <p className="mt-1 text-base font-semibold text-proofound-charcoal">
                  {reviewCard.fitSummary.headline}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {reviewCard.strongestProof.anchorContext ? (
                  <Badge variant="outline">{reviewCard.strongestProof.anchorContext}</Badge>
                ) : null}
                {reviewCard.strongestProof.freshnessLabel ? (
                  <Badge variant="outline">{reviewCard.strongestProof.freshnessLabel}</Badge>
                ) : null}
                <Badge variant="outline">{reviewCard.verification.summaryLabel}</Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm text-proofound-charcoal">
              <p>{reviewCard.strongestProof.summary || 'Proof-backed evidence is available.'}</p>
              {reviewCard.strongestProof.outcome ? (
                <p>Outcome: {reviewCard.strongestProof.outcome}</p>
              ) : null}
              {reviewCard.strongestProof.ownership ? (
                <p>Ownership: {reviewCard.strongestProof.ownership}</p>
              ) : null}
            </div>

            {reviewCard.fitSummary.bullets.length > 0 ? (
              <div className="mt-4 rounded-lg bg-white p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason-coded fit summary
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  {reviewCard.fitSummary.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-proofound-forest" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {fairnessWarning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
              <p className="text-sm text-amber-900">{fairnessWarning}</p>
            </div>
          </div>
        ) : null}

        {reasonSummary.length > 0 ? (
          <div className="rounded-xl border border-proofound-stone bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Privacy-safe explanation</h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Blind-by-default review keeps identity-bearing details hidden until the candidate
              consents to reveal.
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              {reasonSummary.map((item, index) => (
                <li key={`${matchId}-reason-summary-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-proofound-forest" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {reasonSections?.manual_override?.length ? (
              <div className="mt-4 rounded-lg bg-[#F7F6F1] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review notes
                </p>
                <ul className="space-y-1 text-sm text-foreground">
                  {reasonSections.manual_override.map((item, index) => (
                    <li key={`${matchId}-manual-override-${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Overall Score & Rank */}
        <div className="bg-gradient-to-br from-[#E8F5E1] to-[#F7F6F1] rounded-xl p-6 border border-proofound-stone">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Comparative score detail</p>
              <p className="text-4xl font-bold text-proofound-forest">{overallPercent}%</p>
            </div>
            {(rank || rankBand) && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Ranking signal</p>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" style={{ color: getRankColor() }} />
                  <p className="text-xl font-semibold" style={{ color: getRankColor() }}>
                    {getRankDisplay()}
                  </p>
                </div>
                {rankMode === 'band' && exactRankAvailable ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Exact rank is hidden while privacy or fairness limits apply.
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <Progress value={overallPercent} className="h-3" />

          <p className="text-xs text-muted-foreground mt-3">
            This score stays secondary to proof, outcome, and verification context.
          </p>
        </div>

        {/* Tabbed Breakdown */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="purpose">Purpose</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 pt-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Score Breakdown by Category
            </h4>

            {/* Skills */}
            {subscores.skills !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-proofound-forest" />
                    <span className="text-sm font-medium text-foreground">Skills Match</span>
                  </div>
                  <span className="text-sm font-semibold text-proofound-forest">
                    {skillsPercent}%
                  </span>
                </div>
                <Progress value={skillsPercent} className="h-2" />
              </div>
            )}

            {/* PAC */}
            {subscores.pac !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-proofound-terracotta" />
                    <span className="text-sm font-medium text-foreground">
                      {UI_VOCABULARY.pacLabel}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-proofound-terracotta">
                    {pacPercent}%
                  </span>
                </div>
                <Progress value={pacPercent} className="h-2" />
              </div>
            )}

            {/* Constraints */}
            {subscores.constraints !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-proofound-forest" />
                    <span className="text-sm font-medium text-foreground">
                      Practical Constraints
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-proofound-forest">
                    {constraintsPercent}%
                  </span>
                </div>
                <Progress value={constraintsPercent} className="h-2" />
              </div>
            )}

            {/* Recency */}
            {subscores.recency !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Skill Recency</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {recencyPercent}%
                  </span>
                </div>
                <Progress value={recencyPercent} className="h-2" />
              </div>
            )}

            {/* Evidence */}
            {subscores.evidence !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Evidence Strength</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {evidencePercent}%
                  </span>
                </div>
                <Progress value={evidencePercent} className="h-2" />
              </div>
            )}

            <div className="bg-japandi-bg rounded-lg p-4 border border-proofound-stone mt-4">
              <p className="text-xs leading-relaxed text-foreground">
                <strong className="font-semibold">How it works:</strong> This comparative score
                summarizes proof strength, fit rationale, and practical constraints after the
                privacy-safe review context above.
              </p>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4 pt-4">
            {skillsMatch ? (
              <>
                {/* Required Skills */}
                {skillsMatch.required.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Required Skills</h4>
                    <div className="space-y-2">
                      {skillsMatch.required.map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border border-proofound-stone bg-white"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{skill.skillName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Required: Level {skill.requiredLevel} • You have: Level{' '}
                              {skill.yourLevel}
                            </p>
                          </div>
                          {skill.met ? (
                            <CheckCircle2 className="w-5 h-5 text-proofound-forest flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-proofound-terracotta flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nice-to-Have Skills */}
                {skillsMatch.nice.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Nice-to-Have Skills
                    </h4>
                    <div className="space-y-2">
                      {skillsMatch.nice.map((skill, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg border border-proofound-stone bg-white"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{skill.skillName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Your level: {skill.yourLevel}
                            </p>
                          </div>
                          {skill.met && (
                            <CheckCircle2 className="w-5 h-5 text-proofound-forest flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No skills data available</p>
            )}
          </TabsContent>

          {/* Purpose Tab */}
          <TabsContent value="purpose" className="space-y-4 pt-4">
            {pac ? (
              <>
                {/* Values Alignment */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-proofound-terracotta" />
                    <h4 className="font-semibold text-sm text-foreground">Values Alignment</h4>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Overlap</span>
                    <span className="text-sm font-semibold text-proofound-terracotta">
                      {Math.round(pac.valuesOverlap * 100)}%
                    </span>
                  </div>
                  <Progress value={pac.valuesOverlap * 100} className="h-2 mb-3" />

                  {pac.sharedValues.length > 0 ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Shared values:</p>
                      <div className="flex flex-wrap gap-2">
                        {pac.sharedValues.map((value, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-proofound-terracotta/10 text-proofound-terracotta border-[#C76B4A]/20"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {value}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {pac.sharedValues.length} of {pac.totalValues} values in common
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No values in common</p>
                  )}
                </div>

                {/* Causes Alignment */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-5 h-5 text-proofound-forest" />
                    <h4 className="font-semibold text-sm text-foreground">Causes Alignment</h4>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Overlap</span>
                    <span className="text-sm font-semibold text-proofound-forest">
                      {Math.round(pac.causesOverlap * 100)}%
                    </span>
                  </div>
                  <Progress value={pac.causesOverlap * 100} className="h-2 mb-3" />

                  {pac.sharedCauses.length > 0 ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Shared causes:</p>
                      <div className="flex flex-wrap gap-2">
                        {pac.sharedCauses.map((cause, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="bg-proofound-forest/10 text-proofound-forest border-proofound-forest/20"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {cause}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {pac.sharedCauses.length} of {pac.totalCauses} causes in common
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No causes in common</p>
                  )}
                </div>

                <div className="bg-japandi-bg rounded-lg p-4 border border-proofound-stone">
                  <p className="text-xs leading-relaxed text-foreground">
                    <strong className="font-semibold">{UI_VOCABULARY.pacLabel}</strong> uses value
                    and cause overlap to estimate mission alignment. Higher scores mean this role
                    aligns more closely with what matters to you.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No purpose alignment data available</p>
            )}
          </TabsContent>

          {/* Constraints Tab */}
          <TabsContent value="constraints" className="space-y-3 pt-4">
            {constraints ? (
              <>
                {Object.entries(constraints).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between p-3 rounded-lg border border-proofound-stone bg-white"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground capitalize mb-0.5">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      {value.details && (
                        <p className="text-xs text-muted-foreground">{value.details}</p>
                      )}
                    </div>
                    {value.match ? (
                      <CheckCircle2 className="w-5 h-5 text-proofound-forest flex-shrink-0 ml-2" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-proofound-terracotta flex-shrink-0 ml-2" />
                    )}
                  </div>
                ))}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No constraints data available</p>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center py-4 border-t border-proofound-stone px-4 md:px-0 mt-4">
        <p className="text-xs text-muted-foreground">
          Match calculated on {new Date().toLocaleDateString()}
        </p>
        <Button onClick={() => setOpen(false)} className="bg-proofound-forest text-white">
          Got it
        </Button>
      </div>
    </motion.div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
        <DialogContent
          aria-label={explainerContract.title}
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-transparent border-none shadow-none p-0 sm:max-w-2xl [&>button]:right-6 [&>button]:top-6 [&>button]:text-muted-foreground [&>button]:z-50 [&>button]:bg-background/50 [&>button]:backdrop-blur-sm [&>button]:rounded-full [&>button]:p-1.5 [&>button]:hover:bg-background"
        >
          {renderModalContentBody()}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger || defaultTrigger}</DrawerTrigger>
      <DrawerContent
        aria-label={explainerContract.title}
        className="max-h-[90vh] bg-transparent border-none p-0 pt-4"
      >
        <DrawerHeader className="sr-only">
          <DrawerTitle>{explainerContract.title}</DrawerTitle>
          <DrawerDescription>{explainerContract.dialogDescription}</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto w-full h-full rounded-t-xl overflow-hidden shadow-2xl mt-4">
          {renderModalContentBody()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
