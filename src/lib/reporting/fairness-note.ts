/**
 * Automated Fairness Note Generation
 * Implements PRD Gap 3: Generate fairness reports automatically
 */

import { calculateFairnessGaps, type FairnessAnalysis } from '@/lib/analytics/fairness-gaps';
import { db } from '@/lib/db';
import { fairnessReports } from '@/lib/db/schema';

/**
 * Generate a comprehensive fairness note for a release
 */
export async function generateFairnessNote(releaseVersion: string): Promise<string> {
  // Calculate fairness gaps for the last release window
  const dateRange = getLastReleaseWindow();
  const analysis = await calculateFairnessGaps({ dateRange });

  // Generate markdown report
  const report = `# Fairness Note - ${releaseVersion}

**Generated:** ${new Date().toISOString().split('T')[0]}

## Executive Summary

- **Overall Fairness Score:** ${analysis.score}/100
- **Total Matches Analyzed:** ${analysis.totalMatches}
- **Demographics Opt-in Rate:** ${analysis.optInRate.toFixed(1)}%
- **Statistically Significant Gaps:** ${analysis.significantGaps}

## Acceptance Rate Analysis

${generateAcceptanceRateTable(analysis)}

## Contract Rate Analysis

${generateContractRateTable(analysis)}

## Statistical Significance

All gaps tested using chi-square test (α=0.05). Only gaps with:
- p-value < 0.05
- Absolute difference > 5pp

are flagged as statistically significant.

## Recommendations

${analysis.recommendations.map((r) => `- ${r}`).join('\n')}

## Methodology

- **Sample Size:** ${analysis.sampleSize} matches with opt-in demographics
- **Date Range:** ${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}
- **Statistical Test:** Chi-square test for independence
- **Significance Level:** α = 0.05
- **Minimum Sample:** 30 per demographic group

## Privacy & Transparency

- All demographic data is opt-in only
- Individual data is never disclosed
- Only aggregate statistics are reported
- Full methodology is publicly available

---

*This report is generated automatically as part of Proofound's commitment to fairness and transparency.*
`;

  // Store report in database
  await db.insert(fairnessReports).values({
    releaseVersion,
    reportMarkdown: report,
    metricsJson: analysis,
    createdAt: new Date(),
  });

  return report;
}

function generateAcceptanceRateTable(analysis: FairnessAnalysis): string {
  if (analysis.gaps.length === 0) {
    return '*Insufficient data for analysis.*';
  }

  let table = '| Dimension | Group | Rate | vs. Baseline | Significant |\n';
  table += '|-----------|-------|------|--------------|-------------|\n';

  for (const gap of analysis.gaps) {
    for (const group of gap.groups) {
      const diff = group.acceptanceRate - gap.baseline;
      const sigGap = gap.significantGaps.find((sg) => sg.group === group.group);
      const isSig = sigGap?.isSignificant ? '⚠️ Yes' : 'No';

      table += `| ${gap.dimension} | ${group.group} | ${group.acceptanceRate.toFixed(1)}% | ${diff >= 0 ? '+' : ''}${diff.toFixed(1)}pp | ${isSig} |\n`;
    }
  }

  return table;
}

function generateContractRateTable(analysis: FairnessAnalysis): string {
  if (analysis.gaps.length === 0) {
    return '*Insufficient data for analysis.*';
  }

  let table = '| Dimension | Group | Contracts | Rate |\n';
  table += '|-----------|-------|-----------|------|\n';

  for (const gap of analysis.gaps) {
    for (const group of gap.groups) {
      table += `| ${gap.dimension} | ${group.group} | ${group.contracts} | ${group.contractRate.toFixed(1)}% |\n`;
    }
  }

  return table;
}

/**
 * Get date range for last release window
 * Default: last 30 days
 */
function getLastReleaseWindow(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 30);

  return { start, end };
}
