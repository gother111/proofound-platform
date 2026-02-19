/**
 * Deprecated Data Import Preview API
 *
 * Uses the same normalization/validation contract as /api/user/import to keep
 * preview and apply decisions aligned.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  detectConflicts,
  analyzeConflicts,
  autoResolveConflicts,
} from '@/lib/data-import/conflict-resolver';
import { addDeprecationHeaders } from '@/lib/api/deprecation';
import { normalizeImportRequest } from '@/lib/contracts/data-portability';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const CanonicalPath = '/api/user/import';

/**
 * POST /api/data-import/preview
 *
 * Analyzes import data and returns conflicts.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    let importData;
    try {
      const normalized = normalizeImportRequest(await request.json());
      importData = normalized.data;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return addDeprecationHeaders(
          NextResponse.json(
            {
              error: 'Invalid data format',
              details: error.errors,
            },
            { status: 400 }
          ),
          CanonicalPath
        );
      }

      return addDeprecationHeaders(
        NextResponse.json(
          {
            error: 'Invalid data format',
            message: error instanceof Error ? error.message : 'Could not parse import payload',
          },
          { status: 400 }
        ),
        CanonicalPath
      );
    }

    log.info('data.import.preview.started', {
      userId: user.id,
    });

    const existingIndividualProfile = await db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, user.id),
    });

    const allConflicts = [];

    if (importData.profile && existingIndividualProfile) {
      const conflicts = detectConflicts(existingIndividualProfile, importData.profile, 'profile');
      allConflicts.push(...conflicts);
    }

    const analysis = analyzeConflicts(allConflicts);
    const autoResolutions = autoResolveConflicts(allConflicts);
    const conflictsByCategory = groupConflictsByCategory(allConflicts);

    log.info('data.import.preview.completed', {
      userId: user.id,
      totalConflicts: allConflicts.length,
      autoResolvable: analysis.autoResolvable,
      requiresManual: analysis.requiresManual,
    });

    return addDeprecationHeaders(
      NextResponse.json({
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
      }),
      CanonicalPath
    );
  } catch (error) {
    log.error('data.import.preview.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return addDeprecationHeaders(
      NextResponse.json(
        {
          error: 'Failed to preview import',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
        { status: 500 }
      ),
      CanonicalPath
    );
  }
}

function groupConflictsByCategory(conflicts: any[]) {
  const categories = new Map<string, any[]>();

  for (const conflict of conflicts) {
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
