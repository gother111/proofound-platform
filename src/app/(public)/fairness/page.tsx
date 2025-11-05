/**
 * Public Fairness & Transparency Page
 *
 * Displays published fairness notes showing commitment to equitable matching
 * No authentication required - public transparency page
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Info, TrendingUp, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { FairnessNoteAccordion } from './FairnessNoteAccordion';

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

// Force dynamic rendering to avoid build-time data fetching
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

async function getPublishedNotes() {
  try {
    const notes = await db
      .select()
      .from(fairnessNotes)
      .where(eq(fairnessNotes.status, 'published'))
      .orderBy(desc(fairnessNotes.generatedAt));
    
    return notes;
  } catch (error) {
    console.error('Error fetching fairness notes:', error);
    return [];
  }
}

function formatDate(dateString: string | Date) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function FairnessPage() {
  const notes = await getPublishedNotes();

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

        {notes.length === 0 ? (
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
        ) : (
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
                        Published {note.publishedAt && formatDate(note.publishedAt)} • Generated{' '}
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
                  <FairnessNoteAccordion note={note} />
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

