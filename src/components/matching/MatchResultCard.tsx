'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Clock, DollarSign, Shield, Eye, EyeOff, BellOff, Loader2 } from 'lucide-react';
import { PACScoreExplainer } from './PACScoreExplainer';
import { MatchExplainerModal } from './MatchExplainerModal';
import { SnoozeDialog } from './SnoozeDialog';
import { VerificationGatesWarning } from './VerificationGatesWarning';
import { RankDisplay } from './RankDisplay';
import { ConsentToShareDialog } from './ConsentToShareDialog';
import { apiFetch } from '@/lib/api/fetch';
import { motion } from 'framer-motion';

interface MatchResultCardProps {
  result: {
    id?: string; // Match ID for fetching detailed explanation
    score: number;
    subscores: Record<string, number>;
    contributions: Record<string, number>;
    profileId?: string;
    assignmentId?: string;
    profile?: {
      workMode?: string;
      locationMode?: string;
      country?: string;
      hoursMin?: number;
      hoursMax?: number;
      compMin?: number;
      compMax?: number;
      currency?: string;
      valuesTags?: string[];
      valuesRequired?: string[];
      causeTags?: string[];
    };
    assignment?: {
      role?: string;
      locationMode?: string;
      workMode?: string;
      country?: string;
      hoursMin?: number;
      hoursMax?: number;
      compMin?: number;
      compMax?: number;
      currency?: string;
      valuesRequired?: string[];
      valuesTags?: string[];
      causeTags?: string[];
    };
    gaps?: Array<{ id: string; required: number; have: number }>;
  };
  variant?: 'blind' | 'revealed';
  onInterested?: () => void;
  onHide?: () => void;
  skills?: Array<{ id: string; label: string; level: number }>;
}

/**
 * Match result card showing blind-first or revealed match details.
 */
export function MatchResultCard({
  result,
  variant = 'blind',
  onInterested,
  onHide,
  skills = [],
}: MatchResultCardProps) {
  const isOrgView = !!result.profileId; // Org viewing candidates
  const data = isOrgView ? result.profile : result.assignment;
  const [matchExplanation, setMatchExplanation] = useState<any>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [isSnoozeDialogOpen, setIsSnoozeDialogOpen] = useState(false);
  const [showGatesWarning, setShowGatesWarning] = useState(false);
  const [gateCheckResult, setGateCheckResult] = useState<any>(null);
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [visibleFieldsData, setVisibleFieldsData] = useState<any>(null);

  // Top 3 skills
  const topSkills = skills.slice(0, 3);
  const showExactCompensation =
    (result.assignment as any)?.visibility?.showExactSalary === true ||
    (result.profile as any)?.visibility?.showExactSalary === true ||
    (data as any)?.showExactSalary === true;

  // Match score percentage
  const scorePercent = Math.round(result.score * 100);

  // Contribution bars
  const contributions = Object.entries(result.contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Fetch detailed match explanation when requested
  const fetchMatchExplanation = async () => {
    if (!result.id || matchExplanation) return; // Already loaded

    setIsLoadingExplanation(true);
    try {
      const response = await apiFetch(`/api/match/explain/${result.id}`);
      if (response.ok) {
        const data = await response.json();
        setMatchExplanation(data);
      }
    } catch (error) {
      console.error('Failed to fetch match explanation:', error);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  // Fetch visible fields for consent dialog
  const fetchVisibleFields = async () => {
    if (!result.id) return;

    try {
      const response = await apiFetch(`/api/match/visible-fields/${result.id}`);
      if (response.ok) {
        const data = await response.json();
        setVisibleFieldsData(data);
        setIsConsentDialogOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch visible fields:', error);
    }
  };

  // Handle consent and interest
  const handleInterested = async () => {
    if (!isOrgView) {
      // Individual view - check gates first
      if (result.assignmentId) {
        try {
          const gatesResponse = await apiFetch('/api/match/gates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId: result.assignmentId,
            }),
          });

          if (gatesResponse.ok) {
            const gatesData = await gatesResponse.json();
            if (!gatesData.canIntroduce) {
              setGateCheckResult(gatesData);
              setShowGatesWarning(true);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to check verification gates:', error);
        }
      }

      // If gates passed (or failed to check/org view), proceed to consent
      await fetchVisibleFields();
    } else {
      // Org view - direct action
      if (onInterested) onInterested();
    }
  };

  // Handle consent given - actually express interest
  const handleConsentGiven = async (matchId: string) => {
    if (onInterested) {
      await onInterested();
    }
  };

  return (
    <motion.div layoutId={`match-card-${result.id}`} className="block h-full">
      <Card variant="bento" className="p-4 h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            {isOrgView ? (
              <h4 className="text-base font-medium mb-1">
                {variant === 'revealed' ? 'John Doe' : 'Candidate Match'}
              </h4>
            ) : (
              <h4 className="text-base font-medium mb-1">
                {result.assignment?.role || 'Opportunity Match'}
              </h4>
            )}

            {/* Match score */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: '#1C4D3A' }}>
                {scorePercent}% Match
              </span>
              {variant === 'blind' ? (
                <EyeOff className="w-3 h-3" style={{ color: '#6B6760' }} />
              ) : (
                <Eye className="w-3 h-3" style={{ color: '#1C4D3A' }} />
              )}
            </div>

            {/* Match Explainer - Full detailed breakdown */}
            {result.id && (
              <div className="mt-2">
                {matchExplanation ? (
                  <>
                    <MatchExplainerModal
                      matchId={matchExplanation.matchId}
                      compositeScore={matchExplanation.compositeScore}
                      rank={matchExplanation.rank}
                      totalCandidates={matchExplanation.totalCandidates}
                      rankBand={matchExplanation.rankBand}
                      subscores={matchExplanation.subscores}
                      skillsMatch={matchExplanation.skillsMatch}
                      pac={matchExplanation.pac}
                      constraints={matchExplanation.constraints}
                    />
                    {/* Rank Display - Show candidate's ranking */}
                    {matchExplanation.rank && matchExplanation.totalCandidates && !isOrgView && (
                      <div className="mt-2">
                        <RankDisplay
                          rank={matchExplanation.rank}
                          totalCandidates={matchExplanation.totalCandidates}
                          score={matchExplanation.compositeScore}
                          topPercentile={Math.round(
                            (matchExplanation.rank / matchExplanation.totalCandidates) * 100
                          )}
                          variant="compact"
                        />
                      </div>
                    )}
                    {!matchExplanation.rank && matchExplanation.rankBand && !isOrgView && (
                      <div className="mt-2 text-xs font-medium text-proofound-forest">
                        Ranking band: {matchExplanation.rankBand}
                      </div>
                    )}
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1.5 text-proofound-forest hover:bg-proofound-forest/5"
                    onClick={fetchMatchExplanation}
                    disabled={isLoadingExplanation}
                  >
                    {isLoadingExplanation ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Why this match?'
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Fallback PAC Explainer if no match ID */}
            {!result.id &&
              result.subscores &&
              (result.subscores.pac || result.subscores.values || result.subscores.causes) && (
                <div className="mt-2">
                  <PACScoreExplainer
                    pacScore={result.subscores.pac || result.score}
                    valuesOverlap={result.subscores.values || 0}
                    causesOverlap={result.subscores.causes || 0}
                    sharedValues={data?.valuesTags || []}
                    sharedCauses={data?.causeTags || []}
                    totalValues={data?.valuesTags?.length || 0}
                    totalCauses={data?.causeTags?.length || 0}
                  />
                </div>
              )}
          </div>
        </div>

        {/* Top Skills */}
        {topSkills.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {topSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="text-xs px-2 py-0.5"
                  style={{ backgroundColor: '#E8E6DD' }}
                >
                  {skill.label} L{skill.level}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Values/Causes */}
        {(data?.valuesTags || data?.valuesRequired) && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {(data.valuesTags || data.valuesRequired || []).slice(0, 3).map((tag: string) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                  style={{ borderColor: '#7A9278', color: '#1C4D3A' }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key details */}
        <div className="space-y-2 mb-3 text-xs" style={{ color: '#6B6760' }}>
          {/* Location */}
          {(data?.workMode || data?.locationMode) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              <span>
                {data.workMode || data.locationMode}
                {data.country && variant === 'revealed' && ` • ${data.country}`}
                {data.country && variant === 'blind' && ' • Region hidden'}
              </span>
            </div>
          )}

          {/* Hours */}
          {(data?.hoursMin || data?.hoursMax) && (
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>
                {data.hoursMin}-{data.hoursMax} hrs/week
              </span>
            </div>
          )}

          {/* Compensation */}
          {(data?.compMin || data?.compMax || result.subscores?.compensation !== undefined) && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              <span>
                {showExactCompensation && (data?.compMin || data?.compMax)
                  ? `${data.currency} ${data.compMin?.toLocaleString()}-${data.compMax?.toLocaleString()}`
                  : 'Compensation overlap only'}
              </span>
            </div>
          )}

          {/* Verifications (generic in blind mode) */}
          {variant === 'blind' && (
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span>Verified profile</span>
            </div>
          )}
        </div>

        {/* Contribution breakdown */}
        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: '#6B6760' }}>
            Match breakdown:
          </p>
          <div className="space-y-1">
            {contributions.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs w-20 capitalize" style={{ color: '#6B6760' }}>
                  {key}:
                </span>
                <Progress
                  value={value * 100}
                  className="h-1.5 flex-1"
                  style={{ backgroundColor: '#E8E6DD' }}
                />
                <span className="text-xs w-10 text-right">{Math.round(value * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {variant === 'blind' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInterested}
                style={{ backgroundColor: '#1C4D3A' }}
                className="flex-1"
              >
                Interested
              </Button>
              <Button size="sm" variant="outline" onClick={onHide}>
                Hide
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (result.id) {
                  setIsSnoozeDialogOpen(true);
                }
              }}
              disabled={!result.id}
              title={!result.id ? 'Snooze becomes available once this match is saved' : undefined}
              className="w-full text-xs text-muted-foreground hover:bg-japandi-bg"
            >
              <BellOff className="w-3.5 h-3.5 mr-1.5" />
              Snooze
            </Button>
          </div>
        )}

        {variant === 'revealed' && (
          <div>
            <Button size="sm" className="w-full" style={{ backgroundColor: '#1C4D3A' }}>
              View Full Profile
            </Button>
          </div>
        )}

        {/* Gaps (if any) */}
        {result.gaps && result.gaps.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(232, 230, 221, 0.6)' }}>
            <p className="text-xs mb-1" style={{ color: '#C76B4A' }}>
              Skill gaps:
            </p>
            {result.gaps.slice(0, 2).map((gap) => (
              <p key={gap.id} className="text-xs" style={{ color: '#6B6760' }}>
                {gap.id}: Needs L{gap.required}, has L{gap.have}
              </p>
            ))}
          </div>
        )}

        {/* Snooze Dialog */}
        {result.id && (
          <SnoozeDialog
            open={isSnoozeDialogOpen}
            onOpenChange={setIsSnoozeDialogOpen}
            matchId={result.id}
            assignmentTitle={result.assignment?.role || 'This opportunity'}
            onSnoozed={() => {
              // Refresh matches list or remove from current view
              if (onHide) onHide();
            }}
          />
        )}

        {/* Verification Gates Warning */}
        {gateCheckResult && (
          <VerificationGatesWarning
            open={showGatesWarning}
            onOpenChange={setShowGatesWarning}
            unmetGates={gateCheckResult.unmetGates || []}
            userVerifications={gateCheckResult.userVerifications || []}
            assignmentTitle={result.assignment?.role || 'this role'}
          />
        )}

        {/* Consent to Share Dialog */}
        {visibleFieldsData && (
          <ConsentToShareDialog
            isOpen={isConsentDialogOpen}
            onClose={() => setIsConsentDialogOpen(false)}
            matchId={result.id || ''}
            organizationName={visibleFieldsData.organizationName}
            assignmentRole={visibleFieldsData.assignmentRole}
            visibleFields={visibleFieldsData.visibleFields || []}
            onConsent={handleConsentGiven}
          />
        )}
      </Card>
    </motion.div>
  );
}
