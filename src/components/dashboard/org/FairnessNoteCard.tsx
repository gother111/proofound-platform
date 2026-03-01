/**
 * Fairness Note Card
 *
 * Displays fairness gap analysis with real-time calculation fallback.
 * PRD Reference: Part 2 - Fairness Gap Metric
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, RefreshCw, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FairnessNoteCardProps {
  orgSlug: string;
}

interface FairnessNoteData {
  hasData: boolean;
  hasSignificantGaps: boolean;
  findings?: any[];
  recommendations?: any[];
  cohortCount: number;
  message: string;
  lastGenerated: string | null;
  isRealtime: boolean;
  cohortsAnalyzed?: number;
}

export function FairnessNoteCard({ orgSlug }: FairnessNoteCardProps) {
  const [data, setData] = useState<FairnessNoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFairnessNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug]);

  const fetchFairnessNote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/analytics/org/fairness-note?orgSlug=${orgSlug}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError('Failed to load fairness analysis');
      }
    } catch (err) {
      console.error('Failed to fetch fairness note:', err);
      setError('Failed to load fairness analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastGenerated = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Fairness Gap Analysis</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Monitoring hiring equity across demographics
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={fetchFairnessNote}
          disabled={isLoading}
          className="text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center justify-center text-sm text-muted-foreground">
          Analyzing fairness data...
        </div>
      ) : error ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-proofound-terracotta mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      ) : !data?.hasData ? (
        <div className="py-8 flex flex-col items-center justify-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground opacity-50 mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Insufficient Data</p>
          <p className="text-xs text-muted-foreground mt-1">
            Analysis requires more hiring activity
          </p>
        </div>
      ) : (
        <>
          {/* Status indicator */}
          <div
            className={`flex items-start gap-3 p-4 rounded-lg mb-4 ${
              data.hasSignificantGaps
                ? 'bg-[#FFF4E6] border border-[#C76B4A]/20'
                : 'bg-proofound-success-tint border border-proofound-forest/20'
            }`}
          >
            {data.hasSignificantGaps ? (
              <AlertCircle className="w-5 h-5 text-proofound-terracotta flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-proofound-forest flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-semibold mb-1 ${
                  data.hasSignificantGaps ? 'text-proofound-terracotta' : 'text-proofound-forest'
                }`}
              >
                {data.hasSignificantGaps ? 'Review Recommended' : 'All Clear'}
              </p>
              <p className="text-sm text-foreground">{data.message}</p>
            </div>
          </div>

          {/* Findings summary */}
          {data.findings && data.findings.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Key Findings</h4>
              <div className="space-y-2">
                {data.findings.slice(0, 3).map((finding: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-japandi-bg rounded-lg border border-proofound-stone"
                  >
                    {finding.type === 'insufficient_data' ? (
                      <p className="text-sm text-muted-foreground">{finding.message}</p>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className={
                              finding.type === 'negative_gap'
                                ? 'bg-proofound-terracotta/10 text-proofound-terracotta'
                                : 'bg-proofound-forest/10 text-proofound-forest'
                            }
                          >
                            {finding.type === 'negative_gap' ? 'Gap Detected' : 'Positive Trend'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Sample: {finding.sampleSize}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          <strong>
                            {finding.cohort.role || 'Unknown'} / {finding.cohort.seniority || 'All'}{' '}
                            / {finding.cohort.geography || 'Global'}
                          </strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Median TTSC: {finding.medianTTSC}d (
                          {finding.deviationPercent > 0 ? '+' : ''}
                          {finding.deviationPercent}% vs global)
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations && data.recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Recommended Actions</h4>
              <ul className="space-y-2">
                {data.recommendations.slice(0, 2).map((rec: any, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-foreground p-2 bg-[#FFF4E6] rounded"
                  >
                    <span className="text-proofound-terracotta font-bold">•</span>
                    <div className="flex-1">
                      <p className="font-medium">{rec.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.details}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metadata footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-proofound-stone pt-3">
            <div className="flex items-center gap-4">
              <span>{data.cohortCount || data.cohortsAnalyzed} cohorts analyzed</span>
              {data.isRealtime && (
                <Badge
                  variant="secondary"
                  className="bg-proofound-success-tint text-proofound-forest"
                >
                  Real-time
                </Badge>
              )}
            </div>
            <span>Updated {formatLastGenerated(data.lastGenerated)}</span>
          </div>
        </>
      )}
    </Card>
  );
}
