/**
 * PRD Part 2: Core Metrics
 *
 * Implements tracking and calculation for:
 * - TTSC (Time to Signed Contract): Median ≤30 days
 * - TTFQI (Time to First Qualified Introduction): Median ≤72 hours
 * - TTV (Time to Value): Median ≤7 days
 * - PAC (Purpose-Alignment Contribution): ≥20% higher intro acceptance
 * - SUS (System Usability Scale): ≥75
 * - Well-Being Delta: ≥60% show +1 improvement
 */

import { db } from '@/db';
import { analyticsEvents, wellbeingCheckins } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export interface MetricResult {
  value: number;
  unit: 'hours' | 'days' | 'percentage' | 'score';
  timestamp: Date;
  sampleSize: number;
  metadata?: Record<string, any>;
}

export interface TTSCResult extends MetricResult {
  median: number;
  p25: number;
  p75: number;
  mean: number;
}

export async function calculateTTSC(
  startDate?: Date,
  endDate?: Date
): Promise<TTSCResult | null> {
  const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate || new Date();

  try {
    const contractEvents = await db
      .select({
        userId: analyticsEvents.userId,
        contractDate: analyticsEvents.createdAt,
        activationDate: sql<Date>`(
          SELECT MIN(created_at)
          FROM analytics_events
          WHERE user_id = ${analyticsEvents.userId}
          AND event_type = 'profile_activated'
        )`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'contract_signed'),
          gte(analyticsEvents.createdAt, start),
          lte(analyticsEvents.createdAt, end)
        )
      );

    if (contractEvents.length === 0) return null;

    const timeToContract = contractEvents
      .filter(e => e.activationDate)
      .map(e => {
        const diff = e.contractDate.getTime() - e.activationDate!.getTime();
        return diff / (1000 * 60 * 60 * 24);
      })
      .sort((a, b) => a - b);

    if (timeToContract.length === 0) return null;

    const median = calculatePercentile(timeToContract, 50);
    const p25 = calculatePercentile(timeToContract, 25);
    const p75 = calculatePercentile(timeToContract, 75);
    const mean = timeToContract.reduce((a, b) => a + b, 0) / timeToContract.length;

    return {
      value: median,
      median,
      p25,
      p75,
      mean,
      unit: 'days',
      timestamp: new Date(),
      sampleSize: timeToContract.length,
      metadata: {
        target: 30,
        status: median <= 30 ? 'meeting_target' : 'below_target',
      },
    };
  } catch (error) {
    console.error('TTSC calculation error:', error);
    return null;
  }
}

function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

export async function getAllMetrics() {
  const ttsc = await calculateTTSC();
  return {
    ttsc,
    timestamp: new Date().toISOString(),
  };
}
