import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { ilike, or, sql } from 'drizzle-orm';

/**
 * POST /api/expertise/auto-suggest
 *
 * PRD Part 5 (F3 - Expertise Atlas)
 * Auto-suggest skills from pasted CV/JD text
 * Extracts potential skills and matches against taxonomy
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { text, context } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        error: 'Invalid input',
        message: 'text field is required and must be a string',
      }, { status: 400 });
    }

    // Normalize and tokenize text
    const normalizedText = text.toLowerCase();
    const words = normalizedText
      .split(/[\s,;.()[\]{}]+/)
      .filter(w => w.length > 2) // Filter out very short words
      .filter(w => !isCommonWord(w)); // Filter out common words

    // Build unique search terms (skills might be multi-word)
    const searchTerms = extractPotentialSkills(words, normalizedText);

    // Search taxonomy for matches
    const suggestions = await findMatchingSkills(searchTerms);

    // Score and rank suggestions
    const rankedSuggestions = rankSuggestions(suggestions, normalizedText, context);

    return NextResponse.json({
      success: true,
      suggestions: rankedSuggestions.slice(0, 20), // Top 20 suggestions
      metadata: {
        textLength: text.length,
        uniqueTerms: searchTerms.length,
        totalMatches: suggestions.length,
        context: context || 'general',
      },
    });

  } catch (error) {
    console.error('Auto-suggest error:', error);
    return NextResponse.json({
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Check if word is a common word to exclude from skill matching
 */
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'a', 'an', 'as', 'by', 'from', 'that', 'this', 'these', 'those', 'was',
    'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
    'am', 'is', 'are', 'not', 'no', 'yes', 'also', 'very', 'just', 'only',
    'about', 'into', 'through', 'over', 'after', 'before', 'between',
    'under', 'above', 'below', 'up', 'down', 'out', 'off', 'than', 'when',
    'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
    'most', 'some', 'such', 'other', 'any', 'own', 'same', 'so', 'then',
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
  words.forEach(w => skills.add(w));

  // Look for common skill patterns (2-3 word phrases)
  const skillPatterns = [
    /\b([a-z]+\s+(?:management|development|design|analysis|testing|engineering|architecture|optimization|integration|implementation|administration|planning|strategy|research))\b/gi,
    /\b((?:project|product|team|business|data|software|web|mobile|cloud|network|security|quality)\s+[a-z]+)\b/gi,
    /\b([a-z]+\s+(?:skills?|experience|expertise|proficiency))\b/gi,
  ];

  skillPatterns.forEach(pattern => {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.forEach(m => skills.add(m.toLowerCase().trim()));
    }
  });

  return Array.from(skills);
}

/**
 * Find matching skills in taxonomy
 */
async function findMatchingSkills(searchTerms: string[]) {
  if (searchTerms.length === 0) return [];

  // Build OR conditions for ILIKE search
  const conditions = searchTerms.flatMap(term => [
    ilike(skillsTaxonomy.preferredLabel, `%${term}%`),
    ilike(skillsTaxonomy.altLabels, `%${term}%`),
    ilike(skillsTaxonomy.description, `%${term}%`),
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
function rankSuggestions(
  matches: any[],
  originalText: string,
  context?: 'cv' | 'jd' | 'general'
) {
  const scored = matches.map(skill => {
    let score = 0;

    // Exact match in preferred label (highest weight)
    if (originalText.toLowerCase().includes(skill.preferredLabel.toLowerCase())) {
      score += 10;
    }

    // Match in alt labels
    if (skill.altLabels) {
      const altLabels = Array.isArray(skill.altLabels) ? skill.altLabels : [skill.altLabels];
      const altMatch = altLabels.some((alt: string) =>
        originalText.toLowerCase().includes(alt.toLowerCase())
      );
      if (altMatch) score += 7;
    }

    // Match in description
    if (skill.description && originalText.toLowerCase().includes(skill.description.toLowerCase())) {
      score += 3;
    }

    // Boost L4 skills (most specific)
    if (skill.level === 4) score += 2;

    // Context-specific boosts
    if (context === 'jd' && skill.preferredLabel.toLowerCase().includes('management')) {
      score += 1;
    }

    return {
      id: skill.id,
      conceptUri: skill.conceptUri,
      preferredLabel: skill.preferredLabel,
      altLabels: skill.altLabels,
      description: skill.description,
      level: skill.level,
      l1Code: skill.l1Code,
      l1Label: skill.l1Label,
      l2Code: skill.l2Code,
      l2Label: skill.l2Label,
      l3Code: skill.l3Code,
      l3Label: skill.l3Label,
      l4Code: skill.l4Code,
      score,
      confidence: Math.min(score / 10, 1), // Normalize to 0-1
    };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}
