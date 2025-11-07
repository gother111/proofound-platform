/**
 * Data Import Preview API
 *
 * Detects conflicts between existing data and import data
 * Returns conflicts for user resolution before actual import
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { individualProfiles, matchingProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  detectConflicts,
  analyzeConflicts,
  autoResolveConflicts,
} from '@/lib/data-import/conflict-resolver';

export const dynamic = 'force-dynamic';

/**
 * POST /api/data-import/preview
 *
 * Analyzes import data and returns conflicts
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const importData = await request.json();

    log.info('data.import.preview.started', {
      userId: user.id,
    });

    // Fetch existing data
    const existingIndividualProfile = await db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, user.id),
    });

    const existingMatchingProfile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    // Detect conflicts
    const allConflicts = [];

    // Individual profile conflicts
    if (importData.profile?.individual && existingIndividualProfile) {
      const conflicts = detectConflicts(
        existingIndividualProfile,
        importData.profile.individual,
        'profile.individual'
      );
      allConflicts.push(...conflicts);
    }

    // Matching profile conflicts
    if (importData.profile?.matching && existingMatchingProfile) {
      const conflicts = detectConflicts(
        existingMatchingProfile,
        importData.profile.matching,
        'profile.matching'
      );
      allConflicts.push(...conflicts);
    }

    // Analyze conflicts
    const analysis = analyzeConflicts(allConflicts);

    // Generate auto-resolutions
    const autoResolutions = autoResolveConflicts(allConflicts);

    // Group conflicts by category for easier UI display
    const conflictsByCategory = groupConflictsByCategory(allConflicts);

    log.info('data.import.preview.completed', {
      userId: user.id,
      totalConflicts: allConflicts.length,
      autoResolvable: analysis.autoResolvable,
      requiresManual: analysis.requiresManual,
    });

    return NextResponse.json({
      success: true,
      conflicts: allConflicts,
      conflictsByCategory,
      analysis: {
        totalConflicts: allConflicts.length,
        autoResolvable: analysis.autoResolvable,
        requiresManual: analysis.requiresManual,
      },
      autoResolutions: Array.from(autoResolutions.entries()).map(([path, strategy]) => ({
        path,
        strategy,
      })),
      canAutoResolveAll: analysis.requiresManual === 0,
    });
  } catch (error) {
    log.error('data.import.preview.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to preview import',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * Group conflicts by category for easier display
 */
function groupConflictsByCategory(conflicts: any[]) {
  const categories = new Map<string, any[]>();

  for (const conflict of conflicts) {
    // Extract category from path (e.g., "profile.individual.bio" -> "profile")
    const parts = conflict.path.split('.');
    const category = parts[0] || 'general';

    if (!categories.has(category)) {
      categories.set(category, []);
    }

    categories.get(category)!.push(conflict);
  }

  return Array.from(categories.entries()).map(([category, items]) => ({
    category,
    count: items.length,
    conflicts: items,
  }));
}
