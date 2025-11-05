/**
 * Public Fairness & Transparency Page
 *
 * Displays published fairness notes showing commitment to equitable matching
 * No authentication required - public transparency page
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { AlertCircle, CheckCircle2, Info, TrendingUp, Shield, Users } from 'lucide-react';
import Link from 'next/link';

interface FairnessNote {
  id: string;
  releaseVersion: string;
  generatedAt: string;
  publishedAt: string;
  cohortData: any;
  findings: Finding[];
  recommendations: Recommendation[];
  hasSignificantGaps: boolean;
  minSampleSize: number;
  pValue: string | null;
}

interface Finding {
  severity: 'critical' | 'moderate' | 'low' | 'none';
  category: string;
  description: string;
  cohorts: string;
  metric: string;
  gap: number;
  pValue: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  targetDate?: string;
}

export default function FairnessPage() {
  const [notes, setNotes] = useState<FairnessNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/fairness/notes');
      if (!response.ok) {
        throw new Error('Failed to fetch fairness notes');
      }
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'none':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'moderate':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <TrendingUp className="w-4 h-4" />;
      case 'none':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F3EF] to-white">
      {/* Hero Section */}
      <div className="bg-[#1C4D3A] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Fairness & Transparency</h1>
          </div>
          <p className="text-xl text-[#D8D2C8] mb-6">
            Our commitment to equitable matching and bias reduction
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <Users className="w-8 h-8 mb-2" />
              <h3 className="font-semibold mb-1">Demographic Opt-In</h3>
              <p className="text-sm text-[#D8D2C8]">
                All fairness tracking requires explicit user consent. We never use demographics without permission.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 mb-2" />
              <h3 className="font-semibold mb-1">Statistical Testing</h3>
              <p className="text-sm text-[#D8D2C8]">
                We use rigorous statistical methods (p &lt; 0.05) to detect significant gaps between cohorts.
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <Shield className="w-8 h-8 mb-2" />
              <h3 className="font-semibold mb-1">Monthly Audits</h3>
              <p className="text-sm text-[#D8D2C8]">
                Automated fairness notes generated monthly to ensure ongoing equity in our matching system.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* What We Measure */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What We Measure</CardTitle>
            <CardDescription>
              Our fairness analysis compares outcomes across demographic cohorts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 bg-[#1C4D3A] rounded-full" />
              <div>
                <h4 className="font-semibold mb-1">Introduction Acceptance Rate</h4>
                <p className="text-sm text-muted-foreground">
                  How often candidates from different cohorts receive and accept match introductions
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 bg-[#C76B4A] rounded-full" />
              <div>
                <h4 className="font-semibold mb-1">Contract Signing Rate</h4>
                <p className="text-sm text-muted-foreground">
                  How often introductions lead to signed contracts across cohorts
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 bg-[#4A5943] rounded-full" />
              <div>
                <h4 className="font-semibold mb-1">Skills-Controlled Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  We control for skills and constraints to isolate potential bias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fairness Notes */}
        <h2 className="text-2xl font-bold mb-6">Published Fairness Notes</h2>

        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading fairness notes...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className="text-red-800">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && notes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Fairness Notes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Fairness notes will be published here monthly once we have sufficient data.
              </p>
              <p className="text-sm text-muted-foreground">
                We require a minimum of 40 matches per cohort to ensure statistical validity.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && notes.length > 0 && (
          <div className="space-y-6">
            {notes.map((note) => (
              <Card key={note.id} className="overflow-hidden">
                <CardHeader className={note.hasSignificantGaps ? 'bg-yellow-50' : 'bg-green-50'}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {note.hasSignificantGaps ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                        Release {note.releaseVersion}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Published {formatDate(note.publishedAt)} • Generated{' '}
                        {formatDate(note.generatedAt)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={note.hasSignificantGaps ? 'destructive' : 'default'}
                      className={
                        note.hasSignificantGaps ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }
                    >
                      {note.hasSignificantGaps ? 'Gaps Detected' : 'No Significant Gaps'}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {/* Findings */}
                    <AccordionItem value="findings">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Findings ({note.findings?.length || 0})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {note.findings && note.findings.length > 0 ? (
                          <div className="space-y-3">
                            {note.findings.map((finding, idx) => (
                              <div
                                key={idx}
                                className={`p-4 rounded-lg border ${getSeverityColor(finding.severity)}`}
                              >
                                <div className="flex items-start gap-2">
                                  {getSeverityIcon(finding.severity)}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {finding.category}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {finding.severity}
                                      </Badge>
                                    </div>
                                    <p className="font-medium mb-1">{finding.description}</p>
                                    <p className="text-sm mb-2">
                                      Cohorts: {finding.cohorts} • Metric: {finding.metric}
                                    </p>
                                    {finding.gap && (
                                      <p className="text-sm">
                                        Gap: {(finding.gap * 100).toFixed(1)}% • p-value:{' '}
                                        {finding.pValue?.toFixed(4)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4">
                            No significant findings in this analysis period.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Recommendations */}
                    <AccordionItem value="recommendations">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Recommendations ({note.recommendations?.length || 0})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {note.recommendations && note.recommendations.length > 0 ? (
                          <div className="space-y-3">
                            {note.recommendations.map((rec, idx) => (
                              <div key={idx} className="p-4 rounded-lg border bg-white">
                                <div className="flex items-start gap-3">
                                  <Badge
                                    variant={
                                      rec.priority === 'high'
                                        ? 'destructive'
                                        : rec.priority === 'medium'
                                          ? 'default'
                                          : 'secondary'
                                    }
                                  >
                                    {rec.priority}
                                  </Badge>
                                  <div className="flex-1">
                                    <p className="font-medium mb-1">{rec.action}</p>
                                    <p className="text-sm text-muted-foreground">{rec.rationale}</p>
                                    {rec.targetDate && (
                                      <p className="text-xs text-muted-foreground mt-2">
                                        Target: {formatDate(rec.targetDate)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-4">
                            Continue monitoring fairness metrics in upcoming releases.
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Methodology */}
                    <AccordionItem value="methodology">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Methodology
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 text-sm">
                          <p>
                            <strong>Sample Size:</strong> Minimum {note.minSampleSize} matches per cohort
                            required for statistical validity
                          </p>
                          <p>
                            <strong>Statistical Threshold:</strong> p &lt; 0.05 for significance testing
                            {note.pValue && ` (this analysis: p = ${parseFloat(note.pValue).toFixed(4)})`}
                          </p>
                          <p>
                            <strong>Controlled Variables:</strong> Skills match, experience level, location
                            preferences, and compensation alignment
                          </p>
                          <p>
                            <strong>Data Privacy:</strong> All demographic data is opt-in only. Users must
                            explicitly consent to participate in fairness tracking.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <Card className="mt-12 bg-[#1C4D3A] text-white border-none">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold mb-4">Help Us Improve Fairness</h3>
            <p className="text-[#D8D2C8] mb-6">
              Opt in to demographic tracking to help us monitor and improve fairness across our platform. Your
              data is private, secure, and used only for statistical analysis.
            </p>
            <div className="flex gap-4">
              <Button asChild variant="secondary">
                <Link href="/app/i/settings/fairness">Manage Demographic Opt-In</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                <Link href="/about/fairness-methodology">Learn More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

