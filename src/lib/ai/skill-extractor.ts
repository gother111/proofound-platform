/**
 * AI-Powered Skill Extraction
 *
 * Uses LLM to extract skills from CV/JD text and map to Expertise Atlas
 * PRD Reference: Part 5 F3 - AI-assisted CV/JD parsing
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export interface ExtractedSkill {
  skillName: string;
  taxonomyCode?: string; // Matched L4 code
  level: number; // 1-5 proficiency
  confidence: number; // 0-1
  context: string; // Where in text it was found
  monthsExperience?: number;
  yearsExperience?: number;
  relevance: 'current' | 'past' | 'aspirational';
}

export interface SkillExtractionResult {
  skills: ExtractedSkill[];
  summary: string;
  totalExperienceYears?: number;
  industries?: string[];
  roles?: string[];
}

// ============================================================================
// AI EXTRACTION
// ============================================================================

/**
 * Extract skills from text using Claude AI
 */
export async function extractSkillsWithAI(
  text: string,
  context: 'cv' | 'jd' | 'general'
): Promise<SkillExtractionResult> {
  try {
    // Initialize Anthropic client
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      log.warn('skill.extract.no_api_key', { context });
      // Fall back to rule-based extraction
      return extractSkillsRuleBased(text, context);
    }

    const anthropic = new Anthropic({ apiKey });

    // Build context-specific prompt
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(text, context);

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const result = parseAIResponse(content.text, context);

    log.info('skill.extract.success', {
      context,
      skillCount: result.skills.length,
      totalExperience: result.totalExperienceYears,
    });

    // Match extracted skills to taxonomy
    const matchedSkills = await matchSkillsToTaxonomy(result.skills);

    return {
      ...result,
      skills: matchedSkills,
    };
  } catch (error) {
    log.error('skill.extract.failed', {
      context,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Fall back to rule-based extraction
    return extractSkillsRuleBased(text, context);
  }
}

/**
 * Build system prompt based on context
 */
function buildSystemPrompt(context: 'cv' | 'jd' | 'general'): string {
  const basePrompt = `You are an expert skill extraction system for a professional platform. Your task is to extract technical and professional skills from text and structure them in a specific JSON format.

For each skill identified:
- Extract the exact skill name (e.g., "Python", "Project Management", "React")
- Estimate proficiency level (1=Learning, 2=Competent, 3=Proficient, 4=Expert, 5=Master)
- Provide confidence score (0-1, where 1 is extremely confident)
- Include relevant context/evidence from the text
- Determine relevance (current, past, or aspirational)
- Extract experience duration where mentioned`;

  const contextSpecific: Record<typeof context, string> = {
    cv: `\n\nFor CV/Resume context:
- Focus on skills the person HAS and has demonstrated
- Extract years/months of experience for each skill where mentioned
- Identify current vs past skills based on dates
- Look for skill usage in job descriptions, projects, education`,

    jd: `\n\nFor Job Description context:
- Focus on skills REQUIRED for the role
- All skills should be marked as 'aspirational' (desired by organization)
- Note required vs preferred skills (use confidence score)
- Extract minimum experience levels mentioned`,

    general: `\n\nFor general text:
- Be conservative - only extract clear skill mentions
- Default to 'current' relevance unless context suggests otherwise`,
  };

  return basePrompt + contextSpecific[context];
}

/**
 * Build user prompt with text and examples
 */
function buildUserPrompt(text: string, context: string): string {
  return `Extract skills from the following ${context} text and return ONLY valid JSON in this exact format:

{
  "skills": [
    {
      "skillName": "Skill Name",
      "level": 3,
      "confidence": 0.9,
      "context": "relevant quote from text",
      "monthsExperience": 24,
      "relevance": "current"
    }
  ],
  "summary": "Brief 1-2 sentence summary",
  "totalExperienceYears": 5,
  "industries": ["Industry 1", "Industry 2"],
  "roles": ["Role 1", "Role 2"]
}

Text to analyze:
---
${text.slice(0, 15000)}
---

Return ONLY the JSON, no other text.`;
}

/**
 * Parse AI response into structured result
 */
function parseAIResponse(response: string, context: string): SkillExtractionResult {
  try {
    // Extract JSON from response (in case there's wrapper text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.skills || !Array.isArray(parsed.skills)) {
      throw new Error('Invalid skills array in response');
    }

    return {
      skills: parsed.skills.map((s: any) => ({
        skillName: s.skillName || 'Unknown',
        level: Math.min(Math.max(s.level || 2, 1), 5),
        confidence: Math.min(Math.max(s.confidence || 0.5, 0), 1),
        context: s.context || '',
        monthsExperience: s.monthsExperience,
        yearsExperience: s.monthsExperience ? Math.floor(s.monthsExperience / 12) : undefined,
        relevance: s.relevance || 'current',
      })),
      summary: parsed.summary || '',
      totalExperienceYears: parsed.totalExperienceYears,
      industries: parsed.industries || [],
      roles: parsed.roles || [],
    };
  } catch (error) {
    log.error('skill.extract.parse_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      skills: [],
      summary: 'Failed to parse AI response',
    };
  }
}

// ============================================================================
// TAXONOMY MATCHING
// ============================================================================

/**
 * Match extracted skills to taxonomy codes
 */
async function matchSkillsToTaxonomy(skills: ExtractedSkill[]): Promise<ExtractedSkill[]> {
  const matched: ExtractedSkill[] = [];

  for (const skill of skills) {
    try {
      // Search for exact or close matches
      const taxonomyMatches = await db.query.skillsTaxonomy.findMany({
        where: sql`
          ${skillsTaxonomy.nameI18n}::text ILIKE ${`%${skill.skillName}%`}
          OR ${skillsTaxonomy.aliasesI18n}::text ILIKE ${`%${skill.skillName}%`}
        `,
        limit: 1,
      });

      if (taxonomyMatches.length > 0) {
        const match = taxonomyMatches[0];
        matched.push({
          ...skill,
          taxonomyCode: match.code,
        });
      } else {
        // No match found, include anyway
        matched.push(skill);
      }
    } catch (error) {
      log.error('skill.match.failed', {
        skillName: skill.skillName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      matched.push(skill);
    }
  }

  return matched;
}

// ============================================================================
// FALLBACK: RULE-BASED EXTRACTION
// ============================================================================

/**
 * Fallback rule-based extraction when AI is unavailable
 */
export function extractSkillsRuleBased(
  text: string,
  context: 'cv' | 'jd' | 'general'
): SkillExtractionResult {
  const skills: ExtractedSkill[] = [];
  const lowerText = text.toLowerCase();

  // Common skill patterns
  const skillPatterns: Record<string, { level: number; keywords: string[] }> = {
    Python: {
      level: 3,
      keywords: ['python', 'django', 'flask', 'pandas', 'numpy'],
    },
    JavaScript: {
      level: 3,
      keywords: ['javascript', 'js', 'node.js', 'nodejs', 'typescript'],
    },
    React: { level: 3, keywords: ['react', 'react.js', 'reactjs', 'react native'] },
    SQL: { level: 2, keywords: ['sql', 'mysql', 'postgresql', 'database'] },
    AWS: { level: 2, keywords: ['aws', 'amazon web services', 'ec2', 's3'] },
    Docker: { level: 2, keywords: ['docker', 'container', 'kubernetes', 'k8s'] },
    Git: { level: 2, keywords: ['git', 'github', 'gitlab', 'version control'] },
    'Project Management': {
      level: 2,
      keywords: ['project management', 'pm', 'agile', 'scrum'],
    },
    Leadership: {
      level: 2,
      keywords: ['leadership', 'team lead', 'manager', 'leading'],
    },
  };

  // Extract skills based on keyword matching
  for (const [skillName, { level, keywords }] of Object.entries(skillPatterns)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Extract context
        const index = lowerText.indexOf(keyword);
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(text.length, index + 100);
        const contextSnippet = text.slice(contextStart, contextEnd);

        skills.push({
          skillName,
          level,
          confidence: 0.6,
          context: '...' + contextSnippet + '...',
          relevance: context === 'jd' ? 'aspirational' : 'current',
        });
        break; // Only add once
      }
    }
  }

  // Extract years of experience if mentioned
  const experienceMatch = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i);
  const totalExperienceYears = experienceMatch ? parseInt(experienceMatch[1]) : undefined;

  return {
    skills,
    summary: `Found ${skills.length} skills using keyword matching (AI extraction unavailable)`,
    totalExperienceYears,
  };
}
