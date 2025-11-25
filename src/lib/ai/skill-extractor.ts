/**
 * AI-Powered Skill Extraction
 *
 * Primary method: Local AI using NLP + semantic embeddings (no API costs)
 * Secondary method: Claude API (optional, for higher accuracy when needed)
 *
 * PRD Reference: Part 5 F3 - AI-assisted CV/JD parsing
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import {
  extractSkillsLocal,
  preloadLocalExtractor,
  type LocalExtractionResult,
} from './local-skill-extractor';

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
  method?: 'local-ai' | 'api' | 'rule-based';
  processingTimeMs?: number;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION (Uses Local AI by default)
// ============================================================================

/**
 * Extract skills from text - uses local AI as primary method
 *
 * Set USE_ANTHROPIC_API=true in env to use Claude API instead
 */
export async function extractSkillsWithAI(
  text: string,
  context: 'cv' | 'jd' | 'general'
): Promise<SkillExtractionResult> {
  // Check if API mode is explicitly requested
  const useApiMode = process.env.USE_ANTHROPIC_API === 'true';

  if (useApiMode && process.env.ANTHROPIC_API_KEY) {
    log.info('skill.extract.using_api', { context });
    return await extractSkillsWithClaudeAPI(text, context);
  }

  // Use local AI extraction (default)
  log.info('skill.extract.using_local', { context });
  try {
    const localResult = await extractSkillsLocal(text, context);

    // Convert LocalExtractionResult to SkillExtractionResult
    return {
      skills: localResult.skills.map((skill) => ({
        skillName: skill.skillName,
        taxonomyCode: skill.taxonomyCode,
        level: skill.level,
        confidence: skill.confidence,
        context: skill.context,
        monthsExperience: skill.monthsExperience,
        yearsExperience: skill.yearsExperience,
        relevance: skill.relevance,
      })),
      summary: localResult.summary,
      totalExperienceYears: localResult.totalExperienceYears,
      industries: localResult.industries,
      roles: localResult.roles,
      method: localResult.method,
      processingTimeMs: localResult.processingTimeMs,
    };
  } catch (error) {
    log.error('skill.extract.local_failed', {
      context,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fall back to rule-based extraction
    log.info('skill.extract.fallback_to_rules', { context });
    const ruleResult = await extractSkillsRuleBased(text, context);
    return {
      ...ruleResult,
      method: 'rule-based',
    };
  }
}

// ============================================================================
// CLAUDE API EXTRACTION (Optional, for higher accuracy)
// ============================================================================

/**
 * Extract skills from text using Claude AI (optional premium feature)
 */
async function extractSkillsWithClaudeAPI(
  text: string,
  context: 'cv' | 'jd' | 'general'
): Promise<SkillExtractionResult> {
  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      log.warn('skill.extract.no_api_key', { context });
      // Fall back to local extraction
      return await extractSkillsWithAI(text, context);
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

    log.info('skill.extract.api_success', {
      context,
      skillCount: result.skills.length,
      totalExperience: result.totalExperienceYears,
    });

    // Match extracted skills to taxonomy
    const matchedSkills = await matchSkillsToTaxonomy(result.skills);

    return {
      ...result,
      skills: matchedSkills,
      method: 'api',
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    log.error('skill.extract.api_failed', {
      context,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Fall back to local extraction
    log.info('skill.extract.fallback_to_local', { context });
    const localResult = await extractSkillsLocal(text, context);

    return {
      skills: localResult.skills.map((skill) => ({
        skillName: skill.skillName,
        taxonomyCode: skill.taxonomyCode,
        level: skill.level,
        confidence: skill.confidence,
        context: skill.context,
        monthsExperience: skill.monthsExperience,
        yearsExperience: skill.yearsExperience,
        relevance: skill.relevance,
      })),
      summary: localResult.summary,
      totalExperienceYears: localResult.totalExperienceYears,
      industries: localResult.industries,
      roles: localResult.roles,
      method: localResult.method,
      processingTimeMs: localResult.processingTimeMs,
    };
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
export async function extractSkillsRuleBased(
  text: string,
  context: 'cv' | 'jd' | 'general'
): Promise<SkillExtractionResult> {
  const skills: ExtractedSkill[] = [];
  const lowerText = text.toLowerCase();

  try {
    // Extract potential skill terms from text
    const words = lowerText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const uniqueWords = Array.from(new Set(words));

    // Expanded hardcoded list of common skills
    const commonSkills: Record<string, { level: number; keywords: string[] }> = {
      // Languages
      Python: {
        level: 3,
        keywords: [
          'python',
          'django',
          'flask',
          'pandas',
          'numpy',
          'scipy',
          'pytorch',
          'tensorflow',
        ],
      },
      JavaScript: {
        level: 3,
        keywords: ['javascript', 'js', 'node.js', 'nodejs', 'typescript', 'es6', 'ecmascript'],
      },
      TypeScript: { level: 3, keywords: ['typescript', 'ts'] },
      Java: {
        level: 3,
        keywords: ['java', 'spring', 'hibernate', 'jvm', 'kotlin', 'scala'],
      },
      'C#': { level: 3, keywords: ['c#', '.net', 'dotnet', 'asp.net'] },
      'C++': { level: 3, keywords: ['c++', 'cpp', 'stl'] },
      Go: { level: 3, keywords: ['golang', 'go lang'] },
      Rust: { level: 3, keywords: ['rust', 'cargo'] },
      PHP: { level: 3, keywords: ['php', 'laravel', 'symfony'] },
      Ruby: { level: 3, keywords: ['ruby', 'rails', 'ror'] },
      Swift: { level: 3, keywords: ['swift', 'ios', 'xcode'] },

      // Frontend
      React: {
        level: 3,
        keywords: ['react', 'react.js', 'reactjs', 'react native', 'redux', 'next.js', 'nextjs'],
      },
      'Vue.js': {
        level: 3,
        keywords: ['vue', 'vue.js', 'vuejs', 'vuex', 'nuxt'],
      },
      Angular: { level: 3, keywords: ['angular', 'angularjs', 'rxjs'] },
      'HTML/CSS': {
        level: 3,
        keywords: ['html', 'css', 'sass', 'scss', 'less', 'tailwind'],
      },

      // Backend & DB
      SQL: {
        level: 2,
        keywords: ['sql', 'mysql', 'postgresql', 'postgres', 'database', 'relational db'],
      },
      NoSQL: {
        level: 2,
        keywords: ['nosql', 'mongodb', 'mongo', 'redis', 'cassandra', 'dynamodb'],
      },
      GraphQL: { level: 2, keywords: ['graphql', 'apollo'] },
      'API Design': {
        level: 3,
        keywords: ['rest api', 'restful', 'api design', 'swagger', 'openapi'],
      },

      // DevOps & Cloud
      AWS: {
        level: 2,
        keywords: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
      },
      Azure: { level: 2, keywords: ['azure', 'microsoft cloud'] },
      GCP: { level: 2, keywords: ['gcp', 'google cloud'] },
      Docker: { level: 2, keywords: ['docker', 'container', 'docker-compose'] },
      Kubernetes: { level: 2, keywords: ['kubernetes', 'k8s', 'helm'] },
      'CI/CD': {
        level: 2,
        keywords: ['ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'circleci'],
      },
      Git: {
        level: 2,
        keywords: ['git', 'github', 'gitlab', 'bitbucket', 'version control'],
      },

      // General / Soft Skills
      'Project Management': {
        level: 2,
        keywords: ['project management', 'pm', 'agile', 'scrum', 'kanban', 'jira'],
      },
      Leadership: {
        level: 2,
        keywords: ['leadership', 'team lead', 'manager', 'leading', 'mentoring'],
      },
      Communication: {
        level: 3,
        keywords: ['communication', 'presentation', 'public speaking', 'writing'],
      },
      'Problem Solving': {
        level: 3,
        keywords: ['problem solving', 'analytical', 'troubleshooting'],
      },
      'Data Analysis': {
        level: 2,
        keywords: ['data analysis', 'analytics', 'tableau', 'powerbi', 'looker'],
      },
      'Machine Learning': {
        level: 3,
        keywords: [
          'machine learning',
          'ml',
          'ai',
          'artificial intelligence',
          'nlp',
          'computer vision',
        ],
      },
    };

    // Check against hardcoded list
    for (const [skillName, { level, keywords }] of Object.entries(commonSkills)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          const index = lowerText.indexOf(keyword);
          const contextStart = Math.max(0, index - 50);
          const contextEnd = Math.min(text.length, index + 100);
          const contextSnippet = text.slice(contextStart, contextEnd);

          skills.push({
            skillName,
            level,
            confidence: 0.7,
            context: '...' + contextSnippet + '...',
            relevance: context === 'jd' ? 'aspirational' : 'current',
          });
          break;
        }
      }
    }

    // Try to query DB for additional matches
    if (uniqueWords.length > 0) {
      const potentialTerms = uniqueWords.sort((a, b) => b.length - a.length).slice(0, 50);

      try {
        const conditions = potentialTerms.map(
          (term) => sql`${skillsTaxonomy.nameI18n}::text ILIKE ${`%${term}%`}`
        );

        if (conditions.length > 0) {
          const topConditions = conditions.slice(0, 10);

          const dbMatches = await db.query.skillsTaxonomy.findMany({
            where: sql`(${sql.join(topConditions, sql` OR `)})`,
            limit: 20,
          });

          for (const match of dbMatches) {
            const name = (match.nameI18n as any)?.en as string;
            if (name && !skills.some((s) => s.skillName === name)) {
              if (lowerText.includes(name.toLowerCase())) {
                skills.push({
                  skillName: name,
                  taxonomyCode: match.code,
                  level: 2,
                  confidence: 0.8,
                  context: 'Found in taxonomy match',
                  relevance: context === 'jd' ? 'aspirational' : 'current',
                });
              }
            }
          }
        }
      } catch (dbError) {
        log.warn('skill.extract.db_lookup_failed', { error: dbError });
      }
    }
  } catch (error) {
    log.error('skill.extract.rule_based_failed', { error });
  }

  // Extract years of experience
  const experienceMatch = text.match(/(\d+)\+?\s*years?\s+(?:of\s+)?experience/i);
  const totalExperienceYears = experienceMatch ? parseInt(experienceMatch[1]) : undefined;

  return {
    skills,
    summary: `Found ${skills.length} skills using keyword matching and taxonomy lookup`,
    totalExperienceYears,
    method: 'rule-based',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { preloadLocalExtractor };
