/**
 * Admin Fairness Notes Dashboard
 *
 * Displays list of fairness notes, cohort analysis charts,
 * and highlights significant gaps.
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Download, Info, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { apiFetch } from '@/lib/api/fetch';

interface Finding {
  type: 'gap' | 'no_gap' | 'insufficient_data';
  severity: 'critical' | 'moderate' | 'low' | 'none';
  cohorts: string[];
  metric: string;
  description: string;
  gapPercentage?: number;
  pValue?: number;
}

interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  targetCohorts: string[];
}

interface CohortAnalysis {
  cohortName: string;
  sampleSize: number;
  introductionRate: number;
  contractRate: number;
}

interface FairnessNote {
  id: string;
  releaseVersion: string;
  generatedAt: string;
  cohortData: CohortAnalysis[];
  findings: Finding[];
  recommendations: Recommendation[];
  status: 'draft' | 'published' | 'archived';
  hasSignificantGaps: boolean;
  minSampleSize: number;
  pValue: string;
}

export default function FairnessNotesPage() {
  const [notes, setNotes] = useState<FairnessNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newVersion, setNewVersion] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/admin/fairness/notes');
      const data = await response.json();

      if (data.success) {
        setNotes(data.notes);
      } else {
        setError(data.error || 'Failed to fetch fairness notes');
      }
    } catch (err) {
      setError('Error loading fairness notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateNote = async () => {
    if (!newVersion.trim()) {
      alert('Please enter a release version');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await apiFetch('/api/admin/fairness/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseVersion: newVersion }),
      });

      const data = await response.json();

      if (data.success) {
        setNewVersion('');
        await fetchNotes();
        alert('Fairness note generated successfully!');
      } else {
        setError(data.error || 'Failed to generate fairness note');
      }
    } catch (err) {
      setError('Error generating fairness note');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading fairness notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fairness Notes</h1>
          <p className="text-muted-foreground">
            Automated fairness analysis per release with cohort comparisons
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Generate New Note</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Fairness Note</DialogTitle>
              <DialogDescription>
                Create a new fairness note for a specific release version. This will analyze all
                demographic cohorts and identify any significant gaps.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="version">Release Version</Label>
                <Input
                  id="version"
                  placeholder="e.g., v1.2.0"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button onClick={generateNote} disabled={generating} className="w-full">
                {generating ? 'Generating...' : 'Generate Fairness Note'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-2">
              <Info className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">No fairness notes yet</p>
              <p className="text-sm text-muted-foreground">
                Generate your first fairness note to start tracking equity metrics
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {notes.map((note) => (
            <Card key={note.id} className="overflow-hidden">
              <CardHeader
                className={
                  note.hasSignificantGaps ? 'bg-destructive/10 border-b border-destructive/20' : ''
                }
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {note.releaseVersion}
                      {note.hasSignificantGaps ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </CardTitle>
                    <CardDescription>
                      Generated {new Date(note.generatedAt).toLocaleDateString()} •{' '}
                      {note.cohortData.length} cohorts analyzed
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(note.status)}>{note.status}</Badge>
                    {note.hasSignificantGaps && (
                      <Badge variant="destructive">Significant Gaps Detected</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Cohort Analysis Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Cohort Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Array.isArray(note.cohortData) ? note.cohortData : []).map((cohort) => (
                      <Card key={cohort.cohortName}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">{cohort.cohortName}</CardTitle>
                          <CardDescription>n = {cohort.sampleSize}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Introduction Rate:</span>
                            <span className="font-medium">
                              {Number.isFinite(Number(cohort.introductionRate))
                                ? Number(cohort.introductionRate).toFixed(1)
                                : '0.0'}
                              %
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Contract Rate:</span>
                            <span className="font-medium">
                              {Number.isFinite(Number(cohort.contractRate))
                                ? Number(cohort.contractRate).toFixed(1)
                                : '0.0'}
                              %
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Findings */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Findings</h3>
                  <div className="space-y-3">
                    {(Array.isArray(note.findings) ? note.findings : []).map((finding, idx) => (
                      <Alert
                        key={idx}
                        variant={
                          finding.type === 'gap' && finding.severity === 'critical'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        <div className="flex items-start gap-3">
                          {finding.type === 'gap' ? (
                            <AlertCircle className="h-5 w-5 mt-0.5" />
                          ) : finding.type === 'no_gap' ? (
                            <CheckCircle className="h-5 w-5 mt-0.5 text-green-600" />
                          ) : (
                            <Info className="h-5 w-5 mt-0.5" />
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <AlertTitle className="text-sm font-medium">
                                {String(finding.metric || 'unknown_metric')
                                  .replace(/_/g, ' ')
                                  .toUpperCase()}
                              </AlertTitle>
                              {finding.severity !== 'none' && (
                                <Badge variant={getSeverityColor(finding.severity)}>
                                  {finding.severity}
                                </Badge>
                              )}
                            </div>
                            <AlertDescription className="text-sm">
                              {finding.description || 'No description available.'}
                            </AlertDescription>
                            {typeof finding.pValue === 'number' &&
                              Number.isFinite(finding.pValue) && (
                                <p className="text-xs text-muted-foreground">
                                  Statistical significance: p = {finding.pValue.toFixed(4)}
                                </p>
                              )}
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {(Array.isArray(note.recommendations) ? note.recommendations : []).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Priority</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Rationale</TableHead>
                          <TableHead>Target Cohorts</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(Array.isArray(note.recommendations) ? note.recommendations : []).map(
                          (rec, idx) => (
                            <TableRow key={idx}>
                              <TableCell>
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
                              </TableCell>
                              <TableCell className="font-medium">{rec.action}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {rec.rationale}
                              </TableCell>
                              <TableCell>
                                {Array.isArray(rec.targetCohorts) &&
                                rec.targetCohorts.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {rec.targetCohorts.map((cohort) => (
                                      <Badge key={cohort} variant="outline">
                                        {cohort}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">All cohorts</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Export Button */}
                <div className="flex justify-end pt-4 border-t">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report (PDF)
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
