import path from 'node:path';

const GENERIC_BASENAMES = new Set([
  'page.tsx',
  'layout.tsx',
  'route.ts',
  'index.ts',
  'index.tsx',
  'README.md',
]);

const VERIFICATION_RULES = [
  {
    id: 'always-lint',
    command: 'npm run lint',
    reason: 'Always required by the repo verification checklist.',
    source: 'agent/checklists/verification.md',
    match: () => true,
  },
  {
    id: 'always-typecheck',
    command: 'npm run typecheck',
    reason: 'Always required by the repo verification checklist.',
    source: 'agent/checklists/verification.md',
    match: () => true,
  },
  {
    id: 'always-test',
    command: 'npm run test',
    reason: 'Unit tests are part of the default verification bundle.',
    source: 'agent/checklists/verification.md',
    match: () => true,
  },
  {
    id: 'always-build',
    command: 'npm run build',
    reason: 'Build validation is part of the default verification bundle.',
    source: 'agent/checklists/verification.md',
    match: () => true,
  },
  {
    id: 'mobile-v1-contracts',
    command: 'npm run test -- tests/api/mobile-bootstrap-route.test.ts tests/api/mobile-device-token-route.test.ts',
    reason: 'Mobile v1 API route changes require focused contract checks.',
    source: 'agent/checklists/verification.md',
    match: (files) => files.some((file) => file.startsWith('src/app/api/mobile/v1/')),
  },
  {
    id: 'privacy-db-migrate',
    command: 'npm run db:migrate',
    reason: 'Auth, privacy, policy, or migration changes should verify against current DB state.',
    source: 'agent/checklists/verification.md',
    match: touchesPrivacySurface,
  },
  {
    id: 'privacy-test',
    command: 'npm run test:privacy',
    reason: 'Privacy-sensitive changes require the main privacy contract suite.',
    source: 'agent/checklists/verification.md',
    match: touchesPrivacySurface,
  },
  {
    id: 'privacy-test-extended',
    command: 'npm run test:privacy:extended',
    reason: 'Privacy-sensitive changes require the extended privacy suite.',
    source: 'agent/checklists/verification.md',
    match: touchesPrivacySurface,
  },
  {
    id: 'landing-e2e',
    command: 'npm run test:e2e:landing',
    reason: 'Landing-sensitive changes require the dedicated landing E2E check.',
    source: 'agent/checklists/verification.md',
    match: touchesLandingSurface,
  },
  {
    id: 'landing-visual',
    command: 'npm run test:e2e:landing:visual',
    reason: 'Landing-sensitive changes require the visual landing regression check.',
    source: 'agent/checklists/verification.md',
    match: touchesLandingSurface,
  },
];

const RESULT_RANK = {
  pass: 4,
  partial: 3,
  skipped: 2,
  fail: 1,
  unknown: 0,
};

export function extractIssueKeys(input) {
  if (!input) return [];
  const matches = input.match(/\bPRO-\d+\b/gi) ?? [];
  return [...new Set(matches.map((match) => match.toUpperCase()))];
}

export function normalizeCommand(rawCommand) {
  if (!rawCommand) return '';

  let command = rawCommand
    .replace(/`/g, '')
    .replace(/^[`"' ]+|[`"' ]+$/g, '')
    .replace(/^[*-]\s+/, '')
    .trim();

  const splitOnStatus = command.split(/\s+(?:->|\(|-)\s*(?:PASS|FAIL|SKIPPED|PARTIAL|CODE\b|EXIT\b)/i);
  command = splitOnStatus[0].trim();

  if (command.includes('&&')) {
    command = command
      .split('&&')
      .map((part) => part.trim())
      .filter(Boolean)
      .pop();
  }

  const envAssignment = /^([A-Z0-9_]+=(?:"[^"]*"|'[^']*'|\S+)\s+)+/;
  while (envAssignment.test(command)) {
    command = command.replace(envAssignment, '').trim();
  }

  if (command.startsWith('export ')) {
    const parts = command.split(/\s+&&\s+/);
    command = parts[parts.length - 1]?.trim() ?? command;
  }

  return command.replace(/\s+/g, ' ').trim();
}

export function buildVerificationPlan(changedFiles) {
  const normalizedFiles = [...new Set((changedFiles ?? []).filter(Boolean))];
  const selected = [];

  for (const rule of VERIFICATION_RULES) {
    if (!rule.match(normalizedFiles)) continue;

    if (selected.some((entry) => entry.command === rule.command)) continue;

    selected.push({
      id: rule.id,
      command: rule.command,
      reason: rule.reason,
      source: rule.source,
    });
  }

  return selected;
}

export function collectVerificationEvidence(entryTexts) {
  const evidence = new Map();

  for (const entry of entryTexts) {
    const lines = entry.text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (!/(npm run|npx |node |vitest\b)/i.test(trimmed)) continue;

      const result = parseResult(trimmed);
      if (result === 'unknown') continue;

      const codeSpanMatch = trimmed.match(/`([^`]+)`/);
      const candidateCommand = codeSpanMatch ? codeSpanMatch[1] : trimmed;
      const normalized = normalizeCommand(candidateCommand);
      if (!normalized) continue;

      const existing = evidence.get(normalized);
      if (existing && RESULT_RANK[existing.result] >= RESULT_RANK[result]) continue;

      evidence.set(normalized, {
        command: normalized,
        rawLine: trimmed,
        result,
        file: entry.file,
      });
    }
  }

  return evidence;
}

export function resolveVerificationStatus(requiredCommands, evidenceMap) {
  return requiredCommands.map((command) => {
    const normalized = normalizeCommand(command.command);
    const evidence = evidenceMap.get(normalized) ?? null;

    return {
      ...command,
      normalizedCommand: normalized,
      status: evidence?.result ?? 'missing',
      evidence,
    };
  });
}

export function scoreIssueCandidates({
  branchName = '',
  commitSubjects = [],
  scratchpadEntries = [],
  changeEntries = [],
  changedFiles = [],
}) {
  const candidates = new Map();

  const addEvidence = (key, points, source, detail) => {
    const current = candidates.get(key) ?? { key, score: 0, evidence: [] };
    current.score += points;
    current.evidence.push({ source, detail, points });
    candidates.set(key, current);
  };

  for (const issueKey of extractIssueKeys(branchName)) {
    addEvidence(issueKey, 8, 'branch', branchName);
  }

  commitSubjects.slice(0, 8).forEach((subject, index) => {
    const points = Math.max(5 - index, 1);
    for (const issueKey of extractIssueKeys(subject)) {
      addEvidence(issueKey, points, 'commit', subject);
    }
  });

  const recentLogEntries = [
    ...scratchpadEntries.slice(0, 12).map((entry) => ({ ...entry, source: 'scratchpad' })),
    ...changeEntries.slice(0, 12).map((entry) => ({ ...entry, source: 'change-log' })),
  ];

  recentLogEntries.forEach((entry, index) => {
    const points = Math.max(3 - Math.floor(index / 4), 1);
    for (const issueKey of extractIssueKeys(entry.text)) {
      addEvidence(issueKey, points, entry.source, entry.file);
    }
  });

  if (changedFiles.length > 0) {
    for (const candidate of candidates.values()) {
      const overlap = countDiffContextOverlap(candidate.key, changedFiles, recentLogEntries);
      if (overlap > 0) {
        addEvidence(candidate.key, overlap, 'diff-context', `${overlap} overlapping changed file(s)`);
      }
    }
  }

  return [...candidates.values()].sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.key.localeCompare(right.key);
  });
}

export function selectActiveIssue(candidates) {
  if (candidates.length === 0) {
    return {
      status: 'none',
      selectedKey: null,
      candidates: [],
      reason: 'No PRO issue key was detected from branch, commits, or recent logs.',
    };
  }

  if (candidates.length === 1) {
    return {
      status: 'clear',
      selectedKey: candidates[0].key,
      candidates,
      reason: 'Only one PRO issue key was detected.',
    };
  }

  const [top, second] = candidates;

  if (top.score >= second.score + 2) {
    return {
      status: 'clear',
      selectedKey: top.key,
      candidates,
      reason: `Top candidate ${top.key} scored ${top.score} versus ${second.key} at ${second.score}.`,
    };
  }

  return {
    status: 'ambiguous',
    selectedKey: null,
    candidates,
    reason: `Top candidates are too close (${top.key}: ${top.score}, ${second.key}: ${second.score}).`,
  };
}

export function stabilizeIssueSelection(issueSelection, repoState) {
  if (issueSelection.status !== 'clear') {
    return issueSelection;
  }

  const branchIssues = extractIssueKeys(repoState.branch);
  if (branchIssues.length > 0) {
    return issueSelection;
  }

  if (!repoState.dirty) {
    return issueSelection;
  }

  const candidate = issueSelection.candidates.find((entry) => entry.key === issueSelection.selectedKey);
  const hasStrongDiffContext = candidate?.evidence?.some(
    (entry) => entry.source === 'diff-context' && entry.points >= 2
  );

  if (hasStrongDiffContext) {
    return issueSelection;
  }

  return {
    status: 'none',
    selectedKey: null,
    candidates: issueSelection.candidates,
    reason: 'Dirty working tree has no branch-linked or diff-linked PRO issue candidate.',
  };
}

export function evaluateTicketFinisherState({
  issueSelection,
  repoState,
  verificationPlan,
  recentCommits,
  latestChangeSummary,
}) {
  const blockers = [];

  if (issueSelection.status === 'ambiguous') {
    blockers.push(issueSelection.reason);
  }

  if (repoState.dirty) {
    blockers.push(
      `Working tree is dirty: ${repoState.stagedFiles.length} staged, ${repoState.unstagedFiles.length} unstaged, ${repoState.untrackedFiles.length} untracked file(s).`
    );
  }

  if (repoState.upstreamMissing) {
    blockers.push('No upstream branch is configured, so push status is unknown.');
  } else if (repoState.ahead > 0) {
    blockers.push(`Branch is ahead of upstream by ${repoState.ahead} commit(s).`);
  }

  const missingVerification = verificationPlan.filter((entry) => entry.status === 'missing');
  const failingVerification = verificationPlan.filter((entry) => entry.status === 'fail');

  if (failingVerification.length > 0) {
    blockers.push(
      `Recent verification evidence includes failures for ${failingVerification
        .map((entry) => `\`${entry.command}\``)
        .join(', ')}.`
    );
  }

  if (missingVerification.length > 0) {
    blockers.push(
      `Missing verification evidence for ${missingVerification
        .map((entry) => `\`${entry.command}\``)
        .join(', ')}.`
    );
  }

  let suggestedLinearStatus = 'No automatic suggestion';
  if (issueSelection.status === 'clear') {
    suggestedLinearStatus = blockers.length === 0 ? 'In Review (draft only, do not post automatically)' : 'In Progress';
  }

  const finalReviewReady = issueSelection.status === 'clear' && blockers.length === 0;

  return {
    blockers,
    finalReviewReady,
    suggestedLinearStatus,
    draftCompletionComment:
      issueSelection.status === 'clear'
        ? buildDraftCompletionComment({
            issueKey: issueSelection.selectedKey,
            recentCommits,
            verificationPlan,
            latestChangeSummary,
            headSha: repoState.headSha,
          })
        : null,
    hybridAuthority: {
      canMoveToInProgress:
        issueSelection.status === 'clear' && suggestedLinearStatus === 'In Progress',
      canFinalizeAutomatically: false,
    },
  };
}

export function parseChangeEntrySummary(markdown) {
  return {
    whatChanged: extractBulletsFromSection(markdown, 'What changed:'),
    howToVerify: extractBulletsFromSection(markdown, 'How to verify:'),
    openRisks: extractBulletsFromSection(markdown, 'Open risks / TODO:'),
  };
}

function touchesPrivacySurface(files) {
  return files.some((file) => {
    return (
      file.startsWith('src/db/') ||
      file.startsWith('supabase/migrations/') ||
      file === 'run-migrations.mjs' ||
      file === 'src/middleware.ts' ||
      file.startsWith('tests/privacy/') ||
      /^src\/actions\/auth(\.|\/)/.test(file) ||
      /^src\/app\/api\/.*(auth|verification|privacy)/.test(file)
    );
  });
}

function touchesLandingSurface(files) {
  return files.some((file) => {
    return (
      file === 'src/app/page.tsx' ||
      file === 'src/app/globals.css' ||
      file === 'src/app/layout.tsx' ||
      file === 'src/components/ProofoundLanding.tsx' ||
      file.startsWith('src/components/landing/')
    );
  });
}

function parseResult(line) {
  if (/\bPASS\b/i.test(line)) return 'pass';
  if (/\bFAIL\b/i.test(line)) return 'fail';
  if (/\bSKIPPED\b/i.test(line)) return 'skipped';
  if (/\bPARTIAL\b/i.test(line)) return 'partial';
  return 'unknown';
}

function countDiffContextOverlap(issueKey, changedFiles, entries) {
  let overlap = 0;

  for (const entry of entries) {
    if (!entry.text.includes(issueKey)) continue;

    for (const file of changedFiles) {
      const basename = path.basename(file);
      const basenameOkay = basename.length >= 8 && !GENERIC_BASENAMES.has(basename);

      if (entry.text.includes(file) || (basenameOkay && entry.text.includes(basename))) {
        overlap += 1;
      }
    }
  }

  return Math.min(overlap, 3);
}

function extractBulletsFromSection(markdown, sectionHeading) {
  const lines = markdown.split('\n');
  const bullets = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inSection && trimmed === sectionHeading) {
      inSection = true;
      continue;
    }

    if (!inSection) continue;

    if (/^[A-Z][A-Za-z /]+:$/.test(trimmed) && trimmed !== sectionHeading) {
      break;
    }

    if (trimmed.startsWith('- ')) {
      bullets.push(trimmed.slice(2));
    }
  }

  return bullets;
}

function buildDraftCompletionComment({
  issueKey,
  recentCommits,
  verificationPlan,
  latestChangeSummary,
  headSha,
}) {
  const changedBullets =
    latestChangeSummary?.whatChanged?.length > 0
      ? latestChangeSummary.whatChanged.slice(0, 4)
      : recentCommits.slice(0, 4).map((subject) => subject.trim()).filter(Boolean);

  const verificationBullets =
    latestChangeSummary?.howToVerify?.length > 0
      ? latestChangeSummary.howToVerify.slice(0, 6)
      : verificationPlan
          .filter((entry) => entry.status === 'pass')
          .slice(0, 6)
          .map((entry) => `${entry.command} (PASS)`);

  const lines = [
    `${issueKey} is ready for review.`,
    '',
    'What changed:',
    ...formatBullets(changedBullets, 'Updated the active ticket scope in the repository.'),
    '',
    'How to verify:',
    ...formatBullets(
      verificationBullets,
      'Run the repo verification checklist commands captured by the ticket finisher.'
    ),
    '',
    'Commit SHA:',
    `- \`${headSha}\``,
  ];

  return lines.join('\n');
}

function formatBullets(items, fallback) {
  const source = items.length > 0 ? items : [fallback];
  return source.map((item) => `- ${item}`);
}
