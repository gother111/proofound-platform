/**
 * Well-Being Delta Calculation
 *
 * Calculates change in stress/control levels over specified period
 */

import { db } from '@/db';
import { wellbeingCheckins } from '@/db/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

export interface WellBeingDelta {
  stressDelta: number; // Positive = less stress (improvement)
  controlDelta: number; // Positive = more control (improvement)
  period: 14 | 30;
  checkinsCount: number;
  hasBaseline: boolean;
}

/**
 * Calculate Well-Being Delta
 *
 * Compares recent check-ins against baseline (first week)
 *
 * @param userId - User ID
 * @param periodDays - Period to calculate delta (14 or 30 days)
 * @returns Delta values (positive = improvement)
 */
export async function calculateWellBeingDelta(
  userId: string,
  periodDays: 14 | 30 = 14
): Promise<WellBeingDelta> {
  // 1. Get all check-ins for user
  const allCheckins = await db.query.wellbeingCheckins.findMany({
    where: eq(wellbeingCheckins.userId, userId),
    orderBy: [desc(wellbeingCheckins.createdAt)],
  });

  if (allCheckins.length === 0) {
    return {
      stressDelta: 0,
      controlDelta: 0,
      period: periodDays,
      checkinsCount: 0,
      hasBaseline: false,
    };
  }

  // 2. Get baseline check-ins (first 7 days)
  const firstCheckinDate = new Date(allCheckins[allCheckins.length - 1].createdAt);
  const baselineEndDate = new Date(firstCheckinDate);
  baselineEndDate.setDate(baselineEndDate.getDate() + 7);

  const baselineCheckins = allCheckins.filter((checkin) => {
    const date = new Date(checkin.createdAt);
    return date >= firstCheckinDate && date <= baselineEndDate;
  });

  // Need at least 2 baseline check-ins for meaningful comparison
  if (baselineCheckins.length < 2) {
    return {
      stressDelta: 0,
      controlDelta: 0,
      period: periodDays,
      checkinsCount: allCheckins.length,
      hasBaseline: false,
    };
  }

  // 3. Get recent check-ins (last N days)
  const now = new Date();
  const recentStartDate = new Date(now);
  recentStartDate.setDate(recentStartDate.getDate() - periodDays);

  const recentCheckins = allCheckins.filter((checkin) => {
    const date = new Date(checkin.createdAt);
    return date >= recentStartDate && date <= now;
  });

  if (recentCheckins.length === 0) {
    return {
      stressDelta: 0,
      controlDelta: 0,
      period: periodDays,
      checkinsCount: allCheckins.length,
      hasBaseline: true,
    };
  }

  // 4. Calculate average stress/control for each period
  const baselineAvgStress =
    baselineCheckins.reduce((sum, c) => sum + c.stressLevel, 0) / baselineCheckins.length;
  const baselineAvgControl =
    baselineCheckins.reduce((sum, c) => sum + c.controlLevel, 0) / baselineCheckins.length;

  const recentAvgStress =
    recentCheckins.reduce((sum, c) => sum + c.stressLevel, 0) / recentCheckins.length;
  const recentAvgControl =
    recentCheckins.reduce((sum, c) => sum + c.controlLevel, 0) / recentCheckins.length;

  // 5. Calculate delta (recent - baseline)
  // For stress: lower is better, so negate the delta
  // For control: higher is better
  const stressDelta = baselineAvgStress - recentAvgStress; // Positive = less stress
  const controlDelta = recentAvgControl - baselineAvgControl; // Positive = more control

  return {
    stressDelta: Math.round(stressDelta * 10) / 10, // Round to 1 decimal
    controlDelta: Math.round(controlDelta * 10) / 10,
    period: periodDays,
    checkinsCount: recentCheckins.length,
    hasBaseline: true,
  };
}

/**
 * Get Well-Being Trend
 *
 * Returns trend over time (weekly averages)
 *
 * @param userId - User ID
 * @param weeks - Number of weeks to include
 * @returns Weekly average stress/control levels
 */
export async function getWellBeingTrend(
  userId: string,
  weeks: number = 4
): Promise<
  Array<{
    week: number;
    weekStart: string;
    avgStress: number;
    avgControl: number;
    checkinsCount: number;
  }>
> {
  // 1. Get check-ins for last N weeks
  const weeksAgo = new Date();
  weeksAgo.setDate(weeksAgo.getDate() - weeks * 7);

  const checkins = await db.query.wellbeingCheckins.findMany({
    where: and(eq(wellbeingCheckins.userId, userId), gte(wellbeingCheckins.createdAt, weeksAgo)),
    orderBy: [desc(wellbeingCheckins.createdAt)],
  });

  if (checkins.length === 0) {
    return [];
  }

  // 2. Group by week
  const weeklyData = new Map<number, { stress: number[]; control: number[]; weekStart: Date }>();

  const now = new Date();
  for (const checkin of checkins) {
    const checkinDate = new Date(checkin.createdAt);
    const daysDiff = Math.floor((now.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(daysDiff / 7);

    if (!weeklyData.has(weekNumber)) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekNumber * 7);
      weeklyData.set(weekNumber, { stress: [], control: [], weekStart });
    }

    weeklyData.get(weekNumber)!.stress.push(checkin.stressLevel);
    weeklyData.get(weekNumber)!.control.push(checkin.controlLevel);
  }

  // 3. Calculate averages per week
  const trend = Array.from(weeklyData.entries()).map(([week, data]) => ({
    week,
    weekStart: data.weekStart.toISOString(),
    avgStress: Math.round((data.stress.reduce((a, b) => a + b, 0) / data.stress.length) * 10) / 10,
    avgControl:
      Math.round((data.control.reduce((a, b) => a + b, 0) / data.control.length) * 10) / 10,
    checkinsCount: data.stress.length,
  }));

  // Sort by week (most recent first)
  trend.sort((a, b) => a.week - b.week);

  return trend;
}
