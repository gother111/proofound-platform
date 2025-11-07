import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { ilike, or, sql } from 'drizzle-orm';
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
        method: process.env.ANTHROPIC_API_KEY ? 'ai' : 'rule-based',
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

/**
 * Check if word is a common word to exclude from skill matching
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'a',
    'an',
    'as',
    'by',
    'from',
    'that',
    'this',
    'these',
    'those',
    'was',
    'were',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'may',
    'might',
    'must',
    'can',
    'am',
    'is',
    'are',
    'not',
    'no',
    'yes',
    'also',
    'very',
    'just',
    'only',
    'about',
    'into',
    'through',
    'over',
    'after',
    'before',
    'between',
    'under',
    'above',
    'below',
    'up',
    'down',
    'out',
    'off',
    'than',
    'when',
    'where',
    'why',
    'how',
    'all',
    'each',
    'every',
    'both',
    'few',
    'more',
    'most',
    'some',
    'such',
    'other',
    'any',
    'own',
    'same',
    'so',
    'then',
  ]);

  return commonWords.has(word);
}

/**
 * Extract potential skills from tokenized words
 * Includes single words and common multi-word patterns
 */
function extractPotentialSkills(words: string[], fullText: string): string[] {
  const skills = new Set<string>();

  // Add single words
  words.forEach((w) => skills.add(w));

  // Look for common skill patterns (2-3 word phrases)
  const skillPatterns = [
    /\b([a-z]+\s+(?:management|development|design|analysis|testing|engineering|architecture|optimization|integration|implementation|administration|planning|strategy|research))\b/gi,
    /\b((?:project|product|team|business|data|software|web|mobile|cloud|network|security|quality)\s+[a-z]+)\b/gi,
    /\b([a-z]+\s+(?:skills?|experience|expertise|proficiency))\b/gi,
  ];

  skillPatterns.forEach((pattern) => {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.forEach((m) => skills.add(m.toLowerCase().trim()));
    }
  });

  return Array.from(skills);
}

/**
 * Find matching skills in taxonomy
 * Note: nameI18n, aliasesI18n, descriptionI18n are JSONB fields
 * For MVP, we'll search using SQL CAST to text for simplicity
 */
async function findMatchingSkills(searchTerms: string[]) {
  if (searchTerms.length === 0) return [];

  // Build OR conditions for ILIKE search using SQL cast
  const conditions = searchTerms.flatMap((term) => [
    sql`${skillsTaxonomy.nameI18n}::text ILIKE ${`%${term}%`}`,
    sql`${skillsTaxonomy.aliasesI18n}::text ILIKE ${`%${term}%`}`,
    sql`${skillsTaxonomy.descriptionI18n}::text ILIKE ${`%${term}%`}`,
  ]);

  const matches = await db.query.skillsTaxonomy.findMany({
    where: or(...conditions),
    limit: 200, // Limit to prevent huge result sets
  });

  return matches;
}

/**
 * Rank suggestions by relevance
 */
function rankSuggestions(matches: any[], originalText: string, context?: 'cv' | 'jd' | 'general') {
  const scored = matches.map((skill) => {
    let score = 0;

    // Extract English names from JSONB fields
    const name = skill.nameI18n?.en || '';
    const aliases = skill.aliasesI18n || [];
    const description = skill.descriptionI18n?.en || '';

    // Exact match in name (highest weight)
    if (name && originalText.toLowerCase().includes(name.toLowerCase())) {
      score += 10;
    }

    // Match in aliases
    if (aliases && Array.isArray(aliases)) {
      const aliasMatch = aliases.some((alt: string) =>
        originalText.toLowerCase().includes(alt.toLowerCase())
      );
      if (aliasMatch) score += 7;
    }

    // Match in description
    if (description && originalText.toLowerCase().includes(description.toLowerCase())) {
      score += 3;
    }

    // Context-specific boosts
    if (context === 'jd' && name.toLowerCase().includes('management')) {
      score += 1;
    }

    return {
      id: skill.code, // Use code as unique identifier
      code: skill.code,
      name: name,
      aliases: aliases,
      description: description,
      slug: skill.slug,
      tags: skill.tags,
      score,
      confidence: Math.min(score / 10, 1), // Normalize to 0-1
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}
