/**
 * JD to L4 Mapping API
 *
 * Parses job descriptions and maps skills to L4 taxonomy with explanations.
 * PRD Reference: Part 5 O6 - JD Mapping Feature
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { parseJobDescription, validateSkillSuggestions } from '@/lib/ai/jd-parser';
import { log } from '@/lib/log';

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { jdText } = await request.json();

    if (!jdText || typeof jdText !== 'string') {
      return NextResponse.json({ error: 'Job description text is required' }, { status: 400 });
    }

    if (jdText.length < 50) {
      return NextResponse.json(
        { error: 'Job description is too short. Please provide more detail.' },
        { status: 400 }
      );
    }

    if (jdText.length > 10000) {
      return NextResponse.json(
        { error: 'Job description is too long. Please limit to 10,000 characters.' },
        { status: 400 }
      );
    }

    log.info('jd-parser.started', {
      userId: user.id,
      textLength: jdText.length,
    });

    // Parse JD and extract skills
    const rawSuggestions = await parseJobDescription(jdText);

    // Validate against actual L4 taxonomy
    const suggestions = await validateSkillSuggestions(rawSuggestions);

    log.info('jd-parser.completed', {
      userId: user.id,
      suggestionsCount: suggestions.length,
    });

    return NextResponse.json({
      suggestions,
      parsedAt: new Date().toISOString(),
    });
  } catch (error) {
    log.error('jd-parser.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to parse job description' }, { status: 500 });
  }
}
