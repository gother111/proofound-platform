/**
 * LinkedIn Skills Import API
 * 
 * Fetches skills from user's LinkedIn profile and matches them to our taxonomy
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { userIntegrations, skillsTaxonomy } from '@/db/schema';
import { eq, and, or, sql } from 'drizzle-orm';

interface LinkedInSkill {
  name: string;
}

interface SkillSuggestion {
  linkedInSkillName: string;
  matchedSkill: {
    code: string;
    nameI18n: { en: string };
    descriptionI18n?: { en: string };
    catId: number;
    subcatId: number;
    l3Id: number;
    l1?: {
      catId: number;
      slug: string;
      nameI18n: { en: string };
    };
    l2?: {
      subcatId: number;
      catId: number;
      slug: string;
      nameI18n: { en: string };
    };
    l3?: {
      l3Id: number;
      subcatId: number;
      catId: number;
      slug: string;
      nameI18n: { en: string };
    };
  } | null;
  confidence: number; // 0-1
  matchType: 'exact' | 'partial' | 'fuzzy' | 'none';
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
}

/**
 * Match a LinkedIn skill to our taxonomy
 */
async function matchSkillToTaxonomy(linkedInSkillName: string): Promise<SkillSuggestion> {
  const searchTerm = linkedInSkillName.toLowerCase().trim();

  // Try exact match first
  const exactMatch = await db
    .select()
    .from(skillsTaxonomy)
    .where(
      and(
        eq(skillsTaxonomy.status, 'active'),
        sql`LOWER(${skillsTaxonomy.nameI18n}->>'en') = ${searchTerm}`
      )
    )
    .limit(1);

  if (exactMatch.length > 0) {
    const skill = exactMatch[0];
    return {
      linkedInSkillName,
      matchedSkill: {
        code: skill.code,
        nameI18n: skill.nameI18n as { en: string },
        descriptionI18n: skill.descriptionI18n as { en: string } | undefined,
        catId: skill.catId,
        subcatId: skill.subcatId,
        l3Id: skill.l3Id,
      },
      confidence: 1.0,
      matchType: 'exact',
    };
  }

  // Try partial match (LIKE)
  const searchPattern = `%${searchTerm}%`;
  const partialMatches = await db
    .select()
    .from(skillsTaxonomy)
    .where(
      and(
        eq(skillsTaxonomy.status, 'active'),
        or(
          sql`${skillsTaxonomy.nameI18n}->>'en' ILIKE ${searchPattern}`,
          sql`${skillsTaxonomy.aliasesI18n}::text ILIKE ${searchPattern}`
        )
      )
    )
    .limit(10);

  // Calculate similarity scores for partial matches
  const scoredMatches = partialMatches.map((skill) => {
    const skillName = (skill.nameI18n as any)?.en || '';
    const similarity = calculateSimilarity(searchTerm, skillName.toLowerCase());
    return { skill, similarity };
  });

  // Sort by similarity and take best match
  scoredMatches.sort((a, b) => b.similarity - a.similarity);

  if (scoredMatches.length > 0 && scoredMatches[0].similarity > 0.5) {
    const bestMatch = scoredMatches[0];
    const skill = bestMatch.skill;
    return {
      linkedInSkillName,
      matchedSkill: {
        code: skill.code,
        nameI18n: skill.nameI18n as { en: string },
        descriptionI18n: skill.descriptionI18n as { en: string } | undefined,
        catId: skill.catId,
        subcatId: skill.subcatId,
        l3Id: skill.l3Id,
      },
      confidence: bestMatch.similarity,
      matchType: bestMatch.similarity > 0.8 ? 'partial' : 'fuzzy',
    };
  }

  // No match found
  return {
    linkedInSkillName,
    matchedSkill: null,
    confidence: 0,
    matchType: 'none',
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get LinkedIn integration
    const integration = await db
      .select()
      .from(userIntegrations)
      .where(
        and(
          eq(userIntegrations.userId, user.id),
          eq(userIntegrations.provider, 'linkedin')
        )
      )
      .limit(1);

    if (integration.length === 0 || !integration[0].accessToken) {
      return NextResponse.json(
        { error: 'LinkedIn not connected. Please connect your LinkedIn account first.' },
        { status: 400 }
      );
    }

    const accessToken = integration[0].accessToken;

    // Check if token is expired
    if (integration[0].tokenExpiry && new Date() > integration[0].tokenExpiry) {
      return NextResponse.json(
        { error: 'LinkedIn token expired. Please reconnect your LinkedIn account.' },
        { status: 401 }
      );
    }

    // Fetch LinkedIn profile
    // Note: LinkedIn's v2 API has deprecated the /me/skills endpoint
    // We'll need to use the profile endpoint and parse what's available
    // This is a simplified version - in production you might need different approach
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('LinkedIn API error:', errorText);
      return NextResponse.json(
        {
          error: 'Failed to fetch LinkedIn profile. The token may be invalid or expired.',
          details: errorText,
        },
        { status: profileResponse.status }
      );
    }

    const profileData = await profileResponse.json();

    // Note: LinkedIn v2 API doesn't directly expose skills in the /me endpoint
    // For MVP, we'll return mock/example data or guide users to manually enter skills
    // In production, you would need LinkedIn's Marketing API or Partner Program access
    
    // For now, let's create a placeholder that returns a helpful message
    // and allows frontend to handle manual skill input
    return NextResponse.json({
      message:
        'LinkedIn API v2 has limited access to skills data. Please manually add your skills using the search feature.',
      profile: {
        id: profileData.id,
        firstName: profileData.localizedFirstName,
        lastName: profileData.localizedLastName,
      },
      suggestions: [] as SkillSuggestion[],
      note:
        'To enable automatic skill import, you would need LinkedIn Marketing API access or Partner Program enrollment. For MVP, users can manually search and add skills.',
    });

    // If LinkedIn provides skills in the future or via different endpoint:
    // const linkedInSkills: LinkedInSkill[] = profileData.skills || [];
    // const suggestions = await Promise.all(
    //   linkedInSkills.map(skill => matchSkillToTaxonomy(skill.name))
    // );
    // return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('LinkedIn import error:', error);
    return NextResponse.json(
      {
        error: 'Failed to import skills from LinkedIn',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

