/**
 * Manual Fairness Report Generation Page
 *
 * Admin page for generating comprehensive fairness gap reports.
 * PRD Reference: Part 2 - Fairness Gap Metric (Weekly Manual Trigger)
 */

'use client';

import { useState } from 'react';
import { use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Download, RefreshCw, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AppSurface } from '@/components/ui/v2/AppSurface';

export default function FairnessAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/analytics/org/fairness-note/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgSlug: slug }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastReport(data);
        toast.success('Fairness report generated successfully', {
          description: `Analyzed ${data.cohortsAnalyzed} cohorts with ${data.findings} findings`,
        });
      } else {
        const error = await response.json();
        toast.error('Failed to generate report', {
          description: error.message || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Failed to generate fairness report:', error);
      toast.error('Failed to generate report', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AppSurface>
      <div className="container mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-proofound-forest" />
            <h1 className="text-3xl font-bold text-foreground">Fairness Gap Analysis</h1>
          </div>
          <p className="text-muted-foreground">
            Generate comprehensive fairness reports to monitor hiring equity across demographics
          </p>
        </div>

        <div className="grid gap-6">
          {/* Generate Report Card */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Generate Fairness Report
                </h2>
                <p className="text-sm text-muted-foreground">
                  Analyze hiring outcomes across role families, seniority levels, and geographic
                  regions to identify potential fairness gaps. Reports cover the last 30 days of
                  hiring activity.
                </p>
              </div>
            </div>

            <div className="bg-japandi-bg rounded-lg p-4 mb-6 border border-proofound-stone">
              <h3 className="text-sm font-semibold text-foreground mb-2">What's Included:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-proofound-forest" />
                  Time-to-Contract (TTSC) analysis by demographic cohorts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-proofound-forest" />
                  Statistical significance testing (p &lt; 0.05)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-proofound-forest" />
                  Actionable recommendations for addressing gaps
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-proofound-forest" />
                  Percentile distributions (P25, P50, P75)
                </li>
              </ul>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full bg-proofound-forest text-white hover:bg-proofound-forest/90"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Generate Comprehensive Report
                </>
              )}
            </Button>

            {lastReport && (
              <div className="mt-4 p-4 bg-proofound-success-tint rounded-lg border border-proofound-forest/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-proofound-forest mb-1">
                      Report Generated Successfully
                    </p>
                    <p className="text-sm text-foreground">
                      Analyzed {lastReport.cohortsAnalyzed} cohorts • {lastReport.findings}{' '}
                      {lastReport.findings === 1 ? 'finding' : 'findings'}
                    </p>
                    {lastReport.hasSignificantGaps && (
                      <Badge
                        variant="secondary"
                        className="mt-2 bg-proofound-terracotta/10 text-proofound-terracotta"
                      >
                        Gaps Detected - Review Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Information Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-proofound-success-tint flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-proofound-forest" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Significance Threshold</h3>
                  <p className="text-sm text-muted-foreground">
                    Gaps are flagged if a cohort's median TTSC deviates by &gt;20% from the global
                    median with at least 10 samples.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FFF4E6] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-proofound-terracotta" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Data Privacy</h3>
                  <p className="text-sm text-muted-foreground">
                    All cohort analysis is aggregated and anonymized. Individual candidate data is
                    never included in fairness reports.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Automated Reports Info */}
          <Card className="p-6 bg-gradient-to-br from-[#F7F6F1] to-white border-proofound-stone">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
              Automated Daily Analysis
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fairness gap analysis runs automatically every day at 2 AM UTC (analyzing the last 7
              days). You can view the latest automated analysis on your organization dashboard.
            </p>
            <p className="text-xs text-muted-foreground">
              Manual reports provide more comprehensive analysis (30 days, additional demographics)
              compared to the daily automated analysis.
            </p>
          </Card>
        </div>
      </div>
    </AppSurface>
  );
}
