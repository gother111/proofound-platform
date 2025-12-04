/**
 * Fairness Report Admin Component
 *
 * Displays fairness analysis reports for platform admins
 * Allows viewing, downloading, and generating new reports
 *
 * PRD Reference: Part 7 - Automated Fairness Reporting
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FairnessReport } from '@/lib/analytics/fairness';
import { apiFetch } from '@/lib/api/fetch';

interface FairnessReportViewProps {
  initialReports?: any[];
}

export function FairnessReportView({ initialReports = [] }: FairnessReportViewProps) {
  const [reports, setReports] = useState(initialReports);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialReports.length === 0) {
      fetchReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/analytics/fairness/report?limit=20');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        if (data.reports && data.reports.length > 0) {
          setSelectedReport(data.reports[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch fairness reports:', error);
      toast.error('Failed to load fairness reports');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    const version = prompt('Enter release version (e.g., v1.2.3):');
    if (!version) return;

    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/analytics/fairness/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseVersion: version }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      toast.success('Fairness report generated successfully');

      // Refresh list
      await fetchReports();
      setSelectedReport(data.report);
    } catch (error) {
      console.error('Failed to generate fairness report:', error);
      toast.error('Failed to generate fairness report');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadMarkdown = () => {
    if (!selectedReport) return;

    const blob = new Blob([selectedReport.reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairness-report-${selectedReport.releaseVersion}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const analysis: FairnessReport | null = selectedReport?.metricsJson || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#2D3330]">Fairness Reports</h2>
          <p className="text-sm text-[#6B6760] mt-1">
            Automated fairness gap analysis across demographic segments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={generateReport} disabled={isGenerating} className="bg-[#1C4D3A]">
            {isGenerating ? 'Generating...' : 'Generate New Report'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recent Reports</CardTitle>
            <CardDescription>Click to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports.length === 0 ? (
                <p className="text-sm text-[#6B6760]">No reports generated yet</p>
              ) : (
                reports.map((report: any) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedReport?.id === report.id
                        ? 'border-[#1C4D3A] bg-[#E8F5E1]'
                        : 'border-[#E8E6DD] bg-white hover:border-[#1C4D3A]/30'
                    }`}
                  >
                    <div className="font-medium text-[#2D3330]">{report.releaseVersion}</div>
                    <div className="text-xs text-[#6B6760] mt-0.5">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                    {report.metricsJson?.segments && (
                      <div className="flex items-center gap-2 mt-2">
                        {report.metricsJson.segments.filter((s: any) => s.significant).length >
                        0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {report.metricsJson.segments.filter((s: any) => s.significant).length}{' '}
                            Gaps
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800"
                          >
                            No Issues
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedReport ? selectedReport.releaseVersion : 'Select a report'}
                </CardTitle>
                {selectedReport && (
                  <CardDescription>
                    Generated {new Date(selectedReport.createdAt).toLocaleString()}
                  </CardDescription>
                )}
              </div>
              {selectedReport && (
                <Button variant="outline" size="sm" onClick={downloadMarkdown}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedReport ? (
              <p className="text-sm text-[#6B6760]">Select a report to view details</p>
            ) : !analysis ? (
              <p className="text-sm text-[#6B6760]">Report data unavailable</p>
            ) : (
              <Tabs defaultValue="summary">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="segments">Segments</TabsTrigger>
                  <TabsTrigger value="recommendations">Actions</TabsTrigger>
                </TabsList>

                {/* Summary Tab */}
                <TabsContent value="summary" className="space-y-4">
                  {/* Overall Status */}
                  <div
                    className={`p-4 rounded-lg border ${
                      analysis.segments.filter((s) => s.significant).length > 0
                        ? 'border-red-200 bg-red-50'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    {analysis.segments.filter((s) => s.significant).length > 0 ? (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Fairness Gaps Detected</p>
                          <p className="text-sm text-red-800">{analysis.summary}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900 mb-1">No Fairness Issues</p>
                          <p className="text-sm text-green-800">{analysis.summary}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Overall Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-[#E8E6DD] rounded-lg">
                      <p className="text-xs text-[#6B6760] mb-1">Total Matches</p>
                      <p className="text-2xl font-bold text-[#2D3330]">
                        {analysis.overallMetrics.totalMatches.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 border border-[#E8E6DD] rounded-lg">
                      <p className="text-xs text-[#6B6760] mb-1">Introductions</p>
                      <p className="text-2xl font-bold text-[#2D3330]">
                        {analysis.overallMetrics.totalIntroductions.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 border border-[#E8E6DD] rounded-lg">
                      <p className="text-xs text-[#6B6760] mb-1">Interviews</p>
                      <p className="text-2xl font-bold text-[#2D3330]">
                        {analysis.overallMetrics.totalInterviews.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 border border-[#E8E6DD] rounded-lg">
                      <p className="text-xs text-[#6B6760] mb-1">Contracts</p>
                      <p className="text-2xl font-bold text-[#2D3330]">
                        {analysis.overallMetrics.totalContracts.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Segments Tab */}
                <TabsContent value="segments" className="space-y-4">
                  {analysis.segments.length === 0 ? (
                    <p className="text-sm text-[#6B6760]">
                      No segment data available (insufficient opt-in participation)
                    </p>
                  ) : (
                    <Table>
                      <TableCaption>Demographic segment analysis</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Segment</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Gap</TableHead>
                          <TableHead>Samples</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysis.segments.map((seg, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{seg.segment}</TableCell>
                            <TableCell>{seg.segmentRate.toFixed(1)}%</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {seg.gap >= 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className={seg.gap >= 0 ? 'text-green-700' : 'text-red-700'}>
                                  {seg.gap >= 0 ? '+' : ''}
                                  {seg.gap.toFixed(1)}pp
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[#6B6760]">{seg.sampleSize}</TableCell>
                            <TableCell>
                              {seg.significant ? (
                                <Badge variant="destructive">
                                  Significant (p={seg.pValue.toFixed(3)})
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Normal</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-3">
                  {analysis.recommendations.length === 0 ? (
                    <p className="text-sm text-[#6B6760]">No actions required</p>
                  ) : (
                    <div className="space-y-2">
                      {analysis.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-[#E8E6DD] rounded-lg bg-[#F7F6F1]"
                        >
                          <div className="flex items-start gap-2">
                            <span className="font-semibold text-[#1C4D3A] flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <p className="text-sm text-[#2D3330]">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
