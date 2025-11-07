/**
 * AI-Assisted Policy Explainer
 *
 * Uses LLM to explain privacy policies, terms, and complex concepts in plain language
 * PRD Reference: Part 6 - Privacy by Design (policy transparency)
 */

import Anthropic from '@anthropic-ai/sdk';
import { log } from '@/lib/log';

export interface PolicyQuestion {
  question: string;
  context?: 'privacy' | 'consent' | 'data_usage' | 'rights' | 'general';
  policySection?: string; // Specific section of policy
}

export interface PolicyExplanation {
  answer: string;
  summary: string;
  keyPoints: string[];
  relatedSections?: string[];
  examples?: string[];
}

// Platform policies (these would typically be loaded from a database or CMS)
const PLATFORM_POLICIES = {
  privacy: `
Proofound Privacy Policy

1. DATA COLLECTION
We collect only the data you explicitly provide: profile information, skills, work history, 
and matching preferences. We never sell your data.

2. DATA USAGE
Your data is used exclusively for matching you with opportunities aligned with your values 
and expertise. We use Row-Level Security (RLS) to ensure only authorized parties see your data.

3. VISIBILITY CONTROLS
You control what organizations see. Use granular field-level privacy settings and redact mode 
to hide sensitive information.

4. CONSENT
We require explicit consent before sharing your profile with any organization. You can revoke 
access at any time.

5. DATA RIGHTS
You have the right to export, delete, or correct your data. Use the Settings > Data Export 
feature to download your data in JSON format.

6. THIRD-PARTY INTEGRATIONS
We integrate with Veriff (identity verification), Zoom, and Google Meet. These services have 
their own privacy policies.

7. ANALYTICS
We collect anonymized usage data to improve the platform. You can opt out of demographic data 
collection in Settings > Privacy.
`,

  terms: `
Proofound Terms of Service

1. FAIR USE
Use the platform ethically. Do not discriminate, harass, or misuse others' information.

2. MATCHING
Matches are generated using our values-aware algorithm. Match scores are estimates, not guarantees.

3. VERIFICATION
Identity and skill verifications are for trust-building. False attestations violate our terms.

4. DATA PORTABILITY
You own your data. You may export it at any time and use it elsewhere.

5. ACCOUNT TERMINATION
We may suspend accounts that violate these terms. You may delete your account at any time 
with a 30-day grace period.
`,
};

// ============================================================================
// MAIN EXPLAINER
// ============================================================================

/**
 * Explain a policy question using AI
 */
export async function explainPolicy(question: PolicyQuestion): Promise<PolicyExplanation> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      log.warn('policy.explain.no_api_key');
      return generateFallbackExplanation(question);
    }

    const anthropic = new Anthropic({ apiKey });

    // Get relevant policy context
    const policyContext = getPolicyContext(question.context || 'general');

    // Build prompt
    const systemPrompt = buildPolicySystemPrompt();
    const userPrompt = buildPolicyUserPrompt(question, policyContext);

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
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
      throw new Error('Unexpected response type');
    }

    const explanation = parseExplanation(content.text);

    log.info('policy.explain.success', {
      context: question.context,
      questionLength: question.question.length,
    });

    return explanation;
  } catch (error) {
    log.error('policy.explain.failed', {
      context: question.context,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return generateFallbackExplanation(question);
  }
}

/**
 * Build system prompt for policy explanations
 */
function buildPolicySystemPrompt(): string {
  return `You are a privacy and policy expert for the Proofound platform. Your role is to explain policies, terms, and privacy concepts in simple, clear language that anyone can understand.

Guidelines:
- Use plain language, avoiding legal jargon
- Be concise but thorough
- Give concrete examples when helpful
- Always be accurate - don't make up policy details
- If you don't know something, say so
- Emphasize user rights and control
- Be reassuring while being honest

Output format: Return a JSON object with this structure:
{
  "answer": "Direct answer to the question",
  "summary": "One-sentence summary",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "relatedSections": ["Section name 1", "Section name 2"],
  "examples": ["Example 1", "Example 2"]
}`;
}

/**
 * Build user prompt with question and context
 */
function buildPolicyUserPrompt(question: PolicyQuestion, policyContext: string): string {
  return `Policy Context:
${policyContext}

User Question: ${question.question}

Explain this in simple language. Return ONLY the JSON response, no other text.`;
}

/**
 * Get relevant policy text based on context
 */
function getPolicyContext(context: string): string {
  switch (context) {
    case 'privacy':
    case 'consent':
    case 'data_usage':
    case 'rights':
      return PLATFORM_POLICIES.privacy;
    case 'general':
    default:
      return PLATFORM_POLICIES.privacy + '\n\n' + PLATFORM_POLICIES.terms;
  }
}

/**
 * Parse AI response into structured explanation
 */
function parseExplanation(response: string): PolicyExplanation {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      answer: parsed.answer || 'Unable to generate explanation',
      summary: parsed.summary || '',
      keyPoints: parsed.keyPoints || [],
      relatedSections: parsed.relatedSections || [],
      examples: parsed.examples || [],
    };
  } catch (error) {
    log.error('policy.explain.parse_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      answer: 'Unable to parse explanation',
      summary: 'Error parsing response',
      keyPoints: [],
    };
  }
}

// ============================================================================
// FALLBACK EXPLANATIONS
// ============================================================================

/**
 * Generate fallback explanation when AI is unavailable
 */
function generateFallbackExplanation(question: PolicyQuestion): PolicyExplanation {
  const questionLower = question.question.toLowerCase();

  // Simple keyword matching for common questions
  if (
    questionLower.includes('data') &&
    (questionLower.includes('collect') || questionLower.includes('use'))
  ) {
    return {
      answer:
        'We collect only the information you provide in your profile (skills, work history, preferences). We use this data exclusively to match you with opportunities. We never sell your data to third parties.',
      summary: 'We collect profile data for matching, never sell it.',
      keyPoints: [
        'Only collect data you provide',
        'Used for matching only',
        'Never sold to third parties',
      ],
      relatedSections: ['Data Collection', 'Data Usage'],
    };
  }

  if (questionLower.includes('delete') || questionLower.includes('export')) {
    return {
      answer:
        'You can export or delete your data at any time. Go to Settings > Data Export to download your data in JSON format. To delete your account, use Settings > Account > Delete Account.',
      summary: 'You can export or delete your data anytime.',
      keyPoints: [
        'Export data in JSON format',
        'Delete account with 30-day grace period',
        'You own your data',
      ],
      relatedSections: ['Data Rights', 'Account Management'],
    };
  }

  if (questionLower.includes('privacy') || questionLower.includes('visible')) {
    return {
      answer:
        'You control what organizations see through field-level privacy settings. Use "redact mode" to hide sensitive information. Organizations can only see your profile after you explicitly consent.',
      summary: 'You control visibility with granular privacy settings.',
      keyPoints: [
        'Field-level privacy controls',
        'Redact mode available',
        'Explicit consent required',
      ],
      relatedSections: ['Visibility Controls', 'Consent'],
    };
  }

  // Generic fallback
  return {
    answer:
      'For detailed information about this topic, please refer to our full Privacy Policy and Terms of Service. You can also contact our support team for specific questions.',
    summary: 'Please refer to full policy documents.',
    keyPoints: ['Review Privacy Policy', 'Review Terms of Service', 'Contact support for help'],
  };
}

// ============================================================================
// COMMON QUESTIONS
// ============================================================================

/**
 * Get pre-answered common policy questions
 */
export function getCommonPolicyQuestions(): Array<{
  question: string;
  category: string;
}> {
  return [
    {
      question: 'What data do you collect about me?',
      category: 'data_usage',
    },
    {
      question: 'Can I delete my account and data?',
      category: 'rights',
    },
    {
      question: 'Who can see my profile?',
      category: 'privacy',
    },
    {
      question: 'How do I control what organizations see?',
      category: 'privacy',
    },
    {
      question: 'What is Row-Level Security (RLS)?',
      category: 'privacy',
    },
    {
      question: 'Do you sell my data to third parties?',
      category: 'data_usage',
    },
    {
      question: 'What happens when I express interest in a match?',
      category: 'consent',
    },
    {
      question: 'Can I export my data?',
      category: 'rights',
    },
    {
      question: 'How does redact mode work?',
      category: 'privacy',
    },
    {
      question: 'What are verification gates?',
      category: 'general',
    },
  ];
}
