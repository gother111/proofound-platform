/**
 * Public Fairness Dashboard
 * /fairness
 *
 * Implements PRD Gap 3: Public-facing fairness reporting
 */

import { db } from '@/lib/db';
import { fairnessReports } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

export const metadata = {
  title: 'Fairness & Transparency | Proofound',
  description: 'Our commitment to fair and equitable matching',
};

export default async function FairnessPage() {
  // Fetch latest published fairness report
  const latestReports = await db
    .select()
    .from(fairnessReports)
    .where()
    .orderBy(desc(fairnessReports.createdAt))
    .limit(3);

  const latestReport = latestReports[0];

  return (
    <div className="container max-w-5xl py-12">
      {/* Header */}
      <div className="space-y-4 mb-12 text-center">
        <Badge variant="secondary" className="mb-2">
          Transparency & Fairness
        </Badge>
        <h1 className="text-4xl font-bold">Our Commitment to Fairness</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We believe in transparent, equitable matching. Here's how we measure and maintain fairness
          in our platform.
        </p>
      </div>

      {/* Our Approach */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How We Measure Fairness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Proofound is committed to ensuring that our matching algorithm treats all users fairly,
            regardless of demographic characteristics. We:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Measure gaps:</strong> We analyze acceptance and contract rates across
              demographic groups (with opt-in data only)
            </li>
            <li>
              <strong>Test significance:</strong> We use chi-square statistical tests to identify
              meaningful differences
            </li>
            <li>
              <strong>Report regularly:</strong> We generate automated fairness notes with each
              release
            </li>
            <li>
              <strong>Take action:</strong> When gaps are identified, we investigate and adjust our
              algorithms
            </li>
            <li>
              <strong>Protect privacy:</strong> All demographic data is optional and aggregate-only
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Latest Report */}
      {latestReport && (
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Latest Fairness Note</CardTitle>
              <Badge>{latestReport.releaseVersion}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{latestReport.reportMarkdown}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Reports */}
      {latestReports.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {latestReports.slice(1).map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{report.releaseVersion}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="outline">View</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Methodology */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Our Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Data Collection</h3>
            <p className="text-sm text-muted-foreground">
              Users can optionally share demographic information. This data is never required and
              never shown to organizations. It exists solely for fairness monitoring.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Statistical Testing</h3>
            <p className="text-sm text-muted-foreground">
              We use chi-square tests (α=0.05) to determine if observed differences in outcomes are
              statistically significant. We only flag gaps that are both significant and substantial
              (&gt;5pp).
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Continuous Improvement</h3>
            <p className="text-sm text-muted-foreground">
              When we identify significant fairness gaps, we investigate root causes and make
              algorithm adjustments. All changes are documented in subsequent fairness notes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
