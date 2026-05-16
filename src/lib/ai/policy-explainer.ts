/**
 * AI-Assisted Policy Explainer
 *
 * Uses deterministic local explanations for privacy policies, terms, and complex concepts.
 * PRD Reference: Part 6 - Privacy by Design (policy transparency)
 */

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

// ============================================================================
// MAIN EXPLAINER
// ============================================================================

/**
 * Explain a policy question without sending the user's question to an external model.
 */
export async function explainPolicy(question: PolicyQuestion): Promise<PolicyExplanation> {
  return generateFallbackExplanation(question);
}

/**
 * Generate explanation from local policy text and common question patterns.
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
