/**
 * Fairness Report Generation API
 *
 * POST - Generate fairness report from live match data.
 * Supports preview mode for JSON inspection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';

type ReportWindow = {
  start: Date;
  end: Date;
  label: string;
};

function resolveReportWindow(input: unknown): ReportWindow {
  const end = new Date();

  if (typeof input === 'string' || typeof input === 'number') {
    const parsedDays = Number(input);
    const days = Number.isFinite(parsedDays) ? Math.min(Math.max(parsedDays, 1), 365) : 30;
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    return { start, end, label: `${days}d` };
  }

  if (
    input &&
    typeof input === 'object' &&
    'start' in input &&
    'end' in input &&
    typeof (input as any).start === 'string' &&
    typeof (input as any).end === 'string'
  ) {
    const start = new Date((input as any).start);
    const parsedEnd = new Date((input as any).end);
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(parsedEnd.getTime()) &&
      start <= parsedEnd
    ) {
      return { start, end: parsedEnd, label: `${start.toISOString()}_${parsedEnd.toISOString()}` };
    }
  }

  const fallbackStart = new Date(end);
  fallbackStart.setDate(end.getDate() - 30);
  return { start: fallbackStart, end, label: '30d' };
}

function toMarkdown(report: {
  generatedAt: string;
  window: { start: string; end: string; label: string };
  summary: { totalMatches: number; averageScore: number; minScore: number; maxScore: number };
  fairnessSignals: Array<{ metric: string; value: number; benchmark: number; status: string }>;
  recommendations: string[];
}) {
  const lines: string[] = [];
  lines.push('# Fairness Monitoring Report');
  lines.push('');
  lines.push(`Generated at: ${report.generatedAt}`);
  lines.push(`Window: ${report.window.start} -> ${report.window.end} (${report.window.label})`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Total matches analyzed: ${report.summary.totalMatches}`);
  lines.push(`- Average normalized match score: ${report.summary.averageScore.toFixed(2)}`);
  lines.push(
    `- Score range: ${report.summary.minScore.toFixed(2)} to ${report.summary.maxScore.toFixed(2)}`
  );
  lines.push('');
  lines.push('## Fairness Signals');
  for (const signal of report.fairnessSignals) {
    lines.push(
      `- ${signal.metric}: ${signal.value.toFixed(2)} (benchmark ${signal.benchmark.toFixed(2)}) [${signal.status}]`
    );
  }
  lines.push('');
  lines.push('## Recommendations');
  if (report.recommendations.length === 0) {
    lines.push('- Continue monitoring current fairness indicators.');
  } else {
    for (const recommendation of report.recommendations) {
      lines.push(`- ${recommendation}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;

    const supabase = await createClient();
    const body = await req.json().catch(() => ({}));
    const preview = Boolean(body.preview);
    const format = body.format === 'json' ? 'json' : 'markdown';
    const window = resolveReportWindow(body.dateRange);

    const { data: matchRows, error: matchError } = await supabase
      .from('matches')
      .select('score, profile_id, assignment_id, created_at')
      .gte('created_at', window.start.toISOString())
      .lte('created_at', window.end.toISOString());

    if (matchError) {
      return NextResponse.json({ error: 'Failed to fetch match data' }, { status: 500 });
    }

    const normalizedScores = (matchRows || [])
      .map((match) => {
        const rawScore = Number(match.score);
        if (!Number.isFinite(rawScore)) return null;
        return rawScore <= 1 ? rawScore * 100 : rawScore;
      })
      .filter((score): score is number => score !== null);

    const totalMatches = normalizedScores.length;
    const averageScore =
      totalMatches > 0 ? normalizedScores.reduce((sum, score) => sum + score, 0) / totalMatches : 0;
    const minScore = totalMatches > 0 ? Math.min(...normalizedScores) : 0;
    const maxScore = totalMatches > 0 ? Math.max(...normalizedScores) : 0;
    const distributionEquity = totalMatches > 1 ? Math.max(0, 100 - (maxScore - minScore)) : 100;
    const uniqueProfiles = new Set((matchRows || []).map((m) => m.profile_id).filter(Boolean));
    const uniqueAssignments = new Set(
      (matchRows || []).map((m) => m.assignment_id).filter(Boolean)
    );
    const profileCoverage = totalMatches > 0 ? (uniqueProfiles.size / totalMatches) * 100 : 0;
    const assignmentCoverage = totalMatches > 0 ? (uniqueAssignments.size / totalMatches) * 100 : 0;

    const fairnessSignals = [
      {
        metric: 'Average Match Quality',
        value: averageScore,
        benchmark: 75,
        status: averageScore >= 75 ? 'good' : averageScore >= 60 ? 'warning' : 'critical',
      },
      {
        metric: 'Match Distribution Equity',
        value: distributionEquity,
        benchmark: 80,
        status:
          distributionEquity >= 80 ? 'good' : distributionEquity >= 65 ? 'warning' : 'critical',
      },
      {
        metric: 'Profile Representation Coverage',
        value: profileCoverage,
        benchmark: 75,
        status: profileCoverage >= 75 ? 'good' : profileCoverage >= 60 ? 'warning' : 'critical',
      },
      {
        metric: 'Assignment Opportunity Coverage',
        value: assignmentCoverage,
        benchmark: 80,
        status:
          assignmentCoverage >= 80 ? 'good' : assignmentCoverage >= 65 ? 'warning' : 'critical',
      },
    ];

    const recommendations = fairnessSignals
      .filter((signal) => signal.value < signal.benchmark)
      .map((signal) => {
        if (signal.metric === 'Average Match Quality') {
          return 'Revisit scoring weights and calibrate skill-to-impact balancing.';
        }
        if (signal.metric === 'Match Distribution Equity') {
          return 'Review score spread outliers and add fairness calibration checks pre-publish.';
        }
        if (signal.metric === 'Profile Representation Coverage') {
          return 'Expand sourcing and matching coverage for underrepresented profile segments.';
        }
        return 'Audit assignment workflows for bottlenecks in candidate progression.';
      });

    const report = {
      generatedAt: new Date().toISOString(),
      window: {
        start: window.start.toISOString(),
        end: window.end.toISOString(),
        label: window.label,
      },
      summary: {
        totalMatches,
        averageScore,
        minScore,
        maxScore,
      },
      fairnessSignals,
      recommendations,
    };

    await supabase.from('analytics_events').insert({
      user_id: adminUser.userId,
      event_type: 'fairness_report_generated',
      event_data: {
        window: report.window,
        format: preview ? 'preview' : format,
        totalMatches,
      },
    });

    if (preview || format === 'json') {
      return NextResponse.json({
        preview: true,
        report,
      });
    }

    const markdown = toMarkdown(report);
    const fileDate = new Date().toISOString().split('T')[0];
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="fairness-report-${fileDate}.md"`,
      },
    });
  } catch (error) {
    console.error('Fairness report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
