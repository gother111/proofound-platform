/**
 * Match explainer modal for the launch corridor.
 *
 * The explanation stays proof-first and privacy-safe:
 * - strongest proof and fit rationale lead
 * - blind-by-default review stays explicit
 * - fit-signal detail stays secondary
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
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle2, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildMatchExplainerContract,
  MATCH_EXPLAINER_TEST_IDS,
} from '@/lib/matching/explainer-contract';
import { reasonCodeDisplayLabel } from '@/lib/matching/reason-codes';
import { motion } from 'framer-motion';

interface MatchExplainerProps {
  matchId: string;
  rank?: number;
  totalCandidates?: number;
  rankBand?: string;
  rankMode?: 'exact' | 'band';
  exactRankAvailable?: boolean;
  proofSignals?: {
    skills?: string;
    constraints?: string;
    recency?: string;
    evidence?: string;
  };

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
    trustLabels: string[];
    fitBand: string | null;
    fitSummary: {
      headline: string;
      bullets: string[];
      reasonCodes: string[];
    };
  };

  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

function fitBandLabel(label?: string | null): string {
  if (
    label &&
    !/^top\s*\d+/i.test(label) &&
    !/^#\d+/i.test(label) &&
    !/^(highest-priority|high-priority|priority|strong|clear)\s+proof review$/i.test(label) &&
    !/^(highest-priority|high-priority|priority|strong|clear)$/i.test(label)
  ) {
    return label;
  }
  return label ? 'Review-ready proof' : 'Proof review needed';
}

function privacySafeWarning(message?: string | null): string | null {
  if (!message) return null;
  return message
    .replace(/\bfairness\b/gi, 'policy')
    .replace(/\bpolicy remediation\b/gi, 'policy review')
    .replace(/\bremediation\b/gi, 'review')
    .replace(/\branking\b/gi, 'ordering')
    .replace(/\brank\b/gi, 'order');
}

export function MatchExplainerModal({
  matchId,
  rank,
  rankBand,
  rankMode,
  exactRankAvailable,
  proofSignals = {},
  skillsMatch,
  constraints,
  reasonSummary = [],
  reasonSections,
  fairnessWarning,
  reviewCard,
  trigger,
  defaultOpen = false,
}: MatchExplainerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const explainerContract = buildMatchExplainerContract();
  const fitBand = fitBandLabel(reviewCard?.fitBand ?? rankBand);
  const warning = privacySafeWarning(fairnessWarning);
  const evidenceSignals = {
    skills: proofSignals.skills,
    constraints: proofSignals.constraints,
    recency: proofSignals.recency,
    evidence: proofSignals.evidence,
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
                {reviewCard.fitBand ? <Badge variant="outline">{fitBand}</Badge> : null}
                {reviewCard.strongestProof.anchorContext ? (
                  <Badge variant="outline">{reviewCard.strongestProof.anchorContext}</Badge>
                ) : null}
                {reviewCard.strongestProof.freshnessLabel ? (
                  <Badge variant="outline">{reviewCard.strongestProof.freshnessLabel}</Badge>
                ) : null}
                {reviewCard.trustLabels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
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
                  Fit signal summary
                </p>
                <ul className="space-y-2 text-sm text-foreground">
                  {reviewCard.fitSummary.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-proofound-forest" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {reviewCard.fitSummary.reasonCodes.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {reviewCard.fitSummary.reasonCodes.map((reasonCode) => (
                      <Badge key={reasonCode} variant="secondary" className="text-[11px]">
                        {reasonCodeDisplayLabel(reasonCode)}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {warning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 text-amber-700" />
              <p className="text-sm text-amber-900">{warning}</p>
            </div>
          </div>
        ) : null}

        {reasonSummary.length > 0 ? (
          <div className="rounded-xl border border-proofound-stone bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Privacy-safe explanation</h4>
            <p className="mb-3 text-sm text-muted-foreground">
              Blind-by-default review keeps identity-bearing details hidden until the proof-review
              participant consents to reveal.
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

        <div className="rounded-xl border border-proofound-stone bg-[#F7F6F1] p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Supporting fit signal</p>
              <p className="text-lg font-semibold text-proofound-charcoal">{fitBand}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Internal matching values stay secondary to proof, outcome, verification, and privacy
                context.
              </p>
            </div>
            {(rank || rankBand) && (
              <div className="rounded-lg border border-proofound-stone bg-white px-3 py-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Review band
                </p>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-proofound-forest" />
                  <p className="text-sm font-medium text-proofound-charcoal">{fitBand}</p>
                </div>
                {rankMode === 'band' && exactRankAvailable ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Exact ordering is hidden while privacy or policy limits apply.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-foreground">Review signals by area</h4>

            {proofSignals.skills && (
              <div className="rounded-lg border border-proofound-stone bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                    <span className="text-sm font-medium text-foreground">Skills evidence</span>
                  </div>
                  <span className="rounded-full bg-proofound-parchment px-2 py-0.5 text-xs text-muted-foreground">
                    {evidenceSignals.skills}
                  </span>
                </div>
              </div>
            )}

            {proofSignals.constraints && (
              <div className="rounded-lg border border-proofound-stone bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-proofound-forest" />
                    <span className="text-sm font-medium text-foreground">
                      Practical constraints
                    </span>
                  </div>
                  <span className="rounded-full bg-proofound-parchment px-2 py-0.5 text-xs text-muted-foreground">
                    {evidenceSignals.constraints}
                  </span>
                </div>
              </div>
            )}

            {proofSignals.recency && (
              <div className="rounded-lg border border-proofound-stone bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Proof freshness</span>
                  </div>
                  <span className="rounded-full bg-proofound-parchment px-2 py-0.5 text-xs text-muted-foreground">
                    {evidenceSignals.recency}
                  </span>
                </div>
              </div>
            )}

            {proofSignals.evidence && (
              <div className="rounded-lg border border-proofound-stone bg-white p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Verification support
                    </span>
                  </div>
                  <span className="rounded-full bg-proofound-parchment px-2 py-0.5 text-xs text-muted-foreground">
                    {evidenceSignals.evidence}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-japandi-bg rounded-lg p-4 border border-proofound-stone mt-4">
              <p className="text-xs leading-relaxed text-foreground">
                <strong className="font-semibold">How it works:</strong> This fit signal summarizes
                proof strength, fit rationale, and practical constraints after the privacy-safe
                review context above.
              </p>
            </div>
          </TabsContent>

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
          Explanation refreshed on {new Date().toLocaleDateString()}
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
