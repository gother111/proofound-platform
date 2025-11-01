'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface FairnessMetric {
  cohortId: string;
  cohortName: string;
  introAcceptanceRate: number;
  contractSigningRate: number;
  sampleSize: number;
}

interface FairnessGap {
  metric: 'intro_acceptance' | 'contract_signing';
  cohort1: string;
  cohort2: string;
  gap: number;
  isSignificant: boolean;
  pValue: number;
}

interface FairnessNote {
  reportDate: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  cohorts: FairnessMetric[];
  gaps: FairnessGap[];
  summary: string;
  status: 'passing' | 'warning' | 'failing';
  recommendations: string[];
}

export function FairnessNoteDashboard() {
  const [fairnessNote, setFairnessNote] = useState<FairnessNote | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '180d'>('90d');

  const loadFairnessNote = useCallback(async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '180d':
          startDate.setDate(startDate.getDate() - 180);
          break;
      }

      const response = await fetch(
        `/api/analytics/fairness?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to load fairness note');
      }

      const data = await response.json();
      setFairnessNote(data.fairnessNote);
    } catch (error) {
      console.error('Fairness note error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load fairness note');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadFairnessNote();
  }, [loadFairnessNote]);

  const getStatusBadge = (status: 'passing' | 'warning' | 'failing') => {
    switch (status) {
      case 'passing':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Passing
          </Badge>
        );
      case 'warning':
        return (
          <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        );
      case 'failing':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failing
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <CardTitle>Fairness Note</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <Button
                  variant={dateRange === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('30d')}
                >
                  30d
                </Button>
                <Button
                  variant={dateRange === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('90d')}
                >
                  90d
                </Button>
                <Button
                  variant={dateRange === '180d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('180d')}
                >
                  180d
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFairnessNote}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading fairness report...
            </div>
          ) : !fairnessNote ? (
            <div className="text-center py-8 text-muted-foreground">
              No fairness data available
            </div>
          ) : (
            <>
              {/* Status Summary */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(fairnessNote.status)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(fairnessNote.reportPeriod.startDate).toLocaleDateString()} -{' '}
                      {new Date(fairnessNote.reportPeriod.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{fairnessNote.summary}</p>
                </div>
              </div>

              {/* Cohort Metrics */}
              {fairnessNote.cohorts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Cohort Metrics</h3>
                  <div className="space-y-2">
                    {fairnessNote.cohorts.map((cohort) => (
                      <div
                        key={cohort.cohortId}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">{cohort.cohortName}</h4>
                          <Badge variant="outline" className="text-xs">
                            n={cohort.sampleSize}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Intro Acceptance</span>
                            <p className="font-medium">
                              {cohort.introAcceptanceRate.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Contract Signing</span>
                            <p className="font-medium">
                              {cohort.contractSigningRate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Gaps */}
              {fairnessNote.gaps.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Detected Gaps</h3>
                  <div className="space-y-2">
                    {fairnessNote.gaps.map((gap, idx) => (
                      <div
                        key={idx}
                        className={`p-3 border rounded-lg ${
                          gap.isSignificant ? 'border-amber-500 bg-amber-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {gap.metric === 'intro_acceptance'
                                ? 'Introduction Acceptance'
                                : 'Contract Signing'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {gap.cohort1} vs {gap.cohort2}
                            </p>
                          </div>
                          {gap.isSignificant && (
                            <Badge variant="destructive" className="text-xs">
                              Significant
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Gap: </span>
                            <span
                              className={`font-medium ${
                                gap.gap < 0 ? 'text-red-600' : 'text-green-600'
                              }`}
                            >
                              {gap.gap > 0 ? '+' : ''}
                              {gap.gap.toFixed(1)}pp
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">p-value: </span>
                            <span className="font-mono text-xs">{gap.pValue.toFixed(4)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {fairnessNote.recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {fairnessNote.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded border">
                <p className="font-medium mb-1">Privacy Note:</p>
                <p>
                  Fairness metrics are calculated only for users who have opted-in to share
                  demographic information. All data is aggregated at the cohort level to
                  protect individual privacy. Demographics are never required and never used
                  in matching or ranking.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
