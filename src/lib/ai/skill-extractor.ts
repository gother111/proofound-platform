/**
 * AI-Powered Skill Extraction
 *
 * Local-only extraction using NLP plus semantic embeddings.
 *
 * PRD Reference: Part 5 F3 - AI-assisted CV/JD parsing
 */

import { log } from '@/lib/log';
import { db } from '@/db';
import { skillsTaxonomy } from '@/db/schema';
import { sql } from 'drizzle-orm';
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
  method?: 'local-ai' | 'rule-based';
  processingTimeMs?: number;
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract skills from text without sending source text to an external model.
 */
export async function extractSkillsWithAI(
  text: string,
  context: 'cv' | 'jd' | 'general'
): Promise<SkillExtractionResult> {
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
