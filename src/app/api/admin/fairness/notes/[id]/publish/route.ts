/**
 * POST /api/admin/fairness/notes/[id]/publish
 *
 * Publish a draft fairness note (makes it visible on public page)
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-context';
import { publishFairnessNote } from '@/lib/analytics/fairness-note-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication (admin check)
    const user = await requireAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Publish the fairness note
    await publishFairnessNote(id);

    return NextResponse.json({
      success: true,
      message: 'Fairness note published successfully',
    });
  } catch (error) {
    console.error('Error publishing fairness note:', error);
    return NextResponse.json(
      { error: 'Failed to publish fairness note' },
      { status: 500 }
    );
  }
}

