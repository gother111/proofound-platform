import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractSkillsWithAI } from '@/lib/ai/skill-extractor';
import { log } from '@/lib/log';

/**
 * POST /api/expertise/auto-suggest
 *
 * PRD Part 5 (F3 - Expertise Atlas)
 * Auto-suggest skills from pasted CV/JD text
 * Extracts potential skills and matches against taxonomy
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, context } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        {
          error: 'Invalid input',
          message: 'text field is required and must be a string',
        },
        { status: 400 }
      );
    }

    log.info('skill.auto_suggest.start', {
      userId: user.id,
      textLength: text.length,
      context: context || 'general',
    });

    // Use AI-powered extraction
    const result = await extractSkillsWithAI(text, context || 'general');

    // Format skills for frontend
    const suggestions = result.skills.map((skill) => ({
      id: skill.taxonomyCode || skill.skillName.toLowerCase().replace(/\s+/g, '-'),
      code: skill.taxonomyCode || '',
      name: skill.skillName,
      aliases: [],
      description: skill.context,
      slug: skill.skillName.toLowerCase().replace(/\s+/g, '-'),
      tags: null,
      score: skill.level,
      confidence: skill.confidence,
      level: skill.level,
      monthsExperience: skill.monthsExperience,
      relevance: skill.relevance,
    }));

    log.info('skill.auto_suggest.success', {
      userId: user.id,
      skillCount: suggestions.length,
      totalExperience: result.totalExperienceYears,
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 20), // Top 20 suggestions
      metadata: {
        textLength: text.length,
        totalMatches: suggestions.length,
        context: context || 'general',
        summary: result.summary,
        totalExperienceYears: result.totalExperienceYears,
        industries: result.industries,
        roles: result.roles,
        method: result.method || 'local-ai', // Shows: 'local-ai', 'api', or 'rule-based'
        processingTimeMs: result.processingTimeMs,
      },
    });
  } catch (error) {
    log.error('skill.auto_suggest.failed', {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'Failed to generate suggestions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
