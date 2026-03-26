/**
 * SUS Survey Prompt API
 *
 * GET    /api/surveys/sus/prompt -> fetch pending prompt (marks as shown)
 * POST   /api/surveys/sus/prompt -> update prompt status (shown | skip)
 *
 * Used by the SUSPromptHost client to surface SUSDialog at runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import {
  getPendingSUSPrompts,
  markPromptAsShown,
  markPromptAsSkipped,
} from '@/lib/surveys/sus-triggers';
import { log } from '@/lib/log';

export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const prompt = await getPendingSUSPrompts(user.id);
    if (!prompt) {
      return NextResponse.json({ prompt: null });
    }

    // Mark as shown so we do not repeatedly pop it
    await markPromptAsShown(prompt.id);

    return NextResponse.json({
      prompt: {
        id: prompt.id,
        trigger: prompt.trigger,
        createdAt: prompt.createdAt,
      },
    });
  } catch (error) {
    log.error('sus_prompt.get_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to fetch SUS prompt' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { promptId, action } = await request.json();

    if (!promptId || !['shown', 'skip'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (action === 'shown') {
      await markPromptAsShown(promptId);
    } else if (action === 'skip') {
      await markPromptAsSkipped(promptId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('sus_prompt.post_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to update SUS prompt' }, { status: 500 });
  }
}
