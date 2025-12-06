import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { savedSearches } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

const UpdateSavedSearchSchema = z.object({
  name: z.string().min(1).optional(),
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

// GET /api/saved-searches/[id] - fetch a single saved search
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    const search = await db.query.savedSearches.findFirst({
      where: and(eq(savedSearches.id, params.id), eq(savedSearches.userId, user.id)),
    });

    if (!search) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    return NextResponse.json({ savedSearch: search });
  } catch (error) {
    log.error('saved-searches.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      savedSearchId: params.id,
    });
    return NextResponse.json({ error: 'Failed to fetch saved search' }, { status: 500 });
  }
}

// PUT /api/saved-searches/[id] - update a saved search
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const data = UpdateSavedSearchSchema.parse(body);

    const [updated] = await db
      .update(savedSearches)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(savedSearches.id, params.id), eq(savedSearches.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    log.info('saved-searches.updated', {
      userId: user.id,
      savedSearchId: params.id,
    });

    return NextResponse.json({ savedSearch: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }

    log.error('saved-searches.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      savedSearchId: params.id,
    });
    return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 });
  }
}

// DELETE /api/saved-searches/[id] - remove a saved search
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    const [deleted] = await db
      .delete(savedSearches)
      .where(and(eq(savedSearches.id, params.id), eq(savedSearches.userId, user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 });
    }

    log.info('saved-searches.deleted', {
      userId: user.id,
      savedSearchId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('saved-searches.delete.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      savedSearchId: params.id,
    });
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
  }
}
