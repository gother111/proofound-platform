import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';

import { db } from '@/db';
import { savedSearches, type InsertSavedSearch } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

const SavedSearchSchema = z.object({
  name: z.string().min(1),
  causes: z.array(z.string()).optional(),
  valuesTags: z.array(z.string()).optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().int().optional(),
  compMax: z.number().int().optional(),
  hoursMin: z.number().int().optional(),
  hoursMax: z.number().int().optional(),
  industries: z.array(z.string()).optional(),
  alertEnabled: z.boolean().optional(),
  alertThreshold: z.number().min(0).max(1).optional(),
  alertFrequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
});

export const dynamic = 'force-dynamic';

// GET /api/saved-searches - list current user's saved searches
export async function GET() {
  try {
    const user = await requireAuth();

    const searches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, user.id))
      .orderBy(desc(savedSearches.createdAt));

    return NextResponse.json({ savedSearches: searches });
  } catch (error) {
    log.error('saved-searches.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 });
  }
}

// POST /api/saved-searches - create a saved search
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = SavedSearchSchema.parse(body);

    const payload: InsertSavedSearch = {
      userId: user.id,
      name: data.name,
      causes: data.causes ?? [],
      valuesTags: data.valuesTags ?? [],
      locationMode: data.locationMode ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      compMin: data.compMin ?? null,
      compMax: data.compMax ?? null,
      hoursMin: data.hoursMin ?? null,
      hoursMax: data.hoursMax ?? null,
      industries: data.industries ?? [],
      alertEnabled: data.alertEnabled ?? true,
      alertThreshold: (data.alertThreshold ?? 0.75).toString(),
      alertFrequency: data.alertFrequency ?? 'immediate',
      lastAlertedAt: null,
    };

    const [created] = await db.insert(savedSearches).values(payload).returning();

    log.info('saved-searches.created', {
      userId: user.id,
      savedSearchId: created.id,
    });

    return NextResponse.json({ savedSearch: created });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }

    log.error('saved-searches.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 });
  }
}
