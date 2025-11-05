/**
 * GET /api/public/fairness/notes
 *
 * Public API for fetching published fairness notes (no auth required)
 * Used by the public transparency page at /fairness
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { fairnessNotes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Only fetch published notes (no authentication required for public access)
    const notes = await db
      .select()
      .from(fairnessNotes)
      .where(eq(fairnessNotes.status, 'published'))
      .orderBy(desc(fairnessNotes.publishedAt))
      .limit(Math.min(limit, 50)); // Cap at 50 for performance

    return NextResponse.json({
      notes,
      count: notes.length,
    });
  } catch (error) {
    console.error('Error fetching public fairness notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fairness notes' },
      { status: 500 }
    );
  }
}

