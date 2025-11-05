/**
 * POST /api/admin/fairness/notes/[id]/archive
 *
 * Archive a published fairness note (removes from public page)
 * Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { archiveFairnessNote } from '@/lib/analytics/fairness-note-generator';

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

    // Archive the fairness note
    await archiveFairnessNote(id);

    return NextResponse.json({
      success: true,
      message: 'Fairness note archived successfully',
    });
  } catch (error) {
    console.error('Error archiving fairness note:', error);
    return NextResponse.json(
      { error: 'Failed to archive fairness note' },
      { status: 500 }
    );
  }
}

