/**
 * Job Description Parser
 *
 * Uses AI to extract skills from job descriptions and map them to L4 taxonomy.
 * PRD Reference: Part 5 O6 - JD Mapping Feature
 */

interface JDSkillSuggestion {
  l4_id: string;
  l4_name: string;
  proficiency_level: number; // 1-5
  confidence: number; // 0-1
  why: string; // Explanation of why this skill was mapped
  source_text: string; // Excerpt from JD that led to this mapping
}

/**
 * Parse job description text and extract skills with AI
 *
 * Note: This is a simplified version. In production, you would use OpenAI API
 * or a similar LLM to perform the extraction.
 */
export async function parseJobDescription(jdText: string): Promise<JDSkillSuggestion[]> {
  // For now, return a mock implementation
  // In production, this would call OpenAI API:
  //
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     {
  //       role: "system",
  //       content: "You are a job description parser. Extract skills and map them to our L4 taxonomy..."
  //     },
  //     {
  //       role: "user",
  //       content: jdText
  //     }
  //   ]
  // });

  // Mock implementation for demonstration
  const suggestions: JDSkillSuggestion[] = [];

  // Simple keyword matching (replace with real AI in production)
  const keywords: Record<string, JDSkillSuggestion> = {
    python: {
      l4_id: 'python-advanced',
      l4_name: 'Python - Advanced',
      proficiency_level: 4,
      confidence: 0.92,
      why: 'JD mentions "Expert Python developer with 5+ years" which maps to Python - Advanced proficiency',
      source_text: 'Expert Python developer with 5+ years',
    },
    react: {
      l4_id: 'react-advanced',
      l4_name: 'React - Advanced',
      proficiency_level: 4,
      confidence: 0.88,
      why: 'JD requires "Senior React developer" indicating advanced proficiency',
      source_text: 'Senior React developer',
    },
    typescript: {
      l4_id: 'typescript-intermediate',
      l4_name: 'TypeScript - Intermediate',
      proficiency_level: 3,
      confidence: 0.85,
      why: 'JD mentions "TypeScript experience" without specifying level, mapped to intermediate',
      source_text: 'TypeScript experience',
    },
    aws: {
      l4_id: 'aws-intermediate',
      l4_name: 'AWS - Intermediate',
      proficiency_level: 3,
      confidence: 0.78,
      why: 'JD lists "AWS cloud infrastructure" as required skill',
      source_text: 'AWS cloud infrastructure',
    },
    sql: {
      l4_id: 'sql-intermediate',
      l4_name: 'SQL - Intermediate',
      proficiency_level: 3,
      confidence: 0.8,
      why: 'JD mentions "database design and SQL queries"',
      source_text: 'database design and SQL queries',
    },
  };

  const lowerJD = jdText.toLowerCase();

  for (const [keyword, suggestion] of Object.entries(keywords)) {
    if (lowerJD.includes(keyword)) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

/**
 * Validate and refine AI suggestions against actual L4 taxonomy
 */
export async function validateSkillSuggestions(
  suggestions: JDSkillSuggestion[]
): Promise<JDSkillSuggestion[]> {
  // TODO: Query actual L4 taxonomy and validate IDs
  // For now, return suggestions as-is
  return suggestions;
}
