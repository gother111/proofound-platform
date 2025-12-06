/**
 * Static data + helpers for Interview Prep Assistant.
 * Uses curated templates only (no external AI) so it works offline and keeps data private.
 */

export type AssignmentOutcome = {
  metric?: string;
  target?: string;
  timeframe?: string;
  theme?: string;
};

export type AssignmentContext = {
  role?: string;
  roleFamily?: 'engineering' | 'product' | 'design' | 'data' | 'operations' | 'other';
  orgName?: string;
  mustHaveSkills?: { id: string; level?: number }[];
  niceToHaveSkills?: { id: string; level?: number }[];
  outcomes?: AssignmentOutcome[];
};

export type PracticeQuestion = {
  type: 'behavioral' | 'technical' | 'role_specific' | 'values_based';
  question: string;
  contextHint?: string;
};

export type ReflectionPrompt = {
  title: string;
  description: string;
  field: keyof typeof reflectionFieldKeys;
};

const reflectionFieldKeys = {
  whatWentWell: 'what_went_well',
  areasToImprove: 'areas_to_improve',
  unexpectedQuestions: 'unexpected_questions',
  overallFeeling: 'overall_feeling',
  keyLearnings: 'key_learnings',
  followUpActions: 'follow_up_actions',
} as const;

export const rolePrepTips: Record<string, string[]> = {
  general: [
    'Re-read the assignment and note 2-3 outcomes you can influence in the first 90 days.',
    'Prepare two STAR (Situation, Task, Action, Result) stories that show resilience.',
    'Write down 3 thoughtful questions about the team’s priorities and decision-making.',
    'Do a quick scan of recent org news or posts to reference something current.',
  ],
  engineering: [
    'Review recent system design you led; be ready to discuss trade-offs and rollbacks.',
    'Have a story about debugging a production incident and your communication approach.',
    'Skim docs of the top stack items in the assignment; list assumptions you would validate.',
  ],
  product: [
    'Map one recent feature from problem discovery to launch; quantify impact.',
    'Prepare how you balance qualitative research with experiment data when roadmapping.',
    'Know 2-3 prioritization frameworks you actually use (RICE, MoAR, bets).',
  ],
  design: [
    'Pick one case study and outline problem, constraints, iterations, and impact.',
    'Be ready to show how you partner with PM/Eng on handoff quality and feasibility.',
    'Highlight accessibility choices and how you validate them.',
  ],
  data: [
    'Explain a time you improved data quality or instrumentation to unblock insights.',
    'Prepare one metric tree for the assignment’s core outcome.',
    'Know how you communicate uncertainty and experiment caveats to stakeholders.',
  ],
  operations: [
    'Show a process you streamlined; share before/after metrics and change management steps.',
    'Have an example of resolving a blocker across teams with clear escalation.',
    'Quantify efficiency wins (time saved, error rate drop).',
  ],
};

const questionTemplates: PracticeQuestion[] = [
  {
    type: 'behavioral',
    question: 'Tell me about a time you faced an unexpected blocker in a project. What did you do?',
    contextHint: 'Use STAR; highlight communication and risk handling.',
  },
  {
    type: 'behavioral',
    question: 'Describe a situation where you had to persuade others to change course.',
    contextHint: 'Show stakeholder mapping and data you used.',
  },
  {
    type: 'values_based',
    question: 'What does a values-aligned decision look like for you when trade-offs are tough?',
    contextHint: 'Tie to organization mission if known.',
  },
  {
    type: 'values_based',
    question: 'Share a moment when you advocated for well-being or sustainable pace for your team.',
  },
  {
    type: 'technical',
    question:
      'Walk through how you would validate the most critical assumption in this assignment’s stack or workflow.',
    contextHint: 'Mention safeguards and measurement.',
  },
  {
    type: 'technical',
    question: 'How do you approach debugging a high-severity issue without full context?',
    contextHint: 'Outline first 30–60 minutes: logging, rollback, alerts.',
  },
  {
    type: 'role_specific',
    question:
      'For this role, what are the first signals you would monitor in week one to stay on track?',
    contextHint: 'Connect to assignment outcomes.',
  },
  {
    type: 'role_specific',
    question:
      'Which two skills from the requirements will you lean on most, and how have you used them before?',
  },
];

export const curatedBehavioralBank: PracticeQuestion[] = [
  {
    type: 'behavioral',
    question: 'Tell me about a time you received critical feedback. How did you respond?',
  },
  {
    type: 'behavioral',
    question: 'Describe a situation where you had to deliver under a very tight deadline.',
  },
  {
    type: 'behavioral',
    question: 'Share an example of resolving a conflict within a team.',
  },
  {
    type: 'behavioral',
    question: 'Walk me through a decision you made with incomplete data.',
  },
];

export const reflectionPrompts: ReflectionPrompt[] = [
  {
    title: 'What went well?',
    description: 'Moments you felt confident or feedback you received.',
    field: 'whatWentWell',
  },
  {
    title: 'Where to improve?',
    description: 'Skills, communication, or pacing you want to adjust.',
    field: 'areasToImprove',
  },
  {
    title: 'Unexpected questions',
    description: 'Capture any surprise prompts for future practice.',
    field: 'unexpectedQuestions',
  },
  {
    title: 'Overall feeling',
    description: 'Quick score from 1–5 to track momentum.',
    field: 'overallFeeling',
  },
  {
    title: 'Key learnings',
    description: 'Insights you want to keep and reuse.',
    field: 'keyLearnings',
  },
  {
    title: 'Follow-ups',
    description: 'Any promised links, notes, or next steps.',
    field: 'followUpActions',
  },
];

const fallbackRoleOrder: Record<string, string[]> = {
  engineering: ['technical', 'role_specific', 'behavioral', 'values_based'],
  product: ['role_specific', 'behavioral', 'values_based', 'technical'],
  design: ['role_specific', 'behavioral', 'values_based', 'technical'],
  data: ['technical', 'role_specific', 'behavioral', 'values_based'],
  operations: ['role_specific', 'behavioral', 'values_based', 'technical'],
  other: ['behavioral', 'values_based', 'technical', 'role_specific'],
};

const pickRoleFamily = (roleFamily?: string, role?: string) => {
  if (roleFamily) return roleFamily;
  if (!role) return 'other';
  const lower = role.toLowerCase();
  if (lower.includes('product')) return 'product';
  if (lower.includes('engineer') || lower.includes('developer')) return 'engineering';
  if (lower.includes('design')) return 'design';
  if (lower.includes('data') || lower.includes('analytics')) return 'data';
  if (lower.includes('ops') || lower.includes('operations')) return 'operations';
  return 'other';
};

const formatSkillList = (skills?: { id: string }[]) =>
  (skills || [])
    .map((s) => s.id)
    .filter(Boolean)
    .slice(0, 3);

const formatOutcomeSnippet = (outcomes?: AssignmentOutcome[]) => {
  if (!outcomes || outcomes.length === 0) return undefined;
  const first = outcomes[0];
  if (!first) return undefined;
  const parts = [first.metric, first.target, first.timeframe].filter(Boolean);
  return parts.join(' • ');
};

const fillTemplate = (text: string, ctx: AssignmentContext) => {
  const skills = formatSkillList(ctx.mustHaveSkills);
  return text
    .replaceAll('{{role}}', ctx.role || 'this role')
    .replaceAll('{{skill}}', skills[0] || 'a key skill')
    .replaceAll('{{org}}', ctx.orgName || 'the organization')
    .replaceAll('{{outcome}}', formatOutcomeSnippet(ctx.outcomes) || 'a core outcome');
};

export const buildPrepTips = (ctx: AssignmentContext) => {
  const roleFamily = pickRoleFamily(ctx.roleFamily, ctx.role);
  const roleTips = rolePrepTips[roleFamily] || [];
  const base = rolePrepTips.general || [];
  const outcomeHint = formatOutcomeSnippet(ctx.outcomes);
  const contextual = outcomeHint
    ? [`Anchor one story to this outcome: ${outcomeHint}. Quantify expected impact.`]
    : [];
  return Array.from(new Set([...base, ...roleTips, ...contextual]));
};

export const generatePracticeQuestions = (
  ctx: AssignmentContext,
  desiredCount = 6
): PracticeQuestion[] => {
  const roleFamily = pickRoleFamily(ctx.roleFamily, ctx.role);
  const order = fallbackRoleOrder[roleFamily] || fallbackRoleOrder.other;
  const seeded = questionTemplates.map((q, idx) => ({
    ...q,
    question: fillTemplate(q.question, ctx),
    // small shuffle by leveraging order preference
    score: order.indexOf(q.type) + idx * 0.01,
  }));

  const enrichedOutcome =
    ctx.outcomes && ctx.outcomes.length > 0
      ? [
          {
            type: 'role_specific' as const,
            question: `How would you make progress on "${formatOutcomeSnippet(ctx.outcomes)}" in the first 30 days?`,
            contextHint: 'Break into discovery, quick wins, and risks.',
          },
        ]
      : [];

  const enrichedSkills =
    formatSkillList(ctx.mustHaveSkills).length > 0
      ? [
          {
            type: 'technical' as const,
            question: `Pick one required skill (${formatSkillList(ctx.mustHaveSkills).join(
              ', '
            )}). How have you used it to deliver impact recently?`,
            contextHint: 'Give a concise STAR-style example.',
          },
        ]
      : [];

  const combined = [...seeded, ...enrichedOutcome, ...enrichedSkills];
  combined.sort((a, b) => (a as any).score - (b as any).score);

  const uniqueByText = new Map<string, PracticeQuestion>();
  for (const item of combined) {
    if (!uniqueByText.has(item.question) && uniqueByText.size < desiredCount) {
      uniqueByText.set(item.question, {
        type: item.type,
        question: item.question,
        contextHint: item.contextHint,
      });
    }
  }

  if (uniqueByText.size < desiredCount) {
    curatedBehavioralBank.forEach((q) => {
      if (uniqueByText.size < desiredCount && !uniqueByText.has(q.question)) {
        uniqueByText.set(q.question, q);
      }
    });
  }

  return Array.from(uniqueByText.values());
};

export const questionTypeDescriptions: Record<
  PracticeQuestion['type'],
  { label: string; description: string }
> = {
  behavioral: {
    label: 'Behavioral',
    description: 'Past situations that show how you work (STAR-friendly).',
  },
  technical: {
    label: 'Technical/Method',
    description: 'How you solve, debug, or design within the stack or workflow.',
  },
  role_specific: {
    label: 'Role-Specific',
    description: 'Applied to this assignment’s outcomes, stakeholders, and risks.',
  },
  values_based: {
    label: 'Values & Well-being',
    description: 'Alignment with mission, well-being guardrails, and collaboration style.',
  },
};
