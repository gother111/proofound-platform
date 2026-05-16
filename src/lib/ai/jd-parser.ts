/**
 * Job Description Parser
 *
 * Uses local deterministic rules to extract skills from job descriptions.
 * PRD Reference: Part 5 O6 - JD Mapping Feature
 */

import { log } from '@/lib/log';

export interface JDSkillSuggestion {
  l4_id: string;
  l4_name: string;
  proficiency_level: number; // 1-5
  confidence: number; // 0-1
  why: string; // Explanation of why this skill was mapped
  source_text: string; // Excerpt from JD that led to this mapping
  is_required: boolean; // true = must-have, false = nice-to-have
}

export interface JDParseResult {
  suggestions: JDSkillSuggestion[];
  summary: string;
  roleTitle?: string;
  experienceRequired?: string;
  industries?: string[];
}

// ============================================================================
// LOCAL JD PARSING
// ============================================================================

/**
 * Parse job description text and extract skills without sending source text to an external model.
 */
export async function parseJobDescription(jdText: string): Promise<JDSkillSuggestion[]> {
  log.info('jd-parser.local.start', { textLength: jdText.length });
  return parseJobDescriptionRuleBased(jdText);
}

// ============================================================================
// RULE-BASED EXTRACTION
// ============================================================================

/**
 * Rule-based JD parsing for the launch corridor.
 */
function parseJobDescriptionRuleBased(jdText: string): JDSkillSuggestion[] {
  const suggestions: JDSkillSuggestion[] = [];
  const lowerJD = jdText.toLowerCase();

  // Comprehensive skill patterns with proficiency indicators
  const skillPatterns: Record<
    string,
    {
      keywords: string[];
      defaultLevel: number;
      category: string;
    }
  > = {
    // Programming Languages
    Python: {
      keywords: [
        'python',
        'django',
        'flask',
        'fastapi',
        'pandas',
        'numpy',
        'pytorch',
        'tensorflow',
      ],
      defaultLevel: 3,
      category: 'programming',
    },
    JavaScript: {
      keywords: ['javascript', 'js', 'node.js', 'nodejs', 'es6', 'ecmascript'],
      defaultLevel: 3,
      category: 'programming',
    },
    TypeScript: {
      keywords: ['typescript', 'ts'],
      defaultLevel: 3,
      category: 'programming',
    },
    Java: {
      keywords: ['java', 'spring', 'spring boot', 'hibernate', 'jvm'],
      defaultLevel: 3,
      category: 'programming',
    },
    'C#': {
      keywords: ['c#', 'csharp', '.net', 'dotnet', 'asp.net'],
      defaultLevel: 3,
      category: 'programming',
    },
    Go: {
      keywords: ['golang', 'go programming'],
      defaultLevel: 3,
      category: 'programming',
    },
    Rust: {
      keywords: ['rust programming', 'rustlang'],
      defaultLevel: 3,
      category: 'programming',
    },
    PHP: {
      keywords: ['php', 'laravel', 'symfony', 'wordpress'],
      defaultLevel: 3,
      category: 'programming',
    },
    Ruby: {
      keywords: ['ruby', 'rails', 'ruby on rails'],
      defaultLevel: 3,
      category: 'programming',
    },
    Swift: {
      keywords: ['swift', 'ios development', 'swiftui'],
      defaultLevel: 3,
      category: 'programming',
    },
    Kotlin: {
      keywords: ['kotlin', 'android development'],
      defaultLevel: 3,
      category: 'programming',
    },

    // Frontend Frameworks
    React: {
      keywords: ['react', 'react.js', 'reactjs', 'react native', 'redux', 'next.js', 'nextjs'],
      defaultLevel: 3,
      category: 'frontend',
    },
    'Vue.js': {
      keywords: ['vue', 'vue.js', 'vuejs', 'vuex', 'nuxt'],
      defaultLevel: 3,
      category: 'frontend',
    },
    Angular: {
      keywords: ['angular', 'angularjs', 'rxjs'],
      defaultLevel: 3,
      category: 'frontend',
    },
    'HTML/CSS': {
      keywords: ['html', 'css', 'sass', 'scss', 'less', 'tailwind', 'bootstrap'],
      defaultLevel: 2,
      category: 'frontend',
    },

    // Backend & Databases
    SQL: {
      keywords: ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'sql server'],
      defaultLevel: 3,
      category: 'database',
    },
    NoSQL: {
      keywords: ['nosql', 'mongodb', 'dynamodb', 'cassandra', 'couchdb'],
      defaultLevel: 3,
      category: 'database',
    },
    Redis: {
      keywords: ['redis', 'caching'],
      defaultLevel: 2,
      category: 'database',
    },
    GraphQL: {
      keywords: ['graphql', 'apollo', 'hasura'],
      defaultLevel: 3,
      category: 'api',
    },
    'REST API': {
      keywords: ['rest api', 'restful', 'api design', 'swagger', 'openapi'],
      defaultLevel: 3,
      category: 'api',
    },

    // Cloud & DevOps
    AWS: {
      keywords: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation', 'dynamodb'],
      defaultLevel: 3,
      category: 'cloud',
    },
    Azure: {
      keywords: ['azure', 'microsoft azure', 'azure devops'],
      defaultLevel: 3,
      category: 'cloud',
    },
    'Google Cloud': {
      keywords: ['gcp', 'google cloud', 'bigquery', 'cloud functions'],
      defaultLevel: 3,
      category: 'cloud',
    },
    Docker: {
      keywords: ['docker', 'containerization', 'docker-compose'],
      defaultLevel: 3,
      category: 'devops',
    },
    Kubernetes: {
      keywords: ['kubernetes', 'k8s', 'helm', 'container orchestration'],
      defaultLevel: 3,
      category: 'devops',
    },
    'CI/CD': {
      keywords: ['ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'circleci', 'travis'],
      defaultLevel: 3,
      category: 'devops',
    },
    Terraform: {
      keywords: ['terraform', 'infrastructure as code', 'iac'],
      defaultLevel: 3,
      category: 'devops',
    },

    // Data & AI
    'Machine Learning': {
      keywords: [
        'machine learning',
        'ml',
        'deep learning',
        'neural networks',
        'nlp',
        'computer vision',
      ],
      defaultLevel: 3,
      category: 'ai',
    },
    'Data Science': {
      keywords: ['data science', 'data scientist', 'statistical analysis', 'predictive modeling'],
      defaultLevel: 3,
      category: 'data',
    },
    'Data Engineering': {
      keywords: ['data engineering', 'etl', 'data pipeline', 'spark', 'airflow', 'kafka'],
      defaultLevel: 3,
      category: 'data',
    },
    'Data Analysis': {
      keywords: ['data analysis', 'analytics', 'tableau', 'powerbi', 'looker', 'metabase'],
      defaultLevel: 3,
      category: 'data',
    },

    // Security
    Cybersecurity: {
      keywords: ['cybersecurity', 'security', 'penetration testing', 'soc', 'siem'],
      defaultLevel: 3,
      category: 'security',
    },

    // Management & Soft Skills
    'Project Management': {
      keywords: ['project management', 'agile', 'scrum', 'kanban', 'jira', 'pmp'],
      defaultLevel: 3,
      category: 'management',
    },
    'Product Management': {
      keywords: ['product management', 'product owner', 'roadmap', 'user research'],
      defaultLevel: 3,
      category: 'management',
    },
    Leadership: {
      keywords: ['leadership', 'team lead', 'tech lead', 'engineering manager', 'mentoring'],
      defaultLevel: 3,
      category: 'soft-skills',
    },
    Communication: {
      keywords: ['communication skills', 'stakeholder management', 'presentation'],
      defaultLevel: 3,
      category: 'soft-skills',
    },
  };

  // Proficiency level indicators
  const expertIndicators = [
    'expert',
    'senior',
    'lead',
    'architect',
    'principal',
    '5+ years',
    '7+ years',
    '10+ years',
    'extensive',
  ];
  const advancedIndicators = ['advanced', '3+ years', '4+ years', 'strong', 'deep'];
  const intermediateIndicators = [
    'experience with',
    'proficient',
    'working knowledge',
    '2+ years',
    '1-3 years',
  ];
  const basicIndicators = ['familiarity', 'basic', 'exposure', 'understanding of', 'awareness'];

  // Required vs nice-to-have indicators
  const requiredIndicators = [
    'required',
    'must have',
    'essential',
    'mandatory',
    'need',
    'requirements:',
  ];
  const preferredIndicators = ['preferred', 'nice to have', 'bonus', 'plus', 'ideally', 'desired'];

  // Determine if skill appears in required or preferred section
  function isRequired(keyword: string, text: string): boolean {
    const keywordIndex = text.indexOf(keyword);
    if (keywordIndex === -1) return true; // Default to required

    // Check surrounding context (200 chars before)
    const contextBefore = text.slice(Math.max(0, keywordIndex - 200), keywordIndex).toLowerCase();

    if (preferredIndicators.some((ind) => contextBefore.includes(ind))) {
      return false;
    }
    return true; // Default to required
  }

  // Determine proficiency level from context
  function getProficiencyLevel(keyword: string, text: string, defaultLevel: number): number {
    const keywordIndex = text.indexOf(keyword);
    if (keywordIndex === -1) return defaultLevel;

    // Check surrounding context (100 chars before and after)
    const contextStart = Math.max(0, keywordIndex - 100);
    const contextEnd = Math.min(text.length, keywordIndex + keyword.length + 100);
    const context = text.slice(contextStart, contextEnd).toLowerCase();

    if (expertIndicators.some((ind) => context.includes(ind))) {
      return 4;
    }
    if (advancedIndicators.some((ind) => context.includes(ind))) {
      return 4;
    }
    if (basicIndicators.some((ind) => context.includes(ind))) {
      return 2;
    }
    if (intermediateIndicators.some((ind) => context.includes(ind))) {
      return 3;
    }
    return defaultLevel;
  }

  // Extract context snippet
  function getContextSnippet(keyword: string, text: string): string {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return '';

    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + keyword.length + 50);
    return text.slice(start, end).trim();
  }

  // Process each skill pattern
  for (const [skillName, { keywords, defaultLevel }] of Object.entries(skillPatterns)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(jdText)) {
        const proficiencyLevel = getProficiencyLevel(keyword, lowerJD, defaultLevel);
        const sourceText = getContextSnippet(keyword, jdText);
        const required = isRequired(keyword, lowerJD);

        suggestions.push({
          l4_id: `rule-${skillName.toLowerCase().replace(/\s+/g, '-')}`,
          l4_name: skillName,
          proficiency_level: proficiencyLevel,
          confidence: 0.7, // Rule-based has lower confidence than AI
          why: `Identified "${keyword}" in job description${proficiencyLevel > defaultLevel ? ' with indicators suggesting higher proficiency' : ''}`,
          source_text: sourceText ? `...${sourceText}...` : `Contains "${keyword}"`,
          is_required: required,
        });
        break; // Only add once per skill
      }
    }
  }

  log.info('jd-parser.rule_based.success', {
    textLength: jdText.length,
    skillCount: suggestions.length,
  });

  return suggestions;
}

/**
 * Validate and refine AI suggestions against actual L4 taxonomy
 */
export async function validateSkillSuggestions(
  suggestions: JDSkillSuggestion[]
): Promise<JDSkillSuggestion[]> {
  // Filter out any suggestions with extremely low confidence
  const validSuggestions = suggestions.filter((s) => s.confidence >= 0.3);

  // Sort by required first, then by confidence
  validSuggestions.sort((a, b) => {
    if (a.is_required !== b.is_required) {
      return a.is_required ? -1 : 1;
    }
    return b.confidence - a.confidence;
  });

  return validSuggestions;
}
